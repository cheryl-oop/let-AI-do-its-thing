import type { MoodBand } from './types'

export const PET_SIZE = 48
export const PET_SCALE = 6

interface Palette {
  base: string
  shade: string
  light: string
  leaf: string
  leafDark: string
  face: string
  cheek: string
}

const HAPPY: Palette = {
  base: '#ff5c5c',
  shade: '#c93d4b',
  light: '#ff9a9a',
  leaf: '#57c76a',
  leafDark: '#2f8a45',
  face: '#2a1020',
  cheek: '#ff9ec4',
}

const BORED: Palette = {
  base: '#c97777',
  shade: '#9a5158',
  light: '#e0a1a1',
  leaf: '#8d9a5a',
  leafDark: '#5f6b38',
  face: '#2a1020',
  cheek: '#c98a9a',
}

const MAD: Palette = {
  base: '#dc3f3f',
  shade: '#8d1f26',
  light: '#f47272',
  leaf: '#7c6a3a',
  leafDark: '#4f4322',
  face: '#22100c',
  cheek: '#b3352f',
}

const GONE: Palette = {
  base: '#6a6a80',
  shade: '#45455a',
  light: '#8d8da3',
  leaf: '#6a6752',
  leafDark: '#484534',
  face: '#181322',
  cheek: '#585868',
}

const PALETTES: Record<MoodBand, Palette> = { happy: HAPPY, bored: BORED, mad: MAD }

function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
}

function drawCross(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  box(ctx, x, y, 1, 1, color)
  box(ctx, x + 2, y, 1, 1, color)
  box(ctx, x + 1, y + 1, 1, 1, color)
  box(ctx, x, y + 2, 1, 1, color)
  box(ctx, x + 2, y + 2, 1, 1, color)
}

function drawZ(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  box(ctx, x, y, 3, 1, color)
  box(ctx, x + 1, y + 1, 1, 1, color)
  box(ctx, x, y + 2, 3, 1, color)
}

/**
 * Draws the Tomodoro at 48x48 logical pixels. The canvas is scaled up with
 * smoothing disabled, which keeps every edge a hard pixel.
 */
export function drawPet(
  ctx: CanvasRenderingContext2D,
  options: { band: MoodBand; alive: boolean; time: number },
) {
  const { band, alive, time } = options
  const pal = alive ? PALETTES[band] : GONE

  ctx.clearRect(0, 0, PET_SIZE, PET_SIZE)

  const bob = alive ? Math.round(Math.sin(time / 600)) : 0
  const shake = alive && band === 'mad' ? (Math.floor(time / 140) % 2 === 0 ? 1 : 0) : 0
  const cx = 24 + shake
  const cy = 27 + bob
  const rx = 15
  const ry = 12

  // Ground
  for (let x = 3; x < PET_SIZE - 3; x++) box(ctx, x, 44, 1, 3, '#291c46')
  for (let x = 5; x < PET_SIZE - 5; x += 4) box(ctx, x, 44, 2, 1, '#3b2a60')

  // Shadow
  for (let y = 41; y <= 43; y++) {
    const half = 12 - (43 - y) * 3
    ctx.fillStyle = 'rgba(8, 4, 18, 0.45)'
    ctx.fillRect(cx - half, y, half * 2, 1)
  }

  // Body
  const widths: number[] = []
  for (let y = -ry; y <= ry; y++) {
    const ratio = 1 - (y * y) / (ry * ry + 2)
    const w = Math.round(rx * Math.sqrt(Math.max(0, ratio)))
    widths.push(w)
    box(ctx, cx - w, cy + y, w * 2, 1, pal.base)
  }

  widths.forEach((w, index) => {
    const y = cy - ry + index
    box(ctx, cx + w - 3, y, 3, 1, pal.shade)
    box(ctx, cx - w, y, 2, 1, pal.light)
  })

  box(ctx, cx - 9, cy + ry - 1, 18, 1, pal.shade)
  box(ctx, cx - 6, cy + ry - 2, 12, 1, pal.shade)

  // Leaf and stem
  const topY = cy - ry
  box(ctx, cx - 1, topY - 5, 2, 6, pal.leafDark)
  box(ctx, cx - 6, topY - 3, 5, 2, pal.leaf)
  box(ctx, cx + 2, topY - 3, 5, 2, pal.leaf)
  box(ctx, cx - 3, topY - 5, 6, 2, pal.leaf)
  box(ctx, cx - 7, topY - 1, 3, 1, pal.leafDark)
  box(ctx, cx + 4, topY - 1, 3, 1, pal.leafDark)

  // Face
  const eyeY = cy - 2
  const leftEye = cx - 5
  const rightEye = cx + 2
  const mouthY = cy + 6

  if (!alive) {
    drawCross(ctx, leftEye, eyeY - 1, pal.face)
    drawCross(ctx, rightEye, eyeY - 1, pal.face)
    box(ctx, cx - 2, mouthY, 5, 1, pal.face)
  } else if (band === 'happy') {
    const blink = time % 5200 < 150
    if (blink) {
      box(ctx, leftEye, eyeY + 1, 3, 1, pal.face)
      box(ctx, rightEye, eyeY + 1, 3, 1, pal.face)
    } else {
      box(ctx, leftEye, eyeY - 1, 3, 4, pal.face)
      box(ctx, rightEye, eyeY - 1, 3, 4, pal.face)
      box(ctx, leftEye, eyeY - 1, 1, 1, '#ffffff')
      box(ctx, rightEye, eyeY - 1, 1, 1, '#ffffff')
    }
    box(ctx, cx - 3, mouthY - 1, 1, 1, pal.face)
    box(ctx, cx - 2, mouthY, 5, 1, pal.face)
    box(ctx, cx + 3, mouthY - 1, 1, 1, pal.face)
    box(ctx, cx - 1, mouthY + 1, 2, 1, '#ff7b8f')
    box(ctx, cx - 10, mouthY - 2, 2, 1, pal.cheek)
    box(ctx, cx + 8, mouthY - 2, 2, 1, pal.cheek)
  } else if (band === 'bored') {
    const blink = time % 6100 < 150
    if (blink) {
      box(ctx, leftEye, eyeY + 1, 3, 1, pal.face)
      box(ctx, rightEye, eyeY + 1, 3, 1, pal.face)
    } else {
      box(ctx, leftEye, eyeY, 3, 2, pal.face)
      box(ctx, rightEye, eyeY, 3, 2, pal.face)
      box(ctx, leftEye - 1, eyeY - 1, 5, 1, pal.shade)
      box(ctx, rightEye - 1, eyeY - 1, 5, 1, pal.shade)
    }
    box(ctx, cx - 2, mouthY, 5, 1, pal.face)
  } else {
    box(ctx, leftEye - 1, eyeY, 3, 2, pal.face)
    box(ctx, rightEye + 1, eyeY, 3, 2, pal.face)
    box(ctx, leftEye - 2, eyeY - 2, 4, 1, pal.face)
    box(ctx, leftEye + 1, eyeY - 1, 2, 1, pal.face)
    box(ctx, rightEye, eyeY - 2, 4, 1, pal.face)
    box(ctx, cx - 2, mouthY - 1, 5, 1, pal.face)
    box(ctx, cx - 3, mouthY, 1, 1, pal.face)
    box(ctx, cx + 3, mouthY, 1, 1, pal.face)

    // Steam
    const rise = Math.floor(time / 260) % 5
    box(ctx, cx - 13, cy - ry - 5 - rise, 2, 2, '#c7b7ff')
    box(ctx, cx + 11, cy - ry - 3 - ((rise + 2) % 5), 2, 2, '#c7b7ff')
    box(ctx, cx - 11, cy - ry - 1 - ((rise + 3) % 4), 1, 1, '#e2d8ff')
  }

  if (alive) {
    if (band === 'happy') {
      const phase = Math.floor(time / 380) % 4
      const sparkles: Array<[number, number]> = [
        [7, 14],
        [40, 10],
        [6, 31],
        [41, 27],
      ]
      sparkles.forEach(([x, y], index) => {
        if ((phase + index) % 4 !== 0) return
        box(ctx, x, y, 1, 1, '#ffe98a')
        box(ctx, x - 1, y, 1, 1, '#ffe98a')
        box(ctx, x + 1, y, 1, 1, '#ffe98a')
        box(ctx, x, y - 1, 1, 1, '#fff8cf')
        box(ctx, x, y + 1, 1, 1, '#fff8cf')
      })
    } else if (band === 'bored') {
      const drift = Math.floor(time / 900) % 6
      drawZ(ctx, cx + 13, 8 + drift, '#9f8cff')
    }
  }
}
