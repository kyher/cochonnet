import {
  BOULE_COLLISION_RADIUS_M,
  BOULE_MASS_KG,
  BOULE_RADIUS_M,
  COCHONNET_COLLISION_RADIUS_M,
  COCHONNET_MASS_KG,
  COCHONNET_RADIUS_M,
  THROW_ORIGIN_Y_M,
} from '../game/constants'
import { isWithinTerrain } from '../game/scoring'
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

function restingBody(position: Vector2, mass: number, radius: number, collisionRadius: number): PhysicsBody {
  return {
    position: { x: position.x, y: position.y, z: radius },
    velocity: { x: 0, y: 0, z: 0 },
    mass,
    radius,
    collisionRadius,
    atRest: true,
  }
}

function toVector2(v: Vector3): Vector2 {
  return { x: v.x, y: v.y }
}

/**
 * Simulates one thrown boule, launched from the throwing circle at the
 * origin, against any boules already resting on the terrain this end and the
 * cochonnet itself — which can be struck and displaced just like a boule.
 * Runs at a fixed timestep until every body is at rest or a time cap is hit.
 */
export function simulateThrow(
  throwInput: ThrowInput,
  existingBoulePositions: Vector2[],
  cochonnetPosition: Vector2,
): SimulationResult {
  const direction = normalize(throwInput.direction)
  const power = Math.min(1, Math.max(0, throwInput.power))
  const speed = MIN_THROW_SPEED_M_S + power * (MAX_THROW_SPEED_M_S - MIN_THROW_SPEED_M_S)
  const horizontalSpeed = speed * Math.cos(LAUNCH_ANGLE_RAD)
  const verticalSpeed = speed * Math.sin(LAUNCH_ANGLE_RAD)

  const thrownBody: PhysicsBody = {
    position: { x: 0, y: THROW_ORIGIN_Y_M, z: BOULE_RADIUS_M },
    velocity: { x: direction.x * horizontalSpeed, y: direction.y * horizontalSpeed, z: verticalSpeed },
    mass: BOULE_MASS_KG,
    radius: BOULE_RADIUS_M,
    collisionRadius: BOULE_COLLISION_RADIUS_M,
    atRest: false,
  }

  const obstacleCount = existingBoulePositions.length
  let bodies: PhysicsBody[] = [
    thrownBody,
    ...existingBoulePositions.map((p) => restingBody(p, BOULE_MASS_KG, BOULE_RADIUS_M, BOULE_COLLISION_RADIUS_M)),
    restingBody(cochonnetPosition, COCHONNET_MASS_KG, COCHONNET_RADIUS_M, COCHONNET_COLLISION_RADIUS_M),
  ]
  const trajectories: Vector3[][] = bodies.map((b) => [{ ...b.position }])

  let elapsed = 0
  while (elapsed < MAX_SIMULATION_TIME_S && bodies.some((b) => !b.atRest)) {
    bodies = resolveCollisions(bodies.map((b) => stepBody(b, FIXED_TIMESTEP_S)))
    bodies.forEach((b, i) => trajectories[i].push({ ...b.position }))
    elapsed += FIXED_TIMESTEP_S
  }

  const cochonnetIndex = bodies.length - 1
  const updatedCochonnetPosition = toVector2(bodies[cochonnetIndex].position)

  return {
    thrownBoulePosition: toVector2(bodies[0].position),
    updatedObstaclePositions: bodies.slice(1, 1 + obstacleCount).map((b) => toVector2(b.position)),
    updatedCochonnetPosition,
    cochonnetKnockedOut: !isWithinTerrain(updatedCochonnetPosition),
    trajectory: trajectories[0],
    obstacleTrajectories: trajectories.slice(1, 1 + obstacleCount),
    cochonnetTrajectory: trajectories[cochonnetIndex],
  }
}
