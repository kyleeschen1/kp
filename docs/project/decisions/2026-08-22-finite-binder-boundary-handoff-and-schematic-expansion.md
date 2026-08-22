# Finite-Binder Boundary Handoff and Schematic Expansion

Status: accepted design; fixed-bound choreography enters exemplar revision,
symbolic-bound support remains the next separately proved capability
Accepted: 2026-08-22
Applies to: finite sum expansion and later finite product pressure

## Decision

Finite-binder expansion must preserve the learner's memory of the range
boundaries. For the reviewed fixed-range exemplar,

\[
\sum_{i=1}^{3} a_i \longrightarrow a_1+a_2+a_3,
\]

the lower-bound paint travels to the first instantiated reference and the
upper-bound paint travels to the last instantiated reference. The interior
reference is synthesized from ordered range traversal. The source and target
occurrences remain semantically distinct: this is a lineage-backed material
handoff, not identity cloning.

The large operator and binder declaration may withdraw, but their disappearance
must not consume the boundary material. Connectors may appear only after the
neighboring terms and their references have arrived.

## Schematic Variable Bounds

A later schematic capability should represent

\[
\sum_{i=1}^{n} a_i \longrightarrow a_1+a_2+\cdots+a_n
\]

with a first-class omitted-range object. The ellipsis is not punctuation or a
generic connector. It denotes the ordered portion of the bound range omitted
between the demonstrated prefix and terminal instance. It must therefore be
referenceable, expandable, inspectable, and governed by explicit assumptions
about the symbolic upper bound.

The typed vocabulary should distinguish:

- `exhaustive-expansion`: every proven range value has an instance;
- `schematic-expansion`: representative instances plus an omitted range;
- `boundary-transfer`: a source bound derives a boundary instance reference;
- `successor-instantiation`: an interior reference is derived by traversal;
- `omitted-range`: a possibly empty or provably nonempty ordered interval,
  with that distinction made explicit.

Authors choose exhaustive versus schematic presentation. Renderers do not
infer the choice from term count or available width.

## Choreography

For the fixed three-term exemplar:

1. Establish the complete source.
2. Begin the ordered body-template fan-out.
3. Withdraw the operator, declaration, and source binder reference without
   consuming the boundary values.
4. Transfer the lower bound to the first reference and the upper bound to the
   final reference; synthesize the interior reference from the range proof.
5. Introduce each connector only after both adjacent terms are established.
6. Settle onto exact native KaTeX target paint.

For a symbolic upper bound, the same boundary handoff surrounds an omitted
range. The ellipsis should become visible only after the prefix and terminal
instances establish what it abbreviates.

## Invariants

- Boundary source and target occurrences have distinct semantic IDs.
- A visible material handoff requires an explicit lineage edge.
- No source glyph may simultaneously paint multiple target occurrences.
- Symbolic bounds require a typed symbolic-range proof; the explicit-integer
  range authority must continue to reject them.
- An omitted range cannot be synthesized from layout, glyph text, or a generic
  fade fallback.
- Direct seek, reverse, reduced motion, and static endpoints remain
  deterministic under one external clock.

## Promotion Boundary

The revised fixed-bound exemplar must pass another human visual checkpoint
before the boundary-handoff treatment is shared. Symbolic-bound implementation
then requires its own semantic endpoint, assumptions, omitted-range vocabulary,
and reversible visual exemplar. Finite-product pressure remains necessary
before promoting a sum-specific presentation seam as a general binder motif.
