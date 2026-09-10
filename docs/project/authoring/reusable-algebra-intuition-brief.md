# Reusable algebra intuition: exemplar brief

Status: approved task brief; extended source/presentation not yet implemented
Canonical plan: `../threads/2026-09-10-reusable-algebra-intuition-approved-loop.md`

## Question and answer

**Question:** How can we regroup and expand an expression without losing any of
its contributions?

**Reader starting point:** multiplication counts copies; parentheses can name a
whole quantity; the letter x represents a real number. No cancellation or division
by x+3 is assumed.

**Answer:** First count copies of the identical whole group. Then, when opening
that group, apply the combined count to every term inside it. Regrouping changes
how the contribution is written, not its value.

Primary source trace to implement through the bounded versioned extension:

1. `2(x+3)+3(x+3)` — recognize two counts of the same whole group.
2. `(2+3)(x+3)` — collect the counts; preserve the complete group.
3. `5(x+3)` — evaluate the count, not the group.
4. `5x+5*3` — both contributions receive the count of five.
5. `5x+15` — evaluate the constant contribution; preserve 5x.

This is one instructional route, not a claim that collecting first is universally
best. The route avoids expanding each repeated group separately. Do not create a
second animated derivation to make that modest editorial contrast.

## Independently recoverable questions

**Collecting (states 1–3): Why can these two groups be combined?**
Both terms count copies of the same quantity x+3. Add the counts while preserving
that quantity. Establish the original two terms on direct entry; do not require
the reader to have seen the parent explanation.

**Distributing (states 3–5): Where does each contribution go when we expand?**
Five copies of x+3 contain five copies of x and five copies of 3. Establish the
whole group and coefficient on entry; retain the reference to the parent reason.

**Transfer check:** if the shared group were x+y, which part could still be
evaluated numerically, and which contributions must remain? This is a self-check
of structure, not automated grading or measured comprehension evidence.

## Visual evidence and preservation

- Host: existing `/experiments/reusable-reasoning/?example=composed-algebra` on
  the shared localhost:8000 server. Preserve its v1 default while adding an opt-in
  extended source until the new primary is deliberately mounted in its slice.
- Current asset authority: `createKpComposedAlgebraSemanticAsset`, with a
  revision-derived composed-algebra ID, issued factoring/evaluation evidence and
  registered semantic operation projections. Extended steps must use those same
  operation/compositor channels, not glyph-equality correspondence.
- Factoring retains complete x+3 groups and canonical fusion/reception.
- Distribution uses its canonical grouped-copy and arc treatment, without a
  caller-specific departure, inflated clearance arc or alternate renderer.
- Evaluation uses canonical ink-glyph evaluation in the exact surrounding context.
- Keep the shared Focus Card shell, native settled typography, semantic timeline,
  step navigation, continuous reverse/scrub, reduced-motion choice and exact return.
- Question/answer/evidence are editorial composition, not proof, geometry, a new
  universal schema, quiz gate or permanently competing headline.

At the human checkpoint inspect the complete five-state explanation and both
independently entered questions. The reader should be able to locate what changes,
what is preserved and where every final contribution came from. A passing test
suite does not establish that the explanation communicates this well.

## Baseline commands

`npm run test:composed-algebra-authoring` preserves the existing v1 bounded source,
proof, projection, ownership, timeline and publication contracts.
`npm run check:composed-algebra-workflow` reproduces retained source revisions,
typed repair examples and immutable editions. These are implementation baselines,
not an unfamiliar-author or learning-outcome benchmark.

The opt-in source/presentation integration is the rollback unit. Preserve old
callers and native endpoints; do not generalize until s12 acceptance.
