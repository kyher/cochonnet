import { describe, expect, it } from 'vitest'
import { BOULE_RADIUS_M, THROW_ORIGIN_Y_M } from '../game/constants'
import { simulateThrow } from './simulate'

// Off to the side and out of the way of every straight-ahead throw below, so
// it doesn't interfere with tests that aren't specifically about the cochonnet.
const FAR_COCHONNET = { x: 1.8, y: 12 }

function distanceThrown(power: number) {
  const result = simulateThrow({ direction: { x: 0, y: 1 }, power }, [], FAR_COCHONNET)
  return result.thrownBoulePosition.y
}

describe('simulateThrow', () => {
  it('throws roughly along the aim direction', () => {
    const result = simulateThrow({ direction: { x: 0, y: 1 }, power: 0.6 }, [], FAR_COCHONNET)
    expect(result.thrownBoulePosition.y).toBeGreaterThan(0)
    expect(result.thrownBoulePosition.x).toBeCloseTo(0, 1)
  })

  it('travels farther with more power', () => {
    expect(distanceThrown(0.9)).toBeGreaterThan(distanceThrown(0.2))
  })

  it('normalizes a non-unit direction vector', () => {
    const a = simulateThrow({ direction: { x: 0, y: 1 }, power: 0.5 }, [], FAR_COCHONNET)
    const b = simulateThrow({ direction: { x: 0, y: 5 }, power: 0.5 }, [], FAR_COCHONNET)
    expect(b.thrownBoulePosition).toEqual(a.thrownBoulePosition)
  })

  it('settles the trajectory at ground level', () => {
    const result = simulateThrow({ direction: { x: 0, y: 1 }, power: 0.5 }, [], FAR_COCHONNET)
    const last = result.trajectory[result.trajectory.length - 1]
    expect(result.trajectory[0]).toEqual({ x: 0, y: THROW_ORIGIN_Y_M, z: BOULE_RADIUS_M })
    expect(last.z).toBeCloseTo(BOULE_RADIUS_M, 5)
  })

  it('knocks an obstacle it collides with', () => {
    // Placed within the rolling path (past flight range, before full stop),
    // where the boule reliably runs at ground level.
    const obstacle = { x: 0, y: 12 }
    const result = simulateThrow({ direction: { x: 0, y: 1 }, power: 1 }, [obstacle], FAR_COCHONNET)
    const moved = Math.hypot(
      result.updatedObstaclePositions[0].x - obstacle.x,
      result.updatedObstaclePositions[0].y - obstacle.y,
    )
    expect(moved).toBeGreaterThan(0.01)
  })

  it('leaves an out-of-reach obstacle untouched', () => {
    const obstacle = { x: 0, y: 50 }
    const result = simulateThrow({ direction: { x: 0, y: 1 }, power: 1 }, [obstacle], FAR_COCHONNET)
    expect(result.updatedObstaclePositions[0]).toEqual(obstacle)
  })

  it('leaves an untouched cochonnet at its original position', () => {
    const result = simulateThrow({ direction: { x: 0, y: 1 }, power: 0.3 }, [], FAR_COCHONNET)
    expect(result.updatedCochonnetPosition).toEqual(FAR_COCHONNET)
    expect(result.cochonnetKnockedOut).toBe(false)
  })

  it('knocks the cochonnet when struck, sending it farther than an equivalent boule hit', () => {
    const cochonnet = { x: 0, y: 12 }
    const boule = { x: 0, y: 12 }
    const cochonnetResult = simulateThrow({ direction: { x: 0, y: 1 }, power: 1 }, [], cochonnet)
    const bouleResult = simulateThrow({ direction: { x: 0, y: 1 }, power: 1 }, [boule], FAR_COCHONNET)

    const cochonnetMoved = Math.hypot(
      cochonnetResult.updatedCochonnetPosition.x - cochonnet.x,
      cochonnetResult.updatedCochonnetPosition.y - cochonnet.y,
    )
    const boulesMoved = Math.hypot(
      bouleResult.updatedObstaclePositions[0].x - boule.x,
      bouleResult.updatedObstaclePositions[0].y - boule.y,
    )

    expect(cochonnetMoved).toBeGreaterThan(boulesMoved)
  })

  it('reports the cochonnet knocked out once it crosses the terrain edge', () => {
    // Right at the terrain's far edge, so a solid hit sends it past the line.
    const cochonnet = { x: 0, y: 12.97 }
    const result = simulateThrow({ direction: { x: 0, y: 1 }, power: 1 }, [], cochonnet)

    expect(result.cochonnetKnockedOut).toBe(true)
  })

  it('samples a same-length trajectory for every body', () => {
    const obstacle = { x: 0.5, y: 5 }
    const result = simulateThrow({ direction: { x: 0, y: 1 }, power: 0.7 }, [obstacle], FAR_COCHONNET)

    expect(result.obstacleTrajectories[0].length).toBe(result.trajectory.length)
    expect(result.cochonnetTrajectory.length).toBe(result.trajectory.length)
  })
})
