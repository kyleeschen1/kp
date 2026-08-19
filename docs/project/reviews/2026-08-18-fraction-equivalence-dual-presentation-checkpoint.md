# Fraction Equivalence Dual-Presentation Checkpoint

Date: 2026-08-18
Status: approved 2026-08-18
Run contract: `run-contract.kp.theme-planner-fraction-equivalence-v2`

## Review question

Which amount of visible reasoning best communicates the governed operation

\[
\frac{a}{b}\longrightarrow\frac{2a}{2b}?
\]

Both artifacts use the same verified nonzero-scaling law, semantic identities,
target, authoring operation, deterministic clock, native KaTeX settlement, and
surface adapter. They differ only in learner-visible presentation.

## Explanatory presentation

URL:
`http://127.0.0.1:8000/?artifact=animation.equation.fraction-equivalence.v1`

The source stage shows

\[
\frac{2}{2}\cdot\frac{a}{b}.
\]

The two visible occurrences of the shared factor travel one-to-one into the
target numerator and denominator. Both visible source fraction bars participate
in one typed many-to-one fusion and settle into the native target bar; neither
bar is treated as disposable decoration while the other merely stretches.
The two bar segments occupy complementary target partitions and share one
arrival cohort with the numerator and denominator terms, so symbolic material
and division structure combine as a single event.

The verified law still records that the unit factor preserves value. An
explanation may reveal an anchored `2/2 = 1` annotation, but that commentary is
not baked into the foundational KaTeX endpoint or its motion.

## Compact presentation

URL:
`http://127.0.0.1:8000/?artifact=animation.equation.fraction-equivalence.compact.v1`

The source stage aligns one visible `2 ×` operation with the numerator and one
with the denominator. Their factor occurrences travel one-to-one into the
target while the multiplication signs withdraw.

This presentation should communicate the familiar procedure without implying
that one detached glyph mysteriously duplicates itself.

## Preservation boundary

- `operation.equation.fraction-equivalence.v1` remains mathematical authority.
- `kp.algebra.scale-fraction-equivalently` remains the single authoring entry.
- Both presentations require the same denominator and factor nonzero evidence.
- No renderer-wide motif or fraction-family rollout is approved by this spike.
- Timing, spacing, unit-value notation, and the compact operation arrangement
  remain provisional until human review.

## Numeric pressure case

Target products retain their operation whenever juxtaposition would change or
obscure the notation. In particular,

\[
\frac{2}{2}\cdot\frac{3}{5}
\longrightarrow
\frac{2\cdot3}{2\cdot5},
\]

not `23/25`. Evaluating those products is a separate semantic operation and is
not authorized by fraction equivalence itself. Symbolic coefficient products
remain compact, so the canonical target is still `2a/2b`.

## Mechanical evidence

- `npm run test:fraction-equivalence-presentation-plan`
- `npm run test:fraction-equivalence-exemplar`
- `npm run test:equation-series-fraction-equivalence`
- `npm run test:browser:fraction-equivalence`
- `npm run test:equation-surface-preservation`
- `npm run test:selected-surface-capability-declarations`
- `npm run test:animation-library-display`
- `npm run typecheck`
- `npm run check:architecture`
- `npm run visual:fraction-equivalence`

The disposable review sheet is generated at
`tmp/codex/fraction-equivalence-checkpoint/index.html`; its contact sheet is
`tmp/codex/fraction-equivalence-checkpoint/contact-sheet.png`.

## Approval criteria

Review whether:

1. each visible factor has an intelligible origin;
2. the explanatory version makes preservation by one perceptually obvious;
3. the compact version reads as one coordinated operation rather than two
   unrelated insertions;
4. the original numerator, denominator, and division structure remain easy to
   follow;
5. forward and reverse motion preserve identity without overlap, blanking, or
   endpoint correction;
6. the two source fraction bars read as one fusion rather than one fading while
   the other stretches;
7. the terms and fraction-bar seam finish combining simultaneously.

Approval selects the exemplar language only. A second structurally different
caller is still required before extracting shared motif infrastructure.

## Review outcome

Approved after the fraction bars were changed from fade-and-extension behavior
to typed many-to-one fusion, numeric products retained explicit multiplication,
and term material plus bar segments were synchronized as one join event.
