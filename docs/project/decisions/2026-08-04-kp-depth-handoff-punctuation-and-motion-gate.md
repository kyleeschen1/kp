# Add Boundary Punctuation And Gate Motion After The Depth Handoff

Date: 2026-08-04
Status: accepted for bounded discovery

## Decision

Refine the economics inline-sticky proof so prose and essential graph motion do
not compete. The cue remains fully opaque below the stage. When its vertical
center reaches the stage bottom, a short geometry-derived emphasis envelope
peaks: the theme-page cue plane is translucent, graph ink remains visible
underneath, and a restrained paragraph text shadow makes the cue read briefly
above the stage.

As the cue center crosses the lower half of the stage, opacity clears with a
front-loaded curve and negative depth settles early. The shadow drops away
immediately after the boundary. Cue opacity is zero by the stage midpoint.
Only at that midpoint may the block-local semantic motion corridor begin; its
existing authored entry hold and later keyframes remain intact.

Do not add document-level CSS Scroll Snap. The visual punctuation is derived
from the same reversible geometry sample as cue opacity and depth, but it never
changes scroll position. Semantic URLs, TOC restoration, manual takeover, and
scroll rebase therefore keep their existing authority.

## Reason

Starting graph motion at the stage bottom asked the learner to read fading text
while tracking a changing curve. The gated sequence is calmer:

```text
read -> punctuate -> clear prose -> animate -> hold
```

Native proximity snap is broadly available, including in Safari, but it can
re-snap after layout changes and continues to receive interoperability fixes.
The economics lesson settles fonts, uses sticky geometry, performs semantic
hash jumps, and rebases after manual controls. A browser-selected final scroll
position would add motion without adding semantic information and could fight
those transactions.

## Preservation Boundary

Retain the query flag and rollback boundary. Do not change:

- economics truth, graph renderer, animation frames, or authored keyframes;
- canonical prose, controls, semantic URLs, TOC, review, or manual ownership;
- the approved split-layout default;
- another lesson or the shared lesson shell;
- the paused S-expression checkpoint or animation-promotion ledger.

## Proof Criteria

- cue opacity remains one below the stage and reaches zero by its midpoint;
- depth settles faster than opacity without changing prose layout width;
- boundary emphasis peaks at the stage bottom and drops after crossing;
- the cue plane is translucent and tokenized with the lesson theme;
- demand progress remains zero throughout the prose handoff;
- semantic motion begins only after the cue is fully absent, then preserves its
  authored holds, direct seek, rewind, and completion;
- no scroll container opts into CSS Scroll Snap;
- phone, large-text, reduced-motion, default split, and review behavior remain
  valid.

## Consequences

This supersedes only the prior depth-handoff statement that motion begins at
the stage bottom. It does not promote the treatment, authorize scroll snap,
introduce a generic punctuation API, or change the human review gate.

## References

- https://www.w3.org/TR/css-scroll-snap-1/
- https://webkit.org/css-status/
- https://webkit.org/blog/17818/announcing-interop-2026/
