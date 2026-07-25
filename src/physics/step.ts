import { BOULE_RADIUS_M } from '../game/constants'
import {
  BOUNCE_HORIZONTAL_DAMPING,
  BOUNCE_STOP_SPEED_M_S,
  GRAVITY_M_S2,
  RESTITUTION,
  ROLLING_DECELERATION_M_S2,
  STOP_SPEED_M_S,
} from './constants'
import type { PhysicsBody } from './types'

const GROUND_Z = BOULE_RADIUS_M

/** Advances one body's flight, bounce, or roll by dt. Pure: returns a new body. */
export function stepBody(body: PhysicsBody, dt: number): PhysicsBody {
  if (body.atRest) return body

  const airborne = body.position.z > GROUND_Z || body.velocity.z > 0
  return airborne ? stepAirborne(body, dt) : stepRolling(body, dt)
}

function stepAirborne(body: PhysicsBody, dt: number): PhysicsBody {
  const velocity = { ...body.velocity, z: body.velocity.z - GRAVITY_M_S2 * dt }
  let position = {
    x: body.position.x + body.velocity.x * dt,
    y: body.position.y + body.velocity.y * dt,
    z: body.position.z + body.velocity.z * dt,
  }

  if (position.z <= GROUND_Z) {
    position = { ...position, z: GROUND_Z }
    const bounceVz = -velocity.z * RESTITUTION
    velocity.z = Math.abs(bounceVz) < BOUNCE_STOP_SPEED_M_S ? 0 : bounceVz
    velocity.x *= BOUNCE_HORIZONTAL_DAMPING
    velocity.y *= BOUNCE_HORIZONTAL_DAMPING
  }

  return settle({ position, velocity, atRest: false })
}

function stepRolling(body: PhysicsBody, dt: number): PhysicsBody {
  const speed = Math.hypot(body.velocity.x, body.velocity.y)
  if (speed <= STOP_SPEED_M_S) {
    return { position: { ...body.position, z: GROUND_Z }, velocity: { x: 0, y: 0, z: 0 }, atRest: true }
  }

  const decel = Math.min(ROLLING_DECELERATION_M_S2 * dt, speed)
  const scale = (speed - decel) / speed
  const velocity = { x: body.velocity.x * scale, y: body.velocity.y * scale, z: 0 }
  const position = {
    x: body.position.x + body.velocity.x * dt,
    y: body.position.y + body.velocity.y * dt,
    z: GROUND_Z,
  }

  return settle({ position, velocity, atRest: false })
}

/** Marks a grounded, near-stationary body as at rest so it drops out of simulation. */
function settle(body: PhysicsBody): PhysicsBody {
  const speed = Math.hypot(body.velocity.x, body.velocity.y, body.velocity.z)
  if (body.position.z <= GROUND_Z && speed <= STOP_SPEED_M_S) {
    return { position: { ...body.position, z: GROUND_Z }, velocity: { x: 0, y: 0, z: 0 }, atRest: true }
  }
  return body
}
