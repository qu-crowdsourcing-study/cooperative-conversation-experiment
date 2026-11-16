import { useEffect, useRef } from 'react'
import { gapFields } from '../data/task'
import type { StoredResponse } from '../types/experiment'

interface SubmissionSummaryProps {
  response: StoredResponse
  onRestart: () => void
}

export function SubmissionSummary({ response, onRestart }: SubmissionSummaryProps) {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => { sectionRef.current?.focus() }, [])

  return (
    <section
      className="panel confirmation"
      ref={sectionRef}
      tabIndex={-1}
      aria-labelledby="confirmation-title"
    >
      <p className="eyebrow">Worksheet submitted</p>
      <h2 id="confirmation-title">Thank you for taking part.</h2>
      <p>
        Your answers have been saved successfully. You can review your submitted worksheet below.
      </p>
      <dl className="response-summary">
        {gapFields[response.role].map((field) => (
          <div key={field.id}><dt>{field.label}</dt><dd>{response.answers[field.id]}</dd></div>
        ))}
      </dl>
      <div className="actions">
        <button className="button primary" onClick={onRestart}>Return to welcome</button>
      </div>
      <p className="muted small saved-note">
        Returning to welcome or closing this page will not delete your submitted answers.
      </p>
    </section>
  )
}
