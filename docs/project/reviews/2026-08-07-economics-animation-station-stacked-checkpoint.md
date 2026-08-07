# Economics Animation Station: Stacked Exemplar Checkpoint

Date: 2026-08-07
Outcome: `HUMAN_CHECKPOINT`
Contract: `run-contract.kp.motion-passage-publication-authoring-v2`, slice 9
Canonical route:
`/tutorials/economics/demand-shift/?layout=animation-station`
Source proposal:
`2026-08-07-motion-passage-publication-authoring-long-loop-proposal.md`

## What Is Ready For Review

The economics animation station is the sole visual exemplar. The graph and
first cue enter as one locally anchored composition. Ordinary cues receive a
height-independent 10vh reading hold. The demand-shift cue publishes a
read-only progress rail and maps 50vh of native document scroll to the retained
shared playhead: 40vh of semantic motion followed by 10vh of settlement. The
terminal equation-check passage remains ordinary prose while the station rails
release and graph roles withdraw in a reversible stagger.

The station does not intercept the wheel, use scroll snap, create a local
document scroller, or own a second animation clock. Direct checkpoint URLs and
reverse scroll reconstruct the sampled state. Phone, large-text, and
reduced-motion presentations fall back to normal embedded document flow.

The progress rail remains subordinate to the motion cue. It communicates
playhead state but does not add transport controls or become salience truth.
Graph identity, semantic presence, and the retained player remain the existing
authorities. Opacity is used only for true station entrance and withdrawal, not
to dim structurally relevant graph objects.

## Review Sequence

Run `npm run visual:economics-animation-station` to regenerate the disposable
capture set under `tmp/codex/economics-animation-station/`. The stable visual
check records these observable checkpoints:

1. `station-ready.png` — initial cue and graph read as a static document before
   semantic motion begins.
2. `station-cue-focused.png` — the motion cue is readable at the station edge.
3. `station-handoff.png` — cue ownership transfers before the graph moves.
4. `station-motion-midpoint.png` — the rail and shared playhead agree at 72%.
5. `station-settled.png` — the semantic transition is complete before result
   prose takes ownership.
6. `station-exit.png` and `station-exit-light.png` — terminal prose releases the
   rails, then the graph, without swallowing the prose.
7. `station-phone-reading.png` and `station-reduced-motion.png` — constrained
   and accessibility modes retain readable document flow.

During live review, scroll both directions and judge:

- whether the first cue is visible early enough and settles with the graph;
- whether the 10vh reading beat feels calm rather than sticky;
- whether cue disappearance, progress-rail motion, and graph motion form one
  intelligible handoff;
- whether the 40vh motion plus 10vh settlement is the right pace;
- whether the terminal release feels like a return to ordinary prose; and
- whether the rails and progress indicator remain helpful but visually
  subordinate.

No station behavior has been promoted into a shared projection contract. That
promotion remains blocked on explicit human approval of this checkpoint.

## Verification Evidence

Passed:

- `npm run test:economics-demand-shift-tutorial` — 81 checks.
- `npm run test:economics-demand-shift-css` — 17 checks.
- `npm run test:tutorial-motion-page-scale` — 59 checks.
- `npm run test:browser:economics-demand-shift-tutorial` — 12 Chromium checks.
- `npm run visual:economics-animation-station` — 7 Chromium checks.
- `npm run typecheck` — zero TypeScript or Svelte diagnostics.
- `npm run build` — production build completed.

The focused production performance smoke is red only at the startup budget
boundary, which is intentionally scheduled for attribution and closure in
slices 10–18:

| Metric | Observed | Budget | Checkpoint reading |
| --- | ---: | ---: | --- |
| Initial transfer | 255,555 B | 250,000 B | 5,555 B over |
| Initial script | 153,278 B | 150,000 B | 3,278 B over |
| Initial resources | 42 | 42 | at budget |
| Initial longest task | 168 ms | 150 ms | 18 ms over |
| Active p95 frame | 34.4 ms | 42 ms | within budget |
| Active long tasks | 0 | 100 ms max | within budget |
| Cumulative layout shift | 0 | 0.02 | within budget |

Active scrolling performs no SVG string construction or subtree replacement.
The retained graph sampled 28 frames, with a longest semantic sample under
0.4ms and a longest scroll-coordinator execution of 4.5ms. This checkpoint
therefore records bounded startup closure work, not evidence that additional
motion passages are infeasible.

## Preservation And Rollback

Preserve the economics semantic model, compiled lesson source, retained SVG
session, shared player, themes, direct seek/rewind, review capture, and current
split projection. The independently reversible visual rollback unit is the
animation-station presenter and its station-local stylesheet; the progress rail
is a separate framework-neutral publication unit.
