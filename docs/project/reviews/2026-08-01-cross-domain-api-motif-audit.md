# Cross-Domain API And Motif Audit

Date: 2026-08-01
Status: implementation audit after approved economics and physics exemplars

## Outcome

The existing platform already has the correct large boundaries: one lazy
catalogue loader, one renderer-neutral animation runtime, one playback session,
one surface-adapter registry, and one SVG graph viewport. Economics and physics
both reuse them without domain-specific clocks, shell exceptions, iframes, or
parallel review state. Those APIs remain internal platform authority.

The two approved callers prove four smaller shared contracts:

1. reversible, quantized presentation progress before domain choreography;
2. the dimensional-continuity SVG graph profile and its semantic visual roles;
3. two-decimal moving readouts with approximation notation and exact semantic
   authority; and
4. bounded integer query encoding that omits defaults and preserves unrelated
   URL state.

They do **not** prove a shared economics/physics model, synchronized narrative,
SVG composition, graph presenter registry, parameter registry, universal
renderer, or universal motif registry. Those responsibilities remain with the
domain adapters.

The executable classification is
`src/architecture/cross-domain-animation-api-audit.ts`. It distinguishes
stable authoring facades, internal platform APIs, domain adapters,
experimental surfaces, compatibility bridges, and retirement candidates from
observed owners and callers.

## Motif Decision

The canonical renderer-neutral equation motif vocabulary already lives under
`src/animation/motifs/` and is exposed by its local `public-api.ts`. Four files
under `src/rendering/` only re-export that vocabulary. They have no production
caller; one boundary test was their sole import. The extraction slice retired
those facades while retaining the canonical modules and changing the boundary
test into a no-compatibility-import ratchet.

The dimensional-continuity graph language is a presentation profile, not an
equation motion motif. Promoting its shared fields and tokens standardizes the
approved appearance without conflating graph styling with transformation
choreography.

## Explicit Non-Deletions

- The Jacobian/Hessian comparison is a presentation retirement candidate, as
  requested, but its semantic transformation, derivative-structure
  correspondence, and conformance tests remain unique evidence. This loop does
  not delete them or infer a final catalogue disposition.
- The API catalogue and project dashboard are experimental/editorial surfaces,
  not authoring authority. Broad dashboard deletion remains deferred.
- Full-document catalogue navigation remains the progressive fallback; the
  ordinary path already switches assets in shell.
- The seven unresolved playable display entries remain compatibility evidence
  until reviewed; their labels alone do not prove equivalence to concrete
  catalogue assets.

## Extraction Result

The reversible unit is the four proven shared helpers/profile plus removal of
the four zero-caller motif facades:

- `src/animation/synchronized-model-projection.ts` owns reversible progress,
  exact model-progress conversion, and the shared easing primitive;
- `src/editor/bounded-integer-query-parameter.ts` owns only bounded integer URL
  parsing and default omission;
- `src/animation/dimensional-continuity-dynamic-display.ts` owns the neutral
  moving display policy without importing renderer code;
- `src/rendering/dimensional-continuity-graph-profile.ts` owns the approved
  presentation roles and bounded inline KaTeX cache;
  and
- `src/animation/motifs/public-api.ts` remains the sole canonical motif facade.

Economics and physics retain exact frames, direct seek/rewind, accessible
state, rendered output, route behavior, and local rollback boundaries. Domain
equations, narrative, geometry, timing thresholds, and asset identity did not
move. The release slice owns broad verification and project-memory closure.
