import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ALL_ITEMS, createInitialData, createInitialSession, reactionFor } from '../game/data'
import { addLog, step } from '../game/engine'
import type { GameData, NoNoKind, TickContext } from '../game/types'

export interface ActionResult {
  ok: boolean
  message: string
  /** What the pet says back, e.g. a gift reaction. */
  reaction?: string | null
}

interface GameActions {
  tick: (ctx: TickContext) => void
  reconcile: () => void
  startSession: () => void
  pauseSession: () => void
  resumeSession: () => void
  abandonSession: () => void
  care: (itemId: string) => ActionResult
  rename: (name: string) => void
  adopt: () => void
  addNoNo: (kind: NoNoKind, value: string) => ActionResult
  removeNoNo: (kind: NoNoKind, value: string) => void
  setGoalMinutes: (minutes: number) => void
}

export type GameStore = GameData & GameActions

const initial = createInitialData()

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initial,

      tick: (ctx) => {
        const current = get()
        const next = step(current, ctx)
        set({
          pet: next.pet,
          session: next.session,
          log: next.log,
          lastTick: next.lastTick,
          settings: next.settings,
        })
      },

      reconcile: () => {
        const state = get()
        const now = Date.now()
        const pet = { ...state.pet }
        const session = { ...state.session }
        let log = state.log

        // Time spent outside the app still counts as neglect, but at a gentle rate
        // and capped, so a shut-down PC does not wipe out the pet overnight.
        if (state.lastTick > 0) {
          const awayMinutes = Math.min(30, Math.max(0, (now - state.lastTick) / 60000))
          if (awayMinutes > 1 && pet.alive) {
            pet.mood = Math.max(0, pet.mood - awayMinutes * 0.5)
          }
        }

        // Closing the app pauses the session rather than breaking it, so you can
        // come back and keep going. The away decay above is the only cost.
        if (session.status === 'running') {
          session.status = 'paused'
          session.autoPaused = true
          session.breakReason = null
          session.awaySeconds = 0
          log = addLog(log, 'Tomodoro was closed — session paused. Why did you leave me!', 'info', now)
        }

        if (pet.mood <= 0 && pet.alive) {
          pet.mood = 0
          pet.alive = false
          pet.timesLeft += 1
          log = addLog(log, 'You came back too late. Your Tomodoro left.', 'bad', now)
        }

        if (pet.lastCareAt > now) pet.lastCareAt = now

        set({ pet, session, log, lastTick: now })
      },

      startSession: () => {
        const state = get()
        if (!state.pet.alive || state.session.status === 'running') return
        const now = Date.now()
        set({
          session: {
            ...createInitialSession(state.settings.goalMinutes),
            status: 'running',
            startedAt: now,
          },
          lastTick: now,
          log: addLog(
            state.log,
            `Focus session started — ${state.settings.goalMinutes} minutes. Stay here!`,
            'info',
            now,
          ),
        })
      },

      pauseSession: () => {
        const state = get()
        if (state.session.status !== 'running') return
        set({
          session: { ...state.session, status: 'paused', autoPaused: false, awaySeconds: 0 },
          log: addLog(state.log, 'Session paused. No points while paused.', 'info', Date.now()),
        })
      },

      resumeSession: () => {
        const state = get()
        if (state.session.status !== 'paused') return
        set({
          session: {
            ...state.session,
            status: 'running',
            autoPaused: false,
            awaySeconds: 0,
            noNoSeconds: 0,
          },
          lastTick: Date.now(),
        })
      },

      abandonSession: () => {
        const state = get()
        if (state.session.status !== 'running' && state.session.status !== 'paused') return
        const now = Date.now()
        set({
          pet: { ...state.pet, mood: Math.max(0, state.pet.mood - 8) },
          session: { ...state.session, status: 'broken', breakReason: 'you gave up' },
          log: addLog(state.log, 'You gave up early. Mood -8.', 'bad', now),
        })
      },

      care: (itemId) => {
        const state = get()
        const item = ALL_ITEMS.find((entry) => entry.id === itemId)
        if (!item) return { ok: false, message: 'Unknown item.' }
        if (!state.pet.alive) return { ok: false, message: 'Your Tomodoro is gone. Adopt a new one.' }
        if (state.pet.points < item.cost) return { ok: false, message: 'Not enough focus points yet.' }

        const now = Date.now()
        const moodBefore = state.pet.mood
        const raised = Math.min(100, moodBefore + item.mood) - moodBefore
        const reaction = reactionFor(item, moodBefore)

        set({
          pet: {
            ...state.pet,
            points: state.pet.points - item.cost,
            mood: Math.min(100, state.pet.mood + item.mood),
            lastCareAt: now,
          },
          log: addLog(
            state.log,
            `${item.gift ? 'Gift' : 'Fruit'} · ${item.name} — mood +${Math.round(raised)}.`,
            'good',
            now,
          ),
        })

        return { ok: true, message: `${item.name}  mood +${Math.round(raised)}`, reaction }
      },

      rename: (name) => {
        const state = get()
        const trimmed = name.trim().replace(/\s+/g, ' ').slice(0, 18)
        if (!trimmed || trimmed === state.pet.name) return
        const now = Date.now()
        set({
          pet: { ...state.pet, name: trimmed },
          log: addLog(state.log, `Your Tomodoro is now called ${trimmed}.`, 'info', now),
        })
      },

      adopt: () => {
        const state = get()
        const now = Date.now()
        set({
          pet: {
            name: state.pet.name,
            mood: 72,
            points: state.pet.points,
            alive: true,
            bornAt: now,
            lastCareAt: now,
            totalFocusSeconds: state.pet.totalFocusSeconds,
            timesLeft: state.pet.timesLeft,
            leaveWarned: false,
          },
          session: createInitialSession(state.settings.goalMinutes),
          lastTick: now,
          log: addLog(state.log, 'A new Tomodoro hatched. Be kind to it.', 'info', now),
        })
      },

      addNoNo: (kind, value) => {
        const state = get()
        const trimmed = value.trim()
        if (!trimmed) return { ok: false, message: 'Type something first.' }
        const list = kind === 'app' ? state.settings.noNoApps : state.settings.noNoSites
        if (list.some((entry) => entry.toLowerCase() === trimmed.toLowerCase())) {
          return { ok: false, message: 'Already on the list.' }
        }
        if (list.length >= 40) return { ok: false, message: 'That list is full.' }

        set({
          settings:
            kind === 'app'
              ? { ...state.settings, noNoApps: [...state.settings.noNoApps, trimmed] }
              : { ...state.settings, noNoSites: [...state.settings.noNoSites, trimmed] },
        })
        return { ok: true, message: `Added ${trimmed}.` }
      },

      removeNoNo: (kind, value) => {
        const state = get()
        set({
          settings:
            kind === 'app'
              ? { ...state.settings, noNoApps: state.settings.noNoApps.filter((entry) => entry !== value) }
              : { ...state.settings, noNoSites: state.settings.noNoSites.filter((entry) => entry !== value) },
        })
      },

      setGoalMinutes: (minutes) => {
        const state = get()
        const clamped = Math.min(120, Math.max(5, Math.round(minutes)))
        set({
          settings: { ...state.settings, goalMinutes: clamped },
          session:
            state.session.status === 'idle'
              ? { ...state.session, goalSeconds: clamped * 60 }
              : state.session,
        })
      },
    }),
    {
      name: 'tomodoro-save-v1',
      version: 1,
      partialize: (state) => ({
        pet: state.pet,
        session: state.session,
        settings: state.settings,
        log: state.log,
        lastTick: state.lastTick,
      }),
    },
  ),
)
