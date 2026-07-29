import { BACKGROUND_COLOR, COCHONNET_FILL_COLOR, LINE_OF_PLAY_COLOR, TERRAIN_BORDER_COLOR } from './draw'

/** Intrinsic drawing size in CSS pixels — canvas.width/height scale this by devicePixelRatio (see GameOverScreen.tsx). */
export const SHARE_CARD_WIDTH_PX = 480
export const SHARE_CARD_HEIGHT_PX = 640

const FONT_FAMILY = 'system-ui, "Segoe UI", Roboto, sans-serif'

// The panel deliberately isn't the terrain's sandy tan — that read as a
// muddy, low-contrast combination for a card meant to pop when shared.
// LINE_OF_PLAY_COLOR (the game canvas's cream line-of-play color) doubles as
// a clean paper-like surface here instead, with a single saturated red pop
// reserved for the total score.
const PANEL_COLOR = LINE_OF_PLAY_COLOR
const INK_COLOR = '#1a1714'
const MUTED_INK_COLOR = 'rgba(26, 23, 20, 0.6)'

export interface ShareCardData {
  dateKey: string
  totalScore: number
  endScores: number[]
  /** Where someone who sees the shared image can go play it themselves. */
  url: string
}

/**
 * Draws the Share Card (see CONTEXT.md and docs/adr/0007-canvas-share-card.md)
 * — the game-over screen itself, not a separate export-only rendering. Text
 * layout is hand-coded in draw calls rather than CSS/DOM, and the palette is
 * the game board's own fixed canvas colors (render/draw.ts), independent of
 * the app's light/dark CSS theme.
 */
export function drawShareCard(ctx: CanvasRenderingContext2D, data: ShareCardData): void {
  const width = SHARE_CARD_WIDTH_PX
  const height = SHARE_CARD_HEIGHT_PX
  const centerX = width / 2

  ctx.textAlign = 'center'
  ctx.fillStyle = BACKGROUND_COLOR
  ctx.fillRect(0, 0, width, height)

  const panelMargin = 24
  const panelX = panelMargin
  const panelY = panelMargin
  const panelWidth = width - panelMargin * 2
  const panelHeight = height - panelMargin * 2
  drawRoundedRect(ctx, panelX, panelY, panelWidth, panelHeight, 16)
  ctx.fillStyle = PANEL_COLOR
  ctx.fill()
  ctx.strokeStyle = TERRAIN_BORDER_COLOR
  ctx.lineWidth = 2
  ctx.stroke()

  let y = panelY + 56

  ctx.fillStyle = INK_COLOR
  ctx.font = `700 30px ${FONT_FAMILY}`
  ctx.fillText('Cochonnet', centerX, y)

  y += 28
  ctx.fillStyle = MUTED_INK_COLOR
  ctx.font = `15px ${FONT_FAMILY}`
  ctx.fillText(data.dateKey, centerX, y)

  y += 76
  ctx.fillStyle = COCHONNET_FILL_COLOR
  ctx.font = `700 72px ${FONT_FAMILY}`
  ctx.fillText(String(data.totalScore), centerX, y)

  y += 24
  ctx.fillStyle = MUTED_INK_COLOR
  ctx.font = `600 14px ${FONT_FAMILY}`
  ctx.fillText('TOTAL POINTS', centerX, y)

  y += 56
  ctx.strokeStyle = TERRAIN_BORDER_COLOR
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(panelX + 48, y)
  ctx.lineTo(panelX + panelWidth - 48, y)
  ctx.stroke()

  y += 44
  ctx.font = `18px ${FONT_FAMILY}`
  data.endScores.forEach((score, i) => {
    ctx.fillStyle = INK_COLOR
    ctx.textAlign = 'left'
    ctx.fillText(`End ${i + 1}`, panelX + 48, y)
    ctx.textAlign = 'right'
    ctx.fillText(String(score), panelX + panelWidth - 48, y)
    y += 32
  })

  ctx.textAlign = 'center'
  ctx.fillStyle = MUTED_INK_COLOR
  ctx.font = `13px ${FONT_FAMILY}`
  ctx.fillText(data.url, centerX, panelY + panelHeight - 28, panelWidth - 48)
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}
