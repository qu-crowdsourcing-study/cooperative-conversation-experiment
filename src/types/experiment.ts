export type Role = 'traveler' | 'employee'
export type Page = 'welcome' | 'waiting' | 'experiment'

export interface TaskResponse {
  answers: Record<string, string>
}

export interface StoredResponse extends TaskResponse {
  schemaVersion: 1
  sessionId: string
  taskId: string
  taskVersion: number
  role: Role
  joinedAt: string
  startedAt: string
  submittedAt: string
  receivedAt?: string
}

export interface ResultReceipt {
  filename: string
  response: StoredResponse
}

export interface ExperimentSession {
  id: string
  role: Role
  status: 'waiting' | 'active' | 'submitted'
  joinedAt: string
  startedAt?: string
  submittedAt?: string
  response?: StoredResponse
  resultFilename?: string
}
