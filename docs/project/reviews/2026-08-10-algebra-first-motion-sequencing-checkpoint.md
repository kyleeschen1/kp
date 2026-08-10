# Algebra First Motion Sequencing Checkpoint

Date: 2026-08-10
Outcome: `HUMAN_CHECKPOINT`
Canonical route: `/tutorials/algebra/fraction-composition/`
Canonical passage: `distribute`
Canonical range: `distribute-and-normalize`

## What Is Ready

The first authored `kp-motion` passage now forms one complete learner path:
its existing before prose remains visible, a passage-local play and scrub
transport drives only the named canonical range, the live equation replaces
the static target endpoint, and the existing after prose follows the settled
state. The player, fraction animation asset, renderer, and frame clock are
retained rather than duplicated.

Semantic prose links remain focus controls rather than timeline controls.
Checkpoint URLs still seek directly without replay. Reduced motion settles the
same local range immediately. The no-JavaScript article and Article v1 source
grammar are unchanged.

## Review

Open the canonical route and scroll to “Read the grouped expression first.”
Use **Play distribution**, pause or scrub it, and replay it. Judge:

- whether the transport is in the right place between anticipation and result;
- whether the source-to-target transformation is understandable at normal
  speed;
- whether the settled equation hands attention cleanly to the after prose; and
- whether this is the correct interaction packet to repeat for the remaining
  four motion passages.

Regenerate the disposable wide captures with
`npm run visual:algebra-fraction-composition`. The relevant files are
`wide-motion-ready.png` and `wide-motion-settled.png` under
`tmp/codex/algebra-fraction-composition-review/`.

## Verification

Passed:

- `npm run test:kp-article-v1` — 100 checks.
- `npm run test:browser:algebra-article` — 13 Chromium checks.
- `npm run test:browser:fraction-composition:determinism` — 6 checks across
  Chromium and Firefox.
- `npm run visual:algebra-fraction-composition` — 6 Chromium checks.
- `npm run typecheck` — zero TypeScript or Svelte diagnostics.

## Promotion Boundary

This is deliberately one reversible exemplar. Approval promotes the binding
pattern to the other four algebra motion passages and then tests whether the
presenter seam should become shared Article v1 infrastructure. It does not yet
change economics, layouts, source syntax, or vignette contracts.

Preserve the Article v1 grammar, fraction semantic model, canonical animation
asset, shared player and clock, static endpoints, URL restoration, semantic
focus, and authoring surface. The rollback unit is the algebra motion-exemplar
presenter, its local styles and tests, plus the range transport methods added to
the algebra runtime session.
