// All distances in meters, measured on the terrain's 2D ground plane.

export const TERRAIN_WIDTH_M = 4
export const TERRAIN_LENGTH_M = 13

/**
 * Where a boule is released from, behind the line of play (y=0) — the
 * single source of truth for both the physics launch position and where
 * the boule waiting to be thrown is rendered, so the two never drift apart.
 */
export const THROW_ORIGIN_Y_M = -0.3

export const MIN_COCHONNET_DISTANCE_M = 6
export const MAX_COCHONNET_DISTANCE_M = 10

export const BOULE_RADIUS_M = 0.0375
export const COCHONNET_RADIUS_M = 0.015

// Real pétanque equipment masses, so a struck cochonnet reacts like the much
// lighter object it is rather than an equal-mass boule.
export const BOULE_MASS_KG = 0.7
export const COCHONNET_MASS_KG = 0.014

/**
 * True-to-scale boules/cochonnet render as sub-pixel dots at any realistic
 * screen size, so `render/draw.ts` draws them this many times larger for
 * visibility. Collisions use the same exaggerated size (not the true
 * physical radius) so a hit registers exactly when the drawn circles touch,
 * matching what's on screen — resting height and scoring/distance math are
 * unaffected, since those use true positions and radii, not this scale.
 */
export const COLLISION_VISUAL_SCALE = 3
export const BOULE_COLLISION_RADIUS_M = BOULE_RADIUS_M * COLLISION_VISUAL_SCALE
export const COCHONNET_COLLISION_RADIUS_M = COCHONNET_RADIUS_M * COLLISION_VISUAL_SCALE

export const BOULES_PER_END = 3
export const ENDS_PER_SESSION = 3

/**
 * Distance-from-cochonnet thresholds and their point values, ordered nearest
 * to farthest. The first threshold a boule's distance is within wins.
 */
export const SCORING_ZONES = [
  { name: 'bullseye', maxDistanceM: 0.1, points: 50 },
  { name: 'close', maxDistanceM: 0.3, points: 30 },
  { name: 'near', maxDistanceM: 1.0, points: 15 },
  { name: 'in-range', maxDistanceM: 2.0, points: 5 },
] as const

export type ScoringZoneName = (typeof SCORING_ZONES)[number]['name'] | 'miss'
