# Let Natural Cards Hand Off Settled Graph States

Date: 2026-08-04
Status: accepted for bounded discovery

## Decision

Refine only the economics `?layout=two-column-scroll` comparison. Replace its
three short viewport-height steps with four naturally sized cards containing a
mix of concise and longer prose. Begin the sequence with a fully opaque card at
viewport top that describes the untouched axes, supply curve, initial demand
curve, and $E_0=(6,8)$. That card's fully actualized graph state is the initial
market, not an animation in progress.

Each later card names the state that must be fully actualized when its own top
reaches viewport top. Its incoming transition begins at the later of these two
events:

1. the preceding card reaches viewport top; or
2. the incoming card reaches viewport bottom.

Equivalently, the incoming scroll corridor starts at the smaller of one
viewport and the natural distance between neighboring card tops, then ends at
zero. This lets long prose hold the preceding state until its successor enters
view while letting short prose transition over its actual document distance.
Authored mid-animation plateaus remain intact; entry and exit holds remain
presentation-specific.

The outgoing and incoming cards trade opacity over that same interval. The
settled card is exactly opaque at its top; inactive context remains at `0.24`
rather than disappearing. The primary prose owner changes at the handoff
midpoint, while the incoming motion block owns semantic animation throughout
the transition. Each paragraph is sticky within its naturally sized step so
the outgoing thought remains available while the successor rises. Only the
terminal step receives enough minimum height to hold the final card and graph
through clean stage release; there are no universal `100vh` steps between
paragraphs.

Narrow the comparison to a maximum `66rem`: text uses at most `27rem`, the
stage at most `32rem`, and a theme-role `1px` vertical divider plus modest
padding separates them. Desktop activation requires both `60rem` width and
`32rem` height. Narrow windows, tablets, landscape phones, and ordinary phones
retain the one-column inline geometry. CSS and semantic geometry consult the
same media condition.

## Reason

The first two-column trial reduced eye travel but its equal viewport steps
made short text feel artificially sparse and prohibited explanatory paragraphs
from supplying useful context. Natural card height restores ordinary reading
rhythm and lets prose length contribute honestly to pacing. A settled-state
contract is easier to reason about than a trigger contract: when a card reaches
the top, both its text emphasis and corresponding semantic frame are exact.

The explicit initial card prevents the sequence from beginning with an
unexplained transformation. The learner first identifies the axes, curves, and
starting intersection, then watches changes relative to that stable state.

## Preservation Boundary

Preserve the economics model, semantic frames, graph renderer, motion blocks,
checkpoint identities, exact reverse projection, source Markdown, default
split route, `?layout=inline-sticky`, phone fallback, themes, semantic URLs,
TOC navigation, Review capture, and transport-free two-column presentation.
Do not change Lisp, shared lesson types, the promoted graph profile, or the
animation-promotion ledger.

The four-card presentation sidecar, neighboring-card projector, query-local
CSS, focused tests, and this decision are one reversible rollback unit. The
superseded viewport-step implementation remains recoverable in commit history.

## Proof Criteria

- the first card describes the initial graph and is fully opaque when its top
  reaches viewport top;
- a later card is fully opaque and its semantic animation is complete at the
  same boundary;
- neighboring cards reconstruct complementary opacity at an intermediate
  position and reproduce it on reverse scroll;
- the first three steps remain substantially shorter than a viewport;
- the last step holds the settled final state until the sticky stage releases;
- text and graph columns are narrower and separated by a `1px` vertical rule;
- desktop, phone, and short landscape viewports have no horizontal overflow;
- inline-sticky and split presentations retain their prior behavior.

## Promotion Boundary

This remains economics-local visual discovery. It does not promote sticky text
cards, opacity exchange, natural-distance timing, breakpoint values, a shared
cue sidecar, or a two-column lesson shell. Human review precedes a second
caller, phone adoption, or shared authoring schema.

## References

- `2026-08-04-kp-two-column-scroll-comparison.md`
- `2026-08-04-kp-bounded-motion-passage-and-reflection.md`
- `../principles/inline-sticky-lesson-layout.md`
