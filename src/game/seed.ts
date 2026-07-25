import {
  ENDS_PER_SESSION,
  MAX_COCHONNET_DISTANCE_M,
  MIN_COCHONNET_DISTANCE_M,
  TERRAIN_WIDTH_M,
} from './constants'
import type { Vector2 } from './types'

/** UTC calendar-day key, e.g. "2026-07-25". Stable regardless of local timezone. */
export function getDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** FNV-1a hash of a string into a 32-bit unsigned int, used as a PRNG seed. */
function hashToSeed(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** Deterministic PRNG: same seed always produces the same sequence of [0, 1) values. */
function mulberry32(seed: number): () => number {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * The sequence of cochonnet positions for a given day's session, one per end.
 * Deterministic: the same date always yields the same sequence.
 */
export function generateCochonnetPositions(
  dateKey: string,
  count: number = ENDS_PER_SESSION,
): Vector2[] {
  const rng = mulberry32(hashToSeed(dateKey))
  const positions: Vector2[] = []

  for (let i = 0; i < count; i++) {
    const y =
      MIN_COCHONNET_DISTANCE_M + rng() * (MAX_COCHONNET_DISTANCE_M - MIN_COCHONNET_DISTANCE_M)
    const x = (rng() - 0.5) * TERRAIN_WIDTH_M
    positions.push({ x, y })
  }

  return positions
}
