import { useState } from 'react'

interface GameOverScreenProps {
  totalScore: number
  dateKey: string
  onPlayAgain: () => void
}

type ShareStatus = 'idle' | 'copied' | 'error'

function buildShareText(dateKey: string, totalScore: number): string {
  return `Cochonnet — ${dateKey}\nScore: ${totalScore}\n${window.location.href}`
}

export function GameOverScreen({ totalScore, dateKey, onPlayAgain }: GameOverScreenProps) {
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle')

  const handleShare = async () => {
    const text = buildShareText(dateKey, totalScore)

    if (navigator.share) {
      try {
        await navigator.share({ text })
      } catch {
        // User dismissed the share sheet — not an error.
      }
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      setShareStatus('copied')
      setTimeout(() => setShareStatus('idle'), 2000)
    } catch {
      setShareStatus('error')
    }
  }

  return (
    <div className="game-over">
      <h2>Session complete</h2>
      <p className="game-over-score">{totalScore} points</p>
      <button type="button" onClick={handleShare}>
        {shareStatus === 'copied' ? 'Copied!' : shareStatus === 'error' ? 'Could not copy' : 'Share result'}
      </button>
      <button type="button" onClick={onPlayAgain}>
        Play again
      </button>
    </div>
  )
}
