# Shipping refactor: second code focus-card caller

Status: visually accepted by the user; promotion/release checks remain.
Execution: `run-contract.kp.passage-consolidation-v2`, `code-transfer`.

The user accepted the trial, noting limited space for code. Preserve this as an
explicit layout limit: scrolling provides access but does not guarantee that
related distant regions remain visible together. No larger-code modality is
authorized by this acceptance.

The user approved trying the accepted centroid card on a structurally different
code example. This trial uses the existing free-shipping refactor: two callers,
one Boolean rule, seven explanation checkpoints and four complete source
projections. It adds no code transformation or semantic inference.

## Review

Open <http://localhost:8000/experiments/code-reasoning/?reading=focus#before>.
Use the arrows or scrubber to follow the duplicated threshold into its helper,
then watch each caller change. The cue stays above the same code stage.
Copy code works during motion without changing position. Click moving code once
to settle, then drag or double-click to select native text. On narrow screens or
with enlarged fonts, scroll inside the code to reach long lines and both ends.

Judge whether the cue makes the current relationship legible while the code
moves, and whether horizontal scrolling is an acceptable limit for this longer
example. Automated checks establish preservation, not pedagogical quality.

## Authority and reuse

Canonical artifact: checked TypeScript free-shipping refactor, projected through
`typescript-free-shipping-runtime.ts`. Canonical host: the URL above. Renderer:
the existing TypeScript native/token theater and DOM frame renderer. Semantic
source: the refactor contract and its compiler-identified source ranges; prose
comes directly from its score. The existing inspection clock owns progress.

The accepted centroid card's layout, viewport fit, scrubber/arrows and clipboard
interaction now live in small shared code-reader helpers. Centroid retains its
source and thought adapters. Shipping provides its score and source adapter.
No parallel renderer, timing engine, salience store or catalogue-wide interface
was added. The original shipping article remains the default; focus is opt-in.

A score checkpoint can simultaneously start another token track. Explicit
selection holds the clock at the nearest checkpoint and requests its native
projection, using the renderer's existing endpoint path. Subsequent navigation
restores continuous motion. Copy captures that checkpoint's complete source
without seeking; it never concatenates moving glyphs. Touch starts preserve
native scrolling, and clipboard denial exposes a selected readonly source field.

Preservation boundary: semantics, source projections, motion tracks, native paint,
default article, print and no-JavaScript reading. Rollback unit: shipping focus
publication/style/adapter and its opt-in host hooks; common helpers can remain
behind the original centroid wrappers.

## Evidence and limits

- Six shipping Chromium checks passed through `npm run visual:code-reasoning --
  tests/code-reasoning.browser.spec.ts`: persistent stage/geometry, continuous
  navigation, deterministic rewind, score-aligned cues, all four copy sources,
  native word selection, touch preservation, clipboard failure, default reading,
  stale source rejection, reduced motion, print and narrow/enlarged layout.
- Thirteen centroid Chromium checks preserve the accepted caller through the
  same stable visual command with `tests/centroid-reasoning.browser.spec.ts`.
- Twelve focused code/centroid unit checks, app/node/test TypeScript and
  architecture gates passed.
- Desktop and 390px-wide enlarged-font captures inspected. The code surface
  scrolls horizontally at narrow widths; text is not shrunk or reformatted.

This is bounded host reuse, not source-only authoring: shipping still needs a
small adapter for score checkpoints, complete source and selection settlement.
The shared card works with both renderers; this does not establish usefulness
for arbitrary long programs. Cross-browser release checks remain at promotion.
