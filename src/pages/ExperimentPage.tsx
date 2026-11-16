import { VoiceControls } from '../components/VoiceControls'
import { AnswerForm } from '../components/AnswerForm'
import { SubmissionSummary } from '../components/SubmissionSummary'
import { task, roleLabels } from '../data/task'
import type { ExperimentSession, TaskResponse } from '../types/experiment'

interface ExperimentPageProps {
  session: ExperimentSession
  saveError: string
  submitting: boolean
  onSubmit: (response: TaskResponse) => void
  onRestart: () => void
}

export function ExperimentPage({ session, saveError, submitting, onSubmit, onRestart }: ExperimentPageProps) {
  const finished = session.status === 'submitted'

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Step 03 / Experiment</p>
          <h1>Complete your worksheet.</h1>
          <p className="lead">Exchange information with your partner and fill in the gaps.</p>
        </div>
        <span className="badge role-badge">{roleLabels[session.role]}</span>
      </div>
      <div className="experiment-grid">
        <div className="stack">
          {finished && session.response ? (
            <SubmissionSummary response={session.response} onRestart={onRestart} />
          ) : (
            <AnswerForm role={session.role} saveError={saveError} submitting={submitting} onSubmit={onSubmit} />
          )}
          <p className="muted small">{task.source} Historical scenario timetable.</p>
        </div>
        <aside className="stack">
          <VoiceControls finished={finished} />
          <section className="panel compact">
            <h2>Your task</h2>
            <p>Your role is assigned by the research team. Your partner has a different worksheet.</p>
            <p>
              Share the information on your sheet, ask for the details you are missing,
              and complete each gap. Discuss the additional question together.
            </p>
            {!finished && (
              <button className="text-button" onClick={onRestart} disabled={submitting}>
                Leave experiment and discard this draft
              </button>
            )}
          </section>
        </aside>
      </div>
    </>
  )
}
