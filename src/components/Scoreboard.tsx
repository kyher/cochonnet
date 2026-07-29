import { BOULES_PER_END, ENDS_PER_SESSION } from '../game/constants'

interface ScoreboardProps {
  endIndex: number
  boulesThrown: number
  totalScore: number
  currentScore: number
}

export function Scoreboard({ endIndex, boulesThrown, totalScore, currentScore }: ScoreboardProps) {
  return (
    <div className="scoreboard">
      <div className="scoreboard-primary">
        <div className="score-block">
          <span className="score-value">{totalScore}</span>
          <span className="score-label">Total</span>
        </div>
        <div className="score-block">
          <span className="score-value">{currentScore}</span>
          <span className="score-label">This end</span>
        </div>
      </div>
      <div className="scoreboard-progress">
        End {Math.min(endIndex + 1, ENDS_PER_SESSION)}/{ENDS_PER_SESSION} · Boule{' '}
        {Math.min(boulesThrown + 1, BOULES_PER_END)}/{BOULES_PER_END}
      </div>
    </div>
  )
}
