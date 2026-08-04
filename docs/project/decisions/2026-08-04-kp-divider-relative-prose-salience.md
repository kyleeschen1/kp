# Use Divider-Relative Prose Salience In The Two-Column Proof

Date: 2026-08-04
Status: accepted for bounded discovery

## Decision

Refine only the economics `?layout=two-column-scroll` comparison. Keep the
single neutral `1px` divider, place the sticky graph to its left, and place
ordinary flowing prose to its right. Remove every visible card surface:
paragraphs have no unique background, frame, radius, shadow, top border, or
sticky paint. Each passage remains a semantic paragraph inside its existing
metadata boundary.

Paragraph salience has two coupled visible channels. Text opacity moves between
`0.32` context and full emphasis. A layout-neutral `2px` blue pseudo-element at
the paragraph's left edge grows vertically from `0.16` to full height using the
same salience scalar. Its fixed width prevents layout shift, and center-origin
growth distinguishes attention from timeline progress.

The sticky divider's measured top is the exact semantic completion threshold.
For a typical desktop viewport:

- salience begins approaching at `82vh`;
- it peaks at `47vh`, just above viewport center;
- the graph holds through a short focus plateau until `42vh`;
- semantic motion then scrubs directly from that paragraph position to the
  divider top; and
- the exact target frame is reconstructed when the paragraph reaches the
  divider.

The first paragraph is a deliberate initial-state exception. It begins fully
salient at the divider top and describes the untouched graph. Later paragraphs
cannot claim salience until their predecessor reaches the divider; the handoff
completes over `5vh`. If natural paragraph spacing is shorter than the normal
focus-to-divider corridor, motion waits for predecessor settlement. If spacing
is longer, the graph holds rather than stretching its motion. No time-based
spring, scroll snap, or delayed smoothing clock sits between scroll geometry
and semantic progress.

Double the prior query-local paragraph gap from `8vh` to `16vh`, with bounded
rem fallbacks. Paragraph height plus this real margin determines the natural
distance between animation opportunities. Transition paragraphs scrub motion;
interpretation and exposition paragraphs hold settled state and may own prose
focus without inventing movement.

## Reason

The visible cards made continuous explanation look like a sequence of UI
controls. Bare paragraphs restore an article-like reading rhythm while the
right-hand column supplies a consistent text edge adjacent to the persistent
graph. The central divider now has one legible job: it is both the column
boundary and the exact completion threshold.

Separating peak prose salience from motion onset gives the learner time to read,
locate the object of inquiry, and then watch. Direct geometric projection keeps
seek, rewind, fast scroll, and semantic URLs deterministic.

## Preservation Boundary

Preserve the economics model, semantic frames, graph renderer, motion blocks,
checkpoint identities, exact reverse projection, source Markdown, default
split route, `?layout=inline-sticky`, narrow and short viewport fallback,
themes, semantic URLs, TOC navigation, Review capture, and transport-free
two-column presentation. Do not change Lisp, shared lesson types, the promoted
graph profile, or the animation-promotion ledger.

The query-local paragraph projector, prose-sidecar names, desktop CSS, focused
tests, and this decision form one reversible rollback unit. The preceding
visible-card treatment remains recoverable in commit history.

## Proof Criteria

- the opening paragraph aligns with the divider top, is fully salient, and owns
  the untouched graph;
- the graph appears left of the divider and prose appears right;
- no query paragraph has a visible card surface or sticky paragraph geometry;
- the blue rule grows without changing paragraph layout;
- a transition remains at progress zero through its focus plateau and reaches
  exact progress one at the divider top;
- intermediate progress and salience reconstruct on reverse scroll;
- natural paragraph gaps separate transitions without synthetic scene tracks;
- desktop, phone, and short landscape viewports have no horizontal overflow;
- inline-sticky and split presentations retain their prior behavior.

## Promotion Boundary

This remains economics-local visual discovery. It does not promote
divider-relative completion, viewport ratios, paragraph opacity, blue-rule
growth, right-hand prose, gap values, or a two-column lesson shell. Human review
precedes a second caller or shared authoring contract.

## References

- `2026-08-04-kp-natural-card-state-handoff.md`
- `2026-08-04-kp-two-column-scroll-comparison.md`
- `../principles/inline-sticky-lesson-layout.md`
