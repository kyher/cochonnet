# Cochonnet

A solo, daily score-attack game based on pétanque: throw boules at a cochonnet (jack) whose
position each end is generated from a deterministic daily seed, so every player who plays on the
same date faces the identical layout and can compare scores directly.

A session is 3 ends, 3 boules per end. Zone-based scoring, mass-aware physics for
boule-to-cochonnet collisions (a struck cochonnet can fly off and get knocked out of bounds,
voiding the end), and a canvas-rendered Share Card recap at the end of a session.

See [`CONTEXT.md`](./CONTEXT.md) for the game's domain vocabulary (boule, end, terrain, scoring
zone, etc.) and [`docs/adr`](./docs/adr) for the design decisions behind the physics, scoring, and
UI.

## Stack

- React 19 + TypeScript, built with Vite
- Custom 2D physics simulation (no physics library — see [ADR-0001](./docs/adr/0001-custom-physics-engine.md))
- Canvas rendering for the game board and Share Card
- Vitest + Testing Library for tests, Oxlint for linting

## Getting started

Requires [pnpm](https://pnpm.io/) and Node 24 (matches CI).

```bash
pnpm install
pnpm dev
```

This starts the Vite dev server (with HMR) and prints a local URL to open in your browser.

## Testing & linting

```bash
pnpm test        # run the test suite once
pnpm test:watch  # run tests in watch mode
pnpm lint        # run oxlint
```

CI (`.github/workflows`) runs `pnpm lint` and `pnpm test` on every push/PR against `main`.

## Building

```bash
pnpm build    # type-checks (tsc -b) then builds to dist/
pnpm preview  # serve the production build locally
```
