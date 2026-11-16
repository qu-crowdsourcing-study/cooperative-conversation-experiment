import type { Role } from '../types/experiment'
import { roleLabels } from '../data/task'

interface WaitingRoomPageProps {
  role: Role
  onStart: () => void
  onLeave: () => void
}

export function WaitingRoomPage({ role, onStart, onLeave }: WaitingRoomPageProps) {
  return (
    <section className="panel waiting-panel">
      <p className="eyebrow">Step 02 / Waiting room</p>
      <h1>Your role is assigned.</h1>
      <p className="lead">
        The research team assigns each participant a role and a different worksheet.
        You do not need to choose a role.
      </p>
      <div className="assignment">
        <span className="eyebrow">Your assigned role</span>
        <strong>{roleLabels[role]}</strong>
      </div>
      <div className="pair-status" role="status">
        <span className="status-dot" />
        Your worksheet is ready
      </div>
      <div className="notice">
        <strong>Before you begin</strong>
        <p>
          Read the details on your worksheet, then exchange information with your
          partner. Complete your own answers and discuss the final question together.
        </p>
      </div>
      <div className="actions waiting-actions">
        <button className="button primary" onClick={onStart}>
          Open your worksheet <span aria-hidden="true">→</span>
        </button>
        <button className="button secondary" onClick={onLeave}>Back to welcome</button>
      </div>
    </section>
  )
}
