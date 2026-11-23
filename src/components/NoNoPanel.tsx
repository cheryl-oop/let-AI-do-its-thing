import { useState, type FormEvent } from 'react'
import type { Activity, NoNoKind, NoNoMatch } from '../game/types'
import { useGame } from '../store/useGame'

export function NoNoPanel({
  activity,
  noNo,
  tracking,
}: {
  activity: Activity | null
  noNo: NoNoMatch
  tracking: boolean
}) {
  const settings = useGame((state) => state.settings)
  const addNoNo = useGame((state) => state.addNoNo)
  const removeNoNo = useGame((state) => state.removeNoNo)

  const [kind, setKind] = useState<NoNoKind>('app')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const result = addNoNo(kind, value)
    setError(result.ok ? null : result.message)
    if (result.ok) setValue('')
  }

  const list = kind === 'app' ? settings.noNoApps : settings.noNoSites

  return (
    <div className="nono">
      <p className="hint">
        Apps match the foreground process name, sites match the window title. While one is in
        front, mood drains fast and a running session breaks.
      </p>

      <div className={`watching ${noNo.hit ? 'hit' : ''}`}>
        <span className={`dot ${tracking ? 'live' : ''}`} />
        <div className="watching-text">
          <span className="pixel-label">ON SCREEN NOW</span>
          <span className="watching-app">
            {activity ? activity.processName : tracking ? 'waiting…' : 'desktop app only'}
          </span>
          <span className="watching-title">
            {activity?.windowTitle || (tracking ? 'no window title' : 'window tracking is off')}
          </span>
        </div>
      </div>

      <form className="nono-form" onSubmit={submit}>
        <div className="kind-toggle">
          <button
            type="button"
            className={kind === 'app' ? 'active' : ''}
            onClick={() => setKind('app')}
          >
            APP
          </button>
          <button
            type="button"
            className={kind === 'site' ? 'active' : ''}
            onClick={() => setKind('site')}
          >
            SITE
          </button>
        </div>
        <input
          type="text"
          value={value}
          maxLength={48}
          spellCheck={false}
          placeholder={kind === 'app' ? 'discord, steam, tiktok' : 'youtube, reddit, netflix'}
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
          }}
        />
        <button type="submit" className="btn small">
          ADD
        </button>
      </form>
      {error && <p className="form-error">{error}</p>}

      <h3 className="section-title">{kind === 'app' ? 'NO-NO APPS' : 'NO-NO SITES'}</h3>
      {list.length === 0 ? (
        <p className="empty">Nothing here yet. Add the things that steal your focus.</p>
      ) : (
        <ul className="nono-list">
          {list.map((entry) => {
            const active = noNo.hit && noNo.label === entry
            return (
              <li key={entry} className={active ? 'active' : ''}>
                <span>{entry}</span>
                <button
                  type="button"
                  aria-label={`Remove ${entry}`}
                  onClick={() => removeNoNo(kind, entry)}
                >
                  ×
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <p className="tiny">
        Browser URLs are not readable from a desktop app. Titles cover most tabs; a companion
        extension via native messaging would be the next step for exact URLs.
      </p>
    </div>
  )
}
