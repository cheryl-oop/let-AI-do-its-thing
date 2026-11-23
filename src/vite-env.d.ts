/// <reference types="vite/client" />

import type { Activity } from './game/types'

export interface TomodoroApi {
  platform: string
  startActivity: () => void
  stopActivity: () => void
  getLastActivity: () => Promise<Activity | null>
  getIdleSeconds: () => Promise<number>
  setPinned: (pinned: boolean) => Promise<boolean>
  onActivity: (callback: (activity: Activity) => void) => () => void
  onFocus: (callback: (focused: boolean) => void) => () => void
}

declare global {
  interface Window {
    tomodoro?: TomodoroApi
  }
}

export {}
