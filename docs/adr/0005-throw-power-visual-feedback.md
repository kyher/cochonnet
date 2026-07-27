# RAG-gradient visual feedback for throw power during drag

Dragging back on the boule to arm a throw showed only a flat white line (fixed color, fixed width), even though `render/gesture.ts` already computes power continuously in `[0,1]` as the drag progresses. The drag line's color now interpolates continuously from green (gentle) through amber to red (max power) as power goes 0→1, and its width scales from thin to thick over the same range so the power signal doesn't rely on color perception alone — a deliberate accessibility pairing for red-green colorblindness.

Once power reaches 1.0 (drag distance ≥ `MAX_DRAG_PX`), the line's length is capped at that distance rather than continuing to follow the pointer: it stays pinned, solid red, at the max-power point. This teaches the player visually where "full power" is, instead of letting the line stretch arbitrarily further with no additional effect on the throw.

The power→color/width mapping is a continuous gradient rather than three fixed RAG bands, to avoid a visible color snap as power crosses an arbitrary threshold mid-drag. It's implemented as a pure function in a new module, `render/throwIndicator.ts`, unit-tested the same way `render/gesture.ts` is via `gesture.test.ts`. Its color constants live alongside the rest of the canvas palette in `render/draw.ts` rather than the CSS/DOM theme system used by the app chrome (`index.css`) — those two color systems were already independently duplicated before this change and intentionally stay that way here.

## Considered Options

- **Discrete 3-band RAG** (hard-snap between fixed green/amber/red zones) — rejected in favor of continuous interpolation, since crossing a fixed threshold mid-drag would read as a jarring color pop rather than a smooth signal.
- **Let the line keep following the pointer past `MAX_DRAG_PX`**, with color alone signalling "you've maxed out" — rejected because it leaves the actual power ceiling invisible; capping the line's length teaches the boundary directly.
- **Unify canvas hex colors with the CSS theme variables** as part of this change — rejected as unrelated scope; kept the two palettes separate rather than expanding this into a broader theming cleanup.
