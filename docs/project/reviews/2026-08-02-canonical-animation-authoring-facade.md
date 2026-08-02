# Canonical animation authoring facade

Date: 2026-08-02  
Status: defined; exactly two production callers migrated in slice `s13`

## Contract

`src/animation/public-api.ts` is the public authoring entry point for the two
caller-proven balanced-solve animations. Its runtime surface is exactly:

1. `createKpCanonicalBalancedSolveAnimationAsset`
2. `validateKpAnimationAsset`

It additionally exports only the types needed to describe the input, returned
`KpAnimationAsset`, and validation issues:

- `CreateKpCanonicalBalancedSolveAnimationAssetInput`
- `KpAnimationAsset`
- `KpAnimationAssetValidationIssue`

The facade contains no implementation and uses named exports only. Slice `s12`
defined it independently; slice `s13` then moved only the canonical fraction and
verified generated-solve imports through it.

## Why this size

The exact caller audit found two production consumers of the balanced-solve seam
and 126 production consumers of the full internal asset module. Re-exporting the
entire module would turn builders, reference compilation, projection support, and
compatibility details into a public promise without caller evidence.

The public surface therefore excludes:

- the raw `createKpAnimationAsset` constructor and mutable-style builder;
- generated-session, reader, and presentation compilers;
- editor, DOM, KaTeX, SVG, WebGL, and reader lifecycle state;
- economics, physics, vector, programming, or other domain presenters; and
- the equation motif vocabulary, which remains a separate bounded facade rather
  than becoming a universal registry.

## Preservation boundary

The internal canonical factory still owns the balanced-introduction and inverse-
cancellation preconditions plus the typed presentation profile. The internal
asset module still owns cloning, validation, reference closure, seek/rewind laws,
builders, and semantic reference compilation. Provider truth, learner prose,
timing, geometry, rendering, and host state do not cross this facade.

The smallest migration rollback unit is the two import-path changes and their
preservation test. Reverting those paths does not change the public entry point or
either internal implementation.

## Enforcement

- Runtime conformance asserts the exact two exported values and their identity
  with the internal owners.
- Source conformance rejects wildcard exports and imports from reader, renderer,
  editor, integration, or domain modules.
- Type fixtures prove the supported signatures and fail if builders, exemplar
  compilers, domain presenters, reader render plans, or motif registries leak
  through the facade.
- The caller ledger now records exactly the canonical fraction adapter and the
  verified linear-problem animation compiler as production facade callers. The
  internal balanced-solve module has only the public facade as a production
  caller.
