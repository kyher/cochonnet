/** A point on the terrain's 2D ground plane, in meters. */
export interface Vector2 {
  x: number
  y: number
}

/** One end: a cochonnet placement and the boules thrown at it so far. */
export interface EndState {
  cochonnetPosition: Vector2
  boulePositions: Vector2[]
  /** null until all boules for this end have been thrown. */
  score: number | null
}

/** A full session: a fixed sequence of ends, seeded by the day's date. */
export interface SessionState {
  dateKey: string
  ends: EndState[]
  currentEndIndex: number
}
