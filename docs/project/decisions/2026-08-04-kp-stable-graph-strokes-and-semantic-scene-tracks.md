# Use Stable Graph Strokes And Semantic Scene Tracks In The Economics Proof

Date: 2026-08-04
Status: superseded in part for bounded discovery

Superseded on 2026-08-04 by
`2026-08-04-kp-paragraph-owned-stage-occlusion.md`: paragraph crossing now
owns semantic progress, so explicit scene tracks and the cue fade gate no
longer apply. The economics stroke trial is also revised to keep structural
lines at `1px`, use `1.5px` curves, and retain the half-width grid.

The remaining variable stroke hierarchy was superseded by
`2026-08-04-kp-two-column-natural-graph-and-uniform-strokes.md`: the economics
profile now derives curves, guides, traces, and grid lines directly from the
canonical `1px` axis width. Its semantic-scene and style-preserving ghost
rationale remains historical evidence.

## Decision

Refine the query-selected economics proof at
`/tutorials/economics/demand-shift/?layout=inline-sticky` with two independent
but coordinated contracts.

First, keep graph stroke geometry stable. Economics axes, ticks, curves,
guides, movement traces, and point outlines use the renderer-owned
`--kp-graph-line-width: 1px`; grid lines derive
`--kp-graph-grid-line-width: calc(var(--kp-graph-line-width) * 0.5)`. Focus may
change color, opacity, or contextual salience, but never line width. A ghost
keeps the source object's stroke topology and dash style and becomes a ghost
through opacity rather than by turning a solid line into a broken one.

Second, replace generic post-passage runways with explicit scene tracks only
for passages that own semantic motion. The demand-shift track is `52svh`; the
supply-movement track is `48svh`. Each track's physical height and projected
motion corridor are the same budget, so its first pixel maps to normalized
motion `0`, its last pixel maps to `1`, and reverse scroll reconstructs the
same frames. Authored keyframe plateaus remain the only internal pauses.
Ordinary context and conclusion passages receive normal document spacing, not
animation-shaped empty space.

Keep visual spacing separate from time. The animation block receives explicit
rem/viewport-clamped top and bottom margin tokens; those margins do not extend
motion progress.

In this reading mode, inline KaTeX inherits surrounding prose size, `P` and
`Q` use the same explicit prose-size token, and the persistent equation strip
is hidden. Domain labels and current equilibrium notation remain available in
the graph; detailed equations retain their later verification role.

## Reason

Width-based emphasis made the graph wobble perceptually and contradicted the
restrained orthographic language. Converting old states to dashed lines also
changed object identity when the intended meaning was only temporal quieting.

The prior implementation inserted `52svh` after each motion passage and
`24svh` after every other market-clearing passage while projecting motion
through a shorter viewport corridor. That produced blank distance that did not
advance any semantic state. One declared budget now owns both document travel
and motion travel.

## Preservation Boundary

Preserve:

- economics equations, semantic frames, exact model state, graph geometry,
  authored keyframes, controls, manual ownership, URLs, TOC, Review, and
  accessibility truth;
- the invisible threshold, `5vh` cue hold, `10vh` opacity fade, and post-fade
  motion gate;
- readable-fit, reduced-motion, and large-text fallbacks;
- the approved split layout as the default;
- all non-economics graph presentation profiles and every other lesson.

The economics presentation profile and query-selected lesson are the smallest
reversible units. This decision does not promote the `1px` / `0.5px` grammar to
the shared dimensional-continuity profile; a structurally different graph
caller must pressure it first.

## Proof Criteria

- computed economics axes, curves, guides, traces, and emphasized lines remain
  `1px`, while grid lines compute to `0.5px`;
- the old demand reference retains a solid stroke and becomes quiet through
  runtime opacity;
- inline math and `P` / `Q` match the prose-size token, while KaTeX retains its
  renderer-owned font;
- the persistent equation strip is absent from the inline-sticky stage;
- exactly two motion tracks exist and no generic runways remain;
- wide and phone track heights equal their declared viewport ratios, and
  quarter, midpoint, endpoint, and reverse samples map deterministically to
  semantic progress;
- animation margins remain visible in reading mode without creating a third
  timing system.

## Consequences

This decision refines
`2026-08-04-kp-continuous-canvas-attention-ownership.md`. The visible open
space after a motion cue is now accountable: it is part of that animation's
normalized scene track. Non-motion prose returns to ordinary rhythm.

The scene-track budget is authored beside the local motion block because it is
part of pedagogy, not a generic CSS spacer. Future promotion should extract a
shared field only after another caller proves the same seam.

## References

- `2026-08-04-kp-continuous-canvas-attention-ownership.md`
- `2026-08-01-kp-dimensional-continuity-graph-and-diagram-language.md`
- `../principles/inline-sticky-lesson-layout.md`
