import { useEffect, useRef } from 'react'
import type { IconKind } from '../game/types'

const UNITS = 16
const SCALE = 4

function draw(ctx: CanvasRenderingContext2D, kind: IconKind) {
  const r = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect(x, y, w, h)
  }

  ctx.clearRect(0, 0, UNITS, UNITS)

  switch (kind) {
    case 'berry':
      r(5, 7, 6, 6, '#8b5cf6')
      r(6, 6, 4, 1, '#8b5cf6')
      r(6, 13, 4, 1, '#6d3fc0')
      r(6, 8, 2, 2, '#c4b5fd')
      r(11, 4, 1, 4, '#5b7c3a')
      r(9, 5, 2, 1, '#57c76a')
      break
    case 'apple':
      r(6, 6, 5, 7, '#ff5c5c')
      r(5, 7, 7, 5, '#ff5c5c')
      r(6, 7, 2, 2, '#ffb3b3')
      r(8, 3, 1, 4, '#6b4a2a')
      r(9, 5, 3, 1, '#57c76a')
      break
    case 'cherry':
      r(4, 9, 3, 3, '#e0364b')
      r(9, 10, 3, 3, '#c0263c')
      r(5, 10, 1, 1, '#ff8a9c')
      r(7, 6, 1, 3, '#7a5a2a')
      r(10, 5, 1, 5, '#7a5a2a')
      r(8, 4, 3, 1, '#57c76a')
      break
    case 'melon':
      r(4, 7, 8, 6, '#57c76a')
      r(5, 6, 6, 1, '#57c76a')
      r(5, 13, 6, 1, '#2f8a45')
      r(6, 7, 1, 6, '#2f8a45')
      r(9, 7, 1, 6, '#2f8a45')
      r(5, 8, 1, 3, '#a7f3a0')
      break
    case 'starfruit':
      r(7, 3, 2, 10, '#ffd85c')
      r(3, 7, 10, 2, '#ffd85c')
      r(6, 6, 4, 4, '#ffe98a')
      break
    case 'ball':
      r(4, 5, 8, 8, '#ff8fc7')
      r(5, 4, 6, 1, '#ffb3da')
      r(4, 9, 8, 1, '#fff6fb')
      r(6, 6, 1, 1, '#fff6fb')
      break
    case 'music':
      r(9, 3, 2, 7, '#a78bfa')
      r(10, 3, 3, 2, '#7c5cf0')
      r(6, 9, 4, 3, '#a78bfa')
      r(7, 8, 2, 1, '#c4b5fd')
      break
    case 'hat':
      r(4, 8, 9, 1, '#ffb3da')
      r(5, 9, 7, 4, '#ff8fc7')
      r(6, 10, 2, 2, '#ffc2e2')
      r(7, 4, 3, 4, '#ff8fc7')
      r(8, 2, 2, 2, '#fff3b0')
      break
    case 'gift':
      r(4, 7, 8, 7, '#6ee7f0')
      r(4, 10, 8, 4, '#38b6c4')
      r(7, 7, 2, 7, '#ffd85c')
      r(6, 5, 4, 2, '#ffd85c')
      r(4, 3, 3, 2, '#ffd85c')
      r(9, 3, 3, 2, '#ffd85c')
      break
    case 'bed':
      r(3, 9, 10, 4, '#8b5cf6')
      r(3, 6, 4, 3, '#c4b5fd')
      r(5, 7, 2, 1, '#ffe98a')
      r(11, 5, 2, 8, '#6d3fc0')
      r(3, 12, 2, 2, '#4c2f8a')
      r(11, 12, 2, 2, '#4c2f8a')
      break
    case 'heart':
    default:
      r(5, 5, 3, 3, '#ff5c8f')
      r(8, 5, 3, 3, '#ff5c8f')
      r(4, 7, 8, 3, '#ff5c8f')
      r(6, 10, 4, 2, '#ff5c8f')
      r(7, 12, 2, 1, '#ff5c8f')
      r(6, 6, 1, 1, '#ffb3c8')
      break
  }
}

export function PixelIcon({ kind, size = 40 }: { kind: IconKind; size?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)
    ctx.imageSmoothingEnabled = false
    draw(ctx, kind)
  }, [kind])

  return (
    <canvas
      ref={ref}
      width={UNITS * SCALE}
      height={UNITS * SCALE}
      className="pixel-icon"
      style={{ width: size, height: size }}
    />
  )
}
