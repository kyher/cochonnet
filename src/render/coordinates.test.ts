import { describe, expect, it } from 'vitest'
import { TERRAIN_LENGTH_M, TERRAIN_WIDTH_M } from '../game/constants'
import {
  computeViewport,
  HORIZONTAL_MARGIN_M,
  metersToPixels,
  THROW_CIRCLE_MARGIN_M,
  worldToScreen,
} from './coordinates'

const WORLD_WIDTH_M = TERRAIN_WIDTH_M + 2 * HORIZONTAL_MARGIN_M
const WORLD_HEIGHT_M = TERRAIN_LENGTH_M + THROW_CIRCLE_MARGIN_M

describe('computeViewport', () => {
  it('scales uniformly to fit the terrain plus its margins', () => {
    const viewport = computeViewport(WORLD_WIDTH_M * 100, WORLD_HEIGHT_M * 100)
    expect(viewport.scale).toBeCloseTo(100, 5)
  })

  it('is limited by the tighter dimension when aspect ratios differ', () => {
    // Much taller than the world needs: width should be the limiting factor.
    const viewport = computeViewport(WORLD_WIDTH_M * 50, WORLD_HEIGHT_M * 200)
    expect(viewport.scale).toBeCloseTo(50, 5)
  })
})

describe('worldToScreen', () => {
  const viewport = computeViewport(WORLD_WIDTH_M * 100, WORLD_HEIGHT_M * 100)

  it('places the bottom of the throwing-circle margin at the bottom of the canvas', () => {
    const screen = worldToScreen({ x: 0, y: -THROW_CIRCLE_MARGIN_M }, viewport)
    expect(screen.y).toBeCloseTo(viewport.canvasHeightPx, 5)
  })

  it('places the line of play (y=0) above the bottom edge, by the margin', () => {
    const screen = worldToScreen({ x: 0, y: 0 }, viewport)
    expect(screen.y).toBeCloseTo(viewport.canvasHeightPx - THROW_CIRCLE_MARGIN_M * viewport.scale, 5)
  })

  it('moves up the screen as world y increases', () => {
    const near = worldToScreen({ x: 0, y: 1 }, viewport)
    const far = worldToScreen({ x: 0, y: 5 }, viewport)
    expect(far.y).toBeLessThan(near.y)
  })

  it('centers x=0 horizontally', () => {
    const screen = worldToScreen({ x: 0, y: 3 }, viewport)
    expect(screen.x).toBeCloseTo(viewport.offsetX, 5)
  })

  it('keeps a boule that drifted past the terrain edge on screen, within the margin', () => {
    const screen = worldToScreen({ x: TERRAIN_WIDTH_M / 2 + 1, y: 3 }, viewport)
    expect(screen.x).toBeGreaterThan(0)
    expect(screen.x).toBeLessThan(WORLD_WIDTH_M * 100)
  })
})

describe('metersToPixels', () => {
  it('scales a length by the viewport scale', () => {
    const viewport = computeViewport(WORLD_WIDTH_M * 100, WORLD_HEIGHT_M * 100)
    expect(metersToPixels(viewport, 1)).toBeCloseTo(100, 5)
  })
})
