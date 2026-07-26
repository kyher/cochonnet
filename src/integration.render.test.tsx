// @vitest-environment jsdom
import { act, render } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GameCanvas } from './components/GameCanvas'
import { useGameSession, type UseGameSessionResult } from './hooks/useGameSession'

// jsdom doesn't implement ResizeObserver or a real canvas 2D context. Stub
// both just enough that GameCanvas's draw effect actually runs (a null
// context would make it bail out before ever reaching the code we're testing).
class FakeResizeObserver {
  private cb: ResizeObserverCallback
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb
  }
  observe() {
    this.cb([{ contentRect: { width: 400, height: 800 } } as ResizeObserverEntry], this as unknown as ResizeObserver)
  }
  unobserve() {}
  disconnect() {}
}

function fakeContext2d() {
  const gradient = { addColorStop: vi.fn() }
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    setLineDash: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn((..._args: unknown[]) => {}),
    fill: vi.fn(),
    ellipse: vi.fn(),
    createRadialGradient: vi.fn(() => gradient),
    setTransform: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
  } as unknown as CanvasRenderingContext2D
}

let rafQueue: FrameRequestCallback[] = []
let fakeNow = 0

function flushAllAnimationFrames() {
  let iterations = 0
  while (rafQueue.length > 0 && iterations < 2000) {
    const callbacks = rafQueue
    rafQueue = []
    fakeNow += 200 // large jump: only the *number* of samples matters, not real cadence
    callbacks.forEach((cb) => {
      act(() => {
        cb(fakeNow)
      })
    })
    iterations++
  }
}

describe('GameCanvas + useGameSession, mounted with a real DOM and StrictMode', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => fakeContext2d())
    rafQueue = []
    fakeNow = 0
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafQueue.push(cb)
      return rafQueue.length
    })
    vi.stubGlobal('cancelAnimationFrame', () => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  function Harness({ onReady }: { onReady: (api: UseGameSessionResult) => void }) {
    const api = useGameSession(new Date('2026-07-26T12:00:00Z'))
    onReady(api)
    return (
      <GameCanvas
        cochonnetPosition={api.currentEnd?.cochonnetPosition ?? { x: 0, y: 0 }}
        restingBoulePositions={api.currentEnd?.boulePositions ?? []}
        animatedThrownBoulePosition={api.animatedThrownBoulePosition}
        animatedObstaclePositions={api.animatedObstaclePositions}
        animatedCochonnetPosition={api.animatedCochonnetPosition}
        isAnimating={api.isAnimating}
        onThrow={api.throwBoule}
      />
    )
  }

  it('renders through two throws aimed to collide, with no draw crash, under StrictMode', () => {
    let latestApi: UseGameSessionResult | null = null
    render(
      <StrictMode>
        <Harness onReady={(api) => (latestApi = api)} />
      </StrictMode>,
    )

    // First throw: straight ahead, lands somewhere on the line x=0.
    act(() => {
      latestApi!.throwBoule({ direction: { x: 0, y: 1 }, power: 0.6 })
    })
    flushAllAnimationFrames()

    // Second throw: identical aim/power, so it travels the exact same path
    // and directly collides with the first boule's resting position.
    act(() => {
      latestApi!.throwBoule({ direction: { x: 0, y: 1 }, power: 0.6 })
    })
    expect(() => flushAllAnimationFrames()).not.toThrow()

    expect(latestApi!.currentEnd?.boulePositions.length).toBeGreaterThanOrEqual(1)
  })

  it('renders a full end of angled, colliding throws (including a cochonnet hit) with no draw crash', () => {
    let latestApi: UseGameSessionResult | null = null
    render(
      <StrictMode>
        <Harness onReady={(api) => (latestApi = api)} />
      </StrictMode>,
    )

    const throwsAtVaryingAnglesAndPowers = [
      { direction: { x: 0, y: 1 }, power: 0.7 },
      { direction: { x: 0.15, y: 1 }, power: 0.75 }, // angled, likely clips the first boule
      { direction: { x: -0.05, y: 1 }, power: 1 }, // full power, aimed near the cochonnet too
    ]

    for (const input of throwsAtVaryingAnglesAndPowers) {
      act(() => {
        latestApi!.throwBoule(input)
      })
      expect(() => flushAllAnimationFrames()).not.toThrow()
    }
  })

  it('ignores a second throw fired before the first one has finished animating', () => {
    let latestApi: UseGameSessionResult | null = null
    render(
      <StrictMode>
        <Harness onReady={(api) => (latestApi = api)} />
      </StrictMode>,
    )

    // Both calls happen back-to-back, before any animation frames are
    // flushed — i.e. before React has had any chance to commit `isAnimating`.
    // Only a synchronous (ref-based) guard can reject the second one here.
    act(() => {
      latestApi!.throwBoule({ direction: { x: 0, y: 1 }, power: 0.6 })
      latestApi!.throwBoule({ direction: { x: 0, y: 1 }, power: 0.6 })
    })
    expect(() => flushAllAnimationFrames()).not.toThrow()

    // If the second throw had gone through too, two boules would have been
    // recorded from this single burst.
    expect(latestApi!.currentEnd?.boulePositions.length).toBe(1)
  })

  it('accounts for the first boule as an obstacle even when the second throw fires the instant the first finishes, with no intervening render', () => {
    let latestApi: UseGameSessionResult | null = null
    render(
      <StrictMode>
        <Harness onReady={(api) => (latestApi = api)} />
      </StrictMode>,
    )

    act(() => {
      latestApi!.throwBoule({ direction: { x: 0, y: 1 }, power: 0.6 })
    })

    // Drain throw 1's frames manually (not via the flush helper, which wraps
    // each frame in its own `act()` — letting React commit between calls).
    // Here, the very last frame of throw 1 and the start of throw 2 happen in
    // the exact same `act()` callback, with zero opportunity for React to
    // re-render `throwBoule`'s closure in between.
    act(() => {
      let iterations = 0
      while (rafQueue.length > 0 && iterations < 2000) {
        const callbacks = rafQueue
        rafQueue = []
        fakeNow += 200
        callbacks.forEach((cb) => cb(fakeNow))
        iterations++
      }
      // Thrown immediately, inside the same act() — no render boundary at all
      // between throw 1 finishing and throw 2 starting.
      latestApi!.throwBoule({ direction: { x: 0, y: 1 }, power: 0.6 })
    })
    expect(() => flushAllAnimationFrames()).not.toThrow()

    // If throw 2 hadn't seen the first boule as an obstacle, it would have
    // silently wiped it from state instead of ending up with both recorded.
    expect(latestApi!.currentEnd?.boulePositions.length).toBe(2)
  })

  it('does not crash when the first animation frame timestamp is fractionally earlier than performance.now() at throw time', () => {
    // A real, documented browser quirk: the timestamp requestAnimationFrame
    // hands its callback is not guaranteed to be >= a performance.now() read
    // synchronously moments before scheduling it, especially on the very
    // first frame. This drove the actual production crash: a negative
    // elapsed time produced a negative array index, which silently evaluates
    // to `undefined` in JS instead of throwing where the index was computed.
    let latestApi: UseGameSessionResult | null = null
    render(
      <StrictMode>
        <Harness onReady={(api) => (latestApi = api)} />
      </StrictMode>,
    )

    const nowSpy = vi.spyOn(performance, 'now').mockReturnValue(1000)
    act(() => {
      latestApi!.throwBoule({ direction: { x: 0, y: 1 }, power: 0.6 })
    })
    nowSpy.mockRestore()

    expect(rafQueue.length).toBeGreaterThan(0)
    const firstCallback = rafQueue[0]
    rafQueue = []
    expect(() => act(() => firstCallback(999.5))).not.toThrow()

    expect(() => flushAllAnimationFrames()).not.toThrow()
  })

  it('renders through a whole session (3 ends) of straight, colliding throws with no draw crash', () => {
    let latestApi: UseGameSessionResult | null = null
    render(
      <StrictMode>
        <Harness onReady={(api) => (latestApi = api)} />
      </StrictMode>,
    )

    for (let throwNum = 0; throwNum < 9 && !latestApi!.isComplete; throwNum++) {
      act(() => {
        latestApi!.throwBoule({ direction: { x: 0, y: 1 }, power: 0.6 })
      })
      expect(() => flushAllAnimationFrames()).not.toThrow()
    }
  })
})
