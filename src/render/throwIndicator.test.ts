import { describe, expect, it } from 'vitest'
import { getThrowIndicatorStyle } from './throwIndicator'

describe('getThrowIndicatorStyle', () => {
  it('is fully green at zero power', () => {
    expect(getThrowIndicatorStyle(0).color).toBe('rgb(74, 222, 128)')
  })

  it('is fully amber at half power', () => {
    expect(getThrowIndicatorStyle(0.5).color).toBe('rgb(251, 191, 36)')
  })

  it('is fully red at max power', () => {
    expect(getThrowIndicatorStyle(1).color).toBe('rgb(239, 68, 68)')
  })

  it('scales line width from thin to thick as power increases', () => {
    expect(getThrowIndicatorStyle(0).lineWidthPx).toBe(2)
    expect(getThrowIndicatorStyle(0.5).lineWidthPx).toBeCloseTo(4, 5)
    expect(getThrowIndicatorStyle(1).lineWidthPx).toBe(6)
  })

  it('clamps power outside the 0-1 range', () => {
    expect(getThrowIndicatorStyle(-1)).toEqual(getThrowIndicatorStyle(0))
    expect(getThrowIndicatorStyle(2)).toEqual(getThrowIndicatorStyle(1))
  })
})
