import { useState } from 'react'
import type { FormEvent } from 'react'
import { task, gapFields } from '../data/task'
import { TaskInstructions } from './TaskInstructions'
import { WorksheetSymbol } from './WorksheetSymbol'
import type { Role, TaskResponse } from '../types/experiment'

interface AnswerFormProps {
  role: Role
  saveError: string
  submitting: boolean
  onSubmit: (response: TaskResponse) => void
}

export function AnswerForm({ role, saveError, submitting, onSubmit }: AnswerFormProps) {
  const fields = gapFields[role]
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [invalidFields, setInvalidFields] = useState<string[]>([])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    const missing = fields.filter((field) => !answers[field.id]?.trim()).map((field) => field.id)
    setInvalidFields(missing)
    if (missing.length) {
      document.getElementById('gap-' + missing[0])?.focus()
      return
    }
    onSubmit({
      answers: Object.fromEntries(fields.map((field) => [field.id, answers[field.id].trim()])),
    })
  }

  function updateAnswer(id: string, value: string) {
    setAnswers((current) => ({ ...current, [id]: value }))
    setInvalidFields((current) => current.filter((fieldId) => fieldId !== id))
  }

  return (
    <section className="panel worksheet" aria-labelledby="worksheet-title">
      <form className="worksheet-form" onSubmit={handleSubmit} aria-busy={submitting}>
        <TaskInstructions role={role} />
        <fieldset className="worksheet-section gap-fields" disabled={submitting}>
          <legend><span className="worksheet-heading"><WorksheetSymbol kind="obtain" />{role === 'traveler' ? 'Information to obtain' : 'Reservation · Information to obtain'}</span></legend>
          {fields.filter((field) => field.kind !== 'discussion').map((field) => {
            const id = 'gap-' + field.id
            const invalid = invalidFields.includes(field.id)
            return (
              <div className="gap-row" key={field.id}>
                <label htmlFor={id}>{field.label}:</label>
                <div>
                  {field.kind === 'select' ? (
                    <select
                      id={id}
                      name={field.id}
                      required
                      value={answers[field.id] ?? ''}
                      onChange={(event) => updateAnswer(field.id, event.target.value)}
                    >
                      <option value="">Select…</option>
                      {field.options?.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  ) : (
                    <input
                      id={id}
                      name={field.id}
                      type={field.kind}
                      required
                      min={field.kind === 'number' ? 1 : undefined}
                      step={field.kind === 'number' ? 1 : undefined}
                      maxLength={field.kind === 'text' ? 120 : undefined}
                      value={answers[field.id] ?? ''}
                      aria-invalid={invalid || undefined}
                      aria-describedby={invalid ? id + '-error' : undefined}
                      onChange={(event) => updateAnswer(field.id, event.target.value)}
                    />
                  )}
                  {invalid && <p className="error" id={id + '-error'}>Fill in this gap using more than spaces.</p>}
                </div>
              </div>
            )
          })}
        </fieldset>
        {role === 'traveler' && (
          <section className="worksheet-section" aria-labelledby="reservation-title">
            <h3 id="reservation-title"><WorksheetSymbol kind="give" />Reservation · Information to give</h3>
            <ul className="worksheet-facts">
              {task.reservation.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        )}
        <section className="worksheet-section discussion" aria-labelledby="discussion-title">
          <h3 id="discussion-title"><WorksheetSymbol kind="discussion" />Discuss together</h3>
          <p>
            {role === 'traveler'
              ? task.question
              : 'Discuss the caller’s additional question and record the solution you agree on.'}
          </p>
          <p className="muted small" id="discussion-help">
            Neither worksheet supplies the answer. Briefly discuss a solution
            acceptable to both of you. This is a scenario, not real travel information.
          </p>
          <label htmlFor="gap-discussion">{fields.find((field) => field.id === 'discussion')?.label}</label>
          <textarea
            id="gap-discussion"
            name="discussion"
            required
            disabled={submitting}
            rows={3}
            maxLength={1000}
            value={answers.discussion ?? ''}
            aria-invalid={invalidFields.includes('discussion') || undefined}
            aria-describedby="discussion-help discussion-error"
            onChange={(event) => updateAnswer('discussion', event.target.value)}
          />
          <p className="error" id="discussion-error">
            {invalidFields.includes('discussion') ? 'Write your agreed answer using more than spaces.' : ''}
          </p>
        </section>
        <div className="worksheet-submit">
          <p className="muted small">Complete every gap before submitting. Enter scenario details, not your real personal details.</p>
          <p className="muted small">
            Your answers are saved automatically when you submit.
            Unsubmitted entries are lost if you leave or reload.
          </p>
          {saveError && <p className="error" role="alert">{saveError}</p>}
          <button className="button primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving your answers…' : 'Submit worksheet'} <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>
    </section>
  )
}
