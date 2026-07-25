# Full-scene fraction compositor checkpoint

Date: 2026-07-25

Status: reviewable; human visual approval required

Canonical exemplar: `/glyph-reconciliation-experiment.html`, “Merge equal
native denominators”

Source proposal:
`docs/project/reviews/2026-07-25-full-scene-fraction-compositor-long-loop-proposal.md`

Run contract:
`run-contract.kp.full-scene-fraction-compositor-v1`

## What the experiment now proves

- Every visible source and target paint atom has one total semantic-constrained
  disposition. The fraction exemplar inventories 9 source and 6 target paint
  atoms, including both source fraction rules.
- Exact native KaTeX owns progress 0 and progress 1. One inert material scene
  owns every interior frame; the hidden endpoint subtrees never supply
  overlapping visual ink.
- Glyphs and structural rules use the same stateless direct-seek sampler.
  Repeated seeks and reverse playback reproduce identical frames.
- Moving clones are paint-only. Native endpoint DOM retains focus, annotation,
  Cloze, hover, and accessibility authority.
- The implementation remains generic: four production modules, six lifecycle
  primitives, no fraction-, branch-, radical-, viewport-, or operation-specific
  behavior in the compositor.

## What to review

At the source endpoint, the card should show the exact native
`x/2 + y/2`. During motion, both fractions, both rules, `x`, `y`, `+`, and the
denominators should move as one reconciled scene. Near the middle the scene
becomes deliberately compact while the two fraction structures converge. At
the target endpoint, exact native `(x+y)/2` should own the ink and its
denominator should regain focus and Cloze affordances.

The main subjective question is whether the compact middle reads as a
continuous merger or as confusing crowding. Automated checks prove ownership,
continuity, endpoint, reverse, accessibility, and performance contracts; they
do not approve that gestalt.

## Gate evidence

- Full repository suite: 2,380 passing tests.
- Compositor browser suite: 28 passing Chromium checks.
- Shared reader conformance: 9 passing Chromium checks.
- Visual matrix: 10 wide/phone captures at 0%, 25%, 50%, 75%, and 100%.
- Thirty-two-track stress sample: 0.0078 ms average against a 1 ms budget.
- Experiment route: 18.9 KB gzip; 10.1 KB growth against a 12 KB allowance.
- Controller: 38.5 KB against a 40 KB ceiling.
- Production closures, build, workspace validation, direct seek, rewind, and
  responsive containment pass.

The broader animation benchmark still reports existing advisory transfer-size
and constrained-device targets, but no regression was introduced by this
experiment.

## Decision boundary

Do not generalize this compositor to branches, radicals, compound transforms,
text, code, reader production, or export backends before explicit visual
approval. A rejected or revised checkpoint rolls back at the exemplar wiring
boundary while preserving the semantic model, total scene contracts, and
generic measurement evidence.
