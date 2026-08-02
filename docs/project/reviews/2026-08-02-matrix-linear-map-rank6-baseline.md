# Matrix-To-Linear-Map Rank-6 Baseline

Date: 2026-08-02
Status: frozen before rank-6 implementation
Entry commit: `33f17080`
Canonical asset: `animation.generated.linear-algebra.matrix-vector.two-by-two`

## Authority Reconciliation

Rank 6 begins from one generated semantic fixture, one animation asset, one
row-dot choreography, one semantic duration, and one player clock. Matrix and
LinearMap objects own mathematical truth. Equation and Graph SVG adapters own
paint. The Svelte catalogue owns only application composition; it does not own
the fixture, animation frame, renderer ports, clock, URL, or Review state.

The exact owner-to-source mapping is frozen in
`tests/fixtures/matrix-linear-map-rank6-baseline.json` and checked by
`tests/matrix-linear-map-rank6-baseline.test.ts`. The test also prevents Svelte
imports from entering the semantic, animation, or runtime authority paths.

## Existing Seams

- The generated fixture already supplies the exact two-by-two matrix-vector
  problem and selector lineage.
- Matrix-vector choreography already ranks row dot products and samples them
  through the existing semantic duration.
- `deriveLinearMapFromMatrix` already produces a strict LinearMap with source
  and target bases.
- The catalogue already supports composite equation and graph slot dispatch
  and selected Graph SVG loading.
- The existing `animation.graph.vector.linear-map-scale` asset is a separate
  placeholder caller. It remains intact until slice 4 proves what, if
  anything, can eventually be retired.

## Bundle Baseline

The production build and frozen animation-library bundle gate pass.

| Closure | Measured gzip bytes | Ceiling | Headroom |
| --- | ---: | ---: | ---: |
| Outer review shell | 10,459 | 50,000 | 39,541 |
| Main host | 178,189 | 490,000 | 311,811 |
| Measured catalogue route | 90,158 | 190,000 | 99,842 |
| Place-value incremental pack | 71,795 | 75,000 | 3,205 |

No ceiling is authorized to grow during rank 6.

## Runtime Baseline

`npm run perf:animation` passes every regression ratchet. The normal economics
sample used 202,539 initial script-transfer bytes, hydrated in 405 ms, painted
LCP in 472 ms, recorded CLS of 0.00022, painted the measured interaction in
26 ms, and sampled animation-frame p95 at 17.4 ms.

The constrained sample hydrated in 2,324 ms, painted LCP in 2,460 ms, recorded
CLS of 0.00010, painted the measured interaction in 62.6 ms, and sampled frame
p95 at 33.7 ms. Its 128 ms loading task and 33.7 ms frame p95 remain explicit
product-target misses. The normal sample also recorded one 61 ms loading task.
These are pressures to preserve or improve, not permission to widen a ratchet.

Capability attribution passes with one Svelte catalogue composition, no
imperative catalogue route, Graph SVG isolated to its selected callers, Three
isolated to the Graph3D caller, and KaTeX isolated to selected mathematical
callers.

## Slice Boundary

This slice changes no animation, semantic value, route, selector, or visual
behavior. Exact asset truth is frozen separately in slice 2; choreography and
visible behavior are frozen separately in slice 3.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/matrix-linear-map-rank6-baseline.test.ts`
- `npm run build`
- `npm run check:animation-library-bundle-boundary`
- `npm run perf:animation`
- `npm run perf:animation:attribution`
- `theseus workspace validate`
