# KP Bundle Tooling And Assumption Audit

Status: complete
Date: 2026-08-16
Run slice: `run-contract.kp.bundle-application-isolation-v2/s02`

## Conclusion

KP already has useful bundle evidence, but it has two different measurement
systems with different meanings:

1. `check-animation-library-bundle-boundary.ts` walks selected static manifest
   imports and applies four hard-coded ceilings.
2. `animation-capability-attribution.ts` opens six catalogue selections in a
   browser, records the resources actually requested, and derives common,
   exclusive, and capability-owner sets.

Neither is yet the general selected-experience model needed by this tranche.
The first is cheap but conflates named roots with user experiences. The second
is truthful about runtime activation but expensive, catalogue-specific, and
closed over six hard-coded selections.

The replacement should preserve both strengths: a cheap deterministic manifest
model for every commit and a browser-backed verifier at promotion boundaries.

## Current Baseline

| Existing measurement | Current gzip bytes | Ceiling | Headroom |
| --- | ---: | ---: | ---: |
| Outer catalogue shell | 10,819 | 50,000 | 39,181 |
| `src/main.ts` static closure | 196,852 | 490,000 | 293,148 |
| Catalogue plus economics and graph-SVG roots | 118,535 | 190,000 | 71,465 |
| Place-value differential closure | 74,980 | 75,000 | 20 |

These values pass, but their labels overstate what they prove. In particular,
the “main host” starts from `src/main.ts`, while the physical root document
starts from `src/bootstrap.ts`. The measured catalogue route is a synthetic
union of the catalogue entry, economics pack, and graph-SVG capability rather
than a first-class experience declaration.

### Fresh-build discrepancy

A fresh build during this audit produced a different but repeatable cohort:

| Measurement | Approved closeout | Fresh audit build | Change |
| --- | ---: | ---: | ---: |
| Outer catalogue shell | 10,819 | 10,819 | 0 |
| `src/main.ts` static closure | 196,852 | 180,261 | -16,591 |
| Catalogue/economics/graph union | 118,535 | 118,427 | -108 |
| Place-value differential | 74,980 | 75,026 | +46 |

The same fresh manifest returned 75,026 twice, so this is not same-artifact
nondeterminism. It is cross-build closure drift that the existing report cannot
explain. The 26-byte ceiling failure is therefore recorded evidence, not hidden
or fixed by raising the limit. It confirms that a 20-byte margin is not a
meaningful architecture boundary and makes fingerprinted scenario baselines
and structural place-value repair mandatory.

## Tool Inventory

### Static bundle boundary

`scripts/check-animation-library-bundle-boundary.ts` is fast and deterministic.
It correctly measures generated JavaScript and CSS bytes and reports file-level
attribution. It should remain in place until the generalized scenario command
proves equivalent or stricter coverage.

Its current limitations are:

- four scenario concepts and their roots are embedded directly in the
  inspector;
- closure traversal follows `imports` but does not model `dynamicImports` as a
  distinct activation phase;
- CSS is collected from statically reached chunks, while other manifest assets
  are not part of the same general closure contract;
- place-value cost is defined by subtracting catalogue and selected-math sets,
  not by an explicit base scenario plus activation scenario;
- forbidden outer-shell capabilities are inferred from output filename regexes;
- comments still describe older closure figures and product meanings; and
- callers cannot declare negative capability expectations in data.

### Browser capability attribution

`scripts/animation-capability-attribution.ts` supplies important runtime truth:

- it captures requests with cache disabled;
- it repeats every route and rejects a different resource signature;
- it associates emitted resources with manifest owners;
- it distinguishes scripts, styles, and fonts; and
- it verifies exact capability route sets and singleton heavy runtimes.

Its limitations are:

- six catalogue selections are a module-local constant;
- route selection, expected pack, and capability assertions are coupled to one
  report implementation;
- it requires a preview server and Chromium even when only manifest closure is
  needed;
- application entries and public lesson builds are absent; and
- the generated report is disposable evidence rather than a stable scenario
  declaration consumed by other gates.

### Build and application configuration

The root `vite.config.ts` imports and compiles many publications at config time.
That does not automatically place those modules in browser startup, but it
couples build latency and configuration ownership across economics, algebra,
Scheme, Lisp, reader routes, Internal Studio, and public lessons.

The four public Vite configurations successfully provide isolated build graphs,
but duplicate publication injection, build identity, server defaults, and
output setup. Any helper extraction must remain route-neutral: a helper may
accept callbacks and descriptors but must never import a publication
implementation.

`src/bootstrap.ts` is primarily a router, but it still eagerly imports concept
catalog data and route predicates before choosing an application. Its fallback
to `src/main.ts` is a compatibility boundary, not yet a named Internal Studio
entry.

### CSS and KaTeX

Several selected surface capabilities already own their CSS imports. This is a
sound split boundary. Remaining pressure includes:

- shared `styles.css` and the catalogue shell stylesheet entering both the
  Svelte catalogue and legacy main application;
- KaTeX CSS imported independently by several capabilities and explicitly by
  the concept-room branch; and
- tutorial CSS whose route ownership is partly explicit and partly aggregated
  through tutorial entry modules.

CSS work should change ownership and loading only. It must not consolidate,
rename, or visually retune rules in this tranche.

## Required Measurement Semantics

The generalized model should make these distinctions explicit:

- **entry closure:** static imports, CSS, and assets required to start one
  physical application entry;
- **activation closure:** the additional closure reached by an explicitly
  selected literal dynamic import or capability root;
- **experience closure:** entry closure plus an ordered set of activations;
- **incremental closure:** files in one experience but not its declared base;
- **negative closure:** forbidden owners or capabilities that must not appear;
- **common closure:** resources shared by a declared comparison cohort; and
- **exclusive closure:** resources used by exactly one member of that cohort.

Dynamic imports must not be treated as startup imports. They are discoverable
edges that only enter an experience when the scenario declares their
activation.

## Decisions For The Next Four Slices

1. Put immutable scenario declarations in a dependency-light script module.
2. Put pure Vite-manifest graph traversal in a separate reusable module.
3. Represent roots by stable source keys, not emitted filenames or regex-only
   guesses.
4. Let scenarios declare entry roots, activation roots, comparison bases,
   expected and forbidden owners, and optional ceilings.
5. Keep browser attribution as a promotion verifier fed by the same scenario
   identities rather than as the primary inner-loop calculator.
6. Add scenarios before replacing any existing budget gate; equivalence and
   stronger negative coverage must be demonstrated first.

## Non-Goals

This audit does not authorize a chunk split, new budget, application migration,
CSS change, or KaTeX migration. It records the seams and ambiguous assumptions
that the following slices must make typed and testable.
