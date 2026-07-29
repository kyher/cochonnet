# On-canvas floating feedback for throw results

Post-throw result feedback (the zone label and points, and the voided-end message) previously appeared as small static text lines in the Scoreboard component — easy to miss, since the player's attention is on the canvas at the exact moment a boule lands. That feedback now renders directly on the game canvas, anchored at the boule's landing point: text appears there and rises/fades out over about a second, the way "damage numbers" read in action games, rather than living in a separate part of the screen the player has to glance away from the action to read. The scoreboard's two feedback text lines are removed entirely rather than kept as a fallback, since duplicating the same message in two places once the primary signal lives on-canvas would just be redundant.

Each scoring zone (bullseye/close/near/in-range/miss) gets a distinct color, extending the red-green-accessible color pairing already established for the throw-power drag indicator in ADR-0005 rather than inventing a separate ad hoc palette for outcomes.

A voided end (the cochonnet knocked out of bounds) is not just another color variant of this same component: it gets a distinct, more dramatic presentation (larger, animated shake/flash, explicit "void" text) instead of reusing the floating-text treatment unchanged. This is deliberate — a voided end discards the rest of that end's throws and its score, a materially different and rarer outcome than an ordinary miss, and collapsing it into "just another color" would under-communicate that.

## Considered Options

- **Keep the scoreboard text lines as a persistent fallback** alongside the new canvas overlay — rejected as redundant messaging once the primary feedback moved on-canvas.
- **Reuse the same floating-text component/color for a voided end**, just labeled "Void" — rejected because it would read as no different from a normal miss, when it's actually ending the whole end early.
