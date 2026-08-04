# Preserve A Two-Column Scroll Comparison

Date: 2026-08-04
Status: initial viewport-step trial superseded by
`2026-08-04-kp-natural-card-state-handoff.md`

## Decision

Add `?layout=two-column-scroll` to the economics demand-shift lesson as a
desktop comparison beside the accepted split and inline-sticky presentations.
It is not the default. The canonical review target is one left text column and
one right graph column inside the existing bounded motion passage.

On desktop, the graph is sticky and vertically centered. Each visible cue is
one short atomic thought: it either directs attention to one object, forecasts
one motion, or interprets the result just shown. A card's top edge owns one
normalized reversible timeline from viewport bottom (`0`) to viewport top
(`1`). Consecutive card steps are one viewport apart so only one cue owns that
journey at a time. The shared choreography retains its meaningful internal
pause, while its split-layout entry and exit holds are removed from this
projection so visible motion begins and ends at the declared card boundaries.

The comparison renders no transport controls. Scroll is the visible timeline.
Ordinary conceptual exposition before and after the bounded passage remains
continuous prose, and the terminal reflection remains outside the sticky
sequence. The three experimental cue sentences are an economics-local
presentation sidecar; they do not replace the accepted Markdown or establish a
shared cue-card authoring schema.

At `760px` and below, the same published DOM uses the accepted one-column
inline-sticky geometry: a `50vh` top-pinned stage followed by prose. CSS owns
layout as soon as the current client host publishes that markup. JavaScript
mirrors the media boundary only when selecting semantic scroll geometry, so
the fallback does not require reparenting, duplicate content, or a second
layout tree. Static/SSR publication remains a later host concern rather than a
claim of this client-mounted route.

## Reason

The one-column proof preserves conceptual continuity but makes stage
occlusion, paragraph length, and motion timing compete along one axis. A
two-column layout tests the opposite trade: text and diagram stay separately
legible while one card supplies a simple physical clock. The full
bottom-to-top journey gives short instructions enough reading time and makes
completion visually exact without play controls or scroll snap.

This structure also provides a simpler eventual phone story, but the desktop
card grammar must pass human review before phone adopts it. Until then, phone
keeps the already understood inline treatment.

## Canonical Acceptance Criteria

- `/tutorials/economics/demand-shift/?layout=two-column-scroll` is the only new
  route state;
- desktop shows compact cards left and one vertically centered sticky graph
  right, with no overlap and no scrub component;
- the first card enters at viewport bottom only after the graph can occupy its
  sticky center;
- progress is `0` at card-top `100vh`, reconstructs the same intermediate
  frame in either direction, and is `1` at card-top `0`;
- the three bounded cards remain short, while the accepted inline route keeps
  its original source prose and timing;
- the reflection remains outside the sticky body;
- phone uses the existing one-column half-viewport stage without horizontal
  overflow;
- themes, semantic URLs, exact cumulative motion, TOC navigation, Review
  capture, reduced motion, and static publication remain intact.

## Preservation And Rollback

Preserve the economics model, semantic frames, graph renderer, motion blocks,
checkpoint identities, shared corridor authoring, source Markdown, default
split presentation, and `?layout=inline-sticky` behavior. Do not change Lisp,
the shared lesson shell, the graph profile, or the animation-promotion ledger.

The query parser, local card/corridor projections, three cue sentences,
two-column CSS, focused tests, and this decision are one independently
reversible rollback unit. Removing them restores the preceding state without a
content or data migration.

## Promotion Boundary

This comparison is an economics-local visual experiment. It does not make
atomic cards, viewport-height steps, a left/right scrollytelling grid, or
scroll-only transport universal. Human review of this exemplar comes before a
second caller, a phone switch, a shared type family, or a lesson-wide rollout.

## References

- `2026-08-04-kp-bounded-motion-passage-and-reflection.md`
- `../principles/inline-sticky-lesson-layout.md`
- `../threads/explanation-attention.md`
