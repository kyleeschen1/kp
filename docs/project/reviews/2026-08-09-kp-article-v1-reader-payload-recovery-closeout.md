# KP Article v1 Reader Payload Recovery Closeout

Date: 2026-08-09
Status: complete
Source recommendation:
`2026-08-09-kp-post-authoring-next-step-review.md`

## Outcome

The shared equation-reader runtime closure is back below its established
145,000-byte gzip ceiling without raising the budget, duplicating the runtime,
or weakening static publication. The ten common equation routes now share a
124,778-byte runtime closure, leaving 20,222 bytes of measured headroom.

The specialized routes remain below their independent baselines:

- distribution area: 14,993 bytes against 15,565;
- quadratic branching: 14,800 bytes against 15,515.

## Root Causes And Repair

Two dependency-boundary regressions had accumulated:

1. Vite's dynamic-import preload helper was adopted into the lazy
   `kp-tutorial-core` manual chunk. Every reader entry that performed a dynamic
   import consequently inherited the complete Svelte/tutorial closure. A
   dedicated preload-helper chunk now prevents that cross-surface adoption.
2. The single comprehensive runtime and renderer barrels mixed shared learner
   capabilities with route-specific fraction and distribution capabilities.
   Rollup therefore included the fraction evaluation tree in ordinary equation
   routes. Governed learner-core public entry points now expose only the initial
   route closure while specialized variants retain the comprehensive API behind
   their existing lazy boundaries.

Fraction-only salience projection and theme application also moved behind the
existing fraction capability import. This keeps variant behavior out of the
ordinary entry without creating a second runtime or changing its semantics.

Measured common-route closure:

- observed regression before repair: 177,816 gzip bytes;
- after separating the preload helper: 147,966 gzip bytes;
- after restoring learner-core boundaries: 124,778 gzip bytes.

## Preserved Contracts

- The frozen `kp.article.v1` grammar and canonical economics source are
  unchanged by this infrastructure repair.
- Searchable static HTML, build-time KaTeX/MathML, direct navigation, and
  no-JavaScript reading remain intact.
- The framework-neutral reader runtime, canonical compositor, and lazy
  specialized capabilities retain their existing authority.
- Production contains neither development review tooling nor a copied
  per-route tutorial runtime.
- Existing user-authored economics source and generated-publication changes
  remain independently reviewable and were not included in this repair.

## Verification

- `npm run build`
- `npm run check:reader-production`
- `npm run check:reader-budgets`
- `npm run check:dev-review-production`
- `npm run test:browser:reader-conformance` — 17 passed
- `npm run visual:linear-equation` — 39 deterministic states captured
- `npm test` — 3,922 passed

## Next Action

Author one compact multi-step algebra article as the first structurally
different `kp.article.v1` caller. Use the 124,778-byte common reader closure as
the pre-article baseline; do not reopen layout discovery or the article grammar
without evidence from that caller.
