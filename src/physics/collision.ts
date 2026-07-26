import { COLLISION_RESTITUTION } from './constants'
import type { PhysicsBody } from './types'

/**
 * Detects and resolves pairwise overlaps between bodies: separates them
 * positionally, and exchanges velocity along the collision normal via a
 * reduced-mass impulse scaled by COLLISION_RESTITUTION. At equal masses (any
 * boule-vs-boule pair) this reduces exactly to a symmetric equal-and-opposite
 * exchange; unequal masses (a boule striking the much lighter cochonnet)
 * transfer velocity asymmetrically, as momentum conservation requires — the
 * boule barely deflects while the cochonnet is sent flying. Does not account
 * for tangential friction between bodies.
 */
export function resolveCollisions(bodies: PhysicsBody[]): PhysicsBody[] {
  const resolved = bodies.map((b) => ({
    position: { ...b.position },
    velocity: { ...b.velocity },
    mass: b.mass,
    radius: b.radius,
    collisionRadius: b.collisionRadius,
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
  // Uses collisionRadius (the exaggerated, on-screen size), not the true
  // physical radius — so a hit registers when the drawn circles touch, not
  // when the much-smaller true bodies do. Twice the larger collision radius,
  // not the sum of both: this is a point-particle simulation with no
  // rotational/tangential contact, so a literal sum-of-radii contact distance
  // lets a bouncing boule hop clean over the much-shorter cochonnet during a
  // residual post-landing bounce (its low resting height needs only a few cm
  // of clearance to duck under a boule's contact envelope). Sizing every
  // pair's contact distance off the larger body keeps a boule-vs-cochonnet
  // hit exactly as reliable as a boule-vs-boule one.
  const minDistance = 2 * Math.max(a.collisionRadius, b.collisionRadius)

  if (distance === 0 || distance >= minDistance) return

  const nx = dx / distance
  const ny = dy / distance
  const nz = dz / distance

  const aNormalSpeed = a.velocity.x * nx + a.velocity.y * ny + a.velocity.z * nz
  const bNormalSpeed = b.velocity.x * nx + b.velocity.y * ny + b.velocity.z * nz
  const closingSpeed = aNormalSpeed - bNormalSpeed

  // Always separate overlapping bodies, even if this step's motion isn't what caused it.
  const overlap = minDistance - distance
  a.position.x -= (nx * overlap) / 2
  a.position.y -= (ny * overlap) / 2
  a.position.z -= (nz * overlap) / 2
  b.position.x += (nx * overlap) / 2
  b.position.y += (ny * overlap) / 2
  b.position.z += (nz * overlap) / 2

  if (closingSpeed <= 0) return // moving apart, not a real collision

  // Reduced-mass impulse along the normal: J = (1+e) * mu * closingSpeed, with
  // mu = (m_a*m_b)/(m_a+m_b) and e = 2*COLLISION_RESTITUTION - 1 chosen so that
  // at equal masses (mu = m/2) this collapses to exactly
  // COLLISION_RESTITUTION * closingSpeed per body — the original formula.
  const reducedMass = (a.mass * b.mass) / (a.mass + b.mass)
  const impulse = 2 * COLLISION_RESTITUTION * reducedMass * closingSpeed
  const aDelta = impulse / a.mass
  const bDelta = impulse / b.mass

  a.velocity.x -= aDelta * nx
  a.velocity.y -= aDelta * ny
  a.velocity.z -= aDelta * nz
  b.velocity.x += bDelta * nx
  b.velocity.y += bDelta * ny
  b.velocity.z += bDelta * nz

  a.atRest = false
  b.atRest = false
}
