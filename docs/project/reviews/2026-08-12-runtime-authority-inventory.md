# Runtime Authority Inventory

Date: 2026-08-12

## Finding

KP does not have one global browser loop, nor should it. Independent mounted
players and lessons need independent host sessions. The important invariant is
that one artifact instance has one semantic playhead, one frame-delivery owner,
and one paint owner. A `requestAnimationFrame` callback used to batch DOM writes
is not automatically a second clock.

The executable inventory at
`src/architecture/runtime-authority-inventory.ts` classifies 12 authorities:

- the pure animation sampler;
- reader clock arbitration and frame delivery;
- host-scoped editor playback;
- the lazy animation-pack and surface-capability loaders;
- editor and reader adapter registries;
- the canonical operation registry;
- the verified operation-presentation WeakMap cache;
- the canonical equation session; and
- the graph SVG viewport lifecycle.

## Canonical Versus Managed Compatibility

Seven entries are canonical or host-scoped. Four are explicit
compatibility-managed authorities with retirement conditions:

1. the selected-surface capability host's module cache;
2. the editor's mutable surface-adapter singleton;
3. the module-default canonical-operation registry; and
4. the identity-keyed operation-presentation plan cache.

The dashboard's module-scoped semantic-object preview registry remains a known
legacy architecture exception, but is not animation runtime authority. It is
outside this run's product boundary and remains forbidden as a dependency of
new concept or animation work.

The recently removed algebra choreography registries are not active
authorities. Algebra packs now provide immutable fission/fusion and reverse
capabilities explicitly, and import-order independence is already enforced.

## Operational Rule

New work may create a host-scoped session or scheduler, but may not create a
second semantic clock, import-time animation registration, or a renderer that
advances itself independently of sampled state. Capability caches must cache
only loading/registration promises; animation assets and runtime capability
values remain owned by the catalog pack loader.

## Evidence

- `tests/runtime-authority-inventory.test.ts` freezes owners, status,
  replacement conditions, and the clock/scheduler distinction.
- `tests/algebra-registration-graph.test.ts` proves the retired mutable algebra
  graph stays gone.
- `tests/selected-surface-capability.test.ts` proves one host owns optional
  surface imports.
- `tests/semantic-reader-frame-scheduler.test.ts` proves coalescing and
  read/plan/write ordering without hidden time.

