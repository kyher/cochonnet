import { SCORING_ZONES, TERRAIN_LENGTH_M, TERRAIN_WIDTH_M, type ScoringZoneName } from './constants'
import type { Vector2 } from './types'

export function distance(a: Vector2, b: Vector2): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Whether a position is still on the playing surface (throwing circle at y = 0). */
export function isWithinTerrain(position: Vector2): boolean {
  return (
    position.x >= -TERRAIN_WIDTH_M / 2 &&
    position.x <= TERRAIN_WIDTH_M / 2 &&
    position.y >= 0 &&
    position.y <= TERRAIN_LENGTH_M
  )
}

export function getScoringZone(distanceM: number): ScoringZoneName {
  for (const zone of SCORING_ZONES) {
    if (distanceM <= zone.maxDistanceM) {
      return zone.name
    }
  }
  return 'miss'
}

export function getZonePoints(zone: ScoringZoneName): number {
  return SCORING_ZONES.find((z) => z.name === zone)?.points ?? 0
}

/** A boule that has rolled off the terrain scores zero regardless of distance. */
export function scoreBoule(boulePosition: Vector2, cochonnetPosition: Vector2): number {
  if (!isWithinTerrain(boulePosition)) {
    return 0
  }
  return getZonePoints(getScoringZone(distance(boulePosition, cochonnetPosition)))
}

/** All boules in an end contribute — not just the closest. */
export function scoreEnd(boulePositions: Vector2[], cochonnetPosition: Vector2): number {
  return boulePositions.reduce(
    (total, boule) => total + scoreBoule(boule, cochonnetPosition),
    0,
  )
}
