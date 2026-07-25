import { BOULE_RADIUS_M } from '../game/constants'
import { COLLISION_RESTITUTION } from './constants'
import type { PhysicsBody } from './types'

const MIN_DISTANCE_M = 2 * BOULE_RADIUS_M

/**
 * Detects and resolves pairwise overlaps between bodies: separates them
 * positionally, and exchanges velocity along the collision normal as an
 * equal-mass impulse scaled by COLLISION_RESTITUTION. Does not account for
 * tangential friction between boules.
 */
export function resolveCollisions(bodies: PhysicsBody[]): PhysicsBody[] {
  const resolved = bodies.map((b) => ({
    position: { ...b.position },
    velocity: { ...b.velocity },
    atRest: b.atRest,
  }))

  for (let i = 0; i < resolved.length; i++) {
    for (let j = i + 1; j < resolved.length; j++) {
      resolvePair(resolved[i], resolved[j])
    }
  }

  return resolved
}

function resolvePair(a: PhysicsBody, b: PhysicsBody): void {
  const dx = b.position.x - a.position.x
  const dy = b.position.y - a.position.y
  const dz = b.position.z - a.position.z
  const distance = Math.hypot(dx, dy, dz)

  if (distance === 0 || distance >= MIN_DISTANCE_M) return

  const nx = dx / distance
  const ny = dy / distance
  const nz = dz / distance

  const aNormalSpeed = a.velocity.x * nx + a.velocity.y * ny + a.velocity.z * nz
  const bNormalSpeed = b.velocity.x * nx + b.velocity.y * ny + b.velocity.z * nz
  const closingSpeed = aNormalSpeed - bNormalSpeed

  // Always separate overlapping bodies, even if this step's motion isn't what caused it.
  const overlap = MIN_DISTANCE_M - distance
  a.position.x -= (nx * overlap) / 2
  a.position.y -= (ny * overlap) / 2
  a.position.z -= (nz * overlap) / 2
  b.position.x += (nx * overlap) / 2
  b.position.y += (ny * overlap) / 2
  b.position.z += (nz * overlap) / 2

  if (closingSpeed <= 0) return // moving apart, not a real collision

  const exchange = closingSpeed * COLLISION_RESTITUTION

  a.velocity.x -= exchange * nx
  a.velocity.y -= exchange * ny
  a.velocity.z -= exchange * nz
  b.velocity.x += exchange * nx
  b.velocity.y += exchange * ny
  b.velocity.z += exchange * nz

  a.atRest = false
  b.atRest = false
}
