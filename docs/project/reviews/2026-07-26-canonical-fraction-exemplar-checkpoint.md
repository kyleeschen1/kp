# Canonical fraction exemplar checkpoint

Date: 2026-07-26

Status: `HUMAN_CHECKPOINT`

Plan authority:
`docs/project/reviews/2026-07-25-canonical-animation-construction-governed-round-trip-long-loop-proposal.md`,
slice 15.

## Review entrypoints

- Live product reference: `/reader/split-merge-fractions/`
- Stable capture command: `npm run visual:fraction-canonical-checkpoint`
- Browser-native contact sheet:
  `tmp/codex/fraction-canonical-checkpoint/index.html`
- Disposable capture manifest:
  `tmp/codex/fraction-canonical-checkpoint/manifest.json`

The stable command builds the product and regenerates a self-contained HTML
review page. Its 20 frames cover progress 0, 250, 500, 750, and 1000 in wide
and phone viewports under full and reduced motion. The HTML page embeds its
captures so review does not depend on opening individual PNG files.

## Acceptance result

| Criterion | Result |
|---|---|
| One motivated equation anchor | Pass |
| Native endpoint size for `x`, `y`, `+`, denominators, and rules | Pass |
| No lineage-backed split/merge opacity fading | Pass |
| Readable midpoint without double ink, clipping, or unexplained vertical travel | Pass |
| Pixel-stable direct seek and rewind | Pass |
| Wide, phone, full, and reduced projections | Pass |
| Native DOM retains semantic and interaction authority | Pass |
| Zero compatibility paint on migrated transitions | Pass |
| Ordinary routes remain outside the optional canonical session chunk | Pass |
| Frozen release budgets | **Fail** |

Manual inspection of the 20-frame sheet found centered, contained native
typography at both endpoints and readable geometric branching/convergence.
The canonical card is one pixel wider than the compatibility-owned screenshot;
the equation ink itself is unchanged. The accepted snapshot now records that
canonical ownership boundary.

The focused Chromium cohort passes 10/10 tests, including exclusive ownership,
route chunk eligibility, seek/rewind, reduced motion, native semantic
authority, phone containment, static searchability, and midpoint screenshots.
The contact-sheet contract passes 8/8 tests, typecheck passes, the production
build passes, and the capture command emits all 20 frames.

## Promotion gate that did not pass

`npm run check:reader-budgets` fails the previously frozen ceilings across
shared reader routes:

- shared equation runtime closure: 132,761 gzip bytes versus a 120,543-byte
  baseline and 126,571-byte allowed limit;
- distribution runtime closure: 59,235 versus a 56,921-byte allowed limit;
- quadratic runtime closure: 53,982 versus a 53,700-byte allowed limit; and
- compiled HTML gzip exceeds its limit on the shared equation routes, with
  small raw-HTML excesses on divide-both-sides and split/merge.

The failure is not isolated to the migrated fraction route, and the checker
already excludes dynamic imports from eager runtime closure. Raising baselines
would violate the contract's no-silent-widening rule. Broad route splitting or
HTML compaction would change untouched reader delivery and therefore is not a
safe slice-15 repair.

## Decision

The fraction exemplar itself is promoted visually and architecturally, but the
waiver for automatic continuation does not activate because every named
promotion criterion did not pass. Stop at `HUMAN_CHECKPOINT`.

The next decision is whether to authorize a bounded budget-recovery slice
before slice 16. The recommended recovery is to trace the shared runtime and
compiled-HTML deltas to their first accepted commits, then recover the frozen
ceilings through deletion or route-owned lazy loading without raising them.
After the frozen budgets pass, the exact successor contract can resume at
slice 16; no animation implementation needs to be forked or rolled back.
