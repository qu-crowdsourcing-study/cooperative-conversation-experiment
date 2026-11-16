import { randomUUID } from 'node:crypto'
import { link, mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import { gapFields, task } from '../src/data/task.ts'
import { responseFilename } from '../src/services/responseFilename.ts'
import type { ResultReceipt, StoredResponse } from '../src/types/experiment.ts'

class RequestError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function parseRecord(value: unknown): StoredResponse {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new RequestError(400, 'Invalid worksheet response.')
  }
  const record = value as Record<string, unknown>
  if (record.schemaVersion !== 1 || record.taskId !== task.id || record.taskVersion !== task.version
    || (record.role !== 'traveler' && record.role !== 'employee')
    || typeof record.sessionId !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(record.sessionId)) {
    throw new RequestError(400, 'Invalid task, role or session.')
  }
  const timestamps = ['joinedAt', 'startedAt', 'submittedAt'] as const
  for (const key of timestamps) {
    const value = record[key]
    if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))
      || new Date(value).toISOString() !== value) {
      throw new RequestError(400, 'Invalid session timestamp.')
    }
  }
  const { joinedAt, startedAt, submittedAt } = record as Record<typeof timestamps[number], string>
  if (joinedAt > startedAt || startedAt > submittedAt) {
    throw new RequestError(400, 'Session timestamps are out of order.')
  }
  if (typeof record.answers !== 'object' || record.answers === null || Array.isArray(record.answers)) {
    throw new RequestError(400, 'Missing worksheet answers.')
  }
  const input = record.answers as Record<string, unknown>
  const fields = gapFields[record.role]
  if (Object.keys(input).length !== fields.length) {
    throw new RequestError(400, 'Unexpected worksheet fields.')
  }
  const answers: Record<string, string> = {}
  for (const field of fields) {
    const value = input[field.id]
    if (typeof value !== 'string' || !value.trim() || value.length > (field.kind === 'discussion' ? 1000 : 120)
      || (field.options && !field.options.includes(value))
      || (field.kind === 'number' && !/^[1-9]\d*$/.test(value))
      || (field.kind === 'time' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value))) {
      throw new RequestError(400, `Invalid answer: ${field.id}.`)
    }
    answers[field.id] = value.trim()
  }
  return {
    schemaVersion: 1, taskId: task.id, taskVersion: task.version,
    sessionId: record.sessionId.toLowerCase(), role: record.role,
    joinedAt, startedAt, submittedAt, answers,
  }
}

function isAlreadyExists(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'EEXIST'
}

export async function writeResult(directory: string, value: unknown): Promise<ResultReceipt> {
  const record = parseRecord(value)
  const filename = responseFilename(record)
  const target = join(directory, filename)
  const saved = { ...record, receivedAt: new Date().toISOString() }
  await mkdir(directory, { recursive: true })
  const temporary = join(directory, `.${randomUUID()}.tmp`)
  try {
    await writeFile(temporary, JSON.stringify(saved, null, 2) + '\n', { flag: 'wx', flush: true })
    try {
      // Publish only a complete JSON file, without overwriting an existing result.
      await link(temporary, target)
    } catch (error) {
      if (!isAlreadyExists(error)) throw error
      const existing = JSON.parse(await readFile(target, 'utf8')) as StoredResponse
      const canonical = parseRecord(existing)
      // A retry may have a new submit timestamp, but must contain the same answers.
      if (JSON.stringify({ ...canonical, submittedAt: record.submittedAt }) !== JSON.stringify(record)) {
        throw new RequestError(409, 'This session already has a saved response with different answers.')
      }
      return { filename, response: existing }
    }
  } finally {
    await unlink(temporary).catch((error: unknown) => {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error
    })
  }
  return { filename, response: saved }
}

function reply(res: ServerResponse, status: number, value: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(value))
}

export function resultsMiddleware(directory: string) {
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    let pathname: string
    try { pathname = decodeURIComponent(req.url?.split('?')[0] ?? '').replace(/\\/g, '/') } catch {
      reply(res, 400, { error: 'Invalid URL.' })
      return
    }
    // Results are private server files, never static assets served to browsers.
    // Include Vite's /@fs/ URLs and encoded or differently-cased paths.
    if (pathname !== '/api/results' && /(^|\/)results(\/|$)/i.test(pathname)) {
      reply(res, 404, { error: 'Not found.' })
      return
    }
    if (pathname !== '/api/results') return next()
    void handleRequest(req, res, directory).catch((error: unknown) => {
      reply(res, error instanceof RequestError ? error.status : 500, {
        error: error instanceof RequestError ? error.message : 'The result file could not be saved. Please try again.',
      })
    })
  }
}

async function handleRequest(req: IncomingMessage, res: ServerResponse, directory: string) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    throw new RequestError(405, 'Use POST to submit answers.')
  }
  if (req.headers.origin) {
    let origin: URL
    try { origin = new URL(req.headers.origin) } catch { throw new RequestError(403, 'Invalid request origin.') }
    if (origin.host !== req.headers.host || !['http:', 'https:'].includes(origin.protocol)) {
      throw new RequestError(403, 'Cross-origin submissions are not allowed.')
    }
  }
  if (req.headers['sec-fetch-site'] === 'cross-site') {
    throw new RequestError(403, 'Cross-origin submissions are not allowed.')
  }
  if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
    throw new RequestError(415, 'Submit answers as JSON.')
  }
  const maxBytes = 16 * 1024
  if (Number(req.headers['content-length']) > maxBytes) {
    req.resume()
    throw new RequestError(413, 'The response is too large.')
  }
  let bytes = 0
  const chunks: Buffer[] = []
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    const data = Buffer.from(chunk)
    bytes += data.length
    if (bytes > maxBytes) {
      req.resume()
      throw new RequestError(413, 'The response is too large.')
    }
    chunks.push(data)
  }
  let value: unknown
  try { value = JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch {
    throw new RequestError(400, 'Invalid JSON.')
  }
  reply(res, 200, await writeResult(directory, value))
}
