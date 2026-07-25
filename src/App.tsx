import { useMemo } from 'react'
import { GameCanvas } from './components/GameCanvas'
import { GameOverScreen } from './components/GameOverScreen'
import { Scoreboard } from './components/Scoreboard'
import { useGameSession } from './hooks/useGameSession'
import './App.css'

function App() {
  const today = useMemo(() => new Date(), [])
  const {
    dateKey,
    endIndex,
    currentEnd,
    totalScore,
    isComplete,
    isAnimating,
    animatedBoulePosition,
    lastThrow,
    lastEndScore,
    throwBoule,
    restart,
  } = useGameSession(today)

  return (
    <div className="app">
      <header className="app-header">
        <h1>Cochonnet</h1>
      </header>

      {isComplete || !currentEnd ? (
        <GameOverScreen totalScore={totalScore} dateKey={dateKey} onPlayAgain={restart} />
      ) : (
        <>
          <Scoreboard
            endIndex={endIndex}
            boulesThrown={currentEnd.boulePositions.length}
            totalScore={totalScore}
            lastThrow={lastThrow}
            lastEndScore={lastEndScore}
          />
          <GameCanvas
            cochonnetPosition={currentEnd.cochonnetPosition}
            restingBoulePositions={currentEnd.boulePositions}
            animatedBoulePosition={animatedBoulePosition}
            isAnimating={isAnimating}
            onThrow={throwBoule}
          />
          <p className="app-hint">Pull back from the boule and release to throw.</p>
        </>
      )}
    </div>
  )
}

export default App
