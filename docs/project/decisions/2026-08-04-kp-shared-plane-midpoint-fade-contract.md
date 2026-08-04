# Share One Plane And Complete The Cue Fade By Midpoint

Date: 2026-08-04
Status: superseded for bounded discovery

Later correction: the top-edge anchor, fixed black handoff rule, `5vh` hold,
and following `10vh` fade recorded in
`2026-08-04-kp-black-rule-hold-and-fade-bands.md` supersede this proof's
cue-center anchor, bottom-to-midpoint fade distance, and midpoint motion gate.
The subsequent `2026-08-04-kp-paragraph-owned-stage-occlusion.md` replaces the
remaining cue envelope and depth treatment with stable prose beneath an
almost-opaque page-colored stage.

## Decision

Refine the economics inline-sticky proof so the cue and animation stage use
the exact same theme background token. The cue's composited focus layer may
add a restrained edge and pre-rendered shadow, but it adds no second fill or
color wash. Cue and graph therefore read as one continuous surface.

Keep the reversible approach arc: from viewport entry to the stage bottom,
the cue eases from neutral presentation to its shallow peak lift. Once its
center crosses the stage bottom, one smooth eased envelope drives opacity,
elevation, positive depth, scale, and shadow back to their endpoints. At the
stage midpoint the cue is fully transparent, depth and elevation are zero,
scale is neutral, and the shadow is absent. Only then may essential semantic
graph motion begin. A stacking change after that sample is an invisible
implementation detail; there is no visible negative-depth or behind-stage
quarter-cycle.

Apply the same fade-and-transform envelope to every inline-sticky cue cycle in
this economics exemplar. This does not replace the authored choreography
inside graph assets or make the treatment global across lessons.

## Reason

Separate cue and stage colors made the handoff read as one card passing over a
different card. Keeping the cue visible behind the stage until 75% of its
height also prolonged the transition after the learner's attention had
already moved to the graph. One shared plane and one bottom-to-midpoint fade
make the sequence literal:

```text
approach -> lift -> cross -> disappear -> animate
```

The single eased envelope also prevents opacity, shadow, and transform from
suggesting contradictory depths.

## Preservation Boundary

Retain the query-selected rollback unit. Do not change:

- economics truth, graph rendering, semantic frames, or authored keyframes;
- canonical prose, source order, controls, URLs, TOC, Review, or manual
  ownership;
- text measure, reduced-motion, increased-contrast, or large-text fallbacks;
- the approved split-layout default, another lesson, or the shared shell;
- the paused S-expression checkpoint or animation-promotion ledger.

## Proof Criteria

- cue and stage computed backgrounds resolve to the same theme token;
- cue elevation remains zero at viewport entry and peaks at the stage bottom;
- halfway from the stage bottom to its midpoint, opacity and elevation are
  both approximately one half while semantic motion remains zero;
- at the stage midpoint, cue opacity, elevation, depth, and shadow are zero,
  scale is neutral, and semantic motion has not begun;
- semantic motion begins only above the midpoint and retains authored holds;
- the projection is deterministic and symmetric under reverse scrolling;
- cue layout width remains constant, and phone, large-text, reduced-motion,
  split-layout, navigation, and review behavior remain valid.

## Consequences

This supersedes the separate cue/stage planes, full-opacity descent,
midpoint-visible stacking transition, negative depth, 50%-to-75% fade, and
75%-traversal motion gate recorded in
`2026-08-04-kp-cue-elevation-arc-and-stage-crossing.md`. It retains the
approach lift, performant pseudo-element shadow, lack of scroll snap, semantic
motion-after-prose rule, and query-selected rollback boundary. It does not
promote a shared cue API or the one-axis layout.

## References

- `2026-08-04-kp-cue-elevation-arc-and-stage-crossing.md`
- https://tobiasahlin.com/blog/how-to-animate-box-shadow/
