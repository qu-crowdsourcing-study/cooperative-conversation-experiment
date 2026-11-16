import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { Page } from '../types/experiment'

const steps: { page: Page; label: string }[] = [
  { page: 'welcome', label: 'Welcome' },
  { page: 'waiting', label: 'Waiting room' },
  { page: 'experiment', label: 'Experiment' },
]

interface ExperimentLayoutProps {
  page: Page
  children: ReactNode
}

export function ExperimentLayout({ page, children }: ExperimentLayoutProps) {
  const mainRef = useRef<HTMLElement>(null)
  const activeIndex = steps.findIndex((step) => step.page === page)

  useEffect(() => {
    mainRef.current?.focus()
  }, [page])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">TU</span>
          <div>
            <strong>TU Berlin</strong>
            <span>Cooperative conversation study</span>
          </div>
        </div>
        <span className="badge">Conversation study</span>
      </header>
      <nav className="progress" aria-label="Experiment progress">
        <ol>
          {steps.map((step, index) => (
            <li
              key={step.page}
              aria-current={step.page === page ? 'step' : undefined}
              className={index <= activeIndex ? 'reached' : ''}
            >
              <span className="step-number" aria-hidden="true">{index + 1}</span>
              {step.label}
            </li>
          ))}
        </ol>
      </nav>
      <main id="main-content" ref={mainRef} tabIndex={-1}>{children}</main>
      <footer className="site-footer">
        <span>TU Berlin · Cooperative conversation study</span>
        <span>Fictional task data · No audio recording or transcription</span>
      </footer>
    </div>
  )
}
