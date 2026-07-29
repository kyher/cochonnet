import {
  BOULE_RADIUS_M,
  COCHONNET_RADIUS_M,
  COLLISION_VISUAL_SCALE,
  TERRAIN_LENGTH_M,
  TERRAIN_WIDTH_M,
} from '../game/constants'
import type { Vector2 } from '../game/types'
import type { Vector3 } from '../physics/types'
import { metersToPixels, worldToScreen, type Viewport } from './coordinates'

// Exported (not just used locally) so render/shareCard.ts can draw the Share
// Card in the same fixed palette as the game board itself, rather than the
// app's separate light/dark CSS theme (see docs/adr/0005 and docs/adr/0007).
export const BACKGROUND_COLOR = '#5b7a4f'
export const TERRAIN_COLOR = '#c9b28a'
export const TERRAIN_BORDER_COLOR = '#a68f68'
export const LINE_OF_PLAY_COLOR = '#f6f2ea'
const BOULE_FILL_COLOR = '#9aa0a6'
const BOULE_STROKE_COLOR = '#5f6368'
export const COCHONNET_FILL_COLOR = '#d1495b'
export const COCHONNET_STROKE_COLOR = '#8f2e3b'
const SHADOW_COLOR = 'rgba(0, 0, 0, 0.28)'

// Anchors for the throw-power drag indicator's RAG gradient (see
// render/throwIndicator.ts). THROW_POWER_LOW_COLOR is a vivid, saturated
// green rather than a "natural" one so it still reads clearly against the
// olive/sandy terrain and background above.
export const THROW_POWER_LOW_COLOR = '#4ade80'
export const THROW_POWER_MID_COLOR = '#fbbf24'
export const THROW_POWER_HIGH_COLOR = '#ef4444'

// Per-zone colors for the on-canvas throw-result feedback (see
// render/throwFeedback.ts and docs/adr/0006). Ordered best to worst so the
// gradient reads the same "good = green, bad = red" way the power indicator
// above does, without reusing its exact anchor colors (different signal).
export const ZONE_BULLSEYE_COLOR = '#ffd700'
export const ZONE_CLOSE_COLOR = '#4ade80'
export const ZONE_NEAR_COLOR = '#fbbf24'
export const ZONE_IN_RANGE_COLOR = '#fb923c'
export const ZONE_MISS_COLOR = '#cbd0d6'
// A voided end is a distinct, worse outcome than a miss (see docs/adr/0006) —
// alarm red, not a fifth point on the zone gradient above.
export const VOID_COLOR = '#ef4444'

// The terrain is tens of meters long, so true-to-scale boules/cochonnet
// render as sub-pixel dots on any realistic screen size. Draw them
// exaggerated (COLLISION_VISUAL_SCALE, shared with physics so a collision
// triggers exactly when the drawn circles touch) and with a pixel floor for
// legibility on tiny screens — the floor itself is rendering-only and has no
// physics equivalent.
const BOULE_VISUAL_SCALE = COLLISION_VISUAL_SCALE
const BOULE_MIN_RADIUS_PX = 7
const COCHONNET_VISUAL_SCALE = COLLISION_VISUAL_SCALE
const COCHONNET_MIN_RADIUS_PX = 5

function visualRadiusPx(viewport: Viewport, trueRadiusM: number, scale: number, minPx: number): number {
  return Math.max(metersToPixels(viewport, trueRadiusM) * scale, minPx)
}

export function clearCanvas(ctx: CanvasRenderingContext2D, widthPx: number, heightPx: number): void {
  ctx.clearRect(0, 0, widthPx, heightPx)
}

/**
 * Fills the whole canvas (including the margins around the terrain, where
 * the line of play, throwing circle, and out-of-bounds boules render) so
 * there's no jarring blank area outside the terrain rectangle.
 */
export function drawBackground(ctx: CanvasRenderingContext2D, widthPx: number, heightPx: number): void {
  ctx.fillStyle = BACKGROUND_COLOR
  ctx.fillRect(0, 0, widthPx, heightPx)
}

export function drawTerrain(ctx: CanvasRenderingContext2D, viewport: Viewport): void {
  const topLeft = worldToScreen({ x: -TERRAIN_WIDTH_M / 2, y: TERRAIN_LENGTH_M }, viewport)
  const widthPx = metersToPixels(viewport, TERRAIN_WIDTH_M)
  const heightPx = metersToPixels(viewport, TERRAIN_LENGTH_M)

  ctx.fillStyle = TERRAIN_COLOR
  ctx.fillRect(topLeft.x, topLeft.y, widthPx, heightPx)
  ctx.strokeStyle = TERRAIN_BORDER_COLOR
  ctx.lineWidth = 2
  ctx.strokeRect(topLeft.x, topLeft.y, widthPx, heightPx)
}

/** The line of play (foul line): the throwing circle sits behind it, at negative y. */
export function drawLineOfPlay(ctx: CanvasRenderingContext2D, viewport: Viewport): void {
  const left = worldToScreen({ x: -TERRAIN_WIDTH_M / 2, y: 0 }, viewport)
  const right = worldToScreen({ x: TERRAIN_WIDTH_M / 2, y: 0 }, viewport)

  ctx.beginPath()
  ctx.setLineDash([6, 5])
  ctx.moveTo(left.x, left.y)
  ctx.lineTo(right.x, right.y)
  ctx.strokeStyle = LINE_OF_PLAY_COLOR
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.setLineDash([])
}

export function drawCochonnet(ctx: CanvasRenderingContext2D, viewport: Viewport, position: Vector2): void {
  const screen = worldToScreen(position, viewport)
  const radiusPx = visualRadiusPx(viewport, COCHONNET_RADIUS_M, COCHONNET_VISUAL_SCALE, COCHONNET_MIN_RADIUS_PX)

  ctx.beginPath()
  ctx.arc(screen.x, screen.y, radiusPx, 0, Math.PI * 2)
  ctx.fillStyle = COCHONNET_FILL_COLOR
  ctx.fill()
  ctx.strokeStyle = COCHONNET_STROKE_COLOR
  ctx.lineWidth = 1
  ctx.stroke()
}

/**
 * Draws a boule at ground level (a resting boule). For an in-flight boule,
 * use `drawBoule3d` instead, which also renders a ground shadow to convey
 * height.
 */
export function drawBoule(ctx: CanvasRenderingContext2D, viewport: Viewport, position: Vector2): void {
  drawBoule3d(ctx, viewport, { x: position.x, y: position.y, z: BOULE_RADIUS_M })
}

/**
 * Draws an in-flight or rolling boule: a ground shadow at its true ground
 * position, and the boule itself lifted on screen in proportion to its
 * height above the ground (z), giving the illusion of the simulated 3rd
 * dimension on a top-down 2D view.
 */
export function drawBoule3d(ctx: CanvasRenderingContext2D, viewport: Viewport, position: Vector3): void {
  const ground = worldToScreen({ x: position.x, y: position.y }, viewport)
  const radiusPx = visualRadiusPx(viewport, BOULE_RADIUS_M, BOULE_VISUAL_SCALE, BOULE_MIN_RADIUS_PX)
  const liftPx = metersToPixels(viewport, Math.max(0, position.z - BOULE_RADIUS_M))

  ctx.beginPath()
  ctx.ellipse(ground.x, ground.y, radiusPx * 0.9, radiusPx * 0.5, 0, 0, Math.PI * 2)
  ctx.fillStyle = SHADOW_COLOR
  ctx.fill()

  const ballCenter = { x: ground.x, y: ground.y - liftPx }
  const gradient = ctx.createRadialGradient(
    ballCenter.x - radiusPx * 0.3,
    ballCenter.y - radiusPx * 0.3,
    radiusPx * 0.1,
    ballCenter.x,
    ballCenter.y,
    radiusPx,
  )
  gradient.addColorStop(0, '#e2e4e7')
  gradient.addColorStop(1, BOULE_FILL_COLOR)

  ctx.beginPath()
  ctx.arc(ballCenter.x, ballCenter.y, radiusPx, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()
  ctx.strokeStyle = BOULE_STROKE_COLOR
  ctx.lineWidth = 1
  ctx.stroke()
}
