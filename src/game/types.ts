export type MoodBand = 'happy' | 'bored' | 'mad'
export type LogKind = 'good' | 'bad' | 'info'
export type SessionStatus = 'idle' | 'running' | 'paused' | 'done' | 'broken'
export type NoNoKind = 'app' | 'site'

export type IconKind =
  | 'berry'
  | 'apple'
  | 'cherry'
  | 'melon'
  | 'starfruit'
  | 'ball'
  | 'music'
  | 'hat'
  | 'gift'
  | 'bed'
  | 'heart'

export interface Activity {
  processName: string
  windowTitle: string
  pid?: number
}

export interface Pet {
  name: string
  mood: number
  points: number
  alive: boolean
  bornAt: number
  lastCareAt: number
  totalFocusSeconds: number
  timesLeft: number
  /** True once the pet has warned that it is about to leave. */
  leaveWarned: boolean
  /** Last time the pet was petted, used to throttle the FP it gives. */
  lastPetAt?: number
  /** Last time petting actually nudged mood, throttled separately and slower. */
  lastPetMoodAt?: number
}

export interface Session {
  status: SessionStatus
  goalSeconds: number
  elapsed: number
  awaySeconds: number
  noNoSeconds: number
  sessionPoints: number
  startedAt: number | null
  breakReason: string | null
  /** True when the session paused itself because the pet was left alone. */
  autoPaused: boolean
}

export interface Settings {
  goalMinutes: number
  graceSeconds: number
  idleLimitSeconds: number
  noNoApps: string[]
  noNoSites: string[]
}

export interface LogEntry {
  id: string
  at: number
  text: string
  kind: LogKind
}

export interface GameData {
  pet: Pet
  session: Session
  settings: Settings
  log: LogEntry[]
  lastTick: number
}

export interface TickContext {
  now: number
  focused: boolean
  idleSeconds: number
  activity: Activity | null
}

export interface CareItem {
  id: string
  name: string
  icon: IconKind
  cost: number
  mood: number
  note: string
  gift?: boolean
  /** What the pet says when given this item, by mood band. */
  reactions?: Record<MoodBand, string>
}

export interface NoNoMatch {
  hit: boolean
  label: string | null
  reason: NoNoKind | null
}
