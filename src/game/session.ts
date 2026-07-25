import { BOULES_PER_END, ENDS_PER_SESSION } from './constants'
import { generateCochonnetPositions, getDateKey } from './seed'
import { scoreEnd } from './scoring'
import type { EndState, SessionState, Vector2 } from './types'

export function createSession(date: Date): SessionState {
  const dateKey = getDateKey(date)
  const cochonnetPositions = generateCochonnetPositions(dateKey, ENDS_PER_SESSION)

  return {
    dateKey,
    currentEndIndex: 0,
    ends: cochonnetPositions.map(
      (cochonnetPosition): EndState => ({
        cochonnetPosition,
        boulePositions: [],
        score: null,
      }),
    ),
  }
}

export function isSessionComplete(session: SessionState): boolean {
  return session.currentEndIndex >= session.ends.length
}

export function getCurrentEnd(session: SessionState): EndState | null {
  return session.ends[session.currentEndIndex] ?? null
}

export function getTotalScore(session: SessionState): number {
  return session.ends.reduce((total, end) => total + (end.score ?? 0), 0)
}

/**
 * Records the resting position of the next boule thrown in the current end.
 * Once the end's boules are all thrown, its score is computed and the
 * session advances to the next end.
 */
export function recordThrow(session: SessionState, boulePosition: Vector2): SessionState {
  if (isSessionComplete(session)) {
    throw new Error('Cannot record a throw: session is already complete')
  }

  const currentEnd = session.ends[session.currentEndIndex]
  if (currentEnd.boulePositions.length >= BOULES_PER_END) {
    throw new Error('Cannot record a throw: current end already has all its boules')
  }

  const boulePositions = [...currentEnd.boulePositions, boulePosition]
  const endComplete = boulePositions.length >= BOULES_PER_END

  const updatedEnd: EndState = {
    ...currentEnd,
    boulePositions,
    score: endComplete ? scoreEnd(boulePositions, currentEnd.cochonnetPosition) : null,
  }

  const ends = [...session.ends]
  ends[session.currentEndIndex] = updatedEnd

  return {
    ...session,
    ends,
    currentEndIndex: endComplete ? session.currentEndIndex + 1 : session.currentEndIndex,
  }
}
