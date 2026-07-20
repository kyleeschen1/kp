# Semantic reader current baseline

Date: 2026-07-20

Run contract: `run-contract.kp.reader.semantic-document-convergence-v0`

Slice: `s01`

## Purpose

This is the reproducible preservation baseline for the `x + 3 = 7` learner story before the semantic document reader convergence changes its compiler, clock, hydration, or DOM-rendering boundaries.

The repeatable harness is `npm run baseline:semantic-reader`. It builds on the production output, starts an isolated Vite preview, loads the canonical concept route with Playwright, records its actual loaded asset closure, observes the story player's progress mutations, and captures interactive and JavaScript-disabled screenshots under `tmp/codex/semantic-reader-current-baseline/`.

Disposable screenshots and JSON remain under `tmp/codex`; this committed report and the repeatable command are the durable evidence.

## Observed baseline

| Measure | Current result |
| --- | ---: |
| Initial HTML | 325 bytes |
| Lesson heading present in initial HTML | no |
| JavaScript-disabled body text | 0 characters |
| JavaScript-disabled headings | 0 |
| JavaScript-disabled links | 0 |
| Loaded production assets | 36 |
| Loaded JavaScript and CSS | 1,188,286 bytes raw |
| Loaded JavaScript and CSS | 309,171 bytes gzip |
| Observed beat transition | 648.7 ms |
| Observed intermediate progress samples | 36 |
| Progress after an additional small scroll | 0.333, unchanged |

The route loaded these editor-oriented chunks:

- `animation-player-controller-DJn1_Ev4.js`
- `animation-player-shell-Bw9Z6vsf.js`
- `equation-surface-adapter-D-SYsQdg.js`

No Three.js asset was loaded by the route. Earlier audit language that grouped Three.js with the current story's immediate dependency closure was directional and is corrected by this measured production-route evidence. The repository still builds a separate `graph-webgl-three` chunk, but the equation story does not fetch it.

## Motion interpretation

The current story is not missing all intermediate animation frames. Moving from `read-equality` to `subtract-both-sides` produced 36 distinct intermediate progress values over approximately 649 ms.

The interaction deficiency is clock ownership:

1. Crossing the prose trigger begins a time-driven seek to `0.333`.
2. The seek supplies intermediate frames for a fixed duration.
3. Further ordinary scrolling leaves progress at `0.333`.
4. The learner therefore cannot slow, stop, inspect, or reverse the transformation by controlling scroll position.

This baseline distinguishes the required convergence change from an animation-engine rewrite. The existing semantic sampler and DOM player do animate; the reader needs a continuous local scroll clock and a smaller rendering boundary.

## Visual interpretation

The interactive capture confirms the intended two-column reading order, left prose, sticky right equation stage, quiet paper surface, semantic salience, and smaller equation scale. Those are preservation requirements.

The JavaScript-disabled capture is entirely blank. The convergence compiler must turn the canonical route into a readable document without changing the semantic asset source of truth.

## Existing checks

The baseline slice passed:

- `npm run typecheck`
- `npm run build`
- `npm run baseline:semantic-reader`
- `npm run perf:linear-equation` — 3 browser performance/audit tests
- `npm run visual:linear-equation` — 39 named visual states
- `theseus workspace validate`

The production build continues to warn about a built Three.js chunk above 500 KB. That warning is outside this equation-route baseline because the chunk is not loaded here; WebGL package and canvas policy remain deferred until the approved later exemplar.

## Preservation and improvement targets

Preserve:

- canonical semantic animation IDs and transformations;
- two-column left-to-right reading order;
- ordinary document scrolling;
- current route, URL, provenance, and focus contracts;
- zero WebGL contexts for the equation route;
- current stable stage geometry and responsive behavior.

Improve:

- initial HTML from an empty app root to a complete searchable lesson;
- JavaScript-disabled output from blank to readable prose and static math;
- clock ownership from a 649 ms triggered seek to continuous reversible local scroll progress;
- learner dependency closure by removing editor player/controller/surface chunks;
- JavaScript and CSS route cost toward the provisional 100 KB gzip equation-exemplar budget.
