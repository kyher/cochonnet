export interface ThrowFeedbackItem {
  /** Changes on every throw, so React remounts the element and restarts its CSS animation. */
  key: number
  xPx: number
  yPx: number
  label: string
  color: string
  variant: 'zone' | 'void'
}

interface ThrowFeedbackOverlayProps {
  feedback: ThrowFeedbackItem | null
}

/**
 * Floating, fading result text anchored at a throw's landing point (see
 * docs/adr/0006-on-canvas-throw-feedback.md). Rendered as an absolutely
 * positioned DOM node over the game canvas rather than drawn into the canvas
 * itself — text/keyframe animation is far simpler in CSS, and the visual
 * result (overlaid on the board, anchored to the landing spot) is what the
 * ADR is actually about.
 */
export function ThrowFeedbackOverlay({ feedback }: ThrowFeedbackOverlayProps) {
  if (!feedback) return null

  return (
    <div
      key={feedback.key}
      className={`throw-feedback throw-feedback-${feedback.variant}`}
      style={{ left: feedback.xPx, top: feedback.yPx, color: feedback.color }}
    >
      {feedback.label}
    </div>
  )
}
