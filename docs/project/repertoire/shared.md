# Shared reading

## Detail and continuity

### Semantic moves

- [x] `reading.child` Expose checked child reasoning — energy and scalar cancellation. [Evidence](../reviews/2026-09-15-reader-authoring-reuse-boundary.md)
  Example: Open a parent operation's checked justification rather than inventing smaller steps
  Audit: implemented
- [x] `reading.middle` Unfold a middle step while preserving downstream context across independent callers. [Evidence](../reviews/2026-09-17-chain-first-transfer-review.md)
  Example: Inspect norm scaling without losing the later energy cancellation and result
  Audit: implemented — accepted nonterminal energy and independent scalar transfer; bounded to their checked child operations

### Visual motifs

- [x] `motif.reading.unfold` Keep parent and endpoints while inserting detail — terminal energy exemplar. [Evidence](../threads/2026-09-16-disclosure-persistence.md#inline-unfolding-exemplar)
  Example: Open child reasoning while the compact source/result remain recognizable
  Audit: implemented
- [x] `motif.reading.rail` Seek on a rail with native-ink viewport clearance — energy exemplar. [Evidence](../threads/2026-09-16-disclosure-persistence.md#rail-seeking-and-readable-navigation)
  Example: Jump to a selected equation position and retain readable top/bottom clearance
  Audit: implemented
- [x] `motif.reading.inset` Retain inset equation records with single-copy docking — energy exemplar. [Evidence](../threads/2026-09-16-inset-equation-fenceposts.md)
  Example: The active equation lands in its permanent record without two blurred copies
  Audit: implemented

## Reuse and comparison

### Semantic moves

- [x] `reading.recall` Recall a result and use it locally — bounded momentum example. [Evidence](../threads/2026-09-15-concept-dependency-reuse.md)
  Example: A pinned p=mv definition supports its later use in the energy argument
  Audit: implemented
- [ ] `reading.cross-document` Reuse a checked result across documents with context-specific explanation.
  Example: Import a justified identity with its assumptions into a new argument
  Audit: unaudited
- [ ] `reading.assumptions` Compare conclusions under different held-fixed assumptions.
  Example: Compare changing mass at fixed momentum with changing mass at fixed speed
  Audit: unaudited
- [ ] `reading.relation-kind` Distinguish equivalence, implication, approximation and information loss.
  Example: Squaring implies a candidate equation; it need not preserve exactly the original solutions
  Audit: unaudited

### Visual motifs

- [ ] `motif.reading.long-code` Coordinate persistent prose with a long code transformation.
  Example: Keep each reason attached to its referent when prose is much taller than the code
  Audit: unaudited
- [ ] `motif.reading.assumptions` Compare assumptions while retaining shared referents.
  Example: Two conclusions keep the same quantities but expose different fixed conditions
  Audit: unaudited
