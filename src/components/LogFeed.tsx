import { useGame } from '../store/useGame'

function clock(ts: number): string {
  const date = new Date(ts)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function LogFeed() {
  const log = useGame((state) => state.log)

  return (
    <div className="log">
      {log.length === 0 && <p className="empty">Nothing has happened yet.</p>}
      {log.map((entry) => (
        <div key={entry.id} className={`log-row ${entry.kind}`}>
          <span className="log-time">{clock(entry.at)}</span>
          <span className="log-text">{entry.text}</span>
        </div>
      ))}
    </div>
  )
}
