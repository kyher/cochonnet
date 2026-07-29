import { useEffect, useRef, useState } from 'react'
import { drawShareCard, SHARE_CARD_HEIGHT_PX, SHARE_CARD_WIDTH_PX } from '../render/shareCard'

interface GameOverScreenProps {
  totalScore: number
  endScores: number[]
  dateKey: string
  onPlayAgain: () => void
}

type CopyStatus = 'idle' | 'copied' | 'error'

export function GameOverScreen({ totalScore, endScores, dateKey, onPlayAgain }: GameOverScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = SHARE_CARD_WIDTH_PX * dpr
    canvas.height = SHARE_CARD_HEIGHT_PX * dpr

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    drawShareCard(ctx, { dateKey, totalScore, endScores, url: window.location.href })
  }, [dateKey, totalScore, endScores])

  const handleCopy = () => {
    const canvas = canvasRef.current
    if (!canvas || !navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
      setCopyStatus('error')
      return
    }

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setCopyStatus('error')
        return
      }
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        setCopyStatus('copied')
        setTimeout(() => setCopyStatus('idle'), 2000)
      } catch {
        setCopyStatus('error')
      }
    }, 'image/png')
  }

  return (
    <div className="game-over">
      <canvas
        ref={canvasRef}
        className="share-card"
        style={{ width: '100%', maxWidth: SHARE_CARD_WIDTH_PX }}
      />
      <button type="button" onClick={handleCopy}>
        {copyStatus === 'copied' ? 'Copied!' : copyStatus === 'error' ? 'Could not copy' : 'Copy image'}
      </button>
      <button type="button" onClick={onPlayAgain}>
        Play again
      </button>
    </div>
  )
}
