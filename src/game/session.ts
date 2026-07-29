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
        voided: false,
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

/** Each end's final score so far, in play order. An in-progress or unplayed end reads as 0. */
export function getEndScores(session: SessionState): number[] {
  return session.ends.map((end) => end.score ?? 0)
}

/**
 * The running total for the in-progress end: the same `scoreEnd` computation
 * used for a finished end's score, applied to whatever boules and cochonnet
 * position currently stand. Not cached anywhere — always derived fresh from
 * live position state, so it can't drift out of sync when a collision moves
 * a boule already thrown into a different scoring zone.
 */
export function getCurrentScore(session: SessionState): number {
  const currentEnd = getCurrentEnd(session)
  if (!currentEnd) return 0
  return scoreEnd(currentEnd.boulePositions, currentEnd.cochonnetPosition)
}

/**
 * Updates the resting positions of boules already thrown in the current
 * end. Used when a new throw's physics simulation knocks earlier boules to
 * a new position — the score isn't affected here, since the end isn't
 * complete until `recordThrow` finishes it.
 */
export function applyObstacleUpdates(session: SessionState, updatedPositions: Vector2[]): SessionState {
  const currentEnd = session.ends[session.currentEndIndex]
  if (!currentEnd) return session

  const ends = [...session.ends]
  ends[session.currentEndIndex] = { ...currentEnd, boulePositions: updatedPositions }

  return { ...session, ends }
}

/**
 * Updates the current end's cochonnet position. Used when a throw's physics
 * simulation knocks the cochonnet to a new resting spot.
 */
export function applyCochonnetUpdate(session: SessionState, cochonnetPosition: Vector2): SessionState {
  const currentEnd = session.ends[session.currentEndIndex]
  if (!currentEnd) return session

  const ends = [...session.ends]
  ends[session.currentEndIndex] = { ...currentEnd, cochonnetPosition }

  return { ...session, ends }
}

/**
 * Records the resting position of the next boule thrown in the current end.
 * Once the end's boules are all thrown, its score is computed and the
 * session advances to the next end. Passing `voided: true` (the cochonnet was
 * knocked out of the terrain by this throw) ends the end immediately with a
 * score of 0, regardless of how many boules have been thrown so far.
 */
export function recordThrow(
  session: SessionState,
  boulePosition: Vector2,
  options: { voided?: boolean } = {},
): SessionState {
  if (isSessionComplete(session)) {
    throw new Error('Cannot record a throw: session is already complete')
  }

  const currentEnd = session.ends[session.currentEndIndex]
  if (!options.voided && currentEnd.boulePositions.length >= BOULES_PER_END) {
    throw new Error('Cannot record a throw: current end already has all its boules')
  }

  const boulePositions =
    currentEnd.boulePositions.length < BOULES_PER_END
      ? [...currentEnd.boulePositions, boulePosition]
      : currentEnd.boulePositions
  const voided = options.voided === true
  const endComplete = voided || boulePositions.length >= BOULES_PER_END

  const updatedEnd: EndState = {
    ...currentEnd,
    boulePositions,
    score: voided ? 0 : endComplete ? scoreEnd(boulePositions, currentEnd.cochonnetPosition) : null,
    voided,
  }

  const ends = [...session.ends]
  ends[session.currentEndIndex] = updatedEnd

  return {
    ...session,
    ends,
    currentEndIndex: endComplete ? session.currentEndIndex + 1 : session.currentEndIndex,
  }
}
