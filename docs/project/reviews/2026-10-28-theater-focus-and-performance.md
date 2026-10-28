# Theater focus candidate and performance audit

The behavior-first scope is recorded in
[the approved proposal](../2026-10-28-theater-focus-and-audit.md). This review
supersedes the unchanged-opacity/delayed-arrival parts of
[the document-flow candidate](2026-10-28-document-flow-passages.md).

## Local visual candidate

Canonical host: `/reader/solve-fractional-linear/`. Semantic authority remains
`src/semantic/fractional-linear-equation-asset.ts`; existing native KaTeX/material
and legacy introduction paths retain mathematical paint. Only the local reader
shell, scroll adapter, controls and verification change. No catalog promotion.
The behavior commit is the independently reversible rollback unit.

Real document paragraphs approach at 12% opacity. Their tops crossing the stage
workspace's upper boundary drive a 24px smooth focus ramp; the preceding
paragraph fades inversely. Both retain native flow and constant separation
while exchanging. These thresholds are provisional visual choices. Math holds
its result during that exchange; there is no extra blank inspection hold.

One native range below the 82px workspace has a 1px track, 4px thumb and 24px
interaction area. Only explicitly associated operations own it. The local
compiler checks those associations against the semantic transformation sequence;
an unbound comment may retain a result but cannot silently advance an operation.
Invalid or mismatched associations fail at compilation. This is not a new
general-purpose narrative schema. The control dissolves over 24px after the
operation ends and becomes hidden/disabled; reversing restores it. Its exact
interval keeps keyboard input and source-state reload attached to the operation.

Emphasis derives from cached paragraph geometry and scroll position; no new
per-frame bounds reads or independent animation clock. Read all, print and no-JS
show complete prose. Native search uses original paragraphs. The fixed 82px
workspace remains a limitation for future composed scenes.

## Behavior verification

Passed: 11 focused tests for compile-time associations, source/result intervals,
comments between operations, complementary focus, direct/reverse projection,
invalid geometry and existing compiler semantics. Commands:

```sh
node --disable-warning=ExperimentalWarning --test tests/fractional-theater-focus.test.ts tests/fractional-rising-scroll.test.ts tests/fractional-passage-progress.test.ts tests/semantic-reader-fractional-linear-compiler.test.ts
npm run typecheck
npm run check:architecture
npm run visual:fractional-linear-equation -- --rising --base-url=http://127.0.0.1:8000
npm run visual:fractional-linear-equation -- --smoke --base-url=http://127.0.0.1:8000
npm run build:bundle
npm run visual:fractional-linear-equation -- --rising --base-url=http://127.0.0.1:8011
```

Desktop/phone checks cover focus reversal, fixed paragraph separation, slider
placement and ownership, click/drag/keyboard, reflow, native find, transcript,
release and static/print fallbacks. The 41-sample equation-paint smoke has zero
failures. The production preview also passes the focused behavior check.
Phone crossfade capture inspected: text still crosses the held equation during
arrival. Whether the focus threshold makes that overlap comfortable needs human
judgment; passing checks do not establish aesthetic quality.

## What to inspect

Open `http://localhost:8000/reader/solve-fractional-linear/`. Choose **Steps →
Multiply both sides by two**. Scroll through the operation: its slider sits
below the equation, dissolves after completion, and the next paragraph enters
from below. At the stage boundary it should rapidly come into focus while the
old paragraph fades. Reverse through that exchange, try the slider, then use
**Read all** or Cmd+F for **The same x remains**. The introductory observation
has no slider. Judge the threshold, translucency and prose/math overlap.

## Performance audit

The stable diagnostic now includes frame attribution, a sampled CPU profile,
cold/repeated/near/far TOC jumps, and direct mid-operation URL loads:

```sh
npm run visual:fractional-linear-equation -- --performance --base-url=http://127.0.0.1:8000
node node_modules/typescript/bin/tsc --project tsconfig.node.json --noEmit
```

Both pass. The first tools type check caught missing array annotations in the
new harness; those were corrected and the check rerun. No renderer optimization
or cache activation was made. Audit tooling is not included in reader payload.

### Measurements and their limits

Two local Vite/headless Chromium diagnostics agree on traversal counts. Each
uses four full forward/back cycles, 121 requested scroll samples per cycle,
plus 3-second idle windows. The second run's counts are below. These are
instrumented development measurements with a CPU sampler, not production,
low-end-device, sustained-memory, or before/after speed certification. A nearby
tools type check also makes these unsuitable as controlled timing benchmarks.

| Measurement | Before traversal | After four cycles | After idle |
| --- | ---: | ---: | ---: |
| Prose bounds reads | 42 | 42 | 42 |
| Beat-container bounds reads | 28 | 28 | 28 |
| Scroll-geometry rebuilds | 4 | 4 | 4 |
| All bounds reads | 519 | 25,657 | 25,657 |
| Browser layouts | 76 | 9,167 | 9,167 |
| Canonical session builds | 0 | 53 | 53 |

The last three cycles each add **6,160 bounds reads, 2,237 layouts, and 13
canonical builds**. Across 484 sampled frames, 53 contain a build; those frames
account for 23,973 of 25,138 incremental bounds reads (**95.4%**). A bounds read
does not always force layout, and these are whole-page counters. The harness
adds no bounds reads while collecting frame counters.

Recorded synchronous build time totals 1,814ms, with a **35.4ms median** and
68ms maximum; the first run gave 35.2ms and 64.4ms. The non-build frame interval
95th percentile was 17.6ms in both runs. Overall cycle 95th percentiles were
about 33ms, with occasional 50–67ms intervals. Frame timestamps and synchronous
build timing have different boundaries; do not add them or assign every delayed
frame exclusively to its same-row build.

The sampled CPU profile supports the count attribution: about 2,349ms of the
2,992ms sampled under `renderSample` was inside canonical session `apply`,
including about 1,233ms under session creation. These are overlapping inclusive
samples, not additive CPU budgets. Material synchronization/cloning, computed
style copying, native ink measurement and protected transit preparation are
substantial descendants. The prose loop is not the dominant measured cost.

Retained DOM nodes stabilize at 2,368 after the first cycle. Forced-GC JS heap
stays around 11.6–11.9MB during the four cycles and is unchanged during final
idle. This does not measure GPU/native allocations or explain the earlier tab
crash. Development loading was about 250 resource requests / 5.36MB decoded;
that includes Vite modules and instrumentation and is **not shipping payload**.

### Direct narrative jumps

Mutation recording checks every old and final progress attribute, including
synchronous changes; it does not merely inspect the destination screenshot.
All six TOC jumps contain only their source and requested destination. Four
fresh-reader URL loads at 233, 750, 917 and 750 also contain only initialization
and their requested progress. The earlier equation smoke checks direct/scroll
paint equivalence. There is no observed intermediate-state replay.

| TOC action | Session builds | Bounds reads | Layouts | First observed frame |
| --- | ---: | ---: | ---: | ---: |
| Cold far jump: 0 → 833 | 1 | 480 | 162 | 59.5ms |
| Far return: 833 → 0 | 0 | 0 | 15 | 33.9ms |
| Repeat: 0 → 833 | 0 | 0 | 3 | 16.0ms |
| Near return: 833 → 667 | 1 | 464 | 150 | 50.4ms |
| Near forward: 667 → 833 | 1 | 480 | 160 | 48.8ms |

These single-run frame timings include preparation and scheduling; they are not
precise input-to-display latency. Dispatch itself was below 2ms. The first cold
jump spent 54.1ms in the destination build. A long jump can be cheap when the
existing canonical session survives the intervening legacy state; a short jump
can rebuild when another canonical transition has replaced it. Distance along
the narrative is not the main cost in this example.

Fresh mid-operation URLs each built two canonical sessions, with roughly
34–78ms total synchronous preparation and 1,027–1,521 bounds reads. This suggests
startup invalidation/readiness deserves investigation, not that each earlier
operation was replayed. Exact rebuild reasons were not instrumented in this
slice. “Cold” here means a fresh reader instance, not an empty HTTP/module cache.

### Responsible boundaries and recommended next work

1. **Separate preparation invalidation from presentation updates.**
   `reader-canonical-equation-session.ts` has one active session; its key includes
   `presentationRevision`. In `exemplar-entry.ts` that revision includes active
   beat and semantic focus. A changed key retires/rebuilds the session, observes
   endpoints, recompiles a pure plan and recreates material. Repeated builds at
   checkpoint progress and fresh-URL double builds are measured; precisely
   attributing each key change is the first repair step. Do not simply remove
   focus from the key: it currently protects real native paint changes.
2. **Reuse validated preparation, with bounded lifetime.** Immutable measured
   endpoint geometry and protected-transit plans are promising reuse units;
   fresh ownership still has to attach correctly. Reuse needs exact content,
   font, width, layout and paint identities, eviction, and tests for reversal,
   resize, cancellation and disposal. This caller has zero pure-plan cache hits
   and adjacent prewarms; `exemplar-entry.ts` enables those only for fraction
   composition. The existing opt-in cache is not evidence that flipping it on
   is safe here: the preceding reader experiment broke reverse geometry.
3. **Reduce repeated clone preparation after fixing invalidation.** Native
   material creation copies complete computed style trees and checks measured
   ink. Eliminate unnecessary repeats before replacing that mechanism. The
   [October 21 experiment](2026-10-21-computed-style-preparation.md) already found
   that fewer CSSOM writes alone did not demonstrate a reader speed gain; do
   not repeat that optimization based only on this profile's style-copy rows.
4. **Scale startup separately from seeking.** `measureLayout` supplies all
   `transitionElements` to `measureKpCanonicalEquationStageLayout`, which iterates
   the transition set. The current reader also constructs the lesson's plans
   up front. Direct seeking avoids replay, but whole-lesson preparation is not
   yet demand-driven. For long documents, prepare a destination and a bounded
   neighborhood, with explicit dependency closure and stable footprint contracts.
   This audit of seven passages does not establish constant-cost arbitrary jumps.

Before shipping a performance repair, compare uninstrumented production runs on
the same complete reader, with cold/warm and constrained-CPU cohorts. Keep the
existing paint-equivalence, native ownership and reverse checks. The measurable
target is fewer rebuilds and lower preparation latency, not fewer checks or a
new animation style. These are recommendations for the next scope, not changes
silently included in this candidate.
