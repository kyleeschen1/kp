# KP Editor Concrete Animation Library Plan

Date: 2026-07-14
Status: accepted
Run contract: `run-contract.kp.editor.concrete-animation-library-v0`

## Decision

Make the first family-backed concrete animation cohort available in the KP
editor through the existing semantic asset, runtime-frame, visual-frame,
KaTeX, graph, dashboard, and editor contracts.

The editor path must remain a projection of durable `KpAnimationAsset` records:

```text
symbolic family
-> resolved concrete animation asset
-> shared runtime frame
-> renderer-neutral visual frame
-> editor view binding
```

Before expanding visible coverage, distinguish planned family sample refs from
catalog-resolved assets and enforce reference closure. Then stabilize the
canonical solve-x equation path before adding the approved algebra,
calculus/graph, and linear-algebra cohort.

## Required Product Behavior

- Concrete animations are discoverable and selectable in the KP editor.
- Editor selection can be addressed by stable animation id.
- Equation and graph views sample one parent runtime clock.
- Forward playback, seeking, and rewind preserve semantic identity.
- Planned sample refs are never advertised as executable editor animations.
- Dashboard sample actions can open the matching editor animation.
- Runtime and visual binding diagnostics remain inspectable.

## Boundaries

- Keep the existing editor shell and extend its animation catalog incrementally.
- Do not add a separate graph clock or renderer-owned semantic state.
- Defer row operations, determinant/inverse, basis/eigen, media encoders,
  curriculum generation, live CAS/LSP connections, and dynamic package loading.
- Stop if a slice requires a broad editor or renderer rewrite.

## Verification Doctrine

Commit each verified slice. Use focused tests for pure catalog and law changes,
standard verification for shared contracts, and browser/build/full-suite gates
for renderer, selection, routing, and milestone boundaries.
