import { describe, expect, it } from 'vitest'
import { MAX_COCHONNET_DISTANCE_M, MIN_COCHONNET_DISTANCE_M, TERRAIN_WIDTH_M } from './constants'
import { generateCochonnetPositions, getDateKey } from './seed'

describe('getDateKey', () => {
  it('formats as a UTC calendar day', () => {
    expect(getDateKey(new Date('2026-07-25T23:59:00Z'))).toBe('2026-07-25')
  })
})

describe('generateCochonnetPositions', () => {
  it('is deterministic for the same date', () => {
    const a = generateCochonnetPositions('2026-07-25', 3)
    const b = generateCochonnetPositions('2026-07-25', 3)
    expect(a).toEqual(b)
  })

  it('differs across dates', () => {
    const a = generateCochonnetPositions('2026-07-25', 3)
    const b = generateCochonnetPositions('2026-07-26', 3)
    expect(a).not.toEqual(b)
  })

  it('returns the requested number of positions', () => {
    expect(generateCochonnetPositions('2026-07-25', 3)).toHaveLength(3)
    expect(generateCochonnetPositions('2026-07-25', 5)).toHaveLength(5)
  })

  it('keeps every position within terrain and distance bounds', () => {
    const positions = generateCochonnetPositions('2026-07-25', 50)
    for (const { x, y } of positions) {
      expect(y).toBeGreaterThanOrEqual(MIN_COCHONNET_DISTANCE_M)
      expect(y).toBeLessThanOrEqual(MAX_COCHONNET_DISTANCE_M)
      expect(x).toBeGreaterThanOrEqual(-TERRAIN_WIDTH_M / 2)
      expect(x).toBeLessThanOrEqual(TERRAIN_WIDTH_M / 2)
    }
  })
})
