# Use Paragraph-Owned Motion And Stage Occlusion In The Economics Proof

Date: 2026-08-04
Status: accepted for bounded discovery

## Decision

Revise the query-selected economics proof at
`/tutorials/economics/demand-shift/?layout=inline-sticky` so ordinary paragraph
geometry owns both attention and animation timing.

Every market-clearing paragraph is a scene. Its approach from the viewport
bottom is a readable entry hold. When its leading edge reaches the sticky
stage bottom, the paragraph takes attention ownership and any authored motion
begins. Motion advances as the paragraph passes beneath the stage and reaches
its final semantic frame when the paragraph's trailing edge reaches the stage
bottom. A paragraph without continuous motion still changes the focused
checkpoint through the same crossing rule. Reverse scroll projects the same
state from geometry.

Remove synthetic runways and scene-track elements. Use moderate, uniform
document margins for prose rhythm; those margins do not encode time. Keep
paragraph opacity, scale, transform, background, measure, and line wrapping
stable. The stage bleeds wider than the prose and paints above it with the same
page hue at `0.96` opacity. Crossed prose therefore recedes by physical
occlusion rather than by an animation applied to the text, while a small trace
of continuity remains visible beneath the stage.

In this presentation, retain Rewind, Previous, Play/Pause, and Next but hide
the range inputs and percentage readouts. The pre-rendered inputs remain in
the light DOM so the framework-neutral custom element, static publication,
and progressive-enhancement contract do not fork.

Revise the economics graph trial as follows:

- axes, ticks, guides, and structural lines use `1px`;
- curves and curve ghosts use `1.5 *` the axis token;
- grid lines use `0.5 *` the axis token;
- ghosts preserve source dash topology and become quiet through opacity;
- stable and changing curves use SteelBlue and a bright red role token;
- graph math labels, including axes, ticks, curve labels, and equilibrium
  notation, use the prose-size token;
- the inner KaTeX renderer is explicitly reset to `1em`, neutralizing KaTeX's
  default enlargement rather than shrinking the wrapper;
- current and reference equilibrium markers are smaller, with the current
  point at radius `3` and its initial reference at `2.75`.

## Reason

Explicit scene tracks made empty page distance look like a timing model. They
also separated the animation clock from the paragraph whose argument it was
supposed to express. Applying opacity to prose supported the handoff but made
the text itself an unstable visual object and imposed an arbitrary maximum
paragraph height.

Paragraph-owned projection gives physical scroll distance, attention, and
semantic progress one source of truth. The wider almost-opaque stage handles
depth without changing prose paint. Long paragraphs can continue beneath the
stage, and ordinary margins can be tuned as reading rhythm rather than hidden
animation machinery.

The graph revisions restore a visible distinction between structure and data
without width-based focus effects. Body-sized labels and inline mathematics
keep the diagram and prose in one typographic register, while smaller points
stop the equilibrium marker from overpowering the curves.

## Preservation Boundary

Preserve:

- economics equations, prose, semantic frames, exact model truth, authored
  keyframes, URLs, TOC restoration, Review capture, and accessibility truth;
- block-local manual ownership and deterministic reverse projection;
- the useful stage size, constant prose measure, reduced-motion fallback, and
  large-text reading fallback;
- the approved split presentation as the default;
- every non-economics graph profile and other lesson.

The query-selected economics layout and economics presentation profile are the
smallest independent rollback units. This decision does not promote the layout
or revised graph profile globally.

## Proof Criteria

- no motion-track or runway element exists;
- each of the four market-clearing paragraphs reports approach, crossing, and
  passed geometry and owns attention when crossing;
- authored motion holds during approach, advances only during paragraph-stage
  crossing, reaches one at the trailing-edge boundary, and reverses exactly;
- paragraphs remain fully opaque and untransformed;
- the stage is wider than prose, paints above it with the declared occlusion
  surface, and keeps its inner graph plane transparent;
- visible scrub sliders and percentage outputs are absent while the four
  semantic transport actions remain usable;
- paragraph rhythm is moderate and bounded on wide and phone layouts;
- computed graph strokes, colors, label sizes, and marker radii match the
  declared values;
- phone, large-text, reduced-motion, and horizontal-overflow checks pass.

## Consequences

This decision supersedes the cue hold/fade, post-fade gate, and explicit scene
track portions of the earlier continuous-canvas decisions. It revises, but
does not globally promote, the economics graph trial in
`2026-08-04-kp-stable-graph-strokes-and-semantic-scene-tracks.md`.

The next step remains human comparison with the approved split layout. A
structurally different lesson must pressure the paragraph-owned projection,
stage occlusion, fit, navigation, and accessibility seams before shared-shell
promotion.

## References

- `2026-08-04-kp-continuous-canvas-attention-ownership.md`
- `2026-08-04-kp-stable-graph-strokes-and-semantic-scene-tracks.md`
- `2026-08-01-kp-dimensional-continuity-graph-and-diagram-language.md`
- `../principles/inline-sticky-lesson-layout.md`
