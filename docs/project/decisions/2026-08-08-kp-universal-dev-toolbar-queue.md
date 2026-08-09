# Queue A Universal Development Toolbar

Date: 2026-08-08
Status: accepted; implementation queued

## Decision

Move the lesson layout/view switcher out of the top-level reading surface and
into the bottom development-control row beside Review capture and the other
internal controls. Make that bottom row available on every KP route and
projection in development mode, including progressively published lessons,
Svelte presenters, catalogue/editor surfaces, and future lesson callers.

This records product direction; it does not authorize implementation during
the authoring-format review.

## Boundary

- The row is development tooling, not learner-facing publication chrome.
- One route-independent host should own its placement and lifecycle; lessons
  contribute typed capabilities such as available layouts rather than
  rebuilding the row.
- Layout/view switching must preserve the current semantic destination,
  playhead, theme, review identity, and scroll position when those values are
  meaningful in both projections.
- Review capture remains available even when a route exposes no alternate
  layout.
- Static publication and production output must not depend on the toolbar's
  JavaScript. Its development-only presence must not introduce production
  layout shift or make a lesson runtime depend on Svelte.
- Existing route-specific bottom controls remain evidence to consolidate, not
  an instruction to duplicate their implementations globally.

## Queue Position

Complete the article-format decision first. Implement the universal development
toolbar before migrating economics authoring sources, so the migration and its
visual review use the stable cross-route capture and projection controls.

## References

- `2026-08-08-kp-pause-layout-and-reconcile-authoring-format.md`
- `../reviews/2026-08-08-authoring-format-convergence-next-step-review.md`
- `../threads/explanation-attention.md`
