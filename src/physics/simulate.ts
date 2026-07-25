import { BOULE_RADIUS_M } from '../game/constants'
import type { Vector2 } from '../game/types'
import { resolveCollisions } from './collision'
import {
  FIXED_TIMESTEP_S,
  LAUNCH_ANGLE_DEG,
  MAX_SIMULATION_TIME_S,
  MAX_THROW_SPEED_M_S,
  MIN_THROW_SPEED_M_S,
} from './constants'
import { stepBody } from './step'
import type { PhysicsBody, SimulationResult, ThrowInput, Vector3 } from './types'

const LAUNCH_ANGLE_RAD = (LAUNCH_ANGLE_DEG * Math.PI) / 180

function normalize(v: Vector2): Vector2 {
  const length = Math.hypot(v.x, v.y)
  return length === 0 ? { x: 0, y: 1 } : { x: v.x / length, y: v.y / length }
}

function restingBody(position: Vector2): PhysicsBody {
  return { position: { x: position.x, y: position.y, z: BOULE_RADIUS_M }, velocity: { x: 0, y: 0, z: 0 }, atRest: true }
}

/**
 * Simulates one thrown boule, launched from the throwing circle at the
 * origin, against any boules already resting on the terrain this end.
 * Runs at a fixed timestep until every body is at rest or a time cap is hit.
 */
export function simulateThrow(
  throwInput: ThrowInput,
  existingBoulePositions: Vector2[],
): SimulationResult {
  const direction = normalize(throwInput.direction)
  const power = Math.min(1, Math.max(0, throwInput.power))
  const speed = MIN_THROW_SPEED_M_S + power * (MAX_THROW_SPEED_M_S - MIN_THROW_SPEED_M_S)
  const horizontalSpeed = speed * Math.cos(LAUNCH_ANGLE_RAD)
  const verticalSpeed = speed * Math.sin(LAUNCH_ANGLE_RAD)

  const thrownBody: PhysicsBody = {
    position: { x: 0, y: 0, z: BOULE_RADIUS_M },
    velocity: { x: direction.x * horizontalSpeed, y: direction.y * horizontalSpeed, z: verticalSpeed },
    atRest: false,
  }

  let bodies: PhysicsBody[] = [thrownBody, ...existingBoulePositions.map(restingBody)]
  const trajectory: Vector3[] = [{ ...thrownBody.position }]

  let elapsed = 0
  while (elapsed < MAX_SIMULATION_TIME_S && bodies.some((b) => !b.atRest)) {
    bodies = resolveCollisions(bodies.map((b) => stepBody(b, FIXED_TIMESTEP_S)))
    trajectory.push({ ...bodies[0].position })
    elapsed += FIXED_TIMESTEP_S
  }

  return {
    thrownBoulePosition: { x: bodies[0].position.x, y: bodies[0].position.y },
    updatedObstaclePositions: bodies.slice(1).map((b) => ({ x: b.position.x, y: b.position.y })),
    trajectory,
  }
}
