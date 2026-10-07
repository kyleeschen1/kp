# Proposed path to a durable composable LA format

Status: recommendation, not implementation authorization. The polynomial
exemplar still awaits visual acceptance. This proposal does not reopen parked
catalogue work or authorize a universal renderer.

## Evidence and target

`src/math/matrix-product.ts` already owns immutable operands, dimensional
validation, row/column lenses, entry pairings, derived contributions and results.
The bounded matrix-column authoring packet demonstrates value-only variation
for numerical 2×2 inputs. The polynomial fixture reuses symbolic expressions and
matrix-product identity, but its local view still encodes two rows, four basis
expressions, positions and timing. It is not yet a reusable authoring format.

First target: a finite real-scalar linear-combination explanation that can move
between expanded expressions, coefficient matrices and a declared ordered input
family. Separate basis expressions, unknown coordinates and numerical inputs;
similar paint does not imply interchangeable mathematical roles. Do not infer
linear independence from a list called a basis. Polynomial monomials have a
domain-specific basis interpretation; arbitrary function families need their
own assumptions/evidence. Systems additionally carry equations/right-hand sides.

## Candidate comparison

| Candidate | Authoring benefit | Reuse evidence | Risk | Recommendation |
|---|---|---|---|---|
| Parameterize accepted extraction and add a linear-system caller | High | Directly testable | Bounded | First |
| Add more custom LA pages | Low | More demonstrations, little format evidence | Continued fragmentation | Defer |
| Design a universal LA graph/scene language | Speculative | Unproved | High abstraction cost | Defer |

## Stages and exit conditions

1. **Accept one visual reference.** Settle the polynomial choreography and record
   its meaning, supported shapes, provisional aesthetics and preserved endpoints.
   Do not turn every current pixel or duration into a public contract.
2. **Remove exemplar constants.** Author coefficients, ordered input expressions,
   labels, semantic selections and annotation text as data. Derive occurrence
   mappings and dimensions; resolve row/column alignment and spacing in the
   responsible layout adapter. Exercise signed/zero/unit coefficients, changed
   term order, a non-square shape and longer labels. Within the declared envelope,
   source edits must require no renderer/CSS/geometry edits. Unsupported cases
   return a typed repair gap rather than an improvised treatment.
3. **Pressure one different caller.** Represent a small linear system as Ax=b,
   preserving variable identity and the right-hand side, using the same bounded
   collection/distribution mechanism. Extend domain meaning where required;
   do not pretend unknowns are polynomial basis functions. Extract only the seam
   demonstrated by both callers; keep one adopted implementation.
4. **Compose mathematical outputs and explanation passages.** Feed one matrix
   product's exact result into another compatible product. Each passage declares
   required roles, mathematical outputs and visual entry/exit representations.
   Retain provenance and occurrence ownership across the join, with explicit
   space/basis checks when maps carry that context. Test pause, seek, reverse,
   partial expansion and disposal across the boundary. Reverse presentation is
   distinct from mathematical inversion.
5. **Publish a bounded v1 authoring contract.** Use a small typed TS authoring
   surface backed by versioned declarative records at the durable boundary.
   Reuse existing semantic, scene, score and lifecycle contracts; add no parallel
   universal IR. Keep executable implementation/functions out of saved records.
   Provide schema/runtime validation, explicit assumptions, stable IDs,
   migrations/rejections, static mathematical output, accessible explanations,
   positive examples and typed unsupported examples. Generated explanations
   must pass these same checks.

## Boundaries the format must preserve

- Mathematical referents are immutable. Operations create derived objects;
  representation changes create/update visual occurrences of those objects.
- One referent may have several occurrences. Collect/distribute explicitly
  declare that correspondence; identity never follows glyph equality.
- The explanation names intentions such as expose implicit coefficients, align
  corresponding terms, collect/distribute a shared input, inspect a row or
  column, or evaluate a justified expression. Each has preconditions, semantic
  effects (or none), correspondence and validity of intermediate notation.
- Layout supplies constraints and measured endpoints. Motifs supply reversible
  motion. Authors choose bounded treatments without embedding DOM, pixel paths
  or frame timing in the mathematical record.
- Browser delivery includes the selected explanation and required reference
  closure, not the entire research graph or proof library. Measure actual cold
  and warm payloads and one/many-card costs before claiming amortization.

## Definition of the first successful milestone

An author or LLM can create a new supported polynomial explanation and a linear
system by changing only semantic source and instructional selections. Both share
one collection/distribution implementation, retain inspected identities, reject
unsupported input explicitly and restore the same state under arbitrary seek.
Track renderer files changed per new example (target zero), model/code size,
checks and repair attempts, payload/runtime costs and human visual acceptance.
Ease of authoring and learner comprehension require separate evidence.

After this milestone, prioritize row operations/solution-set preservation and
map composition/basis changes as new semantic pressures. Introduce projections,
orthogonality, rank, eigenvectors and other families when they test a real new
boundary; no commitment to encode all LA before shipping the bounded format.
