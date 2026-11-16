import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdtemp, readFile, readdir, rmdir, unlink, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { resultsMiddleware, writeResult } from '../server/results.ts'

function response(overrides = {}) {
  return {
    schemaVersion: 1, taskId: 'p805-scenario-1', taskVersion: 1,
    sessionId: randomUUID(), role: 'traveler',
    joinedAt: '2026-11-16T12:00:00.000Z', startedAt: '2026-11-16T12:01:00.000Z', submittedAt: '2026-11-16T12:05:00.000Z',
    answers: { departureTime: '22:09', arrivalTime: '07:16', trainNumber: 'IC 1511', discussion: 'Ask the attendant.' },
    ...overrides,
  }
}

async function temporaryDirectory(t) {
  const directory = await mkdtemp(join(tmpdir(), 'conversation-results-'))
  t.after(async () => {
    for (const filename of await readdir(directory)) await unlink(join(directory, filename))
    await rmdir(directory)
  })
  return directory
}

async function endpoint(t, directory) {
  const middleware = resultsMiddleware(directory)
  const server = createServer((req, res) => middleware(req, res, () => {
    res.writeHead(404)
    res.end()
  }))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve())
    server.closeAllConnections()
  }))
  return `http://127.0.0.1:${server.address().port}`
}

function post(base, record, headers = {}) {
  return fetch(`${base}/api/results`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(record),
  })
}

test('real HTTP submission writes a complete JSON file before acknowledgement', async (t) => {
  const directory = await temporaryDirectory(t)
  const base = await endpoint(t, directory)
  const record = response()
  const result = await post(base, record, { Origin: base })
  assert.equal(result.status, 200)
  const receipt = await result.json()
  const saved = JSON.parse(await readFile(join(directory, receipt.filename), 'utf8'))
  assert.deepEqual(saved, receipt.response)
  assert.deepEqual(saved.answers, record.answers)
  assert.ok(Number.isFinite(Date.parse(saved.receivedAt)))
  assert.deepEqual(await readdir(directory), [receipt.filename])
  assert.equal((await fetch(`${base}/results/${receipt.filename}`)).status, 404)
  assert.equal((await fetch(`${base}/@fs/${directory.replaceAll('\\', '/')}/${receipt.filename}`)).status, 404)
  assert.equal((await fetch(`${base}/%72esults/${receipt.filename}`)).status, 404)
  assert.equal((await fetch(`${base}/api/results`)).status, 405)
})

test('concurrent retries return the same result without duplicates or altered answers', async (t) => {
  const directory = await temporaryDirectory(t)
  const record = response()
  const [first, retry] = await Promise.all([
    writeResult(directory, record),
    writeResult(directory, { ...record, submittedAt: '2026-11-16T12:06:00.000Z' }),
  ])
  assert.deepEqual(first, retry)
  assert.deepEqual(await readdir(directory), [first.filename])
  await assert.rejects(writeResult(directory, { ...record, answers: { ...record.answers, trainNumber: 'IC 1127' } }), /different answers/)
  assert.deepEqual(JSON.parse(await readFile(join(directory, first.filename), 'utf8')), first.response)
})

test('roles and separate sessions produce distinct files without collecting real identities', async (t) => {
  const directory = await temporaryDirectory(t)
  const traveler = response()
  const employee = response({
    sessionId: traveler.sessionId, role: 'employee',
    answers: { reservationName: 'Thompson', berthCount: '1', travelClass: 'First class', smokingPreference: 'Non-smoker', discussion: 'Ask the attendant.' },
  })
  const receipts = await Promise.all([writeResult(directory, traveler), writeResult(directory, employee), writeResult(directory, response())])
  assert.equal(new Set(receipts.map(item => item.filename)).size, 3)
  assert.equal((await readdir(directory)).length, 3)
})

test('invalid data, path traversal, cross-origin posts and oversized bodies create no files', async (t) => {
  const directory = await temporaryDirectory(t)
  const base = await endpoint(t, directory)
  const valid = response()
  for (const invalid of [
    {}, { ...valid, sessionId: '../outside' }, { ...valid, taskId: '../../outside' },
    { ...valid, answers: { ...valid.answers, discussion: ' ' } },
    { ...valid, joinedAt: 'invalid' }, { ...valid, taskVersion: 2 },
  ]) assert.equal((await post(base, invalid)).status, 400)
  assert.equal((await post(base, valid, { Origin: 'https://another.example' })).status, 403)
  assert.equal((await post(base, valid, { 'Content-Type': 'text/plain' })).status, 415)
  assert.equal((await post(base, { ...valid, padding: 'x'.repeat(20_000) })).status, 413)
  const malformed = await fetch(`${base}/api/results`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })
  assert.equal(malformed.status, 400)
  assert.deepEqual(await readdir(directory), [])
})

test('filesystem failure is returned as an error rather than a saved acknowledgement', async (t) => {
  const directory = await temporaryDirectory(t)
  const blocked = join(directory, 'blocked')
  await writeFile(blocked, 'This is a file, not a directory.')
  const base = await endpoint(t, blocked)
  const result = await post(base, response())
  assert.equal(result.status, 500)
  assert.match((await result.json()).error, /could not be saved/)
  assert.deepEqual(await readdir(directory), ['blocked'])
})
