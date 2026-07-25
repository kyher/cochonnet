import { describe, expect, it } from 'vitest'
import { BOULE_RADIUS_M } from '../game/constants'
import { COLLISION_RESTITUTION } from './constants'
import { resolveCollisions } from './collision'
import type { PhysicsBody } from './types'

const R = BOULE_RADIUS_M

function bodyAt(x: number, vx = 0, atRest = true): PhysicsBody {
  return { position: { x, y: 0, z: R }, velocity: { x: vx, y: 0, z: 0 }, atRest }
}

describe('resolveCollisions', () => {
  it('leaves far-apart bodies untouched', () => {
    const bodies = [bodyAt(0), bodyAt(5)]
    const result = resolveCollisions(bodies)
    expect(result[0].position.x).toBe(0)
    expect(result[1].position.x).toBe(5)
  })

  it('separates overlapping stationary bodies without changing their velocity', () => {
    const bodies = [bodyAt(0), bodyAt(2 * R - 0.01)]
    const result = resolveCollisions(bodies)
    const distance = result[1].position.x - result[0].position.x

    expect(distance).toBeCloseTo(2 * R, 5)
    expect(result[0].velocity.x).toBe(0)
    expect(result[1].velocity.x).toBe(0)
  })

  it('exchanges velocity along the normal on a head-on collision', () => {
    const bodies = [bodyAt(0, 2, false), bodyAt(2 * R - 0.01, 0, true)]
    const result = resolveCollisions(bodies)

    expect(result[0].velocity.x).toBeCloseTo(2 - 2 * COLLISION_RESTITUTION, 5)
    expect(result[1].velocity.x).toBeCloseTo(2 * COLLISION_RESTITUTION, 5)
    expect(result[0].atRest).toBe(false)
    expect(result[1].atRest).toBe(false)
  })

  it('does not exchange velocity when bodies are already separating', () => {
    const bodies = [bodyAt(0, -1, false), bodyAt(2 * R - 0.01, 1, false)]
    const result = resolveCollisions(bodies)

    expect(result[0].velocity.x).toBe(-1)
    expect(result[1].velocity.x).toBe(1)
  })
})
