# Revise The Inline Lesson Proof To A Depth Handoff

Date: 2026-08-04
Status: accepted for bounded discovery

Timing refinement: the cue-center crossing at the stage bottom no longer
starts semantic motion. Boundary punctuation, faster prose recession, and the
midpoint motion gate are recorded in
`2026-08-04-kp-depth-handoff-punctuation-and-motion-gate.md`. The direct depth
geometry, unelevated stage, cue plane, and following runways remain in force.

## Decision

Replace the economics proof's external padding corridor and anticipatory cue
dimming with a direct depth handoff. The stage remains unelevated and pins in
the upper viewport. The following cue is fully opaque, backed by the same page
color, and may overlap the lower stage while leading attention. Its vertical
center is the projection anchor.

When that center crosses the stage bottom, scroll simultaneously begins the
block-local animation and maps the cue through the stage's lower half. At the
stage midpoint, cue opacity reaches zero after a shallow negative
`translateZ` and restrained scale reduction. The existing following runway
then lets motion finish before the next fully opaque cue arrives. Reverse
scroll uses the same projection.

The cue remains above the stage while visible. Because `z-index` is discrete,
the implementation moves it behind the opaque stage plane only in the fully
occluded state; continuous opacity, perspective, scale, and the page-colored
cue plane provide the depth impression.

## Reason

The padding corridor dimmed text before it was relevant and reserved a large
empty band between prose and graph. The direct handoff makes the reading order
literal: read the cue, watch it yield to the graph, then let the synchronized
motion continue. The same one-column grammar also removes the need for a
separate phone composition.

## Preservation Boundary

Retain the query flag and rollback boundary. Do not change:

- economics truth, animation frames, graph rendering, or stage composition;
- canonical prose, passage identity, controls, semantic URLs, TOC, or review;
- the approved split-layout default;
- shared lesson-shell contracts or another tutorial;
- the paused S-expression execution checkpoint or promotion ledger.

## Proof Criteria

- every cue is fully opaque below the stage and has no approach dimming;
- cue-center geometry projects deterministically from stage bottom to midpoint;
- opacity, shallow depth, and scale reverse exactly with scroll;
- the cue plane matches the page and introduces no card border, radius, shadow,
  or layout-width change;
- the same center anchor begins the block-local motion corridor, while the
  runway preserves authored holds and completion time;
- phone text retains one readable measure without horizontal overflow;
- large text and reduced motion select ordinary fully opaque reading flow;
- the default economics layout and review capture retain their regressions.

## Consequences

This supersedes the padding `P`, approach, and reading-shelf presentation detail
of the prior attention-corridor proof. It does not authorize a generic
scroll-scene framework, shared cue abstraction, second-caller rollout, or
default-layout replacement. Human review of this economics exemplar remains
the next gate.
