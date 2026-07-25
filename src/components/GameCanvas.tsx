import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { THROW_ORIGIN_Y_M } from '../game/constants'
import type { Vector2 } from '../game/types'
import type { ThrowInput, Vector3 } from '../physics/types'
import { computeViewport, worldToScreen } from '../render/coordinates'
import {
  clearCanvas,
  drawBackground,
  drawBoule,
  drawBoule3d,
  drawCochonnet,
  drawLineOfPlay,
  drawTerrain,
} from '../render/draw'
import { dragToThrowInput } from '../render/gesture'

/**
 * Where the boule waiting to be thrown is shown, behind the line of play —
 * the same position physics actually launches from (game/constants.ts), so
 * there's no jump between "waiting" and "in flight".
 */
const READY_BOULE_POSITION: Vector2 = { x: 0, y: THROW_ORIGIN_Y_M }

interface GameCanvasProps {
  cochonnetPosition: Vector2
  restingBoulePositions: Vector2[]
  animatedBoulePosition: Vector3 | null
  isAnimating: boolean
  onThrow: (input: ThrowInput) => void
}

/** Drags shorter than this are treated as accidental taps, not throws. */
const MIN_THROW_POWER = 0.05

export function GameCanvas({
  cochonnetPosition,
  restingBoulePositions,
  animatedBoulePosition,
  isAnimating,
  onThrow,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasSize, setCanvasSize] = useState({ widthPx: 0, heightPx: 0 })
  const dragStartRef = useRef<Vector2 | null>(null)
  const [dragCurrent, setDragCurrent] = useState<Vector2 | null>(null)

  // Keep the canvas's internal pixel buffer in sync with its displayed CSS size.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setCanvasSize({ widthPx: width, heightPx: height })
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || canvasSize.widthPx === 0 || canvasSize.heightPx === 0) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = canvasSize.widthPx * dpr
    canvas.height = canvasSize.heightPx * dpr

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const viewport = computeViewport(canvasSize.widthPx, canvasSize.heightPx)

    clearCanvas(ctx, canvasSize.widthPx, canvasSize.heightPx)
    drawBackground(ctx, canvasSize.widthPx, canvasSize.heightPx)
    drawTerrain(ctx, viewport)
    drawLineOfPlay(ctx, viewport)
    drawCochonnet(ctx, viewport, cochonnetPosition)
    restingBoulePositions.forEach((position) => drawBoule(ctx, viewport, position))
    if (animatedBoulePosition) {
      drawBoule3d(ctx, viewport, animatedBoulePosition)
    } else if (!isAnimating) {
      drawBoule(ctx, viewport, READY_BOULE_POSITION)
    }

    if (dragCurrent) {
      const from = worldToScreen(READY_BOULE_POSITION, viewport)
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(dragCurrent.x, dragCurrent.y)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.lineWidth = 3
      ctx.stroke()
    }
  }, [canvasSize, cochonnetPosition, restingBoulePositions, animatedBoulePosition, isAnimating, dragCurrent])

  const getRelativePoint = useCallback((e: PointerEvent<HTMLCanvasElement>): Vector2 => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (isAnimating) return
    const point = getRelativePoint(e)
    dragStartRef.current = point
    setDragCurrent(point)
    canvasRef.current?.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!dragStartRef.current) return
    setDragCurrent(getRelativePoint(e))
  }

  const handlePointerUp = (e: PointerEvent<HTMLCanvasElement>) => {
    const start = dragStartRef.current
    dragStartRef.current = null
    setDragCurrent(null)
    if (!start) return

    const end = getRelativePoint(e)
    const input = dragToThrowInput({ x: end.x - start.x, y: end.y - start.y })
    if (input.power >= MIN_THROW_POWER) {
      onThrow(input)
    }
  }

  return (
    <div ref={containerRef} className="game-canvas-container">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  )
}
