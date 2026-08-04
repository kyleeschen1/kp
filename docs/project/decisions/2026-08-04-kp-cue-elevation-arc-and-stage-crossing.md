# Raise Cues Before A Midstage Layer Crossing

Date: 2026-08-04
Status: accepted for bounded discovery

Latest correction: the shared surface and bottom-to-midpoint eased fade in
`2026-08-04-kp-shared-plane-midpoint-fade-contract.md` supersede this proof's
separate surface colors, full-opacity descent, visible midpoint crossing,
negative depth, 75%-traversal fade, and later motion gate. The approach lift,
composited shadow, no-scroll-snap rule, and rollback boundary remain in force.

## Decision

Refine the economics inline-sticky proof around one reversible elevation arc.
When the cue first enters the viewport, its elevation is zero. As it approaches
the pinned stage, a translucent focus plane, restrained scale increase,
positive `translateZ`, and pre-rendered shadow gather attention. Elevation peaks
when the cue center reaches the stage bottom.

After that boundary, the cue descends while remaining fully opaque. At the
stage midpoint it returns to neutral scale and depth, then changes from the
front stacking plane to the plane behind the stage. From the midpoint to 75%
of the stage traversal, negative depth settles and cue opacity falls from one
to zero. Essential semantic animation may begin only at that 75% point, after
the cue is absent.

The cue uses a translucent warm base plane and a pale blue-green focus wash.
The animation stage uses a separate 90%-opaque theme-page plane so the layer
crossing is visible but graph ink remains authoritative. Neither surface gains
rounded corners. The stage itself remains unelevated.

Implement the shadow using the compositing pattern from Tobias Ahlin's
performant box-shadow treatment: keep the larger shadow fixed on a
pseudo-element and vary only that layer's opacity. Scroll changes only
`transform` and `opacity`; it does not interpolate `box-shadow`, trigger scroll
snap, add another animation loop, or add a runtime dependency.

## Reason

The prior narrow text-shadow punctuation marked one boundary but did not build
attention before it. It also removed the cue by the midpoint, making the depth
relationship read mainly as fading. The new arc gives the eye a continuous
physical story:

```text
enter -> gather -> peak -> descend -> cross -> disappear -> animate
```

The midpoint is now a legible plane crossing rather than the end of opacity.
The 75% gate preserves the more important prior rule: prose and essential graph
motion do not compete.

## Preservation Boundary

Retain the query-selected rollback unit. Do not change:

- economics truth, graph rendering, semantic frames, or authored keyframes;
- canonical prose, source order, controls, URLs, TOC, Review, or manual
  ownership;
- text measure, paragraph layout, reduced-motion, increased-contrast, or
  large-text reading fallbacks;
- the approved split-layout default, another lesson, or the shared shell;
- the paused S-expression checkpoint or animation-promotion ledger.

## Proof Criteria

- elevation is zero when the cue enters the viewport and peaks at the stage
  bottom;
- approach and descent preserve opacity one and the cue's layout width;
- scale and depth return to neutral at the stage midpoint before stacking
  changes behind the stage;
- opacity reaches zero at 75% of stage traversal in both scroll directions;
- semantic motion remains at zero through the complete cue trajectory and
  begins only after the 75% gate, retaining authored holds;
- the focus shadow is pre-rendered and exposed through pseudo-element opacity;
- the cue and stage planes are theme-tokenized, translucent, square, and
  responsive;
- phone, reduced-motion, large-text, split-layout, navigation, and review
  behavior remain valid.

## Consequences

This supersedes the prior proof's narrow text-shadow punctuation, front-loaded
fade, and midpoint motion gate. It retains the prohibition on document-level
scroll snap and the rule that animation waits for prose to clear. It does not
promote an elevation API, a generic card motif, or the one-axis lesson layout.

## References

- https://tobiasahlin.com/blog/how-to-animate-box-shadow/
- `2026-08-04-kp-depth-handoff-punctuation-and-motion-gate.md`
