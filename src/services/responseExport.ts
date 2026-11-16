import type { ResultReceipt, StoredResponse } from '../types/experiment'

export async function submitResult(response: StoredResponse): Promise<ResultReceipt> {
  const result = await fetch('/api/results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(response),
  })
  if (!result.ok) throw new Error('Your answers could not be saved. Please submit again.')
  const receipt = await result.json() as ResultReceipt
  if (typeof receipt.filename !== 'string' || receipt.response?.sessionId !== response.sessionId) {
    throw new Error('The server did not confirm your saved answers.')
  }
  return receipt
}
