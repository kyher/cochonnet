import type { ScoringZoneName } from '../game/constants'
import {
  VOID_COLOR,
  ZONE_BULLSEYE_COLOR,
  ZONE_CLOSE_COLOR,
  ZONE_IN_RANGE_COLOR,
  ZONE_MISS_COLOR,
  ZONE_NEAR_COLOR,
} from './draw'

export const ZONE_LABELS: Record<ScoringZoneName, string> = {
  bullseye: 'Bullseye!',
  close: 'Close!',
  near: 'Near',
  'in-range': 'In range',
  miss: 'Miss',
}

const ZONE_COLORS: Record<ScoringZoneName, string> = {
  bullseye: ZONE_BULLSEYE_COLOR,
  close: ZONE_CLOSE_COLOR,
  near: ZONE_NEAR_COLOR,
  'in-range': ZONE_IN_RANGE_COLOR,
  miss: ZONE_MISS_COLOR,
}

export const VOID_LABEL = 'Void — end lost'

export interface ThrowFeedbackDisplay {
  label: string
  color: string
}

/**
 * The floating on-canvas text and color for a scored throw (see
 * docs/adr/0006-on-canvas-throw-feedback.md) — distinct from
 * `getVoidFeedbackDisplay`, which covers the rarer, more punishing outcome
 * of the cochonnet being knocked out of bounds.
 */
export function getThrowFeedbackDisplay(zone: ScoringZoneName, points: number): ThrowFeedbackDisplay {
  const label = points > 0 ? `${ZONE_LABELS[zone]} +${points}` : ZONE_LABELS[zone]
  return { label, color: ZONE_COLORS[zone] }
}

export function getVoidFeedbackDisplay(): ThrowFeedbackDisplay {
  return { label: VOID_LABEL, color: VOID_COLOR }
}
