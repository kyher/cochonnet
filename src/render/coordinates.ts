import { TERRAIN_LENGTH_M, TERRAIN_WIDTH_M } from '../game/constants'
import type { Vector2 } from '../game/types'

/**
 * Extra world space rendered below the line of play (y=0), so the throwing
 * circle and the boule waiting to be thrown have room to sit behind the
 * line rather than flush against the bottom edge of the canvas.
 */
export const THROW_CIRCLE_MARGIN_M = 3

/**
 * Extra world space rendered on each side of the terrain, so a throw that
 * drifts wide of the terrain (a common, expected outcome of drag-aiming)
 * still renders on screen instead of vanishing off the canvas edge.
 */
export const HORIZONTAL_MARGIN_M = 1.5

export interface Viewport {
  /** Pixels per meter. */
  scale: number
  /** Pixel x-offset that centers the terrain horizontally in the canvas. */
  offsetX: number
  canvasHeightPx: number
}

/**
 * Fits the terrain plus its margins into a canvas of the given pixel size,
 * uniformly scaled (never stretched) and horizontally centered.
 */
export function computeViewport(canvasWidthPx: number, canvasHeightPx: number): Viewport {
  const worldWidthM = TERRAIN_WIDTH_M + 2 * HORIZONTAL_MARGIN_M
  const worldHeightM = TERRAIN_LENGTH_M + THROW_CIRCLE_MARGIN_M
  const scale = Math.min(canvasWidthPx / worldWidthM, canvasHeightPx / worldHeightM)
  return { scale, offsetX: canvasWidthPx / 2, canvasHeightPx }
}

/**
 * Maps a terrain position (meters; x=0 is the terrain's center line, y=0 is
 * the line of play) to canvas pixels (origin top-left, y=0 at the top — so
 * increasing world y, moving away from the player, moves up the screen).
 * The throwing circle sits at negative y, below the line of play.
 */
export function worldToScreen(position: Vector2, viewport: Viewport): Vector2 {
  return {
    x: viewport.offsetX + position.x * viewport.scale,
    y: viewport.canvasHeightPx - (position.y + THROW_CIRCLE_MARGIN_M) * viewport.scale,
  }
}

export function metersToPixels(viewport: Viewport, meters: number): number {
  return meters * viewport.scale
}
