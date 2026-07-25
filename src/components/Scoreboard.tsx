import { BOULES_PER_END, ENDS_PER_SESSION } from '../game/constants'
import type { LastThrowFeedback } from '../hooks/useGameSession'

interface ScoreboardProps {
  endIndex: number
  boulesThrown: number
  totalScore: number
  lastThrow: LastThrowFeedback | null
  lastEndScore: number | null
}

const ZONE_LABELS: Record<LastThrowFeedback['zone'], string> = {
  bullseye: 'Bullseye!',
  close: 'Close!',
  near: 'Near',
  'in-range': 'In range',
  miss: 'Miss',
}

export function Scoreboard({ endIndex, boulesThrown, totalScore, lastThrow, lastEndScore }: ScoreboardProps) {
  return (
    <div className="scoreboard">
      <div className="scoreboard-row">
        <span>
          End {Math.min(endIndex + 1, ENDS_PER_SESSION)}/{ENDS_PER_SESSION}
        </span>
        <span>
          Boule {Math.min(boulesThrown + 1, BOULES_PER_END)}/{BOULES_PER_END}
        </span>
        <span>Score: {totalScore}</span>
      </div>
      {lastThrow && (
        <div className="scoreboard-feedback">
          {ZONE_LABELS[lastThrow.zone]} {lastThrow.points > 0 ? `+${lastThrow.points}` : ''}
        </div>
      )}
      {lastEndScore !== null && <div className="scoreboard-feedback">End score: {lastEndScore}</div>}
    </div>
  )
}
