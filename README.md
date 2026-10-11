# Algorithm Visualizer — From Problem Statement to 3D Execution

An educational tool: paste a DSA problem (or source code), it gets parsed into a structured
representation, run through a real algorithm engine, and the actual execution trace drives
a 2D/3D visualization — nothing is a canned animation for a fixed example.

## What's actually implemented

| Algorithm | Strategies | Visualization |
|---|---|---|
| Fibonacci | recursion, memoization, tabulation | recursion tree (with live cache-hit markers) / 1D DP row |
| Coin Change (min coins) | tabulation, greedy | 1D DP row + 3D / greedy decision path |
| 0/1 Knapsack | tabulation | 2D DP grid + 3D |

Change the numbers in the input, and the whole trace — and therefore the whole
visualization — regenerates from scratch. Nothing is hardcoded per-example; see
`src/_smoketest` logic (removed from the final build, but every algorithm module is pure
and independently testable) for the correctness checks this was built against, including the
coin-change case where **greedy is demonstrably worse than DP** (coins `[1,3,4]`, target `6`:
DP finds a 2-coin solution, greedy gets stuck needing 3) — exactly the kind of divergence
the "DP vs Greedy" comparison mode is meant to make visible, not just assert.

LCS, Activity Selection, and Fractional Knapsack are registered in
`src/metadata/algorithmRegistry.ts` with `implemented: false` — the UI lists them as
"coming soon" rather than pretending they work. Adding a real one is: write
`src/algorithms/<id>/index.ts` implementing the `AlgorithmModule` interface, add one
registry entry, done — no visualizer or UI code needs to change.

## Important honesty note on the "AI Parser"

Section 4 of the spec calls for an "AI Parser." This is a **frontend-only** project with no
backend or API key, so `src/ai/parser.ts` is a genuine, working, but deliberately simple
**regex-based extractor** — it reliably parses phrasings like "coins [1,3,4] and target 6"
or "weights [2,3,4], values [3,4,5], capacity 5," but it is not a general NLP/LLM system and
won't understand arbitrary phrasing or arbitrary pasted source code.

The architecture is built so this is a one-function swap, not a rewrite: `parseProblem()`
returns a `ProblemRepresentation`, which is then checked by `validateProblemRepresentation()`
before anything touches an algorithm engine. Replace the body of `parseProblem` with a call
to an LLM that returns the same JSON shape, and everything downstream — validation, the
algorithm engines, every visualizer — keeps working unchanged. When the input isn't
recognized, the UI never silently guesses: it shows "unable to confidently identify a
supported algorithm" and offers a manual algorithm + input picker (spec section 17).

## Architecture (spec section 19/20)

```
src/
  ai/            parser.ts (recognizer), schema.ts (builds ProblemRepresentation),
                 validator.ts (runtime guardrail before the algorithm engine runs)
  algorithms/    one folder per algorithm; each exports {code, generateTrace, recognize}
  engine/        types.ts (the shared contract everything else depends on),
                 stepManager.ts (play/pause/next/prev/speed — a React hook)
  metadata/      algorithmRegistry.ts — single source of truth for complexity,
                 dimensions, which visualizer to use, supports3D, etc.
  visualizers/   dp/DPGrid2D, threeD/DPGrid3D, recursion/RecursionTree, greedy/GreedyPath
                 — none of these know which algorithm produced their data
  components/    ProblemInput, CodeViewer, ControlPanel, AlgorithmInfo, ExplanationPanel
  pages/App.tsx  wires it all together
  utils/deriveSnapshot.ts  folds trace steps into the "current state of the world"
                 that every visualizer renders from — this is what keeps 2D, 3D, and
                 the explanation panel always in sync with each other
```

The execution trace (`ExecutionTraceStep[]`, in `engine/types.ts`) is the one format every
algorithm module produces and every visualizer consumes — that's what lets `DPGrid2D` render
Fibonacci's tabulation *and* Coin Change *and* Knapsack with zero per-algorithm branching.

## Setup

```bash
npm install
npm run dev       # http://localhost:5173
```

I couldn't run `npm install` or a live build in the sandbox this was built in (no network
access there), so every file was syntax-checked with esbuild, and the entire parser +
algorithm-engine logic (not just syntax — actual runtime correctness, including the
greedy-vs-DP divergence) was executed and verified with `tsx`. The UI layer itself
(React Three Fiber scene, Tailwind layout) hasn't been visually rendered — if something
looks off on first `npm run dev`, it's most likely a minor styling tweak, not a logic bug.

## Try it

1. Paste: `Given coins [1,3,4] and target 6, find the minimum number of coins.`
2. Press play — watch the DP row fill in, left to right.
3. Switch the strategy dropdown to `greedy`, or check "DP vs Greedy" — watch greedy get
   stuck needing one more coin than the optimal answer.
4. Paste: `Given weights [2,3,4], values [3,4,5] and capacity 5, find maximum value.`
   Switch to 3D — rotate, zoom, click a block to see its formula and dependencies.
5. Paste: `Find the fibonacci number for n = 10.` with strategy `recursion` — watch the full
   exponential call tree. Switch to `memoization` — watch repeated calls short-circuit as
   cache hits instead of recursing again.

## Not built yet (honest scope note)

Code-line highlighting is wired for Fibonacci, Coin Change, and Knapsack's own algorithms
(`codeLine` is attached to every trace step and `CodeViewer` reacts to it), but LCS,
Activity Selection, and Fractional Knapsack are metadata-only stubs. Framer Motion was
intentionally left out in favor of plain CSS transitions, per the spec's own "avoid
unnecessary dependencies" guidance — add it back if you want spring physics on top of what's
here.

## AlgoStudio UI + Coach upgrade

The upgraded interface adds a responsive dark/glass visual workspace, a study-coach panel with browser voice input (where SpeechRecognition is supported), quick prompts for greedy-vs-DP and memoization-to-tabulation, and a 3D view toggle for supported two-dimensional DP problems.

### Coach behavior

The UI tries `POST /api/coach` with `{ question, problemType, input, strategy, currentNote }`. Keep model/API credentials on your server, not in Vite environment variables. If that endpoint is not configured, it falls back to built-in learning guidance and tells the user that local guidance is active; it is not pretending to be a live LLM.

### Run locally

```bash
npm install
npm run dev
```
