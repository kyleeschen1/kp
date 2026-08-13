# Code animation ownership and promotion boundary

Date: 2026-08-13
Status: accepted for the approved Python second-caller tranche

## Decision

KP will build the Python free-shipping refactor as a structurally different
second caller of the existing semantic-animation spine before extracting a
cross-language code-animation family. TypeScript remains the canonical visual
reference; Python must reproduce its pedagogical claim and invariants without
sharing TypeScript-specific source, entity, score, plan, or renderer types.

The Python language frontend runs only at build time. Browser code consumes a
checked-in generated semantic artifact and never imports a parser, compiler,
or arbitrary-code executor. Scheme remains a specialized recursive
S-expression caller: later work may adopt proven identity, settlement,
ownership, and syntax-paint protocols without forcing Scheme through an
imperative-language source renderer.

## Present ownership

| Concern | TypeScript owner | Contract boundary |
|---|---|---|
| Novice source and lesson claim | `typescript-free-shipping-refactor-contract.ts` | Exact before/after source, ordered teaching stages, named entities, and behavior cases are authored truth. |
| Language frontend | `scripts/typescript-refactor-frontend.ts` | The TypeScript compiler identifies syntax and diagnostics at build time only. |
| Semantic compilation | `scripts/typescript-refactor-semantic-compiler.ts` | Compiler records become stable entity IDs and exact source ranges. |
| Generated source truth | `typescript-refactor-semantics.generated.json` and `typescript-refactor-semantic-artifact.ts` | Runtime reads checked-in data; generation and check mode detect drift. |
| Transformations and correspondence | `typescript-refactor-operations.ts` | Operations name semantic objects, maps, lineage, and selector identities explicitly. |
| Behavior preservation | `typescript-refactor-behavior-proof.ts` | Frozen boundary cases prove that the before and after programs agree. |
| Pedagogical order | `typescript-refactor-score.ts` | Authored teaching order and holds supersede compiler traversal order. |
| Source projections | `typescript-refactor-source-projections.ts` | Each endpoint is reconstructable native source with stable entity ranges. |
| Motion authority | `typescript-refactor-motion-plan.ts` | A validator mints the only plan allowed to produce trajectories. |
| Deterministic sampling | `typescript-refactor-motion-frame.ts` and `typescript-refactor-token-theater.ts` | Pure progress sampling owns projection handoff and intermediate token positions. |
| Syntax paint | `typescript-source-tokens.ts` | Lexical roles affect paint only; compiler entities retain semantic authority. |
| Native endpoint and accessibility | `typescript-refactor-code-html.ts` | Selectable source is the single endpoint, search, and accessibility owner. |
| Concrete paint | `typescript-refactor-surface-adapter.ts` and `programming-surface.css` | One existing host clock writes DOM styles; Svelte is not frame authority. |
| Asset assembly | `typescript-free-shipping-animation-asset.ts` | The asset validates and bundles the language-specific contracts. |
| Lazy hosting | programming catalogue pack and loadable registry | The artifact loads through the existing catalogue lifecycle and direct URL. |

The layer ordering remains:

```text
authored source
-> build-time language frontend
-> generated semantic artifact
-> operations + correspondence + behavior proof
-> pedagogical score
-> validator-minted motion plan
-> pure sampled frame
-> native source + inert motion overlay
-> existing catalogue host and clock
```

No lower layer may depend on a concrete renderer resource. No renderer may
infer semantic identity from equal glyphs, token text, or coincident geometry.

## Candidate cross-language invariants

The following are candidates, not yet shared APIs:

- semantic identity comes from the language frontend or authored contract;
- every moving source occurrence has explicit provenance and disposition;
- transformations own correspondence and lineage rather than the renderer;
- behavior parity is proven independently from visual endpoint resemblance;
- the score owns pedagogical order and the motion plan owns valid trajectories;
- the sampler is a pure function of one normalized host progress value;
- moving material reaches its exact destination at full scale and opacity
  before native endpoint paint takes ownership;
- native source owns selection, search, copy, accessibility, and settled state;
- syntax roles are optical paint only and remain consistent in static and
  moving material;
- direct seek, rewind, reduced motion, and native endpoints are deterministic;
- artifacts register lazily through existing capability and catalogue seams.

Python must first demonstrate which of these survive a different grammar,
indentation model, AST, call syntax, and source projection. Only the human-
approved comparison after the Python checkpoint may promote a candidate into
a language-neutral contract.

## Deliberate non-abstractions

Before the Python checkpoint, do not create shared code-language entity,
source-projection, score, motion-plan, renderer, or syntax-token type families.
Do not rename TypeScript APIs to generic names merely because Python will have
an analogous file. Parallel language-local implementations are intentional
evidence collection, not duplication debt yet.

Do not introduce a browser parser, new runtime store, scheduler, clock, scene
graph, renderer authority, or CodeMirror dependency. Do not make Scheme adopt
line-oriented projections or imperative refactor tracks. Do not promote the
artifact-scoped dark catalogue treatment into a global theme contract.

## Promotion gate

Promotion requires all of the following:

1. Python source parses with its real build-time language frontend and the
   checked-in semantic artifact is reproducible.
2. Boundary behavior agrees before and after the refactor.
3. The Python exemplar makes duplicated rules converge, settle into the
   helper, and then propagate to callers with exact semantic ownership.
4. Native source, direct seek, rewind, reduced motion, accessibility, lazy
   loading, performance, and stable layout pass focused verification.
5. Human review approves the Python choreography as a second exemplar.
6. A comparison identifies at least two real callers for every proposed
   shared seam and names any language-specific exceptions explicitly.

The smallest rollback unit before that gate is the Python language-local
vertical slice. The approved TypeScript exemplar, Scheme factorial, economics
work, layout experiments, CodeMirror, and public product surfaces are outside
that rollback boundary.
