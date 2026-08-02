# Canonical animation API map

Date: 2026-08-02  
Status: published and executable

## The short version

There is one supported cross-subsystem animation-asset authoring entry point:
`src/animation/public-api.ts`. It is deliberately small. Concept publication,
provider verification, equation motif vocabulary, and reader implementation
remain separate boundaries rather than one umbrella API.

The exact runtime export spellings live in
`src/architecture/canonical-animation-api-map.ts`. A conformance test imports
each supported module and compares its executable keys with that map, so this
document does not duplicate a long export list that can silently drift.

| ID | Entry point | Audience | Authority |
| --- | --- | --- | --- |
| `animation-authoring` | `src/animation/public-api.ts` | Supported cross-subsystem callers | Construct and validate canonical balanced-solve assets |
| `concept-publication` | `src/authoring/public-api.ts` | Separate public boundary | Define, validate, and publish concept manifests |
| `provider-integration` | `src/integrations/public-api.ts` | Separate public boundary | Fetch, map, and verify external problem traces |
| `equation-motif-vocabulary` | `src/animation/motifs/public-api.ts` | Canonical equation vocabulary | Renderer-neutral equation motif contracts; not a universal registry |
| `reader-compiler` | `src/reader/compiler/public-api.ts` | Reader subsystem only | Documents, routes, static math, and hydration manifests |
| `reader-runtime` | `src/reader/runtime/public-api.ts` | Reader subsystem only | Clock, controls, scheduling, URL state, and measured layout |
| `reader-renderers` | `src/reader/renderers/public-api.ts` | Reader subsystem only | Reader render and material projections |

## Supported authoring examples

The canonical fraction adapter imports only the factory:

```ts
import {
  createKpCanonicalBalancedSolveAnimationAsset
} from "./public-api.ts";
```

The verified generated-solve compiler imports the factory, validator, and
asset type from the same boundary:

```ts
import {
  createKpCanonicalBalancedSolveAnimationAsset,
  validateKpAnimationAsset,
  type KpAnimationAsset
} from "./public-api.ts";
```

Those are the only two production caller examples. New callers should begin at
this facade, while internal implementation modules may continue to use exact
sibling paths where doing so preserves ownership and avoids a cycle.

## Boundaries that must remain separate

- Provider integration may establish verified trace truth, but cannot author
  animation timing, geometry, or learner prose.
- Concept publication may publish manifests, but cannot construct animation
  assets.
- Equation motifs are renderer-neutral and equation-scoped. They do not define
  graph aesthetics, programming focus, or a universal domain motif registry.
- Reader `public-api.ts` files are package-local subsystem seams. Their names do
  not make them a second supported animation-authoring surface.
- `src/editor/api-catalog.ts` remains an editorial/diagnostic projection, not
  executable API authority.

## Change rule

A new public export requires a real caller, exact authority, a preservation
boundary, and an executable map update. A second domain caller may justify a
shared helper; naming similarity or a speculative dashboard control does not.
Any retirement requires exact caller closure and an exact replacement, as
recorded in the slice-14 pruning verdict.

Rollback is the architecture map, this document, and their conformance test;
production implementations and existing public modules are unchanged.
