import { useEffect, useRef, useState } from 'react'
import { LEAVING_MOOD, moodBand } from '../game/engine'
import { drawPet, PET_SCALE, PET_SIZE } from '../game/sprite'
import type { SessionStatus } from '../game/types'

interface PetStageProps {
  name: string
  onRename: (name: string) => void
  onPet: () => void
  petComment: string | null
  petBurst: number
  mood: number
  alive: boolean
  toast: string | null
  toastOk: boolean
  noNoLabel: string | null
  reaction: string | null
  sessionStatus: SessionStatus
  awaySeconds: number
  onAdopt: () => void
}

const HAPPY_LINES = ['Focus! Focus! I love this.', 'Look at us go!', 'We are doing so well!']
const BORED_LINES = ['Kinda bored… got a snack?', 'Snack? Snack?', 'This is fine. I guess.']
const MAD_LINES = ['I am SO mad right now.', 'You are on thin ice.', 'Feed me. NOW.']
const IDLE_HAPPY = ['Hi! Ready to study?', 'Let us earn some points!', 'Best day ever.']
const IDLE_BORED = ['Nothing to do…', 'Feed me a fruit?', 'I could use a gift.']
const IDLE_MAD = ['Hmph.', 'You forgot about me.', 'Not talking to you.']

function pick(lines: string[]): string {
  return lines[Math.floor(Date.now() / 7000) % lines.length]
}

function bubbleLine(props: PetStageProps, band: ReturnType<typeof moodBand>): string {
  if (!props.alive) return 'I waited as long as I could…'
  if (props.petComment) return props.petComment
  if (props.reaction) return props.reaction
  if (props.mood <= LEAVING_MOOD) return "That's it! I'm leaving!"
  if (props.noNoLabel) return `No-no app: ${props.noNoLabel} >:(`
  if (props.sessionStatus === 'running') {
    if (props.awaySeconds > 0) return 'Why did you leave me!'
    if (band === 'happy') return pick(HAPPY_LINES)
    if (band === 'bored') return pick(BORED_LINES)
    return pick(MAD_LINES)
  }
  if (props.sessionStatus === 'paused') return 'Why did you leave me!'
  if (props.sessionStatus === 'broken') return 'You broke it. I felt that.'
  if (band === 'happy') return pick(IDLE_HAPPY)
  if (band === 'bored') return pick(IDLE_BORED)
  return pick(IDLE_MAD)
}

export function PetStage(props: PetStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(props.name)
  const [hopping, setHopping] = useState(false)
  const cancelled = useRef(false)
  const band = moodBand(props.mood)
  const line = bubbleLine(props, band)

  const startEditing = () => {
    cancelled.current = false
    setDraft(props.name)
    setEditing(true)
  }

  const commitName = () => {
    if (cancelled.current) {
      cancelled.current = false
      setEditing(false)
      return
    }
    const next = draft.trim().replace(/\s+/g, ' ').slice(0, 18)
    if (next) props.onRename(next)
    setEditing(false)
  }

  useEffect(() => {
    if (!props.petBurst) return
    setHopping(true)
    const timer = window.setTimeout(() => setHopping(false), 320)
    return () => window.clearTimeout(timer)
  }, [props.petBurst])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frameId = 0
    const render = (time: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.setTransform(PET_SCALE, 0, 0, PET_SCALE, 0, 0)
      ctx.imageSmoothingEnabled = false
      drawPet(ctx, { band, time })
      frameId = requestAnimationFrame(render)
    }
    frameId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(frameId)
  }, [band])

  return (
    <>
      <div className="pet-name-bar">
        {editing ? (
          <form
            className="name-form"
            onSubmit={(event) => {
              event.preventDefault()
              commitName()
            }}
          >
            <input
              autoFocus
              value={draft}
              maxLength={18}
              aria-label="Tomodoro nickname"
              placeholder="Nickname"
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commitName}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  cancelled.current = true
                  setEditing(false)
                }
              }}
            />
            <button type="submit" className="btn small">
              SAVE
            </button>
          </form>
        ) : (
          <button
            type="button"
            className="pet-name"
            onClick={startEditing}
            title="Click to give your Tomodoro a nickname"
          >
            <span className="pet-name-label">NAME</span>
            <span className="pet-name-value">{props.name}</span>
            <span className="pet-name-edit" aria-hidden="true">
              edit
            </span>
          </button>
        )}
      </div>

      <div className={`stage band-${props.alive ? band : 'gone'} ${props.noNoLabel ? 'alert' : ''}`}>
              <div className="stage-stars" aria-hidden="true" />
        {props.alive && <div className="bubble">{line}</div>}

      {props.alive && props.petBurst > 0 && (
        <div className="pet-hearts" key={props.petBurst} aria-hidden="true">
          {[0, 1, 2, 3, 4].map((index) => (
            <span
              key={index}
              style={{ left: `${-34 + index * 17}px`, animationDelay: `${index * 70}ms` }}
            >
              ♥
            </span>
          ))}
        </div>
      )}

      {props.alive && (
        <canvas
          ref={canvasRef}
          width={PET_SIZE * PET_SCALE}
          height={PET_SIZE * PET_SCALE}
          className={`pet-canvas ${hopping ? 'hop' : ''}`}
          onClick={props.onPet}
          title="Pet your Tomodoro"
        />
      )}

      {props.toast && (
        <div className={`toast ${props.toastOk ? 'ok' : 'bad'}`}>{props.toast}</div>
      )}

      {!props.alive && (
        <div className="stage-overlay">
          <p className="dead-title">TOMODORO LEFT</p>
          <p className="dead-text">It waited for care that never came.</p>
          <button type="button" className="btn primary" onClick={props.onAdopt}>
            ADOPT A NEW ONE
          </button>
        </div>
      )}
      </div>
    </>
  )
}
