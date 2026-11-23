import { BASE_FP_PER_SECOND, moodBand, moodMultiplier } from '../game/engine'
import { useGame } from '../store/useGame'

export type Tone = 'ok' | 'warn' | 'bad' | 'idle'

const PRESETS = [15, 25, 45, 60]
const SEGMENTS = 24

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function SessionPanel({ statusLabel, tone }: { statusLabel: string; tone: Tone }) {
  const session = useGame((state) => state.session)
  const settings = useGame((state) => state.settings)
  const mood = useGame((state) => state.pet.mood)
  const alive = useGame((state) => state.pet.alive)
  const startSession = useGame((state) => state.startSession)
  const pauseSession = useGame((state) => state.pauseSession)
  const resumeSession = useGame((state) => state.resumeSession)
  const abandonSession = useGame((state) => state.abandonSession)
  const setGoalMinutes = useGame((state) => state.setGoalMinutes)

  const running = session.status === 'running'
  const paused = session.status === 'paused'
  const remaining = Math.max(0, session.goalSeconds - session.elapsed)
  const progress = Math.min(1, session.elapsed / Math.max(1, session.goalSeconds))
  const filled = Math.round(progress * SEGMENTS)
  const multiplier = moodMultiplier(moodBand(mood))

  return (
    <div className="session panel">
      <div className="session-head">
        <span className="pixel-label">FOCUS SESSION</span>
        <span className={`chip ${tone}`}>{statusLabel}</span>
      </div>

      <div className="timer">{formatClock(running || paused ? remaining : session.goalSeconds)}</div>

      <div className="segments">
        {Array.from({ length: SEGMENTS }, (_, index) => (
          <span key={index} className={`segment ${index < filled ? 'on' : ''}`} />
        ))}
      </div>

      <div className="session-meta">
        <span>
          ×{multiplier.toFixed(1)} mood · +{Math.round(BASE_FP_PER_SECOND * multiplier * 60)} FP/min
        </span>
        <span>+{Math.round(session.sessionPoints)} FP this session</span>
      </div>

      {!running && !paused && (
        <div className="presets">
          {PRESETS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              className={`preset ${settings.goalMinutes === minutes ? 'active' : ''}`}
              onClick={() => setGoalMinutes(minutes)}
            >
              {minutes}m
            </button>
          ))}
        </div>
      )}

      <div className="session-actions">
        {!running && !paused && (
          <button type="button" className="btn primary" disabled={!alive} onClick={startSession}>
            START TOMODORO
          </button>
        )}
        {running && (
          <button type="button" className="btn" onClick={pauseSession}>
            PAUSE
          </button>
        )}
        {paused && (
          <button type="button" className="btn primary" onClick={resumeSession}>
            RESUME
          </button>
        )}
        {(running || paused) && (
          <button type="button" className="btn danger" onClick={abandonSession}>
            GIVE UP
          </button>
        )}
      </div>

      {session.status === 'paused' && (
        <p className="session-note">
          {session.autoPaused
            ? 'You left — why did you leave me! It resumes on its own when you are back.'
            : 'Paused. No points while paused.'}
        </p>
      )}
      {session.status === 'broken' && session.breakReason && (
        <p className="session-note bad">Last session: broken — {session.breakReason}.</p>
      )}
      {session.status === 'done' && (
        <p className="session-note good">Last session: complete. It is proud of you.</p>
      )}
    </div>
  )
}
