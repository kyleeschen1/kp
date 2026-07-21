# Fractional Linear Equation Exemplar Long-Loop Proposal

Status: approved  
Approved by: user  
Approved on: 2026-07-21

## Decision

Build `x/2 + 3 = 7` as the next single visible symbolic exemplar. It extends the
accepted `x + 3 = 7` motion language while adding a stacked fraction, explicit
division, two-sided multiplication, cancellation, and harder typography and
overflow constraints.

Do not bundle roots, exponent laws, function wrapping, or distribution and
factoring into this run. Those are separate visual topologies and remain later
exemplars. The unreviewed solve-x attention-responsive presentation is retained
as evidence but is not promoted or copied as an accepted pattern.

## Goal

Produce one searchable, URL-addressable, reversible reader exemplar whose
symbol motion makes the equation's legal operations causally legible:

1. subtract three from both sides;
2. simplify to `x/2 = 4`;
3. multiply both sides by two;
4. cancel the denominator and coalesce `2 * 4` into `8`;
5. settle into native KaTeX `x = 8`.

The exact-rational provider and verifier must accept the intermediate states.
The animation compiler, rather than card-specific CSS or coordinates, owns
geometry, typography, timing, and material correspondence.

## Acceptance criteria

- Both-side operations are shown causally rather than as magical side-switching.
- Numerator, fraction rule, denominator, operators, and `x` retain inspectable
  semantic and material identity.
- KaTeX typography is unchanged across native, moving, and settled states.
- Direct seek, URL reload, forward motion, and rewind are exact.
- No wrapping, clipping, collision, nested scrolling, endpoint jump, or
  card-specific motion coordinate is introduced.
- Static HTML remains searchable and retains semantic math, print, and
  no-JavaScript usefulness.
- Narrow presentation remains finite and reviewable without promoting the
  deferred solve-x attention model.
- Hidden generated cases validate reuse, but only `x/2 + 3 = 7` is promoted to
  a visible exemplar in this run.

## Approved slice order

1. Persist the approved proposal and typed contract.
2. Capture current fraction and linear-solve baselines.
3. Define the canonical exact-rational problem and solution trace.
4. Encode valid intermediate steps and verifier responses.
5. Define semantic identity and correspondence across all steps.
6. Establish the renderer-neutral composition boundary.
7. Author the searchable lesson and static fallback.
8. Expose numerator, fraction rule, denominator, and grouping geometry.
9. Select one timeline-wide font and layout plan.
10. Animate subtracting three from both sides.
11. Animate cancellation and simplification to `x/2 = 4`.
12. Introduce multiplication by two on both sides.
13. Cancel the denominator without fading or substitution.
14. Coalesce `2 * 4` into `8`.
15. Settle cleanly into native `x = 8`.
16. Add restrained operation-specific salience.
17. Prove exact forward, seek, and reverse motion.
18. Mount the exemplar in a searchable reader card.
19. Add semantic-editor discovery and direct routing.
20. Provide a finite non-overflowing narrow presentation.
21. Preserve no-JavaScript, search, print, and MathML output.
22. Run unseen generated fractional cases through the compiler.
23. Enforce wrapping, collision, ink-bound, and containment budgets.
24. Run accessibility, performance, build, browser, and contact-sheet gates.
25. Stop at the human exemplar checkpoint before family promotion.

Each slice is an independently reversible commit. Focused checks run inside
the loop; subsystem and broad release gates run at the relevant boundaries.

## Preservation boundary

Preserve existing semantic math, exact-rational provider behavior, linear-solve
assets, KaTeX identity and metrics, reader search and static output, URL
authority, rewind laws, developer-review history, production exclusion, and all
existing editor and reader routes.

## Explicit deferrals

- roots, radicals, exponent laws, and function wrapping;
- distribution and factoring;
- balance-scale or other geometric projections;
- family-wide promotion of new fraction choreography;
- promotion of the deferred solve-x attention-responsive presentation;
- arbitrary CAS behavior, LLM-authored geometry, or generalized overflow
  infrastructure.

## Stop conditions

Stop if semantic validity, material identity, KaTeX typography, URL authority,
rewind, searchable/static output, accessibility, or production isolation
regresses; if the exemplar requires card-specific motion coordinates or CSS;
if scope would expand into another symbolic family or attention-pattern
promotion; or when the final human exemplar checkpoint is reached.

## Rollback and promotion

Each verified slice is its own rollback unit. The complete exemplar must remain
removable through its content and route registration without affecting existing
readers. Promotion requires human acceptance that the fraction cancellation is
causal, typography is stable, attention is clear, and the experience remains
contained and smooth at wide and narrow sizes.
