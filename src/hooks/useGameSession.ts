import { useCallback, useEffect, useRef, useState } from 'react'
import {
  applyObstacleUpdates,
  createSession,
  getCurrentEnd,
  getTotalScore,
  isSessionComplete,
  recordThrow,
} from '../game/session'
import { distance, getScoringZone, getZonePoints, isWithinTerrain } from '../game/scoring'
import type { EndState, SessionState } from '../game/types'
import { FIXED_TIMESTEP_S } from '../physics/constants'
import { simulateThrow } from '../physics/simulate'
import type { ThrowInput, Vector3 } from '../physics/types'
import type { ScoringZoneName } from '../game/constants'

export interface LastThrowFeedback {
  zone: ScoringZoneName
  points: number
}

export interface UseGameSessionResult {
  dateKey: string
  endIndex: number
  currentEnd: EndState | null
  totalScore: number
  isComplete: boolean
  isAnimating: boolean
  animatedBoulePosition: Vector3 | null
  lastThrow: LastThrowFeedback | null
  lastEndScore: number | null
  throwBoule: (input: ThrowInput) => void
  restart: () => void
}

export function useGameSession(date: Date): UseGameSessionResult {
  const [session, setSession] = useState<SessionState>(() => createSession(date))
  const [isAnimating, setIsAnimating] = useState(false)
  const [animatedBoulePosition, setAnimatedBoulePosition] = useState<Vector3 | null>(null)
  const [lastThrow, setLastThrow] = useState<LastThrowFeedback | null>(null)
  const [lastEndScore, setLastEndScore] = useState<number | null>(null)

  const rafRef = useRef<number | null>(null)
  const isMountedRef = useRef(true)

  // Set (not just read) on mount too: StrictMode's dev-only double-invoke of
  // effects (mount -> cleanup -> mount) would otherwise leave this stuck at
  // false forever after the first mount/cleanup pair, silently breaking every
  // throw animation.
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const throwBoule = useCallback(
    (input: ThrowInput) => {
      if (isAnimating || isSessionComplete(session)) return
      const currentEnd = getCurrentEnd(session)
      if (!currentEnd) return

      const result = simulateThrow(input, currentEnd.boulePositions)
      const trajectory = result.trajectory
      const startTime = performance.now()
      setIsAnimating(true)

      const step = (now: number) => {
        if (!isMountedRef.current) return

        const elapsedS = (now - startTime) / 1000
        const index = Math.min(trajectory.length - 1, Math.floor(elapsedS / FIXED_TIMESTEP_S))
        setAnimatedBoulePosition(trajectory[index])

        if (index < trajectory.length - 1) {
          rafRef.current = requestAnimationFrame(step)
          return
        }

        setIsAnimating(false)
        setAnimatedBoulePosition(null)
        const zone: ScoringZoneName = isWithinTerrain(result.thrownBoulePosition)
          ? getScoringZone(distance(result.thrownBoulePosition, currentEnd.cochonnetPosition))
          : 'miss'
        setLastThrow({ zone, points: getZonePoints(zone) })

        setSession((s) => {
          const withObstaclesUpdated = applyObstacleUpdates(s, result.updatedObstaclePositions)
          const endIndexBeforeThrow = withObstaclesUpdated.currentEndIndex
          const updated = recordThrow(withObstaclesUpdated, result.thrownBoulePosition)

          if (updated.currentEndIndex !== endIndexBeforeThrow) {
            setLastEndScore(updated.ends[endIndexBeforeThrow].score)
          }

          return updated
        })
      }

      rafRef.current = requestAnimationFrame(step)
    },
    [session, isAnimating],
  )

  const restart = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    setIsAnimating(false)
    setAnimatedBoulePosition(null)
    setLastThrow(null)
    setLastEndScore(null)
    setSession(createSession(new Date()))
  }, [])

  return {
    dateKey: session.dateKey,
    endIndex: session.currentEndIndex,
    currentEnd: getCurrentEnd(session),
    totalScore: getTotalScore(session),
    isComplete: isSessionComplete(session),
    isAnimating,
    animatedBoulePosition,
    lastThrow,
    lastEndScore,
    throwBoule,
    restart,
  }
}
