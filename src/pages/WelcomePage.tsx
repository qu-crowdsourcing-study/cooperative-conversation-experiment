interface WelcomePageProps {
  onJoin: () => void
}

export function WelcomePage({ onJoin }: WelcomePageProps) {
  return (
    <div className="welcome-grid">
      <section className="welcome-copy">
        <p className="eyebrow">Cooperative conversation study</p>
        <h1>Plan a train journey<br />through conversation.</h1>
        <p className="lead">
          Work with another participant on a rail travel enquiry. One of you plays
          a caller planning a journey; the other plays a rail employee with the
          timetable. The research team assigns your role.
        </p>
        <p>
          Your worksheets contain different details. Use the voice call to share
          what you know and ask for the information you are missing. Fill in your
          own worksheet, discuss the final question together, then submit your answers.
        </p>
        <button className="button primary" onClick={onJoin}>
          Join experiment <span aria-hidden="true">→</span>
        </button>
        <p className="muted small">
          Your answers are saved automatically when you submit your worksheet.
        </p>
      </section>
      <aside className="panel overview" aria-labelledby="overview-title">
        <p className="eyebrow">How it works</p>
        <h2 id="overview-title">What you will do</h2>
        <ol className="overview-list">
          <li>
            <strong>Read your role and worksheet</strong>
            <p>Check the information you have and the blanks you need to complete.</p>
          </li>
          <li>
            <strong>Exchange information</strong>
            <p>Ask your partner for missing details and share the information they need.</p>
          </li>
          <li>
            <strong>Agree, complete and submit</strong>
            <p>Record your answers and your agreed response to the final question, then submit your worksheet.</p>
          </li>
        </ol>
        <div className="notice">
          <strong>No audio recording or transcription.</strong>
          <p>
            Only your submitted worksheet answers and session details are saved.
            Use the name on your worksheet, rather than your real personal details.
          </p>
        </div>
      </aside>
    </div>
  )
}
