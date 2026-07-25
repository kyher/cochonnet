// All distances in meters, measured on the terrain's 2D ground plane.

export const TERRAIN_WIDTH_M = 4
export const TERRAIN_LENGTH_M = 13

export const MIN_COCHONNET_DISTANCE_M = 6
export const MAX_COCHONNET_DISTANCE_M = 10

export const BOULE_RADIUS_M = 0.0375
export const COCHONNET_RADIUS_M = 0.015

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
