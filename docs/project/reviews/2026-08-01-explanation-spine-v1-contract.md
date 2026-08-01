# ExplanationSpineV1 Contract

Date: 2026-08-01
Status: frozen for deterministic generated solve-x compilation

## Purpose

`ExplanationSpineV1` is the smallest reviewable editorial structure between a
verified problem trace and learner-facing text. It records one explicit
learner state, one bounded vocabulary contract, ordered sections and beats,
closed template intent, and verified claim/source references.

It is not prose. It accepts no raw text, LaTeX, HTML, geometry, animation
direction, renderer choice, or free-form mathematical assertion.

## Closed structure

V1 fixes four section kinds in this order:

1. orientation;
2. subtract;
3. divide; and
4. solution.

Every beat belongs to exactly one section. The concatenated section beat IDs
must exactly match the beat array, so order cannot drift between projections.
Each of the eight V1 templates fixes its compatible beat kind, section,
verified claim kind, required vocabulary, and frame/operation source kind.

## Learner and vocabulary boundaries

The first learner state is `early-algebra-foundation` at `standard` detail. It
declares assumed knowledge and the intended knowledge change through closed
concept IDs. It is input to deterministic projection; no persistent learner
profile or inferred personalization is introduced.

The vocabulary contract separates familiar, introduced, and blocked terms;
declares approved notation readings; limits cues to 12 words; and uses one
clause. Beats can reference only vocabulary available in that contract and
must include the terms required by their selected template.

## Claim authority

Claims are opaque verified references with an exact instance, kind, source
frame or operation, and `provider-verified` status. Every beat must reference a
claim of the kind required by its template. A frame/operation source on the
beat must match one of those claims. Unknown, cross-instance, unverified, or
free-form claims fail closed.

The next slice will derive the claim packet from the accepted bridge and
compiled asset, instantiate one hand-authored V1 spine, and deterministically
project it into learner-facing cues. Any wording remains reviewable and no
network or model call is allowed.
