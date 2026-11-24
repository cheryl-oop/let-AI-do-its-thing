import { useEffect, useMemo, useRef, useState } from 'react'
import { CarePanel } from './components/CarePanel'
import { LogFeed } from './components/LogFeed'
import { MoodMeter } from './components/MoodMeter'
import { NoNoPanel } from './components/NoNoPanel'
import { PetStage } from './components/PetStage'
import { SessionPanel, type Tone } from './components/SessionPanel'
import { petLine } from './game/data'
import { BASE_FP_PER_SECOND, matchNoNo, moodBand, moodMultiplier } from './game/engine'
import { useActivity } from './hooks/useActivity'
import { useGame } from './store/useGame'

type Tab = 'care' | 'nono' | 'log'

export default function App() {
  const { activity, focused, idleSeconds } = useActivity()

  const pet = useGame((state) => state.pet)
  const session = useGame((state) => state.session)
  const settings = useGame((state) => state.settings)
  const adopt = useGame((state) => state.adopt)
  const rename = useGame((state) => state.rename)

  const [tab, setTab] = useState<Tab>('care')
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null)
  const [reaction, setReaction] = useState<string | null>(null)
  const [petComment, setPetComment] = useState<string | null>(null)
  const [petBurst, setPetBurst] = useState(0)
  const [pinned, setPinned] = useState(false)

  const toastTimer = useRef<number | null>(null)
  const reactionTimer = useRef<number | null>(null)
  const petTimer = useRef<number | null>(null)
  const ctxRef = useRef({ activity, focused, idleSeconds })
  ctxRef.current = { activity, focused, idleSeconds }

  const hasApi = typeof window !== 'undefined' && Boolean(window.tomodoro)

  useEffect(() => {
    useGame.getState().reconcile()

    const run = () => {
      const current = ctxRef.current
      useGame.getState().tick({
        now: Date.now(),
        focused: current.focused,
        idleSeconds: current.idleSeconds,
        activity: current.activity,
      })
    }

    run()
    const timer = window.setInterval(run, 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
      if (reactionTimer.current) window.clearTimeout(reactionTimer.current)
      if (petTimer.current) window.clearTimeout(petTimer.current)
    }
  }, [])

  const noNo = useMemo(() => matchNoNo(activity, settings), [activity, settings])
  const band = moodBand(pet.mood)
  const idleBlocked = idleSeconds >= settings.idleLimitSeconds
  const rate = Math.round(BASE_FP_PER_SECOND * moodMultiplier(band) * 60)

  let statusLabel = 'READY'
  let tone: Tone = 'idle'
  if (!pet.alive) {
    statusLabel = 'GONE'
    tone = 'bad'
  } else if (noNo.hit) {
    statusLabel = `NO-NO: ${noNo.label}`
    tone = 'bad'
  } else if (session.status === 'running') {
    if (idleBlocked) {
      statusLabel = 'IDLE — MOVE!'
      tone = 'warn'
    } else if (!focused) {
      statusLabel = 'AWAY — COME BACK'
      tone = 'warn'
    } else {
      statusLabel = 'FOCUSING'
      tone = 'ok'
    }
  } else if (session.status === 'paused') {
    statusLabel = 'PAUSED'
    tone = 'idle'
  } else if (session.status === 'done') {
    statusLabel = 'COMPLETE'
    tone = 'ok'
  } else if (session.status === 'broken') {
    statusLabel = 'BROKEN'
    tone = 'bad'
  }

  const flashToast = (text: string, ok: boolean, duration = 2400) => {
    setToast({ text, ok })
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), duration)
  }

  const handlePet = () => {
    const result = useGame.getState().petTomodoro()
    if (!result.ok) return

    setPetBurst((burst) => burst + 1)
    setPetComment(petLine(pet.mood))
    if (result.moodGained > 0) flashToast(`Pet · mood +${result.moodGained}`, true, 2000)

    if (petTimer.current) window.clearTimeout(petTimer.current)
    petTimer.current = window.setTimeout(() => setPetComment(null), 3500)
  }

  const handleCare = (itemId: string) => {
    const result = useGame.getState().care(itemId)
    flashToast(result.message, result.ok)

    if (result.ok && result.reaction) {
      setPetComment(null)
      setReaction(result.reaction)
      if (reactionTimer.current) window.clearTimeout(reactionTimer.current)
      reactionTimer.current = window.setTimeout(() => setReaction(null), 6000)
    }
  }

  const togglePin = async () => {
    const api = window.tomodoro
    if (!api) return
    const next = await api.setPinned(!pinned)
    setPinned(next)
  }

  const focusMinutes = Math.floor(pet.totalFocusSeconds / 60)

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">TOMODORO</span>
          <span className="brand-sub">focus pet</span>
        </div>

        <div className="hud">
          <div className="stat">
            <span className="stat-label">FOCUS FP</span>
            <span className="stat-value">{Math.floor(pet.points)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">MOOD</span>
            <span className={`stat-value mood-${band}`}>{Math.round(pet.mood)}%</span>
          </div>
          <div className="stat">
            <span className="stat-label">RATE</span>
            <span className="stat-value">+{rate}/min</span>
          </div>
          <button
            type="button"
            className={`pin ${pinned ? 'on' : ''}`}
            onClick={togglePin}
            disabled={!hasApi}
            title="Keep Tomodoro above other windows"
          >
            PIN
          </button>
        </div>
      </header>

      {!hasApi && (
        <div className="web-note" role="note">
          <span className="web-note-tag">BROWSER DEMO</span>
          No-no apps &amp; sites, idle detection and the PIN button only work in the
          desktop app.
        </div>
      )}

      <main className="layout">
        <section className="stage-col">
          <PetStage
            name={pet.name}
            onRename={rename}
            onPet={handlePet}
            petComment={petComment}
            petBurst={petBurst}
            mood={pet.mood}
            alive={pet.alive}
            toast={toast ? toast.text : null}
            toastOk={toast ? toast.ok : true}
            noNoLabel={noNo.hit ? noNo.label : null}
            reaction={reaction}
            sessionStatus={session.status}
            awaySeconds={session.awaySeconds}
            onAdopt={adopt}
          />

          <MoodMeter mood={pet.mood} />

          <SessionPanel statusLabel={statusLabel} tone={tone} />
        </section>

        <aside className="side">
          <div className="tabs">
            {(['care', 'nono', 'log'] as const).map((key) => (
              <button
                key={key}
                type="button"
                className={`tab ${tab === key ? 'active' : ''}`}
                onClick={() => setTab(key)}
              >
                {key === 'care' ? 'CARE' : key === 'nono' ? 'NO-NO' : 'LOG'}
              </button>
            ))}
          </div>

          <div className="tab-body">
            {tab === 'care' && <CarePanel onCare={handleCare} />}
            {tab === 'nono' && (
              <NoNoPanel activity={activity} noNo={noNo} tracking={hasApi} />
            )}
            {tab === 'log' && <LogFeed />}
          </div>

          <div className="side-footer">
            <span>
              FOCUSED <strong>{focusMinutes}m</strong>
            </span>
            <span>
              LEFT <strong>{pet.timesLeft}×</strong>
            </span>
            <span>
              GOAL <strong>{settings.goalMinutes}m</strong>
            </span>
          </div>
        </aside>
      </main>
    </div>
  )
}
