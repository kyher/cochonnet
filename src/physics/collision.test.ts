import { describe, expect, it } from 'vitest'
import {
  BOULE_COLLISION_RADIUS_M,
  BOULE_MASS_KG,
  BOULE_RADIUS_M,
  COCHONNET_COLLISION_RADIUS_M,
  COCHONNET_MASS_KG,
  COCHONNET_RADIUS_M,
} from '../game/constants'
import { COLLISION_RESTITUTION } from './constants'
import { resolveCollisions } from './collision'
import type { PhysicsBody } from './types'

const R = BOULE_RADIUS_M

function bodyAt(
  x: number,
  vx = 0,
  atRest = true,
  mass = BOULE_MASS_KG,
  radius = R,
  z = radius,
  collisionRadius = radius,
): PhysicsBody {
  return { position: { x, y: 0, z }, velocity: { x: vx, y: 0, z: 0 }, mass, radius, collisionRadius, atRest }
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

describe('resolveCollisions with unequal masses (boule vs cochonnet)', () => {
  // z pinned to 0 for both bodies (rather than each body's own resting
  // height) so the collision normal is purely along x, isolating the
  // mass-weighted impulse math from the geometric height difference between
  // a resting boule and a resting cochonnet. Gap sized against the
  // (exaggerated) collision radii actually used for contact detection, not
  // the true physical radii.
  const boule = () => bodyAt(0, 3, false, BOULE_MASS_KG, BOULE_RADIUS_M, 0, BOULE_COLLISION_RADIUS_M)
  const cochonnetGap = BOULE_COLLISION_RADIUS_M + COCHONNET_COLLISION_RADIUS_M - 0.001
  const cochonnet = () =>
    bodyAt(cochonnetGap, 0, true, COCHONNET_MASS_KG, COCHONNET_RADIUS_M, 0, COCHONNET_COLLISION_RADIUS_M)

  it('sends the much lighter cochonnet off faster than the boule that struck it', () => {
    const [resolvedBoule, resolvedCochonnet] = resolveCollisions([boule(), cochonnet()])

    expect(resolvedBoule.velocity.x).toBeGreaterThan(0)
    expect(resolvedBoule.velocity.x).toBeLessThan(boule().velocity.x)
    expect(resolvedCochonnet.velocity.x).toBeGreaterThan(boule().velocity.x)
  })

  it('conserves momentum along the collision normal', () => {
    const before = boule()
    const momentumBefore = before.mass * before.velocity.x + cochonnet().mass * cochonnet().velocity.x

    const [resolvedBoule, resolvedCochonnet] = resolveCollisions([boule(), cochonnet()])
    const momentumAfter = resolvedBoule.mass * resolvedBoule.velocity.x + resolvedCochonnet.mass * resolvedCochonnet.velocity.x

    expect(momentumAfter).toBeCloseTo(momentumBefore, 5)
  })

  it('reduces to the equal-mass formula when masses happen to match', () => {
    const equalMassBoule = bodyAt(0, 2, false, BOULE_MASS_KG, BOULE_RADIUS_M, 0)
    const equalMassOther = bodyAt(2 * R - 0.01, 0, true, BOULE_MASS_KG, BOULE_RADIUS_M, 0)
    const [a, b] = resolveCollisions([equalMassBoule, equalMassOther])

    expect(a.velocity.x).toBeCloseTo(2 - 2 * COLLISION_RESTITUTION, 5)
    expect(b.velocity.x).toBeCloseTo(2 * COLLISION_RESTITUTION, 5)
  })
})

describe('resolveCollisions collision distance vs true physical size', () => {
  it('triggers a collision at a gap wider than the true radii but within the (exaggerated) collision radii', () => {
    // True boules would need to be within 2*BOULE_RADIUS_M (~7.5cm) to touch.
    // This gap is well beyond that, but still within 2*BOULE_COLLISION_RADIUS_M
    // (~22.5cm) — i.e. exactly the gap where the drawn circles touch on
    // screen but the true bodies don't.
    const gap = 2 * BOULE_RADIUS_M + 0.05
    expect(gap).toBeLessThan(2 * BOULE_COLLISION_RADIUS_M)

    const bodies = [
      bodyAt(0, 2, false, BOULE_MASS_KG, BOULE_RADIUS_M, 0, BOULE_COLLISION_RADIUS_M),
      bodyAt(gap, 0, true, BOULE_MASS_KG, BOULE_RADIUS_M, 0, BOULE_COLLISION_RADIUS_M),
    ]
    const [a, b] = resolveCollisions(bodies)

    expect(a.velocity.x).toBeLessThan(2)
    expect(b.velocity.x).toBeGreaterThan(0)
  })
})
