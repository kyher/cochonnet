import { describe, expect, it } from 'vitest'
import { getThrowFeedbackDisplay, getVoidFeedbackDisplay, ZONE_LABELS } from './throwFeedback'

describe('getThrowFeedbackDisplay', () => {
  it('appends the point value for a scoring zone', () => {
    expect(getThrowFeedbackDisplay('bullseye', 50).label).toBe('Bullseye! +50')
    expect(getThrowFeedbackDisplay('close', 30).label).toBe('Close! +30')
  })

  it('omits the point suffix for a miss', () => {
    expect(getThrowFeedbackDisplay('miss', 0).label).toBe(ZONE_LABELS.miss)
  })

  it('gives every zone a distinct color', () => {
    const colors = (Object.keys(ZONE_LABELS) as (keyof typeof ZONE_LABELS)[]).map(
      (zone) => getThrowFeedbackDisplay(zone, 1).color,
    )
    expect(new Set(colors).size).toBe(colors.length)
  })
})

describe('getVoidFeedbackDisplay', () => {
  it('is a distinct color from every scoring zone', () => {
    const { color: voidColor } = getVoidFeedbackDisplay()
    const zoneColors = (Object.keys(ZONE_LABELS) as (keyof typeof ZONE_LABELS)[]).map(
      (zone) => getThrowFeedbackDisplay(zone, 1).color,
    )
    expect(zoneColors).not.toContain(voidColor)
  })
})
