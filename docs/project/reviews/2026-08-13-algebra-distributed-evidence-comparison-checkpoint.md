# Algebra Distributed-Evidence Comparison Checkpoint

Status: HUMAN_CHECKPOINT
Date: 2026-08-13
Static route: `/learn/math/fraction-composition/?evidence=static`
Motion route: `/learn/math/fraction-composition/?evidence=motion`

## Question

Does placing motion evidence at the exact point where Article prose discusses
an operation improve comprehension enough to beat the same searchable lesson
with certified static endpoints?

This is a controlled Option B comparison, not a new layout system. It covers
two consecutive canonical operations:

1. `distribute-and-normalize` (`factored` to `normalized`); and
2. `evaluate-constant` (`normalized` to `constant-quotient`).

## Current, Baseline, And Challenger

- The approved default retains one attention stage followed by the complete
  Article.
- The static baseline is the native server-rendered Article: source prose and
  six certified KaTeX endpoint diagrams, with no live equation session.
- The motion challenger uses the same Article DOM, prose, semantic addresses,
  endpoints, and canonical animation. It moves one retained live renderer and
  one clock between the first two existing endpoint sockets.

When the reader activates constant evaluation, distribution returns to its
certified `normalized` endpoint and the live surface begins the next range at
that same `normalized` state. No second renderer, timeline, or semantic model
is created.

## Semantic Inspection Proof

The motion challenger now tests a capability that video and static diagrams do
not natively provide. `variable term` and `constant term` are typed semantic
tracks across the factored, distributed, normalized, constant-product, and
constant-quotient equation states. A reader may select either track from the
compact `Trace` control or directly from the live native-KaTeX equation. The
selection persists when the one live renderer moves into the next operation.

The URL records the active evidence range, exact endpoint when settled, and
semantic Article address. Reloading or sharing that URL seeks directly to the
requested endpoint and restores the selection without replay.

This spike also establishes a useful separation of meanings. The canonical
correspondence graph answers provenance; following the shared factor therefore
branches into both distributed terms. The evidence projector answers the
narrower attentional request, “show this term,” through typed branch membership
on native selector owners. It does not weaken or relabel the provenance graph.

## Human Review

Compare the static and motion routes, then answer:

- Is it immediately clear what to read, what can move, and how to continue?
- Does local motion explain either operation better than its static endpoint?
- Does the handoff from distribution to constant evaluation feel like one
  persistent equation rather than two unrelated embeds?
- Is the native Play/Pause/Replay/scrubber transport useful, or is it too much
  interface for an inline evidence block?
- Does the narrower Article measure and compact live stage reduce eye travel?
- Would repeating this rhythm through a longer lesson feel calm or repetitive?
- Does selecting a term answer “where did this go?” with less reconstruction
  than scrubbing a video or comparing two static diagrams?
- Is the selected term unmistakable while the rest of the equation remains
  readable context?
- Does the selection persist across the operation handoff in the way you
  expect?
- Are the two `Trace` buttons a worthwhile affordance or already too much UI?

The challenger deliberately preserves the existing transport rather than
polishing a new control. Its visible cost is evidence for the comparison.

## Durable Truth Verified Before Review

- both projections preserve the Article's server-rendered searchable prose;
- static mode creates zero canonical equation sessions;
- motion mode has exactly one canonical equation host across both operations;
- the second range starts at the first range's exact final checkpoint;
- direct scrubbing reaches `normalized` and `constant-quotient` without replay;
- the live equation uses the dark-first semantic palette and remains readable;
- the compact stage stays above the canonical equation fit floor;
- the approved default, the distribution attention arc, no-JavaScript truth,
  semantic endpoint restoration, and 390 px composition retain focused checks.
- term selection is available through controls and native equation targets;
- a selected semantic track survives the renderer's range handoff;
- URL restoration recovers range, endpoint, and selection without playback;
- adjacent syntax stays context under the local branch-membership projection;
- salience paint revisions include endpoint identity, preventing stale focus
  attributes when retained DOM owners cross into a new state.

Evidence:

- `npm run typecheck:public-fraction-composition`
- `npm run test:public-fraction-composition`
- `npm run visual:public-fraction-composition` (8 Chromium checks)
- `npm run build:public-fraction-composition`

Disposable comparison captures are written to
`tmp/codex/public-fraction-composition/distributed-static.png` and
`distributed-motion.png`.

The route-only build is 9.42 KB gzip HTML, 14.90 KB gzip CSS, and 108.43 KB
gzip entry JavaScript. The complete distributed-evidence and semantic-
inspection experiment added roughly 0.24 KB HTML, 0.44 KB CSS, and 1.72 KB
JavaScript relative to the preceding public symbolic checkpoint. The
static query avoids runtime session construction but does not yet split the
shared entry bundle. The separate repository-wide common-reader budget check
remains above its established ceiling (152,834 versus 145,000 gzip bytes); that
pre-existing product-health issue is not repaired or hidden by this spike.

## Preservation, Promotion, And Rollback

Preserve Article v1, canonical equation semantics and motion, the approved
default route, the Option A distribution arc, native KaTeX endpoints, public
semantic links, static publication, and the user's economics worktree edits.

Human approval may select a direction for another bounded algebra iteration.
It does not authorize a shared projection API, catalogue-wide rollout, Article
grammar change, or delayed economics caller. A structurally different caller
is still required before promotion.

Rollback is the two opt-in query modes, their two server-rendered activation
buttons, the local distributed-evidence controller and CSS, the explicit dark
theme input, typed inspection tracks, local branch-membership projector, and
their focused tests. The endpoint-aware salience revision is a separately
tested renderer correctness fix and is not part of the visual rollback unit.
