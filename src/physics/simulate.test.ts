import { describe, expect, it } from 'vitest'
import { BOULE_RADIUS_M } from '../game/constants'
import { simulateThrow } from './simulate'

function distanceThrown(power: number) {
  const result = simulateThrow({ direction: { x: 0, y: 1 }, power }, [])
  return result.thrownBoulePosition.y
}

describe('simulateThrow', () => {
  it('throws roughly along the aim direction', () => {
    const result = simulateThrow({ direction: { x: 0, y: 1 }, power: 0.6 }, [])
    expect(result.thrownBoulePosition.y).toBeGreaterThan(0)
    expect(result.thrownBoulePosition.x).toBeCloseTo(0, 1)
  })

  it('travels farther with more power', () => {
    expect(distanceThrown(0.9)).toBeGreaterThan(distanceThrown(0.2))
  })

  it('normalizes a non-unit direction vector', () => {
    const a = simulateThrow({ direction: { x: 0, y: 1 }, power: 0.5 }, [])
    const b = simulateThrow({ direction: { x: 0, y: 5 }, power: 0.5 }, [])
    expect(b.thrownBoulePosition).toEqual(a.thrownBoulePosition)
  })

  it('settles the trajectory at ground level', () => {
    const result = simulateThrow({ direction: { x: 0, y: 1 }, power: 0.5 }, [])
    const last = result.trajectory[result.trajectory.length - 1]
    expect(result.trajectory[0]).toEqual({ x: 0, y: 0, z: BOULE_RADIUS_M })
    expect(last.z).toBeCloseTo(BOULE_RADIUS_M, 5)
  })

  it('knocks an obstacle it collides with', () => {
    // Placed within the rolling path (past flight range, before full stop),
    // where the boule reliably runs at ground level.
    const obstacle = { x: 0, y: 9 }
    const result = simulateThrow({ direction: { x: 0, y: 1 }, power: 1 }, [obstacle])
    const moved = Math.hypot(
      result.updatedObstaclePositions[0].x - obstacle.x,
      result.updatedObstaclePositions[0].y - obstacle.y,
    )
    expect(moved).toBeGreaterThan(0.01)
  })

  it('leaves an out-of-reach obstacle untouched', () => {
    const obstacle = { x: 0, y: 50 }
    const result = simulateThrow({ direction: { x: 0, y: 1 }, power: 1 }, [obstacle])
    expect(result.updatedObstaclePositions[0]).toEqual(obstacle)
  })
})
