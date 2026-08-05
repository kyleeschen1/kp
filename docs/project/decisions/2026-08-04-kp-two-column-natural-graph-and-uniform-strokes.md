# Use Natural Graph Geometry And Axis-Canonical Strokes

Date: 2026-08-04
Status: implemented exemplar; human visual checkpoint pending

## Decision

Refine the economics graph presentation profile and the
`?layout=two-column-scroll` host without changing the promoted cross-domain
graph language.

Restore the economics graph's natural `640 × 420` viewport. The host may center
and responsively scale that rectangle, but must not force the graph element or
its view box into a square. Reduce the graph surface's inline padding to
`clamp(1.25rem, 2.5vw, 2rem)` so the natural plot uses more of the animation
column without touching its edges.

Do not use opacity or SVG filters to express passage salience inside the graph.
Axes, curves, labels, guides, and equilibrium objects remain at their normal
presentation opacity as prose attention changes. Preserve opacity only when it
belongs to an object's actual entry or exit lifecycle. Paragraph opacity in the
prose column also remains unchanged.

Treat axis width as the canonical stroke-width token for the economics graph
profile in every host. Axes, curves, dashed guides, traces, and grid lines all
resolve to the same `1px` CSS variable. Color, dash pattern, and semantic
identity continue to distinguish their roles.

For the two-column exemplar, keep only the axis quantities `P` and `Q`
persistent. Supply, demand, and equilibrium KaTeX are contextual graph
callouts owned by the paragraph currently holding attention. The progressively
enhanced screen-space label layer discloses them; the complete SVG label set
remains the static/no-JS fallback.

Expose an internal, framework-neutral line tuner as a light-DOM custom element.
It owns one bounded optical multiplier (`0.65`–`1.75`), records it as the
`stroke` query parameter and Review evidence, and leaves the host responsible
for theme policy. The economics host preserves the dark/light compensation
ratio (`1px` / `1.25px` at `1×`) while applying the multiplier to the one
canonical stroke token. SVG axis markers remain `markerUnits="strokeWidth"`,
so arrowheads scale with the tuned axes without a second control.

Reserve an economics-local gutter at the right edge of the SVG plot. Place
curve labels in that gutter, aligned with the curve endpoints, rather than over
the data. Place `P` and `Q` at the visual midpoint of their respective axes.
This changes plot projection only; it does not change the economics model or
the graph element's natural `640 × 420` geometry.

Render equilibrium points as hollow, theme-aware rings. Dark mode uses a white
outline with the deep-blue page color inside; light mode uses a near-black
outline with the paper color inside. The current equilibrium's contextual
KaTeX callout is a compact tooltip anchored to and displaced left of the ring.

For the retired demand curve, test a coincident-stroke ghost: a canonical-width
red casing beneath a narrower grey core. Both strokes remain solid. This is an
economics-exemplar candidate, not a promoted graph-wide motif; promotion still
requires a human checkpoint, device-pixel-ratio pressure, and a structurally
different caller.

Correct the axes' apparent thinness with theme-specific luminance and
`shape-rendering: crispEdges`, while retaining the same computed width as every
other economics stroke. Do not compensate optical weight by giving axes a
different line-width token.

The final two-column interpretation explicitly owns the settled
`supply-movement` frame. Demand-player seek events may update lesson state only
while the demand block owns semantic motion. This prevents the player from
resetting supply progress during the last prose handoff and removes the visible
snap when the sticky region releases.

## Reason

The square treatment over-constrained a naturally wide graph and required too
much empty inline space. Graph-local attenuation also added a salience language
before the lesson had settled how to isolate objects without erasing context.
A single canonical width removes a premature visual hierarchy and makes later
line-weight changes one-token decisions. Screen-edge labels, theme-aware rings,
and luminance-based optical correction keep the plot legible without
reintroducing competing widths or permanent notation clutter.

## Preservation Boundary

Preserve the question-driven prose, paragraph-opacity handoff (with a `0.32`
inactive floor), scroll
projection, animation timing, semantic and lifecycle fades, static column
divider, grey axes, stage slot, themes, phone fallback, URLs, TOC, Review
capture, and the default and inline-sticky routes. The uniform stroke rule is
economics-profile-local; it does not silently revise the promoted shared graph
language or any non-economics graph profile.

## Verification

- `npm run test:economics-demand-shift-tutorial`
- `npm run visual:economics-two-column-scroll`
- `npm run visual:economics-inline-sticky-poc`
- `npm run test:browser:economics-demand-shift-tutorial`
- `npm run typecheck`
- `git diff --check`

## References

- `2026-08-04-kp-two-column-next-loop-visual-correction.md`
- `2026-08-04-kp-economics-question-driven-explanatory-spine.md`
- `../threads/explanation-attention.md`
