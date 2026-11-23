import { useEffect, useState } from 'react'
import type { Activity } from '../game/types'

export interface ActivitySnapshot {
  activity: Activity | null
  focused: boolean
  idleSeconds: number
}

/**
 * Subscribes to foreground-window updates from the Electron main process.
 * Falls back to plain document focus in a normal browser tab.
 */
export function useActivity(): ActivitySnapshot {
  const [activity, setActivity] = useState<Activity | null>(null)
  const [focused, setFocused] = useState(true)
  const [idleSeconds, setIdleSeconds] = useState(0)

  useEffect(() => {
    const api = window.tomodoro

    if (!api) {
      const onFocus = () => setFocused(true)
      const onBlur = () => setFocused(false)
      setFocused(document.hasFocus())
      window.addEventListener('focus', onFocus)
      window.addEventListener('blur', onBlur)
      return () => {
        window.removeEventListener('focus', onFocus)
        window.removeEventListener('blur', onBlur)
      }
    }

    let alive = true
    api.startActivity()

    const offActivity = api.onActivity((payload) => {
      if (!alive) return
      setActivity(payload)
    })
    const offFocus = api.onFocus((value) => {
      if (!alive) return
      setFocused(value)
    })

    const poll = async () => {
      try {
        const seconds = await api.getIdleSeconds()
        if (alive) setIdleSeconds(seconds)
      } catch {
        /* idle polling is best effort */
      }
    }

    void poll()
    const timer = window.setInterval(() => void poll(), 1000)

    return () => {
      alive = false
      window.clearInterval(timer)
      offActivity()
      offFocus()
      api.stopActivity()
    }
  }, [])

  return { activity, focused, idleSeconds }
}
