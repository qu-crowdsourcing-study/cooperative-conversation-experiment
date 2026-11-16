import assert from 'node:assert/strict'
import test from 'node:test'
import { submitResult } from '../src/services/responseExport.ts'
import { responseFilename } from '../src/services/responseFilename.ts'

const response = {
  schemaVersion: 1,
  taskId: 'p805-scenario-1', taskVersion: 1,
  sessionId: '243d539b-6c0e-42fa-a2bb-72d3d970315d', role: 'traveler',
  joinedAt: '2026-11-16T12:00:00.000Z',
  startedAt: '2026-11-16T12:01:00.000Z',
  submittedAt: '2026-11-16T12:05:00.000Z',
  answers: { departureTime: '22:09', arrivalTime: '07:16', trainNumber: 'IC 1511', discussion: 'Ask the attendant.' },
}

test('filename distinguishes date, task version, role and session and is safe on Windows', () => {
  const filename = responseFilename(response)
  assert.equal(filename, '2026-11-16T12-00-00-000Z__p805-scenario-1__v1__traveler__243d539b-6c0e-42fa-a2bb-72d3d970315d.json')
  assert.doesNotMatch(filename, /[<>:"/\\|?*]/)
  assert.notEqual(filename, responseFilename({ ...response, role: 'employee' }))
  assert.notEqual(filename, responseFilename({ ...response, sessionId: 'another-session' }))
  assert.equal(filename, responseFilename({ ...response, submittedAt: '2026-11-16T12:10:00.000Z' }))
})

test('submission posts all answers to the project endpoint and waits for its receipt', async (t) => {
  const receipt = { filename: responseFilename(response), response: { ...response, receivedAt: '2026-11-16T12:05:01.000Z' } }
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/results')
    assert.equal(options.method, 'POST')
    assert.equal(options.headers['Content-Type'], 'application/json')
    assert.deepEqual(JSON.parse(options.body), response)
    return Response.json(receipt)
  })
  assert.deepEqual(await submitResult(response), receipt)
})

test('server errors, unavailable endpoint and unconfirmed saves are reported for retry', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch')
  fetch.mock.mockImplementation(async () => Response.json({ error: 'Disk full' }, { status: 500 }))
  await assert.rejects(submitResult(response), /could not be saved/)
  fetch.mock.mockImplementation(async () => { throw new TypeError('Failed to fetch') })
  await assert.rejects(submitResult(response), /Failed to fetch/)
  fetch.mock.mockImplementation(async () => Response.json({ filename: 'something.json', response: { sessionId: 'other' } }))
  await assert.rejects(submitResult(response), /did not confirm/)
})
