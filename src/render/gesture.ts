import type { ThrowInput } from '../physics/types'

/**
 * Drag distance, in pixels, representing full throw power. Kept short
 * because the on-screen throwing area a player actually has room to drag
 * within is fairly small — a long threshold makes full power hard to reach.
 */
export const MAX_DRAG_PX = 120

/**
 * Converts an on-screen drag vector into a throw's aim direction and power,
 * slingshot-style: dragging back (down the screen, away from the target)
 * arms the throw, and releasing launches in the opposite direction.
 */
export function dragToThrowInput(dragVector: { x: number; y: number }): ThrowInput {
  const dx = -dragVector.x
  const dy = dragVector.y // screen down (positive dy) -> positive world y (away from the player)
  const magnitude = Math.hypot(dx, dy)

  if (magnitude === 0) {
    return { direction: { x: 0, y: 1 }, power: 0 }
  }

  return {
    direction: { x: dx / magnitude, y: dy / magnitude },
    power: Math.min(1, magnitude / MAX_DRAG_PX),
  }
}
