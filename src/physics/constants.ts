export const GRAVITY_M_S2 = 9.81

/** Fixed launch angle for every throw; power scales speed, not angle. */
export const LAUNCH_ANGLE_DEG = 35

export const MIN_THROW_SPEED_M_S = 4
export const MAX_THROW_SPEED_M_S = 9.7

/** Fraction of vertical speed kept after a ground bounce. */
export const RESTITUTION = 0.4
/** Below this vertical impact speed, a bounce is treated as landing instead. */
export const BOUNCE_STOP_SPEED_M_S = 0.5
/** Fraction of horizontal speed kept after each ground contact (impact friction). */
export const BOUNCE_HORIZONTAL_DAMPING = 0.85

/** Horizontal speed lost per second while rolling on the ground. */
export const ROLLING_DECELERATION_M_S2 = 14
/** Below this horizontal speed, a body is considered stopped. */
export const STOP_SPEED_M_S = 0.05

/** Fraction of closing speed exchanged along the collision normal (equal-mass impulse). */
export const COLLISION_RESTITUTION = 0.7

// Fine enough that a boule at MAX_THROW_SPEED_M_S can't tunnel through the
// cochonnet between two samples: collision detection is purely positional
// (no continuous/swept check), so a step's displacement must stay well under
// the smallest contact distance in play (a boule-cochonnet pair, since the
// cochonnet's radius is much smaller than a boule's).
export const FIXED_TIMESTEP_S = 1 / 480
/** Safety cap so a simulation can never run forever. */
export const MAX_SIMULATION_TIME_S = 10
