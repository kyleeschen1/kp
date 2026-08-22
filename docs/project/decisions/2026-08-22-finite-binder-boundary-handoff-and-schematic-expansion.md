# Finite-Binder Retained Equivalence and Schematic Expansion

Status: revised after fixed-bound human review; retained-equivalence generator
is the current exemplar candidate, symbolic-bound support remains separate
Accepted: 2026-08-22
Applies to: finite sum expansion and later finite product pressure

## Decision

Finite-binder expansion must preserve the complete source as stable context.
For the reviewed fixed-range exemplar,

\[
\sum_{i=1}^{3} a_i \longrightarrow a_1+a_2+a_3,
\]

the source, a fixed equality relation, and the final target slots occupy their
settled geometry from the start. A distinct live projection of the source body
generates `a_1`, `a_2`, and `a_3` in range order. The complete source stays
visible while the right side is constructed.

The lower and upper bounds remain semantic provenance for the first and final
references, but their glyphs do not travel. Each target reference owns fresh
paint and a distinct occurrence identity. Connectors may appear only after the
neighboring terms and their references have arrived.

The earlier physical boundary-handoff candidate was rejected at human review:
moving the tiny bounds produced an irregular focal path and did not read as a
smooth expansion. The semantic lineage remains useful truth; it no longer
implies paint persistence.

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
- `range-value-instantiation`: a target reference derives its value from the
  verified range while receiving a fresh representation occurrence;
- `lower-bound`, `range-successor`, and `upper-bound`: provenance categories
  for those values, not prescribed motion routes;
- `omitted-range`: a possibly empty or provably nonempty ordered interval,
  with that distinction made explicit.

Authors choose exhaustive versus schematic presentation. Renderers do not
infer the choice from term count or available width.

## Choreography

For the fixed three-term exemplar:

1. Reserve the complete equation geometry and establish the source plus fixed
   equality relation.
2. Keep the source occurrence frozen and fully visible.
3. Emit distinct body instances from a live projection of `a_i`, left to right.
4. Resolve each target reference in place from verified range truth.
5. Introduce each connector only after both adjacent terms are established.
6. Settle the constructed side onto exact native KaTeX target paint without
   moving the source or equality relation.

For a symbolic upper bound, the same boundary handoff surrounds an omitted
range. The ellipsis should become visible only after the prefix and terminal
instances establish what it abbreviates.

## Invariants

- Source, relation, transit, and target representations have distinct
  occurrence IDs under the shared state-retention projection.
- Range provenance does not imply material persistence.
- No source glyph may simultaneously paint multiple target occurrences.
- Symbolic bounds require a typed symbolic-range proof; the explicit-integer
  range authority must continue to reject them.
- An omitted range cannot be synthesized from layout, glyph text, or a generic
  fade fallback.
- Direct seek, reverse, reduced motion, and static endpoints remain
  deterministic under one external clock.

## Promotion Boundary

The retained-equivalence fixed-bound exemplar must pass another human visual
checkpoint before its generation treatment is shared. In particular, direct
body travel across equality versus a shallow routed handoff remains an
exemplar-level aesthetic decision. Symbolic-bound implementation then requires
its own semantic endpoint, assumptions, omitted-range vocabulary, and
reversible visual exemplar. Finite-product pressure remains necessary before
promoting a sum-specific presentation seam as a general binder motif.
