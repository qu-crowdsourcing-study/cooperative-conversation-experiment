import { useState } from 'react'

export function VoiceControls({ finished }: { finished: boolean }) {
  const [connected, setConnected] = useState(true)
  const [muted, setMuted] = useState(false)
  const active = connected && !finished
  const status = finished
    ? 'Call controls closed'
    : active
      ? (muted ? 'Call controls · Muted' : 'Call controls · Unmuted')
      : 'Call controls disconnected'

  return (
    <section className="panel voice-panel" aria-labelledby="voice-title">
      <p className="eyebrow">Conversation</p>
      <h2 id="voice-title">Voice call</h2>
      <p className="call-status" role="status">
        <span className={active ? 'status-dot connected' : 'status-dot offline'} />
        {status}
      </p>
      <div className="actions">
        <button
          className="button secondary"
          disabled={!active}
          aria-pressed={muted}
          onClick={() => setMuted(!muted)}
        >
          {muted ? 'Unmute' : 'Mute'}
        </button>
        <button
          className="button secondary"
          disabled={finished}
          onClick={() => setConnected(!connected)}
        >
          {connected ? 'Disconnect' : 'Reconnect'}
        </button>
      </div>
      <p className="muted small">
        Audio is never recorded or transcribed. Use your worksheet to record the
        answers you agree on.
      </p>
    </section>
  )
}
