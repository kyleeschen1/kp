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
