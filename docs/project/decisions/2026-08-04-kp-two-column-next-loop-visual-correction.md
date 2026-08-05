# Correct The Two-Column Graph Scale And Structural Divider

Date: 2026-08-04
Status: superseded after human visual review

Superseded by
`2026-08-04-kp-two-column-natural-graph-and-uniform-strokes.md`. The static
divider and removal of paragraph rails remain accepted, but the forced square,
wide inline padding, graph-object attenuation, and variable stroke hierarchy
do not.

## Decision

Correct only the economics `?layout=two-column-scroll` exemplar in the next
implementation loop. Do not implement this correction while the tutorial text
is being restructured.

Make the graph square by reducing its longer displayed dimension to its
existing shorter dimension. Center that smaller square in the graph column and
retain visible inline padding on both sides. A square stage must not make the
plot expand to fill all available column width.

Remove the animated per-paragraph left rail entirely. Restore one quiet,
non-animated vertical divider between the graph and prose columns as the
structural boundary. The graph axes and the divider use the same neutral grey
role; axis color must not read as another semantic blue alongside the supply
curve.

## Current Mismatch

The current discovery implementation enlarged the economics SVG from its
shorter rectangular side into a width-filling square and replaced the column
divider with midpoint-spanning paragraph rails that animate from zero to one
pixel through horizontal scale. Both choices are now rejected. They remain in
the uncommitted exemplar only until the next loop applies this correction.

## Preservation Boundary

Preserve the economics model, semantic graph objects, exact animation frames,
scroll progress, paragraph salience, prose position, grid restoration, fixed
line-width hierarchy, themes, mobile fallback, semantic URLs, TOC, Review
capture, and the accepted inline-sticky and split routes. This is a scale,
spacing, and structural-line correction rather than a semantic or runtime
redesign.

## Next-Loop Acceptance

- the visible plot is square on its smaller side and centered with clear left
  and right padding;
- no paragraph has an animated left border or rail;
- one neutral grey vertical divider separates graph and prose;
- both axes use the same neutral grey role as that divider;
- grid lines remain visible and subordinate;
- no scroll, animation, URL, responsive, or lesson-state behavior regresses.

## Promotion Boundary

This remains economics-local discovery. It does not promote a shared graph
size, column divider, axis palette, or two-column tutorial shell.

## Implementation Outcome

The query-selected exemplar now renders the intrinsic square graph at the
smaller displayed side, centers it with explicit inline padding, and keeps one
static neutral divider between graph and prose. The animated paragraph rail
and its runtime scale channel were removed. Axes inherit the divider grey;
curves and grid retain the economics-local `1.5px` / `0.5px` hierarchy.

The two-column presentation also keeps one stable full stage slot and hides
the older verification sidecar because the restructured prose now performs
that verification. The sidecar remains intact in the default and inline-sticky
routes. Focused semantic, desktop, phone, preserved-layout, browser, and type
checks pass. Human judgment of the visual scale and reading cadence remains the
promotion gate.

## References

- `2026-08-04-kp-divider-relative-prose-salience.md`
- `2026-08-04-kp-economics-question-driven-explanatory-spine.md`
- `../threads/explanation-attention.md`
