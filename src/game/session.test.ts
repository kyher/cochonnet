import { describe, expect, it } from 'vitest'
import { BOULES_PER_END, ENDS_PER_SESSION } from './constants'
import { generateCochonnetPositions, getDateKey } from './seed'
import {
  createSession,
  getCurrentEnd,
  getTotalScore,
  isSessionComplete,
  recordThrow,
} from './session'

const date = new Date('2026-07-25T12:00:00Z')

describe('createSession', () => {
  it('seeds ends from the date, all empty and unscored', () => {
    const session = createSession(date)
    const expectedPositions = generateCochonnetPositions(getDateKey(date), ENDS_PER_SESSION)

    expect(session.dateKey).toBe('2026-07-25')
    expect(session.currentEndIndex).toBe(0)
    expect(session.ends).toHaveLength(ENDS_PER_SESSION)
    session.ends.forEach((end, i) => {
      expect(end.cochonnetPosition).toEqual(expectedPositions[i])
      expect(end.boulePositions).toEqual([])
      expect(end.score).toBeNull()
    })
  })
})

describe('recordThrow', () => {
  it('does not mutate the original session', () => {
    const session = createSession(date)
    const cochonnet = session.ends[0].cochonnetPosition
    recordThrow(session, cochonnet)

    expect(session.ends[0].boulePositions).toEqual([])
  })

  it('leaves the end unscored until all boules are thrown', () => {
    let session = createSession(date)
    const cochonnet = session.ends[0].cochonnetPosition

    session = recordThrow(session, cochonnet)
    expect(getCurrentEnd(session)?.score).toBeNull()
    expect(session.currentEndIndex).toBe(0)

    session = recordThrow(session, cochonnet)
    expect(getCurrentEnd(session)?.score).toBeNull()
    expect(session.currentEndIndex).toBe(0)
  })

  it('scores the end and advances once all boules are thrown', () => {
    let session = createSession(date)
    const cochonnet = session.ends[0].cochonnetPosition

    for (let i = 0; i < BOULES_PER_END; i++) {
      session = recordThrow(session, cochonnet)
    }

    expect(session.ends[0].score).toBe(50 * BOULES_PER_END) // all dead-center: bullseye each
    expect(session.currentEndIndex).toBe(1)
  })

  it('throws once the current end already has all its boules', () => {
    let session = createSession(date)
    const cochonnet = session.ends[0].cochonnetPosition
    for (let i = 0; i < BOULES_PER_END; i++) {
      session = recordThrow(session, cochonnet)
    }

    expect(() => recordThrow(session, cochonnet)).not.toThrow() // now throwing into end 2
  })

  it('completes the session after all ends are played, and rejects further throws', () => {
    let session = createSession(date)

    for (let e = 0; e < ENDS_PER_SESSION; e++) {
      const cochonnet = session.ends[e].cochonnetPosition
      for (let b = 0; b < BOULES_PER_END; b++) {
        session = recordThrow(session, cochonnet)
      }
    }

    expect(isSessionComplete(session)).toBe(true)
    expect(getCurrentEnd(session)).toBeNull()
    expect(getTotalScore(session)).toBe(50 * BOULES_PER_END * ENDS_PER_SESSION)
    expect(() => recordThrow(session, { x: 0, y: 0 })).toThrow()
  })
})
