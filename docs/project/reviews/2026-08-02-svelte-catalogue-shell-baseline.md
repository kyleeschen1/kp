# Svelte Catalogue Shell Migration Baseline

Date: 2026-08-02
Status: frozen before Svelte integration
Canonical asset: `animation.dot-projection.basic`

## What Is Frozen

The current imperative catalogue is the visual and behavioral reference for
the reversible Svelte proof. It has three flat sibling regions—rail, stage,
and inspector—with the Review launcher docked at lower left. Ordinary row
selection stays inside the shell, while native or unsafe link gestures retain
document navigation. The stage owns the existing editor player and exposes
only Play/Pause and the scrubber by default.

The migration baseline records the current DOM hooks, actions, lifecycle
owners, ceilings, and observed measurements in
`tests/fixtures/animation-catalogue-svelte-migration-baseline.json`. The stable
focused gate is `npm run test:svelte-catalogue-shell`.

The imperative application remains the rollback entry. The Svelte proof may
replace its application composition only after the human checkpoint; it may
not replace animation assets, clocks, runtime sampling, renderer ports, URL
codecs, or Review storage.

## Source Baseline

| Surface | Lines before migration |
| --- | ---: |
| `animation-catalogue-application.ts` | 958 |
| `animation-catalogue-shell.ts` | 439 |
| `animation-catalogue-shell.css` | 590 |

These counts are diagnostic rather than targets. The useful test is whether
Svelte makes ownership and lifecycle boundaries clearer without creating a
parallel runtime.

## Bundle Baseline

The production build and animation-library bundle boundary passed.

| Closure | Measured gzip bytes | Ceiling | Headroom |
| --- | ---: | ---: | ---: |
| Outer review shell | 10,459 | 50,000 | 39,541 |
| Main host | 253,348 | 490,000 | 236,652 |
| Measured catalogue route | 169,890 | 190,000 | 20,110 |
| Place-value incremental pack | 71,797 | 75,000 | 3,203 |

The outer shell requested no forbidden animation-runtime files. No ceiling is
authorized to grow during the Svelte proof.

## Runtime Baseline

`npm run perf:animation` passed its regression ratchets on the selected
economics route. The observed normal sample used 187,497 initial script bytes,
hydrated in 308 ms, painted LCP in 380 ms, recorded CLS of 0.00022, and painted
the measured interaction in 26.9 ms.

The constrained sample remains useful pressure rather than accepted quality:
it recorded 2,524 ms LCP against the 2,500 ms target, a 235 ms loading long task
against 50 ms, and a 33.4 ms frame p95 against 33 ms. These were existing
target misses, not regression-ratchet failures. The Svelte proof may improve
them but may not normalize or widen them.

## Capability-Attribution Pressure

`npm run perf:animation:attribution` currently fails before Svelte integration.
Its asserted KaTeX cohort expects equation, vector, economics, and exact-
quantity routes; the production probe also observes the shared KaTeX script on
the Graph3D and programming routes. The default outer shell remains free of
KaTeX and other selected runtime capabilities, so this is selected-pack
granularity pressure rather than default-shell eager loading.

This discrepancy is recorded, not silently accepted. Slice 15 must either
restore the intended exact cohort through a framework-neutral loading joint or
update the attribution contract with evidence that the additional selected
callers intentionally require KaTeX. Svelte itself must not conceal or worsen
the pressure.

## Visual Baseline

`npm run visual:vector-dot-projection` captured seven deterministic states at
`tmp/codex/animation-catalogue/vector-dot-projection/manifest.json`: wide
start, component pairing, projection, settlement, narrow projection, reduced-
motion projection, and static SVG settlement. All reported contained label
geometry and no overlap. These images are disposable; the stable command and
observable checkpoints are the durable evidence.

## Verification

- `npm run test:svelte-catalogue-shell` — 14/14 passed.
- `npm run typecheck` — passed.
- `npm run build` — passed.
- `npm run check:animation-library-bundle-boundary` — passed.
- `npm run perf:animation` — regression ratchets passed; three existing product
  target misses recorded above.
- `npm run perf:animation:attribution` — failed on the pre-existing KaTeX
  cohort discrepancy recorded above.
- `npm run visual:vector-dot-projection` — seven-state manifest captured.
