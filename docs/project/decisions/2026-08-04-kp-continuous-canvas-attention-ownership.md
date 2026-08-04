# Use A Continuous Canvas For The One-Axis Lesson Proof

Date: 2026-08-04
Status: accepted for bounded discovery

## Decision

Refine only the query-selected economics presentation at
`/tutorials/economics/demand-shift/?layout=inline-sticky` into a continuous
canvas. Keep prose at one fixed readable measure and let the sticky graph bleed
wider around the same center, but remove the visible row, column, stage-card,
and cue-card treatments. The page, stage, graph plane, and cue backgrounds are
continuous. The stage and cue have no rule, border, radius, fill, lift, scale,
depth translation, or shadow.

Keep the established scroll geometry without its discarded visual metaphor.
The cue's untransformed top edge crosses an invisible stage-bottom threshold,
remains fully opaque for `5vh`, then fades through one opacity-only smoothstep
over `10vh`. Essential graph motion begins only after that fade. Reverse scroll
projects the same states from geometry; do not add scroll snap or a second time
animation.

Render the block-local scrubber as a quiet inline divider rather than another
card. Its actions have no borders, radii, lift, or shadow. Retain the bounded
Gill Sans trial for non-KaTeX text and retain KaTeX's renderer-owned fonts.

## Reason

Both visible columns and visible rows made text and animation read as sibling
representations. The raised cue and ruled stage added a second explanatory
object precisely where KP needs one transfer of attention. A continuous canvas
preserves the useful one-axis timing while allowing prose to lead directly into
the diagram and then leave it to the motion.

```text
prose approaches -> invisible threshold -> hold 5vh -> fade 10vh -> animate
```

## Preservation Boundary

Do not change:

- economics truth, graph geometry, semantic frames, or authored keyframes;
- canonical prose, source order, normalized controls, URLs, TOC, Review, or
  manual ownership;
- the 43-rem prose measure, top-edge anchor, `5vh` hold, `10vh` fade, motion
  gate, or readable-fit fallbacks;
- reduced-motion and large-text ordinary-reading behavior;
- the approved split-layout default, another lesson, or the shared shell;
- the paused S-expression checkpoint or animation-promotion ledger.

The complete query-selected economics presentation remains one reversible
rollback unit.

## Proof Criteria

- the wide graph stage is materially wider than the unchanged prose measure;
- stage, inner player, graph plot plane, and cue are transparent on wide and
  phone layouts;
- no stage rule, cue pseudo-surface, border, radius, shadow, or transform is
  present;
- the cue is fully opaque at the threshold and through `5vh`, is approximately
  half opaque at the midpoint of the following `10vh`, and is absent before
  semantic motion begins;
- scrub actions read as inline controls without button-card chrome;
- reverse scroll, cue width, phone fit, large text, reduced motion, Gill Sans,
  and KaTeX font ownership remain deterministic.

## Consequences

This supersedes the visible black rule, shared filled plane, elevation arc,
depth, scale, shadow, and stacking switch in
`2026-08-04-kp-black-rule-hold-and-fade-bands.md`. It retains that decision's
top-edge anchor, `5vh` hold, `10vh` eased fade, post-fade motion gate,
query-local typography trial, no-scroll-snap rule, and rollback boundary.

This does not promote a shared lesson API, make the one-axis layout the
default, or authorize a second caller. Human comparison with the split layout
still precedes any promotion decision.

## References

- `2026-08-04-kp-black-rule-hold-and-fade-bands.md`
- `../principles/inline-sticky-lesson-layout.md`
