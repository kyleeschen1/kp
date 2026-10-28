# Prepared reader delivery evidence

Scope: [approved continuation](../2026-10-28-prepared-reader-delivery.md).
Baseline: `2753589c3`, canonical fractional reader. The preceding pass did not
substantially change normal-speed tail-frame intervals; perceptible preparation
stalls, not aggregate counts alone, are this run's acceptance target.

## Static publication experiment

Existing production HTML already contains annotated KaTeX states. Browser work
includes semantic asset construction, geometry-independent render/material
plans, and DOM-dependent measured plans. The latter are not static HTML work.
Some motion plans carry nominal, runtime-verified authority; JSON cannot restore
those objects by cast without violating existing checks.

A candidate published the complete fractional semantic asset as a deeply frozen,
contextually typed TypeScript data artifact. A build freshness gate compared it
with the authoritative constructor; semantic, rewind, compiler and 41-frame
browser checks passed, as did app types and architecture. The generated source
was 49,720 readable bytes; existing verified motion constructors were retained.

Eight isolated production cohorts per variant used the existing command:
`npm run visual:fractional-linear-equation -- --production-performance --label=prepared-baseline --base-url=http://127.0.0.1:8011`
and the same command with `--label=static-candidate`, after its production build.
Actual requested assets grew from 912,567 raw / 302,165 gzip bytes to
940,684 / 304,471 (+28,117 / +2,306). Layout counts were unchanged: 3950/3944
desktop at 1x/4x CPU and 3437/3431 phone. Unthrottled p95 remained about 33.3ms.
No reliable traversal gain was established; the candidate and its generation
machinery were removed. Source-plan compiler dependencies remain necessary for
other runtime responsibilities, so static asset data alone duplicated cost.

Do not repeat this asset-only substitution as a speed claim. More extensive
ahead-of-time motion publication needs an actual typed publication/rehydration
boundary and complete-consumer accounting; forcing nominal plans through JSON
is not an acceptable shortcut. This result prioritizes reusable browser
preparation, which addresses the measured active-motion bottleneck directly.

## Focus paint and geometry

The fractional and division descriptors explicitly declare native color-only
focus. Their geometric session key excludes that color revision; the existing
material owner projects native colors onto its inert source/target clones.
Typography, transforms, presence and opacity keep their existing owners. Native
CSS color interpolation is sampled by the reader host for only its active
interval, with cancellation on retirement. The renderer introduces no clock.

The four-cycle development diagnostic now builds 25 sessions rather than 53;
all 28 focus-only rebuilds disappear. Bounds reads fall from 25,102 to 11,604,
layouts from 7,825 to 4,064. This is instrumented development evidence, not a
production latency claim. Full production comparison follows integration.

Checks: architecture and app types; division focus/resize/disposal canary;
native color projection through focus and reversal in Chromium, Firefox and
WebKit (including nested SVG paint, no bounding reads, stable geometry/identity).
The first color test exposed host stylesheet loading during its snapshot; it
now waits for host readiness. Architecture rejected a renderer-local RAF; the
reader host now owns the bounded scheduling. No authority gate was weakened.

## Bounded prepared replay

Native-color readers retain at most four prepared transitions including the
active one. Parked sessions sit at a native endpoint inside their hidden host;
exact keys include plan, presentation geometry, motion mode, font, typography,
layout revision, dimensions and pixel ratio. Surface identity must also match.
Eviction and disposal retire paint; layout remeasurement retires the whole pool.
The pressure test caught missing whole-layout retirement on resize; the repair
is at the host's measurement boundary, before any new observation is published.

The diagnostic falls to four builds total across four full traversal cycles,
with zero warm rebuilds, 3,120 bounds reads and 1,848 layouts. Instrumented warm
p95 is approximately 17.5ms (individual maxima still about 33–34ms). Heap and
DOM increase modestly because four preparations replace one; complete production
resource accounting remains an integration gate.

`npm run visual:fractional-linear-equation -- --preparation --base-url=http://127.0.0.1:8000`
checks 12 forward/reverse cycles, exact visible glyph identity and geometry at
four operation interiors, four-layer maximum, all-layer retirement on resize and
font invalidation, and complete pagehide disposal. The 41-point smoke, app/test/
script types and architecture also passed. This does not activate the older
measured-scene/pure-plan cache for this family.

## Bounded advance preparation

The same builder can prepare one hidden neighbor after 120ms without foreground
updates, only when requestIdleCallback reports more than 45ms. Browsers without
that facility keep synchronous first use. No timeout forces a missed idle budget.
Width, height, font, layout ownership and disposal invalidate queued work. Once
a preparation exceeds 45ms, this mounted reader stops speculating. Idle budgets
are advisory: the first cold preparation can still exceed them (about 65ms in
one instrumented run); this is not cooperative or interruptible compilation.

Prepared material must inherit normal visibility while its inactive host retains
zero opacity. The cold/warm smoke comparison caught frozen hidden glyphs in the
first candidate; the shared preparation boundary now samples normal subtree
visibility under a verified zero-opacity host and restores it in a finally block.
No visible or accessible ownership changes during that work. The pressure harness
forces an idle opportunity to prove this path actually executes, then checks all
12 reversal cycles and lifecycle invalidations. Performance measurements retain
real browser idle budgets. The queue's unit checks cover insufficient budget,
timeout, foreground activity, stale geometry and cancellation (8 passed).

The 41-point cold/warm smoke, full types, architecture and production build pass.
The direct-jump assertion now separates the one destination build from explicitly
counted hidden-neighbor builds; it still forbids replay of skipped states.

## Reliability, loading and explicit budget amendment

The real-page pressure run covers 96 operation-interior revisits after warmup,
bounded DOM, unchanged realized glyph identity/geometry, whole-pool resize/font
retirement and pagehide disposal. The performance diagnostic separately proves
no continuing layout or geometry reads after settling and no intermediate-state
replay on TOC/URL jumps. This does not reproduce or explain the earlier tab crash;
forced-GC JavaScript heap excludes browser-native and GPU allocations.

Two stale baseline browser expectations were repaired without changing visuals:
division navigation now resolves the Catalogue's registered canonical host,
rather than a removed home-page review shortcut; cancellation checks actual
motion through the verified cohort rather than requiring eight vertical pixels
at one sample. The shared route planner explicitly supports above/below and
left/right routes. The updated three-test navigation/motion/lifecycle canary passes.

**Still open:** `equation-canonical-cross-surface-parity.browser.spec.ts` expects
equal raw font sizes across editor and reader. Actual settled native glyphs are
19.2px and 23.232px (ratio 1.21), unchanged from the independently reproduced
baseline. That assertion remains intact and failing. Choosing the cross-host
type policy would change presentation outside this preservation task; it is not
hidden by a relaxed tolerance. All 17 shared reader conformance tests pass.

The route-budget gate exposed older publication/style growth. Attribution found
the fractional document-flow CSS in every shared reader closure. It now loads
only through the fractional stylesheet; compiler regressions protect both that
route and the ordinary solve-x route, and desktop/phone document behavior passes.
Distribution-area entry closure drops from 16,953 to 15,597 gzip bytes; quadratic
branching drops from 16,600 to 15,230 and needs no baseline amendment. Ordinary
equation-reader entry closures save 1,377 gzip bytes. No content or consumer was
removed to meet a budget.

Under the standing engineering-budget authority, two explicit baselines change:
fractional published HTML 64,003 raw / 5,836 gzip → 69,395 / 6,603, accounting for
the already accepted real document prose and static theater shell; and
distribution-area entry closure 14,823 → 15,597 gzip after removing the unrelated
CSS. Its residual 32-byte breach of the old 15,565 ceiling is not addressed by
minifying source or deleting behavior. The normal 5% headroom remains; all other
baseline values and forbidden-asset checks remain unchanged. These are policy
amendments, not optimization claims. Complete observed reader assets are also
measured below because the static entry-closure gate alone excludes lazy loads.

## Integrated production comparison

Commands: `npm run build:bundle`, then
`npm run visual:fractional-linear-equation -- --production-performance --label=integrated --base-url=http://127.0.0.1:8011`.
Same eight cohorts as `prepared-baseline`: fresh Chromium contexts, 1280×900 and
390×844, 1×/4× CPU, two repeats each, cold/warm navigation and two forward/reverse
traversals. Compiler/browser test jobs had finished before measurement. No CPU
profiler or forced GC during traversal. These are local diagnostic comparisons,
not device certification or a statistical loading-time guarantee.

| View / CPU | Baseline p95 ms | Final p95 ms | Final scripting seconds | Scripting reduction | Final layouts |
| --- | --- | --- | --- | --- | --- |
| Desktop / 1× | 33.3 / 33.3 | 17.6 / 17.6 | 0.540 / 0.546 | 52.8% | 993 / 993 |
| Desktop / 4× | 149.6 / 149.9 | 17.6 / 17.7 | 1.720 / 1.791 | 58.4% | 993 / 993 |
| Phone / 1× | 33.3 / 33.4 | 17.6 / 17.6 | 0.665 / 0.696 | 45.8% | 606 / 606 |
| Phone / 4× | 133.3 / 133.6 | 17.6 / 17.7 | 1.614 / 1.464 | 64.1% | 666 / 654 |

Scripting percentages compare means of both repeats. Baseline layouts were
3,950/3,944 desktop and 3,437/3,431 phone. Frames over 50.1ms fall from 33–35 to
9 under 4× slowdown. **Worst frames still reach 166.5–200.2ms under slowdown**;
unthrottled maxima are 33.3–50ms. Thus the common path is substantially smoother,
but first-use preparation is still a long synchronous task and p95 alone would
overstate its elimination. Preparing a new transition remains the next bottleneck.

The complete requested asset union remains 95 files: 917,247 raw / 303,843 gzip
bytes, versus 912,567 / 302,165 baseline (+4,680 / +1,678). This includes lazy
JavaScript, CSS and actually requested fonts; gzip is measured per local file,
not the preview server's wire encoding. Published HTML is accounted separately
above. Retained JS heap after GC is 5.57–5.64MB and 2,469 DOM nodes, versus about
5.36–5.69MB and 2,334 nodes. The usual roughly 0.2MB/135-node increase buys bounded
prepared replay. Native/GPU memory and an unreproduced crash remain outside that
measurement. No loading-latency percentage is claimed from these short local runs.

Validated integration includes full types and Svelte checks; architecture;
equation-surface preservation (11), reader runtime hardening (25), native glyph
compositor units (82), compiler/budget units (9), reader conformance (17),
cross-browser clone/color projection (18), native compositor release (6),
cross-browser native preparation (6), the 41-point fractional smoke,
production closure and all 12 route budgets, and dev-review exclusion. The
canonical desktop/phone document-flow check preserves search, real prose, slider
association, reversal, font reflow, Read all, static reading and print. The
remaining baseline cross-host typography assertion is disclosed above.

The final `--compare-themes` check passes all 34 dark/paper samples. Its stylesheet
override follows the newly scoped fractional sheet. Idle preparation can produce
different hidden-neighbor populations between runs, so the comparator now first
asserts zero effective opacity for every inactive transition, then compares all
current-presentation glyphs (including invisible current owners). Non-color
paint and geometry comparisons remain exact. This corrects a cache-population
comparison, not a visual mismatch; script type checking also passes.

## Remaining invalidation categories

The user asks whether preparation is still invalidated needlessly. Confirmed
unnecessary focus and revisit rebuilds are removed for the declared color-only
readers. Ordinary progress, reversal and direct jumps apply prepared frames;
plan/content and motion-policy changes select a different preparation key.
Capacity eviction and page disposal deliberately release resources rather than
claiming those preparations became stale.

Layout invalidation remains conservative. `exemplar-entry.ts` observes both the
viewport and story; after the first notification, either resize requests layout
refresh. `measureLayout` retires all active and retained sessions before publishing
new measurements. A prose-only story resize can therefore discard equation
preparation even if its metrics did not change. `equation-font-readiness.ts`
publishes every document font-loading completion, without filtering by the fonts
used in the equation. The scheduler coalesces notifications before a frame, but
does not prove a geometry change before advancing the measurement revision.

These are source-confirmed broad invalidation paths, not measured attribution
of the remaining cold stalls. A next investigation should separate document
scroll geometry from equation geometry and record actual invalidation causes.
Preserve full retirement when mathematical metrics or layout ownership change;
matching outer width/height alone does not prove unchanged internal glyph layout.
Reducing unnecessary invalidation prevents repeated cold work; it does not make
the first preparation cheaper. No new invalidation policy is implemented here.

## Inspection and next boundary

Open `http://localhost:8000/reader/solve-fractional-linear/`. Scroll through the
solve, reverse through multiplication and cancellation, then repeat that section.
The existing equations, colors, passage timing and choreography should remain;
focus changes and repeat traversal should avoid preparation pauses. Jump through
Steps, resize once, and try Cmd+F/Read all to check preserved reading behavior.
The division reader is the second color-only caller; unrelated families retain
their own preparation policy.

The next performance investigation should target the four cold builds: batched
material-clone capture and typography preparation, or a verified publication
boundary for geometry-independent instructions. Asset-only static substitution
was rejected here. Do not activate the old measured-scene cache, replace native
KaTeX, or promote this capability to arbitrary salience/layout mutations without
new ownership and geometry evidence. This delivery does not implement the
historical derivation trail or settle the separate cross-host typography policy.
