import type {
  Activity,
  GameData,
  LogEntry,
  LogKind,
  MoodBand,
  NoNoMatch,
  Settings,
  TickContext,
} from './types'

/** Focus points earned per second at 1x mood. */
export const BASE_FP_PER_SECOND = 0.12

/** A happy pet earns much more; a mad one barely anything. */
export const MOOD_MULTIPLIER: Record<MoodBand, number> = {
  happy: 2.4,
  bored: 1,
  mad: 0.3,
}

/** Bonus focus points awarded per goal minute when a session completes. */
export const COMPLETION_FP_PER_MINUTE = 2

export const HAPPY_THRESHOLD = 66
export const BORED_THRESHOLD = 33

/** At or below this mood the pet announces that it is about to leave. */
export const LEAVING_MOOD = 12

const SELF_PROCESSES = ['tomodoro', 'electron']

export function moodBand(mood: number): MoodBand {
  if (mood >= HAPPY_THRESHOLD) return 'happy'
  if (mood >= BORED_THRESHOLD) return 'bored'
  return 'mad'
}

export function moodMultiplier(band: MoodBand): number {
  return MOOD_MULTIPLIER[band]
}

export function addLog(log: LogEntry[], text: string, kind: LogKind, at: number): LogEntry[] {
  const entry: LogEntry = {
    id: `${at}-${Math.random().toString(36).slice(2, 8)}`,
    at,
    text,
    kind,
  }
  return [entry, ...log].slice(0, 60)
}

function normalise(value: string): string {
  return value.trim().toLowerCase().replace(/\.exe$/, '')
}

/**
 * Window titles and process names are the primary signal for "no-no" usage.
 * A browser tab title like "Cats — YouTube" is caught by the site keyword list.
 */
export function matchNoNo(activity: Activity | null, settings: Settings): NoNoMatch {
  if (!activity) return { hit: false, label: null, reason: null }

  const process = normalise(activity.processName || '')
  const title = (activity.windowTitle || '').toLowerCase()

  if (SELF_PROCESSES.some((self) => process.includes(self))) {
    return { hit: false, label: null, reason: null }
  }

  for (const app of settings.noNoApps) {
    const key = normalise(app)
    if (key && process.includes(key)) {
      return { hit: true, label: app, reason: 'app' }
    }
  }

  for (const site of settings.noNoSites) {
    const key = site.trim().toLowerCase()
    if (key && title.includes(key)) {
      return { hit: true, label: site, reason: 'site' }
    }
  }

  return { hit: false, label: null, reason: null }
}

/**
 * Advances the simulation by the elapsed wall-clock time.
 * Called once per second by the renderer; dt is clamped so a suspended
 * window does not fast-forward the whole game.
 */
export function step(state: GameData, ctx: TickContext): GameData {
  const now = ctx.now
  const dt = Math.min(5, Math.max(0, (now - state.lastTick) / 1000))
  if (!Number.isFinite(dt) || dt === 0) {
    return { ...state, lastTick: now }
  }

  const pet = { ...state.pet }
  const session = { ...state.session }
  let log = state.log

  const noNo = matchNoNo(ctx.activity, state.settings)
  const onTask =
    ctx.focused && ctx.idleSeconds < state.settings.idleLimitSeconds && !noNo.hit

  if (!pet.alive) {
    return { ...state, pet, session, lastTick: now }
  }

  // --- Mood drift -------------------------------------------------------
  // Baseline drift, plus a slow escalation the longer it goes unfed. These values
  // are tuned so a fresh, untouched pet lasts roughly an hour and a half before
  // it leaves — neglect should sting, not be an instant wipeout.
  const minutesSinceCare = Math.max(0, (now - pet.lastCareAt) / 60000)
  let decayPerMinute = 0.35

  if (minutesSinceCare > 20) decayPerMinute += 0.35
  if (minutesSinceCare > 45) decayPerMinute += 0.75
  if (minutesSinceCare > 90) decayPerMinute += 1.5

  if (session.status === 'running' && onTask) decayPerMinute *= 0.8
  if (session.status === 'running' && !onTask && !noNo.hit) decayPerMinute += 1.2
  if (noNo.hit) decayPerMinute += 4

  pet.mood -= (decayPerMinute * dt) / 60

  // One last warning before it walks out for good.
  if (pet.mood <= LEAVING_MOOD) {
    if (!pet.leaveWarned) {
      pet.leaveWarned = true
      log = addLog(log, 'Tomodoro: "That\'s it! I\'m leaving!" — feed it, quick!', 'bad', now)
    }
  } else if (pet.leaveWarned) {
    pet.leaveWarned = false
  }

  // --- Session ----------------------------------------------------------
  // A session that paused itself when you left picks up again as soon as you
  // are back and focused. A manual pause stays paused.
  if (session.status === 'paused' && session.autoPaused && onTask) {
    session.status = 'running'
    session.autoPaused = false
    session.awaySeconds = 0
    session.noNoSeconds = 0
    log = addLog(log, 'Welcome back — session resumed. Let us keep going!', 'info', now)
  }

  if (session.status === 'running') {
    if (noNo.hit) {
      session.noNoSeconds += dt
    } else {
      session.noNoSeconds = Math.max(0, session.noNoSeconds - dt * 2)
    }

    if (!onTask && !noNo.hit) {
      session.awaySeconds += dt
    } else {
      session.awaySeconds = Math.max(0, session.awaySeconds - dt * 2)
    }

    if (noNo.hit && session.noNoSeconds >= 2.5) {
      session.status = 'broken'
      session.breakReason = `no-no app: ${noNo.label}`
      pet.mood -= 16
      log = addLog(log, `Session broken — you opened ${noNo.label}. Mood -16.`, 'bad', now)
    } else if (session.awaySeconds >= state.settings.graceSeconds) {
      // Leaving pauses the session instead of destroying it.
      session.status = 'paused'
      session.autoPaused = true
      session.breakReason = null
      session.awaySeconds = 0
      log = addLog(log, 'You left — session paused. Why did you leave me!', 'info', now)
    } else if (onTask) {
      const band = moodBand(pet.mood)
      const gain = BASE_FP_PER_SECOND * moodMultiplier(band) * dt
      pet.points += gain
      pet.totalFocusSeconds += dt
      session.elapsed += dt
      session.sessionPoints += gain

      if (session.elapsed >= session.goalSeconds) {
        session.elapsed = session.goalSeconds
        session.status = 'done'
        const bonus = Math.round(state.settings.goalMinutes * COMPLETION_FP_PER_MINUTE)
        pet.points += bonus
        pet.mood += 9
        log = addLog(
          log,
          `Session complete! +${bonus} bonus FP and mood +9.`,
          'good',
          now,
        )
      }
    }
  }

  // --- Leaving ----------------------------------------------------------
  if (pet.mood <= 0) {
    pet.mood = 0
    pet.alive = false
    pet.timesLeft += 1
    if (session.status === 'running') {
      session.status = 'broken'
      session.breakReason = 'abandoned'
    }
    log = addLog(
      log,
      'Your Tomodoro gave up waiting and left. Adopt a new one when you are ready.',
      'bad',
      now,
    )
  } else {
    pet.mood = Math.min(100, pet.mood)
  }

  return { ...state, pet, session, log, lastTick: now }
}
