# Selected Optional Capability Isolation

Date: 2026-08-02  
Status: implemented and verified in `s23`

## Result

The default animation-catalogue shell no longer imports Graph3D hosting,
Three.js, API-catalog interaction, development diagnostics, or a code
highlighter without a selected caller.

- `graph-webgl-3d` registers the bounded Graph3D surface only for
  `animation.graph.surface-mode.mesh-to-donut`; Three.js remains a second,
  selected-and-visible capability behind that adapter.
- The legacy editor's Graph3D controls and WebGL lifecycle now live in one
  route-lazy controller. Opening the editor loads the controller; approaching
  a mounted rich surface loads Three.js.
- API-catalog selection and preview behavior load only when an editor or
  dashboard caller actually requests them.
- Animation diagnostics load only when the rendered host contains its
  development diagnostics panel. The compact catalogue has no such panel.
- There is no code-highlighting runtime in the current catalogue closure.
  Programming paint remains an honest capability gap until `s26`–`s29` add
  the approved native execution-trace surface.

The small renderer-neutral graph support predicate remains in the default
host so it can decide which capability to request. Semantic graph data and
shared animation sampling also remain common. This slice isolates optional
paint and inspector runtimes; it does not misclassify semantic model code as a
renderer leak.

## Production Closure Change

The six-route attribution command measures every production route twice with
cache disabled and now fails if an optional runtime appears on an unrelated
route or if the selected graph/KaTeX runtimes are emitted more than once.

| Selected route | Script gzip after `s22` | Script gzip after `s23` | Change |
| --- | ---: | ---: | ---: |
| generated/verified solve-x | 401,462 | 385,181 | -16,281 |
| vector dot projection | 325,269 | 308,982 | -16,287 |
| economics equilibrium | 319,776 | 303,489 | -16,287 |
| exact fraction quantity | 389,675 | 373,387 | -16,288 |
| 3D graph | 367,248 | 354,996 | -12,252 |
| addition execution trace | 229,220 | 212,933 | -16,287 |

The main-host closure fell from 232,146 to 215,893 gzip bytes, a further
16,253-byte reduction. Across the complete attribution sequence it is down
204,218 bytes from the 420,111-byte `s21` baseline. The current programming
route transfers 233,196 script bytes and is below the fixed 250,000-byte
product target before its native surface is added.

The common production closure is now 56 scripts totaling 208,270 gzip bytes
and one 14,377-byte gzip stylesheet. The original `s21` measurement had 79
common scripts totaling 404,981 gzip bytes and two styles totaling 22,331
gzip bytes.

## Exact Ownership Matrix

The ratchet records these route sets:

- Graph3D surface, WebGL shell, and Three.js renderer: `graph-webgl-3d` only;
- graph-SVG surface: solve-x, vector, and economics only;
- equation surface: solve-x only;
- programming adapter: programming trace only;
- API catalog, animation diagnostics, and code highlighting: no catalogue
  route; and
- KaTeX script: solve-x, vector, economics, and exact quantity, with KaTeX CSS
  limited to solve-x, vector, and economics.

The build contains exactly one script each for the Graph3D surface, graph-SVG
surface, WebGL shell, Three.js renderer, and KaTeX runtime. The split therefore
removed initial closure without duplicating either graph or math runtimes.

## Preservation and Verification

- delayed equation loading remains accessible and produces zero observed
  layout shift through font settlement;
- Graph3D selected paint, seek, lease release, context-loss fallback, and
  semantic SVG fallback pass in Chromium;
- the legacy editor/dashboard round trip still previews API items and updates
  Graph3D surface controls after their controller extraction;
- generated solve-x and vector direct seek, rewind, reduced motion, and native
  paint checks pass;
- typecheck, production build, architecture boundaries, promotion memory,
  development-review production closure, capability attribution, and all
  split bundle ceilings pass; and
- 23 focused unit tests cover capability derivation, source boundaries,
  attribution ratchets, Graph3D hosting, and the API catalog.

Stable commands:

```sh
npm run perf:animation:attribution
npm run test:browser:animation-equation-capability
npm run test:browser:animation-catalogue-3d
npm run test:browser:dashboard
npm run check:animation-library-bundle-boundary
```

One broader unit-suite baseline remains stale independently of this slice:
the committed HTML-output inventory contains 26 owners while its count ratchet
still expects 25. The capability-focused checks and architecture gate are
green; the release reconciliation slice `s30` owns that existing count repair
alongside the previously recorded place-value preservation hash residual.

## Boundary for the Next Slice

This slice does not change catalogue geometry, reserve per-surface layout, or
claim the remaining common semantic closure is optimal. `s24` owns reserved
layout and layout-shift metrics. `s25` will rerun the measured performance
targets and decide which remaining common debt is product-relevant before the
execution-trace exemplar begins.
