# Economics semantic visual salience human checkpoint

Date: 2026-08-05

Run contract: `run-contract.kp.semantic-visual-salience-theme-v1`

Slice: 19 — mandatory economics exemplar checkpoint

Status: `HUMAN_CHECKPOINT`

## Review object

Review the demand-shift tutorial at
`/tutorials/economics/demand-shift/?layout=two-column-scroll`. The economics
page is still the only presentation consumer of the candidate role, state,
theme, and renderer-adapter seam. No algebra or catalogue-wide promotion has
started.

The checkpoint preserves the lesson's mathematics, SVG geometry, prose,
scroll clock, direct-link semantics, KaTeX internals, and review controls. The
visible changes are limited to the approved handoff palette, semantic
foreground/context/focus/ghost treatment, accessible theme projections, and
New Computer Modern Mono typography. Regular is the default prose face, Book
is reserved for deliberate 500 weight, and inline KaTeX keeps its native face
at the surrounding prose's computed size.

## Human acceptance questions

Approve the visual seam only if all of the following feel right in the live
page:

- Regular prose is comfortably light and large enough, while inline KaTeX
  shares its apparent height and baseline without inheriting the prose face;
- the focused curve and equilibrium are immediately legible without making
  the contextual supply curve, axes, grid, or prior equilibrium disappear;
- demand's rose and supply's blue remain distinguishable in dark and light
  modes without the theme becoming visually busy;
- ghost curves and guides read as retained history rather than current data;
- prose focus and graph focus hand attention off coherently during forward,
  reverse, manual, and direct-link traversal;
- the wide two-column treatment and phone fallback remain readable; and
- reduced motion, increased contrast, and forced colors preserve meaning even
  when the normal palette or transitions are unavailable.

The most useful calibration question is whether the contextual graph is too
faint. The current treatment is deliberately conservative: axes, grid,
historical traces, and the non-owning curve recede enough that the focused
series dominates. That hierarchy is structurally correct, but its exact
strength remains a human visual decision.

## Automated evidence

- `npm run visual:economics-two-column-scroll`: 12/12 Chromium cases passed,
  covering dark and light wide states, phone fallback, forced colors,
  typography parity, tuning URLs, cached scroll geometry, and identical
  forward/reverse semantic projection.
- `npm run visual:economics-demand-shift-tutorial`: 12/12 Chromium cases
  passed, covering persistent graph state, manual/scroll handoff, direct seek
  without replay, history and TOC transactions, reduced motion, no-JavaScript
  controls, progressive enhancement, and phone docking.
- The scoped capture command refreshes stable evidence named
  `desktop-initial-paragraph-state.png`, `desktop-mid-demand.png`,
  `desktop-light-optical-compensation.png`, and
  `phone-inline-fallback.png` under
  `tmp/codex/economics-two-column-scroll/`.
- Focused unit, CSS ownership, accessibility, and type checks passed in slices
  13–17. KaTeX retains native font ownership, and browser checks assert equal
  computed prose and inline-math font sizes.

## Performance evidence

The checkpoint makes no release claim. The production audit keeps the
predeclared budgets intact and currently fails initial payload while passing
the visual-runtime budgets.

| Measure | Observed | Budget | Result |
| --- | ---: | ---: | --- |
| Initial transfer | 323,778 B | 250,000 B | fail |
| Initial script | 151,211 B | 150,000 B | fail |
| Initial resources | 44 | 42 | fail |
| Economics CSS | 66,949 B | 77,000 B | pass |
| Loaded raw font assets | 134,976 B | measured | review |
| Cumulative layout shift | 0.01858 | 0.02 | pass |
| Initial longest task | 141 ms | 150 ms | pass |
| Active p95 frame | 33.7 ms | 42 ms | pass |
| Active longest task | 0 ms | 100 ms | pass |

The active renderer builds no SVG strings, replaces no SVG subtree, changes
at most one progress attribute per frame, and holds geometry work to two reads
at 6, 24, and 48 cues. Average scroll-coordinator execution was 1.12 ms and
its longest execution was 2 ms. The remaining concern is initial delivery,
not scroll or graph-render cost. Four loaded font assets account for 134,976
raw bytes: Regular and Bold prose faces plus the two KaTeX faces used by this
lesson.

## Promotion recommendation and stop boundary

The renderer-neutral semantic boundary is coherent enough to promote if the
visual hierarchy is approved. However, the payload miss is large enough that
the recommended continuation is to repair initial font/shared-runtime
delivery before shared promotion, rather than deferring all delivery work
until the final release slice. Do not relax the budgets to make the audit
green.

Slices 20–28 remain untouched. A rejection rolls back or refines only the
economics presentation consumers; the semantic model, graph mathematics,
animation clock, and native KaTeX boundary remain preserved. Fresh human
approval is required before any shared promotion or algebra adoption.
