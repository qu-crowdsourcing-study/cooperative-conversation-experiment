import type { StoredResponse } from '../types/experiment'

export const RESPONSE_STORAGE_KEY = 'tu-berlin.conversation.responses.v1'

type ResponseStorage = Pick<Storage, 'getItem' | 'setItem'>

function isStoredResponse(value: unknown): value is StoredResponse {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return record.schemaVersion === 1
    && typeof record.sessionId === 'string'
    && typeof record.taskId === 'string'
    && typeof record.taskVersion === 'number'
    && (record.role === 'traveler' || record.role === 'employee')
    && ['joinedAt', 'startedAt', 'submittedAt'].every((key) => typeof record[key] === 'string')
    && typeof record.answers === 'object'
    && record.answers !== null
    && !Array.isArray(record.answers)
    && Object.values(record.answers).every((answer) => typeof answer === 'string')
}

export function readResponses(storage: ResponseStorage): StoredResponse[] {
  const raw = storage.getItem(RESPONSE_STORAGE_KEY)
  if (raw === null) return []
  const records: unknown = JSON.parse(raw)
  if (!Array.isArray(records) || !records.every(isStoredResponse)) {
    throw new Error('Saved response data is not in the expected format.')
  }
  return records
}

export function saveResponse(record: StoredResponse, storage: ResponseStorage): void {
  const records = readResponses(storage)
  // A repeated submission for the same session must not create another record.
  if (records.some((item) => item.sessionId === record.sessionId)) return
  storage.setItem(RESPONSE_STORAGE_KEY, JSON.stringify([...records, record]))
}
