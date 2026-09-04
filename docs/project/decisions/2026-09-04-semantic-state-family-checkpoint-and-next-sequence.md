# Semantic State Family Checkpoint And Next Sequence

Date: 2026-09-04
Status: accepted; Loop 4 execution requires approval of its exact proposal

## Decision

Accept the completed Loop 3 applied-state-family boundary. Persistent
`before` and `after` snapshots remain ordinary transaction results, while
arbitrary `at(progress)` samples, transient dependency tokens, derived reads,
and evaluator caches remain pure ephemeral evaluation state outside semantic
history and recovery.

Keep the direct-module surface internal. The supply-tax and circle callers
prove one useful internal state-family and evaluator seam, but they do not yet
prove a public package, aggregate timeline, or renderer contract. Continue to
require caller-owned typed interpolation of declared independent drivers;
there is no generic scalar or derived-value interpolation fallback.

## Approved Sequence

1. Draft and review a separate nonvisual Loop 4 contract for aggregate
   transformation composition, conflict diagnostics, coherent historical and
   branch recovery, and stable logical timeline addressing.
2. If that architecture/API checkpoint passes, use Loop 5 for one canonical
   production-shaped Graph2D/KaTeX integration and stop for human visual and
   API review.
3. Only after the Loop 5 exemplar is approved, propose a separate bounded
   compatibility contract for selected existing KaTeX transformations.

This decision authorizes the Loop 4 proposal, not its implementation. The
exact ordered slices remain subject to review under the Theseus long-loop
workflow.

## Preserved Boundaries

- Aggregate composition must reuse the existing persistent snapshot,
  transaction, state-family, derived-graph, provenance, correspondence,
  lineage, and pinned-recovery authorities.
- Logical timeline locations distinguish settled persistent state from an
  in-transition ephemeral sample. They do not introduce wall-clock,
  animation-duration, URL-router, navigation, or renderer authority.
- A local historical read is inspection. Changing current aggregate state
  from a historical point requires a new coherent branch and transformation;
  object-local rewind does not mutate the rest of the aggregate.
- Graph2D, KaTeX, sampled-frame, motion-plan, host, Article, Focus Deck,
  Catalogue, public-facade, and compatibility work remain outside Loop 4.
- Existing KaTeX transformations stay on their current canonical paths until
  a reviewed exemplar proves the new adapter and ownership boundary.

## Source

This accepts all six recommendations in
`../reviews/2026-09-04-semantic-state-families-interpolation-closeout.md`.
