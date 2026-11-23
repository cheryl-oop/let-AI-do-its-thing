import { moodBand } from '../game/engine'

export function MoodMeter({ mood }: { mood: number }) {
  const band = moodBand(mood)
  const clamped = Math.max(0, Math.min(100, mood))

  return (
    <div className="mood-meter panel">
      <div className="mood-head">
        <span className="pixel-label">MOOD</span>
        <span className={`mood-word ${band}`}>{band.toUpperCase()}</span>
      </div>
      <div className="mood-track">
        <div className="mood-fill" style={{ width: `${clamped}%` }} />
        <div className="mood-tick" style={{ left: '33%' }} />
        <div className="mood-tick" style={{ left: '66%' }} />
        <div className="mood-marker" style={{ left: `calc(${clamped}% - 3px)` }} />
      </div>
      <div className="mood-scale">
        <span>MAD</span>
        <span>BORED</span>
        <span>HAPPY</span>
      </div>
    </div>
  )
}
