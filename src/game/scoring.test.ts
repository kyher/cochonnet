import { describe, expect, it } from 'vitest'
import { TERRAIN_LENGTH_M, TERRAIN_WIDTH_M } from './constants'
import {
  distance,
  getScoringZone,
  getZonePoints,
  isWithinTerrain,
  scoreBoule,
  scoreEnd,
} from './scoring'

const cochonnet = { x: 0, y: 7 }

describe('distance', () => {
  it('computes straight-line distance', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })
})

describe('isWithinTerrain', () => {
  it('accepts positions inside the terrain', () => {
    expect(isWithinTerrain({ x: 0, y: 5 })).toBe(true)
  })

  it('rejects positions past the side edges', () => {
    expect(isWithinTerrain({ x: TERRAIN_WIDTH_M, y: 5 })).toBe(false)
    expect(isWithinTerrain({ x: -TERRAIN_WIDTH_M, y: 5 })).toBe(false)
  })

  it('rejects positions past the far or near edges', () => {
    expect(isWithinTerrain({ x: 0, y: TERRAIN_LENGTH_M + 1 })).toBe(false)
    expect(isWithinTerrain({ x: 0, y: -1 })).toBe(false)
  })
})

describe('getScoringZone', () => {
  it('picks the nearest zone the distance qualifies for', () => {
    expect(getScoringZone(0.05)).toBe('bullseye')
    expect(getScoringZone(0.1)).toBe('bullseye')
    expect(getScoringZone(0.2)).toBe('close')
    expect(getScoringZone(0.3)).toBe('close')
    expect(getScoringZone(0.5)).toBe('near')
    expect(getScoringZone(1.0)).toBe('near')
    expect(getScoringZone(1.5)).toBe('in-range')
    expect(getScoringZone(2.0)).toBe('in-range')
  })

  it('misses beyond the farthest zone', () => {
    expect(getScoringZone(2.01)).toBe('miss')
  })
})

describe('getZonePoints', () => {
  it('returns each zone point value', () => {
    expect(getZonePoints('bullseye')).toBe(50)
    expect(getZonePoints('close')).toBe(30)
    expect(getZonePoints('near')).toBe(15)
    expect(getZonePoints('in-range')).toBe(5)
    expect(getZonePoints('miss')).toBe(0)
  })
})

describe('scoreBoule', () => {
  it('scores an in-bounds boule by proximity', () => {
    expect(scoreBoule({ x: 0, y: 7.05 }, cochonnet)).toBe(50)
  })

  it('scores zero for an out-of-bounds boule even if geometrically close', () => {
    expect(scoreBoule({ x: 0, y: TERRAIN_LENGTH_M + 0.01 }, { x: 0, y: TERRAIN_LENGTH_M })).toBe(0)
  })
})

describe('scoreEnd', () => {
  it('sums all boules, not just the closest', () => {
    const boules = [
      { x: 0, y: 7.05 }, // bullseye: 50
      { x: 0.2, y: 7 }, // close: 30
      { x: 0, y: -1 }, // out of bounds: 0
    ]
    expect(scoreEnd(boules, cochonnet)).toBe(80)
  })
})
