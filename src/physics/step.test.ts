import { describe, expect, it } from 'vitest'
import { BOULE_COLLISION_RADIUS_M, BOULE_MASS_KG, BOULE_RADIUS_M } from '../game/constants'
import { ROLLING_DECELERATION_M_S2 } from './constants'
import { stepBody } from './step'
import type { PhysicsBody } from './types'

const DT = 1 / 120

function runToRest(body: PhysicsBody, maxSteps = 100_000): PhysicsBody {
  let current = body
  for (let i = 0; i < maxSteps && !current.atRest; i++) {
    current = stepBody(current, DT)
  }
  return current
}

describe('stepBody', () => {
  it('leaves an at-rest body unchanged', () => {
    const body: PhysicsBody = {
      position: { x: 1, y: 2, z: BOULE_RADIUS_M },
      velocity: { x: 0, y: 0, z: 0 },
      mass: BOULE_MASS_KG,
      radius: BOULE_RADIUS_M,
      collisionRadius: BOULE_COLLISION_RADIUS_M,
      atRest: true,
    }
    expect(stepBody(body, DT)).toEqual(body)
  })

  it('a vertical-only launch returns to the same x/y at rest', () => {
    const body: PhysicsBody = {
      position: { x: 3, y: 4, z: BOULE_RADIUS_M },
      velocity: { x: 0, y: 0, z: 5 },
      mass: BOULE_MASS_KG,
      radius: BOULE_RADIUS_M,
      collisionRadius: BOULE_COLLISION_RADIUS_M,
      atRest: false,
    }
    const result = runToRest(body)

    expect(result.atRest).toBe(true)
    expect(result.position.z).toBeCloseTo(BOULE_RADIUS_M, 5)
    expect(result.position.x).toBeCloseTo(3, 5)
    expect(result.position.y).toBeCloseTo(4, 5)
  })

  it('bounces before settling when impact speed is high', () => {
    const body: PhysicsBody = {
      position: { x: 0, y: 0, z: 2 },
      velocity: { x: 0, y: 1, z: 0 },
      mass: BOULE_MASS_KG,
      radius: BOULE_RADIUS_M,
      collisionRadius: BOULE_COLLISION_RADIUS_M,
      atRest: false,
    }

    let current = body
    let bounced = false
    for (let i = 0; i < 1000 && !current.atRest; i++) {
      const before = current
      current = stepBody(current, DT)
      if (before.velocity.z < 0 && current.velocity.z > 0) {
        bounced = true
      }
    }

    expect(bounced).toBe(true)
    expect(current.atRest).toBe(true)
  })

  it('rolling friction brings a ground body to rest within the expected distance', () => {
    const speed = 2
    const body: PhysicsBody = {
      position: { x: 0, y: 0, z: BOULE_RADIUS_M },
      velocity: { x: 0, y: speed, z: 0 },
      mass: BOULE_MASS_KG,
      radius: BOULE_RADIUS_M,
      collisionRadius: BOULE_COLLISION_RADIUS_M,
      atRest: false,
    }
    const result = runToRest(body)

    // Ideal stopping distance under constant deceleration: v^2 / (2a).
    const idealDistance = speed ** 2 / (2 * ROLLING_DECELERATION_M_S2)
    expect(result.atRest).toBe(true)
    expect(result.position.y).toBeGreaterThan(0)
    expect(result.position.y).toBeLessThanOrEqual(idealDistance + 0.05)
  })
})
