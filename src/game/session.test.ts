import { describe, expect, it } from 'vitest'
import { BOULES_PER_END, ENDS_PER_SESSION } from './constants'
import { generateCochonnetPositions, getDateKey } from './seed'
import { scoreEnd } from './scoring'
import {
  applyCochonnetUpdate,
  applyObstacleUpdates,
  createSession,
  getCurrentEnd,
  getCurrentScore,
  getEndScores,
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
      expect(end.voided).toBe(false)
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

describe('applyObstacleUpdates', () => {
  it('replaces the current end boule positions without scoring it', () => {
    let session = createSession(date)
    const cochonnet = session.ends[0].cochonnetPosition
    session = recordThrow(session, { x: 1, y: 1 })
    session = recordThrow(session, { x: 2, y: 2 })

    const knocked = [{ x: 1.5, y: 1.5 }, { x: 2.5, y: 2.5 }]
    session = applyObstacleUpdates(session, knocked)

    expect(session.ends[0].boulePositions).toEqual(knocked)
    expect(session.ends[0].score).toBeNull()

    // Finishing the end now scores against the knocked-to positions, not the originals.
    session = recordThrow(session, cochonnet)
    expect(session.ends[0].score).toBe(scoreEnd([...knocked, cochonnet], cochonnet))
  })

  it('is a no-op once the session is complete', () => {
    let session = createSession(date)
    for (let e = 0; e < ENDS_PER_SESSION; e++) {
      const cochonnet = session.ends[e].cochonnetPosition
      for (let b = 0; b < BOULES_PER_END; b++) {
        session = recordThrow(session, cochonnet)
      }
    }

    const result = applyObstacleUpdates(session, [{ x: 0, y: 0 }])
    expect(result).toEqual(session)
  })
})

describe('applyCochonnetUpdate', () => {
  it('replaces the current end cochonnet position without scoring it', () => {
    let session = createSession(date)
    const knocked = { x: 1, y: 5 }

    session = applyCochonnetUpdate(session, knocked)

    expect(session.ends[0].cochonnetPosition).toEqual(knocked)
    expect(session.ends[0].score).toBeNull()
  })

  it('is a no-op once the session is complete', () => {
    let session = createSession(date)
    for (let e = 0; e < ENDS_PER_SESSION; e++) {
      const cochonnet = session.ends[e].cochonnetPosition
      for (let b = 0; b < BOULES_PER_END; b++) {
        session = recordThrow(session, cochonnet)
      }
    }

    const result = applyCochonnetUpdate(session, { x: 0, y: 0 })
    expect(result).toEqual(session)
  })
})

describe('recordThrow with voided: true', () => {
  it('ends the end immediately with a score of 0, even with boules left to throw', () => {
    let session = createSession(date)
    const cochonnet = session.ends[0].cochonnetPosition

    session = recordThrow(session, cochonnet) // 1 of 3 boules thrown
    session = recordThrow(session, { x: 0, y: 13.5 }, { voided: true }) // knocks the jack out

    expect(session.ends[0].score).toBe(0)
    expect(session.ends[0].voided).toBe(true)
    expect(session.ends[0].boulePositions).toHaveLength(2)
    expect(session.currentEndIndex).toBe(1) // advanced despite only 2 of 3 boules thrown
  })

  it('does not mark a normal completed end as voided', () => {
    let session = createSession(date)
    const cochonnet = session.ends[0].cochonnetPosition

    for (let i = 0; i < BOULES_PER_END; i++) {
      session = recordThrow(session, cochonnet)
    }

    expect(session.ends[0].voided).toBe(false)
  })
})

describe('getEndScores', () => {
  it('reads 0 for every unplayed end', () => {
    const session = createSession(date)
    expect(getEndScores(session)).toEqual([0, 0, 0])
  })

  it('fills in each end\'s score as it completes, leaving later ends at 0', () => {
    let session = createSession(date)
    const cochonnet = session.ends[0].cochonnetPosition

    for (let i = 0; i < BOULES_PER_END; i++) {
      session = recordThrow(session, cochonnet)
    }

    expect(getEndScores(session)).toEqual([50 * BOULES_PER_END, 0, 0])
  })

  it('reads 0 for a voided end', () => {
    let session = createSession(date)
    const cochonnet = session.ends[0].cochonnetPosition
    session = recordThrow(session, cochonnet)
    session = recordThrow(session, { x: 0, y: 13.5 }, { voided: true })

    expect(getEndScores(session)).toEqual([0, 0, 0])
  })
})

describe('getCurrentScore', () => {
  it('is 0 before any boule is thrown', () => {
    const session = createSession(date)
    expect(getCurrentScore(session)).toBe(0)
  })

  it('reflects only the boules thrown so far in the in-progress end', () => {
    let session = createSession(date)
    const cochonnet = session.ends[0].cochonnetPosition

    session = recordThrow(session, cochonnet) // bullseye
    expect(getCurrentScore(session)).toBe(50)

    session = recordThrow(session, { x: 10, y: 10 }) // miss
    expect(getCurrentScore(session)).toBe(50)
  })

  it('recalculates once a collision moves an already-scored boule into a new zone', () => {
    let session = createSession(date)
    const cochonnet = session.ends[0].cochonnetPosition

    session = recordThrow(session, cochonnet) // bullseye: +50
    expect(getCurrentScore(session)).toBe(50)

    // A later throw's collision knocks the first boule out to the edge of the "near" zone.
    session = applyObstacleUpdates(session, [{ x: cochonnet.x + 0.9, y: cochonnet.y }])
    expect(getCurrentScore(session)).toBe(15)
  })

  it('drops a boule to 0 once a collision knocks it off the terrain entirely', () => {
    let session = createSession(date)
    const cochonnet = session.ends[0].cochonnetPosition

    session = recordThrow(session, cochonnet) // bullseye: +50
    session = applyObstacleUpdates(session, [{ x: 0, y: -1 }]) // knocked behind the throwing line
    expect(getCurrentScore(session)).toBe(0)
  })

  it('is 0 for the next end, once the previous end completes', () => {
    let session = createSession(date)
    const cochonnet = session.ends[0].cochonnetPosition

    for (let i = 0; i < BOULES_PER_END; i++) {
      session = recordThrow(session, cochonnet)
    }

    expect(getCurrentScore(session)).toBe(0)
  })

  it('is 0 once the session is complete', () => {
    let session = createSession(date)
    for (let e = 0; e < ENDS_PER_SESSION; e++) {
      const cochonnet = session.ends[e].cochonnetPosition
      for (let b = 0; b < BOULES_PER_END; b++) {
        session = recordThrow(session, cochonnet)
      }
    }

    expect(getCurrentScore(session)).toBe(0)
  })
})
