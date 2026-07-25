import type { Vector2 } from '../game/types'

/** A point in 3D space: x/y on the ground plane, z as height above ground. */
export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface ThrowInput {
  /** Aim direction on the ground plane. Need not be pre-normalized. */
  direction: Vector2
  /** Throw strength in [0, 1], from a drag gesture's magnitude. */
  power: number
}

export interface PhysicsBody {
  position: Vector3
  velocity: Vector3
  /** True once the body has stopped moving and no longer needs simulating. */
  atRest: boolean
}

export interface SimulationResult {
  /** Ground-plane resting position of the thrown boule. */
  thrownBoulePosition: Vector2
  /** Resting positions of the pre-existing boules, in the same order as input — unchanged unless knocked. */
  updatedObstaclePositions: Vector2[]
  /** Sampled 3D positions of the thrown boule over time, for animating the throw. */
  trajectory: Vector3[]
}
