# Canonical Algebra Article Human Checkpoint

Date: 2026-08-10  
Status: awaiting human judgment  
Contract: `run-contract.kp.canonical-algebra-article-recovery-v2`  
Slice: `s20` (`HUMAN_CHECKPOINT`)

## What is under review

The first algebra Article v1 motion passage now embeds the same retained,
chrome-free fraction-composition session used by the canonical reader. The
Article windows the unchanged global timeline over `distribute-and-normalize`;
it does not construct an editor player, renderer, animation asset, or passage
clock.

The promotion question is narrow: does the Article preserve the canonical
equation's visual behavior, attention choreography, and object continuity well
enough to bind the remaining four named ranges through data?

## Live review

- Canonical reference, first-range source:
  `http://localhost:8000/reader/fraction-composition/?kpTheme=dark&kpMotion=full&kpProgress=0`
- Algebra Article, first-range source:
  `http://localhost:8000/tutorials/algebra/fraction-composition/?kpTheme=dark#kp-ref:solve/factored`
- Canonical reference, first-range target:
  `http://localhost:8000/reader/fraction-composition/?kpTheme=dark&kpMotion=full&kpProgress=154`
- Algebra Article, first-range target:
  `http://localhost:8000/tutorials/algebra/fraction-composition/?kpTheme=dark#kp-ref:solve/normalized`

On the Article, review play, pause, replay, and the local scrubber. Then use the
source and target checkpoint links. A direct jump should paint one endpoint
without replaying intermediate motion. Prose semantic focus should change
attention without changing timeline progress.

## Captured review

Run:

```sh
npm run visual:algebra-canonical-checkpoint
```

The stable command writes disposable evidence to
`tmp/codex/algebra-article-canonical-checkpoint/`:

- `contact-sheet.png`: paired reader/Article source, midpoint, and target in
  wide and phone dark-theme profiles;
- `index.html`: the same pairs as a scrollable review sheet;
- `manifest.json`: exact local/global samples, routes, viewports, and capture
  ordering.

The capture hides only the global development toolbar so it cannot cover the
equation surface. It does not alter stage geometry, salience, or timeline
state.

## Review criteria

Approve only if:

1. The same equation fragments win attention at source, midpoint, and target.
2. The distribution motion, settlement, ghosting, and native endpoints look
   like the canonical reader—not like a generic player approximation.
3. Reader and Article preserve object identity and one exclusive material
   paint owner while scrubbing, reversing, replaying, and direct-seeking.
4. Wide and phone presentations remain legible, with no clipped or competing
   material.
5. The canonical reader itself has not changed visually.

## Automated evidence

- `npm run test:browser:algebra-article-parity`: passed 8 configurations
  (Chromium and Firefox; wide and phone; light and dark), sampling five exact
  points in the first range.
- `npm run test:browser:algebra-article`: passed 17 Chromium checks.
- `npm run test:browser:canonical-stage-shell`: passed 6 shared-host checks.
- `npm run test:browser:fraction-composition:determinism`: passed 6 Chromium
  and Firefox checks.
- `npm run typecheck`: passed.
- `npm run visual:algebra-canonical-checkpoint`: generated and visually
  inspected the paired checkpoint sheet.

The complete canonical visual matrix still reports the same six unrelated
zero-contact families present before this loop. All 16 configurations and
1,296 frames pass the other ownership, endpoint, fit, overflow, opacity,
review, and runtime assertions. This is bounded pre-existing clearance debt,
not a shared-host migration regression.

## Decision boundary

Approval unlocks only slices `s21` through `s24`: data-bind the remaining four
ranges, retain one session across all five passages, pressure-test the complete
lesson, and run release closeout. It does not approve a new layout, Article
grammar change, curriculum expansion, or catalogue-wide promotion.
