# Semantic Document Reader Exemplar Review

Date: 2026-07-20

Run contract: `run-contract.kp.reader.semantic-document-convergence-v0`

Canonical review route: `/reader/solve-x/`

Status: automated gates passed; stopped for mandatory human visual review

## Outcome

The isolated reader now makes the intended Kinetic Press proposition concrete:
searchable prose stays on the left while the algebra itself moves continuously
under ordinary document scroll on the right. The route is compiled from
`content/lessons/solve-x.md`, uses the current typed x-plus-3 animation asset,
and renders complete static prose, TOC, KaTeX, MathML, and checkpoints before
JavaScript runs.

Hydration measures compiler-authored semantic KaTeX anchors once, projects the
canonical renderer-neutral frame, and writes persistent material-owner frames.
Every intermediate point is controlled by scroll position rather than a fixed
duration. Scrolling backward retraces the same point exactly. Settled locations
encode lesson version, checkpoint, progress, projection, focus, and document
anchor in a URL suitable for a teacher or LLM.

The reader imports neither the editor nor WebGL/Three.js in production. KaTeX
rendering is build-only; the learner downloads font assets, not the KaTeX
JavaScript renderer. The existing concept route remains unchanged and its
smoke, conformance, performance, and visual gates pass.

## Reproduce The Package

Run `npm run review:semantic-reader`. It builds the production application,
starts an isolated preview, enforces the route budgets and behavioral contracts,
and writes 12 disposable captures plus `review.json` under
`tmp/codex/semantic-reader-review/`.

For live review, run `npm run dev` and open:

`http://127.0.0.1:8000/reader/solve-x/`

## Measured Result

| Measure | Previous concept route baseline | New reader route |
|---|---:|---:|
| Initial HTML | 325 B | 24,571 B raw / 2,824 B gzip |
| Searchable lesson in initial HTML | no | yes |
| JavaScript-disabled body text | 0 characters | 742 characters |
| JavaScript-disabled headings / links | 0 / 0 | 5 / 7 |
| Loaded JavaScript and CSS | 309,171 B gzip | 84,139 B gzip |
| Route-cost change | — | 72.8% lower |
| Provisional full-equation budget | — | 84,139 / 102,400 B gzip |
| Route shell, stylesheet, and preload | — | 20,336 / 20,480 B gzip |
| Editor / Three.js / WebGL / client-KaTeX assets | editor player stack | none |
| Small forward scroll | no change after seek | +38 permille |
| Equal rewind | n/a | 0 permille error |
| Layout reads across those ordinary frames | n/a | 1 before / 1 after |
| Reduced-motion sample at 500 | existing route checkpoint contract | snapped to checkpoint 667 |

The 20 KB and 100 KB limits remain pilot hypotheses, not global policy. The
route-shell figure deliberately includes its CSS and preload helper, making it
a conservative measurement.

## Named Review States

| Capture | Progress | Review purpose |
|---|---:|---|
| `read-equality-desktop.png` | 0 | First impression, value proposition, typography, TOC, and native equation. |
| `subtract-motion-desktop.png` | 167 | Symbols entering and persistent terms rearranging during subtraction. |
| `subtract-settled-desktop.png` | 333 | Full same-operation-on-both-sides state and no-wrap fit. |
| `cancel-motion-desktop.png` | 500 | The most important visual-risk state: inverse cancellation while equality recenters. |
| `cancel-settled-desktop.png` | 667 | Exact native `x = 7 - 3` checkpoint after cancellation. |
| `solution-motion-desktop.png` | 833 | Right-side simplification in motion. |
| `solution-settled-desktop.png` | 1000 | Exact native `x = 4` settlement. |
| `semantic-focus-desktop.png` | 0 | Shared prose/symbol hover focus. |
| `cancel-motion-phone.png` | 500 | Narrow no-wrap fit, sticky stage, and document spacing. |
| `reduced-motion-checkpoint.png` | requested 500 | Directional checkpoint projection instead of continuous interpolation. |
| `forced-colors-cancel.png` | 500 | System-color focus and legibility. |
| `no-javascript-document.png` | static | Searchable, printable document and first equation without hydration. |

## Human Review Questions

1. Does the first viewport communicate “See concepts move” immediately, without feeling like lesson or quiz chrome?
2. Does direct scroll ownership feel meaningfully better than video—easy to stop, reverse, search, and revisit?
3. Do persistent symbols feel like the same mathematical objects, rather than cross-faded glyphs?
4. Is the mid-cancellation collision between the disappearing `-3` and the moving equality sign acceptable, or does it obscure causality?
5. During `7 - 3 → 4`, should the material visibly reshape into `4` earlier instead of retaining the source glyph until the endpoint handoff?
6. Is coral salience restrained enough, especially when a beat focuses a whole equation object rather than one selector?
7. On phone, is the vertical distance between the sticky stage and active prose still frictionless, or should the scroll geometry become more compact?
8. Do the serif prose, KaTeX equation, paper surface, teal links, coral focus, and identical focus outlines read as one polished visual system?
9. Is a persistent left TOC helpful at this lesson length, or should the shortest exemplar hide it until requested?
10. Does “Link this moment” feel sufficiently obvious for teacher/LLM correction workflows without adding control clutter?

## Architecture And Preservation

- The build-only compiler owns Markdown parsing, safe static HTML, MathML,
  semantic endpoint markup, and hydration data.
- The browser runtime owns scroll, URL, focus, reduced motion, and session state;
  it does not import the compiler.
- The equation renderer owns immutable render/material/layout/alignment/motion/
  fit plans, a read-plan-write scheduler, and the persistent DOM material layer.
- The exemplar app composes those public contracts and owns only route-local DOM
  queries, styling, and lifecycle wiring.
- The selector-annotated x-plus-3 definition moved from the editor namespace to
  neutral rendering so editor and reader consume one source without creating a
  learner-to-editor dependency.
- The physical reader HTML is a separate Vite build entry. SPA fallback remains
  enabled so existing clean concept URLs retain their original behavior.
- The route remains static and meaningful if hydration fails. Print deliberately
  shows the compiled first equation and all prose beats.
- The focused implementation rollback begins at commit `5363edc`; earlier reader
  kernel slices are independently committed and do not require reverting the
  canonical semantic asset or editor player.

## Verification Evidence

| Command | Result | Scope |
|---|---|---|
| `npm test` | Passed | Full unit, server, architecture, inference, catalog, content, and domain suite. |
| `npm run review:semantic-reader` | Passed, 12 captures | Production build, no-JS document, exact URL states, asset closure, budgets, continuous/rewind motion, reduced motion, forced colors, mobile, and layout-read discipline. |
| Reader Chromium suite | Passed, 3 tests | No-JS reading, continuous anchored material, write-only ordinary frames, URL settlement and restore, zero WebGL. |
| `npm run smoke:linear-equation` | Passed, 2 tests | Existing canonical and failure-fallback learner routes remain intact. |
| `npm run test:browser:linear-equation-conformance` | Passed, 3 tests | Existing native endpoints, seek/rewind, resize, and reduced-motion contracts remain intact. |
| `npm run perf:linear-equation` | Passed, 3 tests | Existing shell geometry, direct seek stability, frame budget, and zero WebGL remain intact. |
| `npm run visual:linear-equation` | Passed, 39 states | Existing visual package regenerates unchanged in scope. |
| `npm run theseus -- workspace validate` | Passed, 667 nodes / 8,828 events | Durable project-memory integrity. |

## Residual Risks And Deliberate Deferrals

- The `cancel-motion` capture shows a real collision: the disappearing inverse
  and equality sign occupy overlapping space while persistent owners recenter.
  This is the primary visual-acceptance question, not an automated-gate success.
- The final simplification preserves semantic ownership, but its current visual
  material remains the source `7 - 3` until the late native handoff to `4`.
  A reviewed lifecycle-specific reshape or succession policy may be clearer.
- Mobile preserves one searchable content tree and a no-wrap sticky equation,
  but its vertical scrub distance creates substantial whitespace. Compacting it
  changes the feel of scroll ownership and requires human judgment.
- Beat-level focus can color many selectors coral. The focus contract is shared
  and keyboard-accessible, but salience granularity may need content refinement.
- The route is under both provisional budgets, but the route-shell measurement
  has only 144 bytes of headroom. A future budget should separate controller JS,
  CSS, and semantic asset data before becoming a family-wide gate.
- `exemplar-entry.ts` intentionally keeps composition local and reversible, but
  it is large enough that a second accepted equation exemplar should extract a
  tested controller factory instead of copying it.
- Missing-middle, generated equations, geometry, graphs, programming, economics,
  FTC, LLM correction, and WebGL canvas policy remain outside this contract.

## Hard Stop

The approved 30-slice loop ends here. Do not generalize the layout, motion
lifecycles, style tokens, compiler vocabulary, controller, or budgets to another
asset family until a human accepts or revises this exemplar.
