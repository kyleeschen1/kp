# Reader performance delivery evidence

Scope: [approved delivery](../2026-10-28-reader-performance-delivery.md).
Canonical page `/reader/solve-fractional-linear/`; current mathematical semantics,
choreography and prose are the preservation baseline. Runtime baseline is
`dfffc83f9` (production assets retain the preceding behavior commit).

## Production baseline

Command: `npm run visual:fractional-linear-equation -- --production-performance --label=baseline --base-url=http://127.0.0.1:8011`.
Production preview, fresh Chromium contexts at 1280×900 and 390×844, CPU1×/4×,
two repetitions each. Each context measures cold and warm navigation, then two
forward/back traversals with 242 requested samples. No CPU profiler, prototype
instrumentation or forced GC during motion. Retained metrics use GC afterward.
CPU slowdown is a diagnostic, not phone certification; local loading lacks
network latency. Two repeats are not a statistical performance guarantee.

| View / CPU | Traversal scripting seconds | Layouts | Frame p95 ms |
| --- | --- | --- | --- |
| Desktop / 1× | 1.575 / 1.291 | 4617 / 4617 | 33.4 / 33.4 |
| Desktop / 4× | 5.475 / 5.400 | 4593 / 4593 | 167.7 / 167.0 |
| Phone / 1× | 1.354 / 1.355 | 4134 / 4134 | 33.4 / 33.5 |
| Phone / 4× | 5.055 / 4.264 | 4116 / 4116 | 150.0 / 117.5 |

Cold readiness samples: desktop 1× 735/339ms, 4× 668/853ms; phone 1×
423/250ms, 4× 570/566ms. Warm: desktop 1× 260/168ms, 4×339/302ms;
phone 1×181/143ms, 4×308/290ms. Readiness is the font-stable host-ready mutation,
not networkidle. Cold first process/JIT startup differs from later fresh contexts.

Observed asset union: 93 JS files 859,469 raw / 254,956 gzip bytes; one CSS file
55,881 / 13,801; three WOFF2 fonts 47,920 raw. Gzip is calculated per local file,
not the preview's actual content encoding. Declared but unused fonts are omitted.

## Invalidation diagnosis

`npm run visual:fractional-linear-equation -- --performance --base-url=http://127.0.0.1:8000`
passes measurement-idle and no-replay guards. New bounded reason counters show
53 builds in four cycles: initial 1, transition/render/material changes 24 each,
presentation changes 40 (categories overlap). Thus 28 builds do not change the
mathematical transition. Fresh mid-operation URLs at 233/750/917/750 each build
twice: initial then measurement-revision change. These instrumented development
counts diagnose causes; their timings are not the production baseline.

App and tools TypeScript checks pass. All instrumentation retains existing
rendering behavior. Subsequent sections record candidate results and safeguards.

## Preparation and startup

Retained changes: a paint-derived presentation key; source/target clone reuse
inside the existing session-owned material layer; synchronous batching of
independent native text measurements during typography compilation; suppression
of the initial ResizeObserver refresh only when its viewport was already measured
at the same dimensions. All later notifications still invalidate, as do fonts.
No pure-plan or cross-session measured-scene cache was enabled for this reader.

The first hypothesis did not produce a gain: dropping narrative identity alone
still gave 53 builds, because the passages actually change semantic focus.
Those legitimate invalidations remain. After the retained preparation changes,
four instrumented development traversals had 7,825 layout passes (baseline 9,167),
25,102 bounds reads (25,657), and unchanged 53 builds. These are diagnostic counts;
production timings are reserved for the final comparison. Four fresh semantic
URLs now each build once instead of twice, with an executable assertion. The
observer trace showed only initial delivery, not a real size change.

Validation: 41-sample fractional smoke; desktop/phone rising-document preservation
(reversal, font reflow, slider, find, Read all, print/static); native preparation
checks on Chromium, Firefox and WebKit (6); native glyph compositor units (82);
focus identity units (4); app/tools TypeScript; architecture gates. A new division
reader test proves bounded per-owner source/target copies, reuse while scrubbing,
and retirement on focus, resize and disposal via
`npm run visual:cancellation -- --grep 'divide-both-sides preparation'`.
Its initial test range crossed a genuine narrative-focus boundary; the test was
corrected to stay inside one focus interval, with explicit invalidation tested
separately. An initial TypeScript inference error was repaired without a cast;
the subsequent app/tools checks passed.

## Unchanged frames

The reader now separates continued prose scrolling from equation repainting.
One last-successful-frame identity includes exact (unrounded) progress, motion,
focus revision, font revision, narrative/attention identity and measured layout.
Only identical mathematical frames reuse existing paint. Changed geometry,
direction, focus and settings still render; failed frames never publish reuse.
Unchanged passage attributes and status text also avoid DOM replacement.

The four-cycle diagnostic applies the canonical compositor 196 times instead of
332 (41% fewer), with the same legitimate 53 preparations. Layout count remains
7,825: preparation, rather than the remaining sampling work, still dominates.
A trial batching material-clone normalization did not reduce this workload's
counts and was removed instead of adding another optimization path.

Frame identity units include sub-permille changes and every presentation input.
The division browser canary additionally proves repeated identical seeks do not
apply the compositor. Fractional smoke (41) and full rising-document preservation
pass, as do app/tools types and native glyph compositor units. Timings from the
instrumented run are not used as a production speed claim.

## Loading

Phase-name metadata now lives in a dependency-free leaf; all five original
choreography modules re-export the same values. The motif catalog no longer
loads their implementations just to construct its phase inventory. A runtime
import-closure test guards this boundary, while actual choreography tests retain
the original API and behavior. Independent canonical host/adapter imports start
together after descriptor capability selection.

Eight fresh production cohorts (`--production-performance --label=loading`)
observe 91 JavaScript assets instead of 93, with JavaScript decreasing from
859,469 to 808,201 raw bytes and 254,956 to 240,126 gzip bytes. Total observed
assets decrease from 97 to 95 and 963,270 to 912,002 raw bytes. This is a modest
payload gain, not a renderer-family split. Full build, architecture and equation
surface preservation pass; 20 motif/choreography units pass. App/tools types
pass. The full typecheck found a test fixture using `backward` instead of the
clock's `rewind`; that spelling is corrected and the full gate passes in final
integration. No type/bundle ceilings were raised.

## Long-document work and preservation

Passage lookup now uses binary search. Measured focus geometry is compiled once
per layout; ordinarily only the incoming and outgoing neighbors need emphasis
updates. The painter updates the union of previous and current neighbors, so
direct jumps and reversals also reset departed paragraphs. Closely overlapping
crossings retain the original dense calculation exactly. Real paragraph DOM
remains available to native search, accessibility, Read all and print.

`tests/fractional-theater-focus.test.ts` checks the sparse result against the
original dense law over 10,000 passages, reversals, far jumps and overlapping
spans. A 100,000-position lookup uses at most 17 indexed reads. These are bounded
algorithmic guarantees, not evidence that mounting 10,000 real paragraphs or
animations is cheap. Initial layout and intrinsic-height observation still
measure the actual prose. The final desktop/phone `--rising` check passes,
including native reveal, font reflow, sliders, Read all and static/print.

## Broader browser-suite failures

`npm run visual:cancellation` has six passing tests and three failures on the
candidate. A detached checkout at `53f579ec5` (diagnostics only, before runtime
changes) reproduces the same three failures, with five tests passing; the sixth
passing candidate test is the new preparation/lifecycle canary.

| Existing assertion | Baseline and candidate |
| --- | --- |
| Reader/editor final font-size ratio below 1.01 | 1.21 |
| Cancellation inverse centers spread greater than 8px | 5.0625px |
| Editor home exposes “Review division animation” link | Link absent |

The first baseline attempt had blocked fonts because its dependencies were
symlinked outside Vite's serving root; those results were discarded. The valid
rerun allowed only the checkout and shared dependency directory. No source,
typography, choreography or assertion was changed. The isolated configuration
and checkout were removed afterward. These older mismatches remain open; this
delivery neither weakens their thresholds nor claims the whole suite is green.

## Investigated alternatives and remaining boundary

Finer selector-scoped focus keys did not reduce this exemplar's legitimate
session invalidations and were removed. Material-clone normalization batching
also showed no useful gain and was removed. No cross-session measured-scene or
pure-plan cache was activated: reverse geometry and native ownership must remain
correct, and the existing pure-plan route has prior reverse-geometry failures.

Workers do not directly solve the remaining synchronous DOM geometry/style
preparation. Moving pure compilation alone is not justified by these results;
an asynchronous worker protocol would add complexity without removing the
measured dominant browser work. GPU paint cost was not separately profiled, so
this work makes no speculative shadow, opacity or compositing changes.

The next measured performance boundary is separating stable prepared geometry
from genuine focus-paint changes, with proof through the real native/material/
native handoff. The retained 53 preparations in four traversal cycles remain
expensive; skipping them blindly would risk stale geometry or duplicate paint.

## Final production comparison

Command: `npm run visual:fractional-linear-equation -- --production-performance --label=final --base-url=http://127.0.0.1:8011`.
Same eight-cohort protocol as baseline, after the final production build and with
other compiler/browser test jobs finished. Each scripting percentage compares
the mean of two samples, rather than selecting the faster run.

| View / CPU | Final scripting seconds | Reduction from baseline | Final layouts | Layout reduction | Final frame p95 ms |
| --- | --- | --- | --- | --- | --- |
| Desktop / 1× | 1.193 / 1.182 | 17.1% | 3950 / 3950 | 14.4% | 33.3 / 33.4 |
| Desktop / 4× | 4.047 / 4.091 | 25.2% | 3944 / 3944 | 14.1% | 134.1 / 149.3 |
| Phone / 1× | 1.145 / 1.235 | 12.1% | 3437 / 3437 | 16.9% | 33.2 / 33.4 |
| Phone / 4× | 4.240 / 4.301 | 8.3% | 3431 / 3431 | 16.6% | 133.9 / 133.7 |

Across the eight samples, total traversal scripting falls from 25.768 to 21.435
seconds (16.8%). This is a local workload comparison, not a universal speedup.
Unthrottled p95 is essentially unchanged, and throttled runs still have roughly
200ms worst frames. Less work has not yet produced reliably smooth 60fps motion.

Final observed JavaScript is 91 assets, 808,766 raw / 240,367 gzip bytes, versus
93 assets, 859,469 / 254,956 before: 50,703 raw and 14,589 gzip bytes saved
(5.9% and 5.7%). The complete requested asset union is 95 files,
912,567 raw / 302,165 gzip bytes. The long-document optimization adds 565 raw /
241 gzip bytes compared with the preceding loading-only candidate; that cost is
included. CSS and font payloads remain unchanged.

Final cold-ready milliseconds: desktop 1× 819/351, 4×506/470; phone 1×194/185,
4×469/498. Warm: desktop 1×169/183, 4×274/268; phone 1×152/121, 4×299/262.
There is no defensible single startup-latency gain from these short local runs.
The separately asserted elimination of duplicate cold-URL preparation is a
work-count improvement, not a promised loading-time percentage.

After forced GC outside motion, final retained JS heap is 5.36–5.63MB and node
count is 2,334 in every cohort; baseline was 5.41–5.48MB and 2,335. There is no
claimed memory reduction. This bounded two-cycle check excludes native/GPU
memory, long sessions and the user's unreproduced tab crash.

## Final verification and inspection

Passed: full `npm run typecheck`; `npm run check:architecture`;
`npm run test:equation-surface-preservation` (11);
`npm run test:reader-runtime-hardening` (24);
`npm run test:real-katex-glyph-compositor` (82); phase/choreography units (20);
focus/frame identity units; sparse/dense focus units (5); `npm run build:bundle`;
fractional smoke (41) and desktop/phone `--rising` preservation;
`npm run visual:native-preparation` (6 across three engines); and
`npm run test:browser:native-katex-compositor-conformance:release`
(6 across Chromium, Firefox and WebKit). The broader cancellation suite's three
independently reproduced baseline failures remain as recorded above.

Inspect `http://localhost:8000/reader/solve-fractional-linear/`: scroll forward,
reverse around cancellation and multiplication by two, jump using Steps, then
use native find and Read all. The same mathematics, passage timing and native
handoffs should remain. Native-find automation exercises document reveal rather
than the browser's full Cmd+F toolbar; the user previously confirmed Cmd+F.
Production measurements are reproducible through the committed scoped command,
not dependent on retained disposable reports or screenshots.
