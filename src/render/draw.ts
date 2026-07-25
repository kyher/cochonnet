import { BOULE_RADIUS_M, COCHONNET_RADIUS_M, TERRAIN_LENGTH_M, TERRAIN_WIDTH_M } from '../game/constants'
import type { Vector2 } from '../game/types'
import type { Vector3 } from '../physics/types'
import { metersToPixels, worldToScreen, type Viewport } from './coordinates'

const BACKGROUND_COLOR = '#5b7a4f'
const TERRAIN_COLOR = '#c9b28a'
const TERRAIN_BORDER_COLOR = '#a68f68'
const LINE_OF_PLAY_COLOR = '#f6f2ea'
const BOULE_FILL_COLOR = '#9aa0a6'
const BOULE_STROKE_COLOR = '#5f6368'
const COCHONNET_FILL_COLOR = '#d1495b'
const COCHONNET_STROKE_COLOR = '#8f2e3b'
const SHADOW_COLOR = 'rgba(0, 0, 0, 0.28)'

// The terrain is tens of meters long, so true-to-scale boules/cochonnet
// render as sub-pixel dots on any realistic screen size. Draw them
// exaggerated and with a pixel floor for legibility; this only affects
// rendering — collision and scoring still use the true physical radii.
const BOULE_VISUAL_SCALE = 3
const BOULE_MIN_RADIUS_PX = 7
const COCHONNET_VISUAL_SCALE = 3
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
