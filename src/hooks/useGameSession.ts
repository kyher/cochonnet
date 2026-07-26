import { useCallback, useEffect, useRef, useState } from 'react'
import {
  applyCochonnetUpdate,
  applyObstacleUpdates,
  createSession,
  getCurrentEnd,
  getTotalScore,
  isSessionComplete,
  recordThrow,
} from '../game/session'
import { distance, getScoringZone, getZonePoints, isWithinTerrain, scoreEnd } from '../game/scoring'
import type { EndState, SessionState } from '../game/types'
import { FIXED_TIMESTEP_S } from '../physics/constants'
import { simulateThrow } from '../physics/simulate'
import type { ThrowInput, Vector3 } from '../physics/types'
import { BOULES_PER_END, type ScoringZoneName } from '../game/constants'

export interface LastThrowFeedback {
  zone: ScoringZoneName
  points: number
}

export interface LastEndResult {
  score: number
  voided: boolean
}

export interface UseGameSessionResult {
  dateKey: string
  endIndex: number
  currentEnd: EndState | null
  totalScore: number
  isComplete: boolean
  isAnimating: boolean
  animatedThrownBoulePosition: Vector3 | null
  animatedObstaclePositions: Vector3[] | null
  animatedCochonnetPosition: Vector3 | null
  lastThrow: LastThrowFeedback | null
  lastEndResult: LastEndResult | null
  throwBoule: (input: ThrowInput) => void
  restart: () => void
}

export function useGameSession(date: Date): UseGameSessionResult {
  const [session, setSessionState] = useState<SessionState>(() => createSession(date))
  // `throwBoule` needs the absolute-latest session synchronously, at the
  // instant it's called — reading the `session` *state* via closure isn't
  // enough, because that closure only refreshes once React re-renders after a
  // previous throw's setSession call. Fire a second throw quickly enough
  // (right as the first finishes) and that re-render may not have happened
  // yet, so the closure would still see the pre-first-throw session — the
  // second throw's physics would then run without the first boule as an
  // obstacle at all. A ref sidesteps render timing entirely: it's updated the
  // instant a throw's outcome is known, not on the next render.
  const sessionRef = useRef(session)

  const updateSession = useCallback((updater: (s: SessionState) => SessionState) => {
    const next = updater(sessionRef.current)
    sessionRef.current = next
    setSessionState(next)
  }, [])

  const [isAnimating, setIsAnimating] = useState(false)
  const [animatedThrownBoulePosition, setAnimatedThrownBoulePosition] = useState<Vector3 | null>(null)
  const [animatedObstaclePositions, setAnimatedObstaclePositions] = useState<Vector3[] | null>(null)
  const [animatedCochonnetPosition, setAnimatedCochonnetPosition] = useState<Vector3 | null>(null)
  const [lastThrow, setLastThrow] = useState<LastThrowFeedback | null>(null)
  const [lastEndResult, setLastEndResult] = useState<LastEndResult | null>(null)

  const rafRef = useRef<number | null>(null)
  const isMountedRef = useRef(true)
  // A synchronous guard against re-entrant throws, distinct from the
  // `isAnimating` *state*: state updates are only visible after React commits
  // a re-render, so relying on `isAnimating` alone to block a second throw
  // leaves a real (if narrow) window where two throws could both pass the
  // check and run their animation loops concurrently — each internally
  // consistent, but racing to overwrite the same `animated*` state with
  // differently-shaped results every frame. A ref is mutated immediately, with
  // no such window.
  const isThrowInProgressRef = useRef(false)

  // Set (not just read) on mount too: StrictMode's dev-only double-invoke of
  // effects (mount -> cleanup -> mount) would otherwise leave this stuck at
  // false forever after the first mount/cleanup pair, silently breaking every
  // throw animation.
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      isThrowInProgressRef.current = false
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const throwBoule = useCallback(
    (input: ThrowInput) => {
      if (isThrowInProgressRef.current || isSessionComplete(sessionRef.current)) return
      const currentEnd = getCurrentEnd(sessionRef.current)
      if (!currentEnd) return

      isThrowInProgressRef.current = true
      const result = simulateThrow(input, currentEnd.boulePositions, currentEnd.cochonnetPosition)
      const frameCount = result.trajectory.length
      const startTime = performance.now()
      setIsAnimating(true)

      const step = (now: number) => {
        if (!isMountedRef.current) return

        // `now` (handed to a rAF callback) is not always >= a `performance.now()`
        // read synchronously just before scheduling it — on the first frame in
        // particular, browsers can hand back a timestamp fractionally earlier
        // than that, making elapsedS (and this index) briefly negative. Clamp
        // at 0: without it, a negative array index silently evaluates to
        // `undefined` in JS rather than throwing, which is exactly what made
        // this look like a random missing element instead of an out-of-range one.
        const elapsedS = Math.max(0, (now - startTime) / 1000)
        const index = Math.min(frameCount - 1, Math.floor(elapsedS / FIXED_TIMESTEP_S))
        setAnimatedThrownBoulePosition(result.trajectory[index])
        setAnimatedObstaclePositions(result.obstacleTrajectories.map((t) => t[index]))
        setAnimatedCochonnetPosition(result.cochonnetTrajectory[index])

        if (index < frameCount - 1) {
          rafRef.current = requestAnimationFrame(step)
          return
        }

        isThrowInProgressRef.current = false
        setIsAnimating(false)
        setAnimatedThrownBoulePosition(null)
        setAnimatedObstaclePositions(null)
        setAnimatedCochonnetPosition(null)
        // Judged against the cochonnet's final position — if this throw also
        // knocked it, the score reflects where it ended up, not where it started.
        const zone: ScoringZoneName = isWithinTerrain(result.thrownBoulePosition)
          ? getScoringZone(distance(result.thrownBoulePosition, result.updatedCochonnetPosition))
          : 'miss'
        setLastThrow({ zone, points: getZonePoints(zone) })

        // Computed up front, from data already in hand, rather than inside the
        // updateSession call below: a state transition should never itself
        // trigger another state update as a side effect (React's StrictMode
        // guards against exactly this by invoking setState updaters more than
        // once to check their purity).
        const boulePositionsAfterThrow = [...result.updatedObstaclePositions, result.thrownBoulePosition]
        const endCompletesThisThrow = result.cochonnetKnockedOut || boulePositionsAfterThrow.length >= BOULES_PER_END
        if (endCompletesThisThrow) {
          const score = result.cochonnetKnockedOut
            ? 0
            : scoreEnd(boulePositionsAfterThrow, result.updatedCochonnetPosition)
          setLastEndResult({ score, voided: result.cochonnetKnockedOut })
        }

        updateSession((s) => {
          const withObstaclesUpdated = applyObstacleUpdates(s, result.updatedObstaclePositions)
          const withCochonnetUpdated = applyCochonnetUpdate(withObstaclesUpdated, result.updatedCochonnetPosition)
          return recordThrow(withCochonnetUpdated, result.thrownBoulePosition, {
            voided: result.cochonnetKnockedOut,
          })
        })
      }

      rafRef.current = requestAnimationFrame(step)
    },
    [updateSession],
  )

  const restart = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    isThrowInProgressRef.current = false
    setIsAnimating(false)
    setAnimatedThrownBoulePosition(null)
    setAnimatedObstaclePositions(null)
    setAnimatedCochonnetPosition(null)
    setLastThrow(null)
    setLastEndResult(null)
    sessionRef.current = createSession(new Date())
    setSessionState(sessionRef.current)
  }, [])

  return {
    dateKey: session.dateKey,
    endIndex: session.currentEndIndex,
    currentEnd: getCurrentEnd(session),
    totalScore: getTotalScore(session),
    isComplete: isSessionComplete(session),
    isAnimating,
    animatedThrownBoulePosition,
    animatedObstaclePositions,
    animatedCochonnetPosition,
    lastThrow,
    lastEndResult,
    throwBoule,
    restart,
  }
}
