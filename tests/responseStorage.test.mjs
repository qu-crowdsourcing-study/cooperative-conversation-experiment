import assert from 'node:assert/strict'
import test from 'node:test'
import { readResponses, saveResponse, RESPONSE_STORAGE_KEY } from '../src/services/responseStorage.ts'
import { task, gapFields } from '../src/data/task.ts'
import { assignment } from '../src/data/assignment.ts'

function memoryStorage() {
  const items = new Map()
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
  }
}

const record = {
  schemaVersion: 1,
  sessionId: 'test-session',
  taskId: 'p805-scenario-1',
  taskVersion: 1,
  role: 'traveler',
  joinedAt: '2026-11-09T12:00:00.000Z',
  startedAt: '2026-11-09T12:01:00.000Z',
  submittedAt: '2026-11-09T12:05:00.000Z',
  answers: {
    departureTime: '22:09',
    arrivalTime: '07:16',
    trainNumber: 'IC 1511',
    discussion: 'We agreed to ask the attendant when breakfast starts.',
  },
}

test('saved response preserves every gap and its task, role, session and timing metadata', () => {
  const storage = memoryStorage()
  assert.deepEqual(readResponses(storage), [])
  saveResponse(record, storage)
  assert.deepEqual(readResponses(storage), [record])
  assert.deepEqual(JSON.parse(storage.getItem(RESPONSE_STORAGE_KEY)), [record])
})

test('repeated submission is idempotent and a new session retains earlier responses', () => {
  const storage = memoryStorage()
  saveResponse(record, storage)
  saveResponse(record, storage)
  assert.equal(readResponses(storage).length, 1)
  saveResponse({ ...record, sessionId: 'second-session' }, storage)
  assert.equal(readResponses(storage).length, 2)
})

test('receiver reservation gaps are stored separately from the caller’s journey gaps', () => {
  const storage = memoryStorage()
  const receiver = {
    ...record,
    sessionId: 'receiver-session',
    role: 'employee',
    answers: {
      reservationName: 'Thompson',
      berthCount: '1',
      travelClass: 'First class',
      smokingPreference: 'Non-smoker',
      discussion: 'Ask the attendant about breakfast.',
    },
  }
  saveResponse(record, storage)
  saveResponse(receiver, storage)
  assert.deepEqual(readResponses(storage), [record, receiver])
})

test('invalid existing data is never silently overwritten', () => {
  for (const raw of ['not json', '{}', '[null]', '[{"schemaVersion":1}]']) {
    const storage = memoryStorage()
    storage.setItem(RESPONSE_STORAGE_KEY, raw)
    assert.throws(() => saveResponse(record, storage))
    assert.equal(storage.getItem(RESPONSE_STORAGE_KEY), raw)
  }
})

test('storage failures propagate so the caller can retain the draft', () => {
  const storage = { getItem: () => null, setItem: () => { throw new Error('quota') } }
  assert.throws(() => saveResponse(record, storage), /quota/)
})

test('both worksheets have distinct gap sets and the source first-class sleeper is preserved', () => {
  assert.ok(['traveler', 'employee'].includes(assignment.role))
  assert.equal(task.id, record.taskId)
  assert.deepEqual(gapFields.traveler.map((field) => field.id), Object.keys(record.answers))
  assert.deepEqual(gapFields.employee.map((field) => field.id), [
    'reservationName', 'berthCount', 'travelClass', 'smokingPreference', 'discussion',
  ])
  assert.deepEqual(task.timetable[0].values, ['IC 1127', 'IC 829', 'IC 1511'])
  assert.deepEqual(task.timetable.at(-1).values, ['Only 2nd class', 'Only 2nd class', '1st and 2nd class'])
})
