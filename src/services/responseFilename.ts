import type { StoredResponse } from '../types/experiment.ts'

export function responseFilename(response: StoredResponse): string {
  // Session creation time stays fixed on retries. Colons are invalid on Windows.
  const timestamp = new Date(response.joinedAt).toISOString().replace(/[:.]/g, '-')
  return `${timestamp}__${response.taskId}__v${response.taskVersion}__${response.role}__${response.sessionId}.json`
}
