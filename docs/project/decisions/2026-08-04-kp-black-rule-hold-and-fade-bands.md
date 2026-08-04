# Mark The Handoff With A Rule, Hold, And Fade Bands

Date: 2026-08-04
Status: superseded for bounded discovery

Later correction: the continuous-canvas treatment in
`2026-08-04-kp-continuous-canvas-attention-ownership.md` supersedes this
decision's visible rule, shared filled plane, lift, scale, depth, shadow, and
stacking treatment. The subsequent
`2026-08-04-kp-paragraph-owned-stage-occlusion.md` also supersedes the fixed
hold, opacity fade, and post-fade motion gate.

## Decision

Refine the economics inline-sticky proof with a fixed six-pixel solid-black
rule along the animation stage's bottom edge. The cue's untransformed top edge
is the scroll anchor. When that edge crosses the rule, the cue remains fully
opaque at peak scale, positive depth, elevation, and shadow for another `5vh`.
Across the following `10vh`, one smooth eased envelope takes opacity to zero
and returns scale, depth, elevation, and shadow to neutral. Essential graph
motion may begin only at the end of that fade band.

Keep the cue on the front plane while it is visible. The rule belongs to the
stage and stays fixed; the lifted cue may veil the portion beneath its shared
translucent surface rather than drawing a black stroke over prose. Any stacking
change occurs only after the cue is invisible. Reverse scrolling reconstructs
the same fade, hold, and crossing without a separate time animation.

Retain the exact shared background token for cue and stage. Apply the same
hold-and-eased-fade geometry to each inline-sticky cue cycle in this economics
exemplar, without replacing asset-local semantic choreography.

As a bounded companion typography trial, use a Gill Sans stack for all
non-KaTeX text inside this query-selected economics presentation. KaTeX and
its descendants retain their renderer-owned mathematical fonts and metrics.
Do not infer a project-wide typography change or restyle the approved split
presentation.

## Reason

The midpoint contract made the disappearance distance depend on stage height
and did not provide a strong visible threshold. A fixed rule makes the handoff
legible, while viewport-relative bands preserve the intended perceptual timing
across wide and phone layouts:

```text
approach -> cross rule -> hold 5vh -> fade 10vh -> animate
```

Using the cue's top edge makes “crossing the rule” literal. Deriving that edge
from untransformed layout geometry prevents projected scale from feeding back
into the scroll calculation.

## Preservation Boundary

Retain the query-selected rollback unit. Do not change:

- economics truth, graph rendering, semantic frames, or authored keyframes;
- canonical prose, source order, controls, URLs, TOC, Review, or manual
  ownership;
- cue/stage background equality, text measure, or readable fit fallbacks;
- reduced-motion and increased-contrast ordinary-reading behavior;
- the approved split-layout default, another lesson, or the shared shell;
- the paused S-expression checkpoint or animation-promotion ledger.

## Proof Criteria

- the stage exposes a fixed six-pixel `#000` bottom rule without changing its
  measured height;
- cue geometry is anchored to its untransformed top edge;
- the cue is fully opaque and at peak elevation at the rule and through `5vh`;
- halfway through the next `10vh`, opacity and elevation are approximately one
  half while semantic motion remains zero;
- at `15vh` above the rule, opacity, elevation, depth, and shadow are zero,
  scale is neutral, and semantic motion has not begun;
- semantic motion begins only beyond that endpoint and retains authored holds;
- computed prose and control typography use Gill Sans while computed KaTeX
  typography does not;
- reverse scroll is deterministic, cue width is constant, and phone,
  large-text, reduced-motion, split-layout, navigation, and Review remain
  valid.

## Consequences

This supersedes the cue-center anchor, bottom-to-midpoint fade distance, and
midpoint motion gate in
`2026-08-04-kp-shared-plane-midpoint-fade-contract.md`. It retains that
decision's shared surface, single eased property envelope, positive-only depth,
performant pseudo-element shadow, invisible stacking switch, no-scroll-snap
rule, and query rollback. It does not promote a shared cue API, a universal
black-rule motif, or the one-axis layout.

## References

- `2026-08-04-kp-shared-plane-midpoint-fade-contract.md`
- https://tobiasahlin.com/blog/how-to-animate-box-shadow/
