import { describe, expect, it } from 'vitest'
import { dragToThrowInput, MAX_DRAG_PX } from './gesture'

describe('dragToThrowInput', () => {
  it('maps a zero drag to zero power', () => {
    const result = dragToThrowInput({ x: 0, y: 0 })
    expect(result.power).toBe(0)
  })

  it('maps a downward (pull-back) drag to the forward (+y) direction', () => {
    const result = dragToThrowInput({ x: 0, y: 100 })
    expect(result.direction.x).toBeCloseTo(0, 5)
    expect(result.direction.y).toBeCloseTo(1, 5)
  })

  it('maps a pull to one side to a throw toward the opposite side', () => {
    const result = dragToThrowInput({ x: -100, y: 0 })
    expect(result.direction.x).toBeCloseTo(1, 5)
    expect(result.direction.y).toBeCloseTo(0, 5)
  })

  it('scales power linearly up to the max drag distance', () => {
    expect(dragToThrowInput({ x: 0, y: MAX_DRAG_PX / 2 }).power).toBeCloseTo(0.5, 5)
    expect(dragToThrowInput({ x: 0, y: MAX_DRAG_PX }).power).toBeCloseTo(1, 5)
  })

  it('clamps power at 1 beyond the max drag distance', () => {
    expect(dragToThrowInput({ x: 0, y: MAX_DRAG_PX * 3 }).power).toBe(1)
  })
})
