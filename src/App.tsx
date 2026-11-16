import { useRef, useState } from 'react'
import { ExperimentLayout } from './components/ExperimentLayout'
import { WelcomePage } from './pages/WelcomePage'
import { WaitingRoomPage } from './pages/WaitingRoomPage'
import { ExperimentPage } from './pages/ExperimentPage'
import { assignment } from './data/assignment'
import { task } from './data/task'
import { saveResponse } from './services/responseStorage'
import { submitResult } from './services/responseExport'
import type { ExperimentSession, StoredResponse, TaskResponse } from './types/experiment'
import './App.css'

function App() {
  const [session, setSession] = useState<ExperimentSession | null>(null)
  const [saveError, setSaveError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submitInProgress = useRef(false)
  const page = session === null ? 'welcome' : session.status === 'waiting' ? 'waiting' : 'experiment'

  function reset() {
    setSession(null)
    setSaveError('')
  }

  function join() {
    setSession({
      id: crypto.randomUUID(),
      role: assignment.role,
      status: 'waiting',
      joinedAt: new Date().toISOString(),
    })
  }

  function start() {
    setSession((current) => current?.status === 'waiting' ? {
      ...current, status: 'active', startedAt: new Date().toISOString(),
    } : current)
  }

  async function submit(response: TaskResponse) {
    if (session?.status !== 'active' || !session.startedAt || submitInProgress.current) return
    submitInProgress.current = true
    setSubmitting(true)
    setSaveError('')

    const record: StoredResponse = {
      ...response,
      schemaVersion: 1,
      sessionId: session.id,
      taskId: task.id,
      taskVersion: task.version,
      role: session.role,
      joinedAt: session.joinedAt,
      startedAt: session.startedAt,
      submittedAt: new Date().toISOString(),
    }

    try {
      const receipt = await submitResult(record)
      try {
        saveResponse(receipt.response, window.localStorage)
      } catch {
        // The project result is authoritative. Browser storage is an optional copy.
      }
      setSession({
        ...session, status: 'submitted', submittedAt: receipt.response.submittedAt,
        response: receipt.response, resultFilename: receipt.filename,
      })
    } catch {
      setSaveError('Your answers could not be saved. Keep this page open, check the connection and try submitting again. Your entries are still here.')
    } finally {
      submitInProgress.current = false
      setSubmitting(false)
    }
  }

  return (
    <ExperimentLayout page={page}>
      {session === null ? (
        <WelcomePage onJoin={join} />
      ) : session.status === 'waiting' ? (
        <WaitingRoomPage role={session.role} onStart={start} onLeave={reset} />
      ) : (
        <ExperimentPage session={session} saveError={saveError} submitting={submitting} onSubmit={submit} onRestart={reset} />
      )}
    </ExperimentLayout>
  )
}

export default App
