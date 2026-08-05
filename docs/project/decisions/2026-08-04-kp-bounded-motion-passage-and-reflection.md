# Bound The Economics Scroll Sequence As A Motion Passage

Date: 2026-08-04
Status: accepted for bounded discovery

The later
`2026-08-04-kp-two-column-natural-graph-and-uniform-strokes.md` decision makes
economics graph strokes uniformly `1px`. The passage threshold remains a
separate `1.5px` layout boundary; it no longer derives its width from a graph
curve role.

## Decision

Refine only the query-selected economics inline-sticky presentation into one
visibly bounded **motion passage**. The passage uses a slight theme-role wash,
thin top and bottom rules, the content label `A change in demand`, and a quiet
downward direction glyph. It has no side border, radius, shadow, or enclosing
card. These gates exist in the published HTML and CSS before enhancement.

Keep the total sticky stage at `50vh` and pinned to the viewport top. The stage
includes `2.5vh` top and bottom padding and its lower threshold inside that
height. The threshold uses the same `1.5px` role as economics curves. Stage
paint uses the page RGB channels at `0.975` alpha so crossed prose is barely
perceptible without becoming a second reading target.

Reduce the reading gap before the first cue and between adjacent cues to
`25vh`. The gap remains document rhythm and never advances semantic progress.
When a transition paragraph's leading edge crosses the threshold, visible
motion begins immediately. Its full physical crossing owns the reversible
timeline, with authored plateaus still available for internal pauses.

Give the source passages explicit local roles:

- `transition` owns one motion block, establishes the current graph, directs
  attention, and forecasts the change;
- `interpretation` explains a completed transition while the bounded stage
  remains active;
- `reflection` follows the motion-passage exit, does not cross beneath the
  stage, and returns the lesson to ordinary document flow;
- `regular` retains ordinary lesson behavior elsewhere.

The economics compiler requires `transition` roles and motion annotations to
correspond exactly. This is an economics-local authoring check, not a shared
lesson schema.

Do not render Rewind, Previous, Play/Pause, Next, a slider, or progress output
inside the inline-sticky proof. Scroll is its visible transport. Preserve the
existing manual controls in the approved split layout, and preserve semantic
URLs, exact state restoration, keyboard access, reduced-motion reading flow,
and review capture.

The supply comparison remains mounted in one fixed stage. It fades and travels
in through the right aperture while the graph recomposes continuously, stays
present for the terminal reflection, and reverses through the same action on
upward scroll. There is no discrete terminal equation removal or automatic
cleanup step. Numeric axis ticks use `0.75` of prose size; `P`, `Q`, curve
labels, and equilibrium annotations remain prose-sized.

## Reason

The prior proof made the sticky behavior legible only after it had started and
gave every paragraph the same spatial fate. A bounded passage lets the reader
anticipate the interaction mode without adding a dashboard surface. Explicit
prose roles separate preparation, observation, and retrospective explanation,
so scroll geometry follows the causal argument rather than arbitrary document
position.

The thinner internal threshold reads as an event boundary instead of a shelf.
The shorter gaps preserve breathing room without making the lesson feel
vacant. Keeping the settled comparison through reflection avoids the last-step
layout jump and lets the final prose discuss evidence that remains visible.

## Preservation Boundary

Preserve the exact economics model, graph geometry, semantic frames,
cumulative motion state, deterministic reverse scroll, URL reconstruction,
TOC destinations, Review capture, themes, progressive static publication, and
the approved split layout. Do not change another lesson, the shared lesson
document, the promoted graph profile, or the animation-promotion ledger.

The local Markdown roles and copy, economics compiler check, inline-sticky
markup, scroll projection, stage composition paint, stylesheet, and focused
browser assertions form one reversible rollback unit.

## Proof Criteria

- the motion-passage entrance and exit gates exist before enhancement;
- the passage wash extends beyond prose without a side border or rounded card;
- the stage remains exactly `50vh`, including `2.5vh` block padding and its
  internal `1.5px` threshold;
- stage paint is near-opaque in both economics themes;
- first-cue and adjacent-cue gaps are exactly `25vh`;
- transition motion is greater than zero immediately after threshold crossing
  and reaches its endpoint at the trailing edge;
- the inline-sticky DOM contains no scrub bar or transport buttons;
- the reflection has no crossing phase and the stage is released before it;
- verification paint enters through opacity, clipping, travel, and stable
  graph recomposition without changing outer stage geometry;
- the verification surface stays mounted and settled through reflection, then
  reverses to its outside state on upward scroll;
- phone, large-text, reduced-motion, light-theme, and midnight-theme checks
  preserve readable flow and prevent horizontal overflow.

## Promotion Boundary

This is economics-local presentation and authoring evidence. It does not make
motion-passage roles, `25vh` rhythm, a half-viewport stage, scroll-only
transport, or the boundary treatment universal. A structurally different
lesson must prove the same causal and progressive-enhancement boundary before
shared lesson-shell promotion.

## References

- `2026-08-04-kp-half-viewport-stage-and-scene-rhythm.md`
- `2026-08-04-kp-paragraph-owned-stage-occlusion.md`
- `../principles/inline-sticky-lesson-layout.md`
