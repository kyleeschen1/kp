# Trial A Half-Viewport Stage And Scene Rhythm In The Economics Lesson

Date: 2026-08-04
Status: superseded for bounded discovery

The retained `50vh` stage was refined by
`2026-08-04-kp-bounded-motion-passage-and-reflection.md`. That decision replaces
the `50vh` scene gaps, opaque paint, exterior `0.5rem` bar, and visible inline
transport described below with the current bounded passage treatment.

## Decision

Revise only the query-selected economics inline-sticky presentation so its
animation stage is exactly `50vh` at every supported viewport size. CSS owns
that height before enhancement, and the semantic layout projection mirrors the
same half-viewport measurement rather than selecting another responsive pixel
height. When pinned, the stage aligns with the top of the viewport.

Use one exact `50vh` margin between adjacent market-clearing paragraph scenes.
The gap is document rhythm, not a second animation clock: motion still begins
when a paragraph reaches the stage bottom and completes when its trailing edge
reaches that threshold. No progress accumulates while the empty gap passes.

Make the stage background fully opaque in either economics theme. Add a
`0.5rem` grey threshold bar immediately beneath it. The bar shares the stage
center, exceeds the 43rem prose measure on wide screens, and reaches the full
viewport width on phones without causing horizontal overflow. It is inert
paint, not a focus target, timeline object, or additional layout row.

## Reason

The earlier responsive-height calculation made the visual threshold vary by
viewport and left unused space difficult to interpret. A stable half-screen
stage makes the page grammar easy to predict: the upper half is the persistent
visual field and the lower half receives prose. The grey bar makes their
handoff visible even though the opaque stage and page share one dark hue.

Half-viewport paragraph rhythm gives each explanatory scene a distinct entry
without reintroducing synthetic runways. Keeping that gap outside the motion
projection preserves the paragraph-owned causality already established by the
economics proof.

## Preservation Boundary

Preserve economics prose, exact model truth, graph geometry, semantic frames,
authored keyframes, cumulative motion blocks, manual controls, reverse scroll,
TOC and URL restoration, Review capture, and the approved split layout. Keep
prose width, typography, opacity, and transform stable.

The inline-sticky CSS geometry, its matching layout projection, and focused
browser assertions are one rollback unit. The threshold bar is part of that
unit. This does not change the split stage, another lesson, a shared lesson
shell, or the promoted graph profile.

## Proof Criteria

- the pinned stage is `400px` high and top-aligned in an `800px` viewport;
- it is `422px` high and top-aligned in an `844px` phone viewport;
- large text does not change the stage's half-viewport height;
- adjacent paragraph-scene border boxes are separated by exactly `50vh`;
- stage paint is opaque in both themes;
- the grey bar is `0.5rem` high, wider than prose on wide screens, and full
  viewport width without overflow on phones;
- paragraph crossing still owns semantic progress and reverses exactly;
- reduced motion still returns the stage to document flow;
- static publication remains complete before enhancement.

## Promotion Boundary

This is economics-local presentation evidence. A structurally different lesson
must prove that a half-viewport stage and half-viewport scene rhythm fit its
content before either value becomes a shared layout token or default lesson
grammar.

## References

- `2026-08-04-kp-paragraph-owned-stage-occlusion.md`
- `2026-08-04-kp-economics-midnight-theme-trial.md`
- `../principles/inline-sticky-lesson-layout.md`
