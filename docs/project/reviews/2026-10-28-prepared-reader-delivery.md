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
