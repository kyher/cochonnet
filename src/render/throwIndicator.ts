import { THROW_POWER_HIGH_COLOR, THROW_POWER_LOW_COLOR, THROW_POWER_MID_COLOR } from './draw'

const MIN_LINE_WIDTH_PX = 2
const MAX_LINE_WIDTH_PX = 6

export interface ThrowIndicatorStyle {
  color: string
  lineWidthPx: number
}

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

function lerpColor(fromHex: string, toHex: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(fromHex)
  const [r2, g2, b2] = hexToRgb(toHex)
  return `rgb(${Math.round(lerp(r1, r2, t))}, ${Math.round(lerp(g1, g2, t))}, ${Math.round(lerp(b1, b2, t))})`
}

/**
 * Maps throw power (0-1) to a continuous RAG (red/amber/green) gradient
 * color and a line width, so the drag indicator's power signal doesn't rely
 * on color perception alone (see docs/adr/0005-throw-power-visual-feedback.md).
 */
export function getThrowIndicatorStyle(power: number): ThrowIndicatorStyle {
  const clamped = Math.min(1, Math.max(0, power))
  const color =
    clamped < 0.5
      ? lerpColor(THROW_POWER_LOW_COLOR, THROW_POWER_MID_COLOR, clamped / 0.5)
      : lerpColor(THROW_POWER_MID_COLOR, THROW_POWER_HIGH_COLOR, (clamped - 0.5) / 0.5)

  return {
    color,
    lineWidthPx: lerp(MIN_LINE_WIDTH_PX, MAX_LINE_WIDTH_PX, clamped),
  }
}
