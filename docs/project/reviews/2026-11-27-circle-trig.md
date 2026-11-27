# Circle coordinates and trigonometric graphs

Date: 2026-11-27
Status: implemented, checked and accepted by the user ("beautiful.resume").
Authority: approved studio outcome 8, resumed after composition-notebook acceptance.
Execution: `run-contract.kp.circle-trig-20261127`.

## Outcome and authority

A compact reference connects the point on a unit circle to its cosine/x and
sine/y coordinates and the corresponding function values. Authors/readers can
change a real angle, inspect quadrant signs, compare negative angles and turns,
seek/reverse, and reload an exact location.

Canonical artifact: a bounded real angle with stable circle, coordinate and
function identities. Host: `/experiments/circle-trig/`. Existing expression
sin/cos evaluation owns numeric truth; Graph2D/SVG paints geometry, native
KaTeX paints definitions, and the existing timeline playback clock owns time.
This new exemplar is not an existing certified animation or author-check task.
Its adapter is explicit; no unrelated motif or generic fallback is selected.

Preserve all accepted notebooks, references, palettes, source identities and
scroll behavior. Rollback: additive exemplar, scoped tooling and evidence.
No notebook persistence, angle-addition derivation, generalized trig solver,
shared renderer promotion, paid model call or publication. The actual-model
revision trial remains separate. Use a six-hour ceiling, reserving the final
hour for verification and backup; finish earlier at visual review.

## Explanation and medium choice

Assume Cartesian coordinates, a radius and a graph of a function. Introduce
positive counterclockwise angles and radians as arc length on a unit circle.
Define cosine as x and sine as y. Projecting that same point onto the axes makes
signs visible; plotting the coordinates against angle explains the waves.
A complete revolution returns to the same point, hence the same coordinates.
The functions are periodic; the accumulated angle itself need not reset.

The static baseline is one circle diagram, the coordinate definitions and a
quadrant table. Manipulation adds the ability to track one point continuously
into changing coordinate values and their graph markers. Curved movement is
the actual circular path, not a decorative trajectory. Scrubbing supports
prediction at a nearby angle and direct comparison of negative/wrapped angles.
Question: at 210°, why are both coordinates negative, and why do 210° and
570° agree? Expected reasoning uses quadrant III and one complete revolution.
This is a retrieval/explanation aid, not proof of learning or angle-addition.

Show all required text without motion. Bind each coordinate to its function
through shared semantic identity, a written label and distinct stroke style;
color alone does not carry correspondence. Keep ordinary text stable while
numeric slots update. Numeric approximation is labeled; axis intersections
are exact quarter-turn endpoints. A wrapped graph marker may jump from the end
of one period to the beginning; explain that seam rather than implying the
circle point jumps.

## Packages and acceptance

1. **semantics:** bounded angle admission, unwrapped/wrapped meanings, shared
   expression evaluation, exact quarter turns, periodicity, signs and pure seeks.
2. **exemplar:** compact circle/function view, native definitions, editable angle,
   local clock, stable readouts, theme/reduced-motion handling, URL restoration
   and disposal. Static source generated through the same presentation owner.
3. **verification:** focused numerical and identity laws, scoped/full types,
   architecture, stable static artifact, complete standalone payload and a small
   Chromium/Firefox desktop/phone/theme/lifecycle smoke. Inspect screenshots.
4. **review:** judge coordinate-to-function correspondence, wrap comprehension
   and compact readability. Stop before second-host integration or promotion.

Theseus owns live progress. Human acceptance and one distinct caller are needed
before extracting a reusable presentation seam.

## Review

Open http://127.0.0.1:8000/experiments/circle-trig/ .
Enter **210**: both coordinates are negative. Enter **570**: the circle point
and wave markers agree with 210°, while the entered angle retains its extra
turn. Try **−90**, then use the quarter-turn arrows or Play to see axis crossings.
Scrub through 360° and inspect the explicit wrapped-marker boundary.
Reload to restore the valid angle, or enter an incomplete draft to confirm the
last valid diagram remains visible and playback disables.

Judge whether one point and its two coordinates are easy to track into the
waves, whether the wrap reads clearly, and whether the small diagrams are useful.
Desktop places them side by side; phones retain ordinary document flow with
stacked diagrams. That avoids shrinking labels but weakens simultaneous comparison.
No scroll manipulation is introduced. Review this tradeoff before notebook
reuse or any shared presentation promotion.

## Executed evidence and safeguards

- `npm run test:circle-trig`: 16 passed, including expression-owner preservation,
  exact quarter turns, unit radius, periodicity, quadrant signs, numeric
  admission, pure seek/reverse, stable formatting and source-generated static HTML.
- `npm run author:circle-trig -- --check`: committed HTML matches the semantic
  and presentation sources. Native KaTeX definitions and both complete diagrams
  are present without JavaScript; the browser enhances existing graph nodes.
- `npm run visual:circle-trig -- --project=firefox`: eight Chromium/Firefox
  checks passed, including edit/focus retention, node reuse, negative/extra turns,
  tiny-input reload, invalid drafts/URLs, playback interruption, exact quarter
  controls, reduced motion, phone/dark/enlarged text, geometry stability of
  readout slots and following prose, and JavaScript-disabled reading.
- `npm run typecheck`, `npm run typecheck:circle-trig` and
  `npm run check:architecture` passed. Final scoped checking covers the
  exact-seek source pin and canonical numeric input/URL language.
- `npm run check:tooling-configs`: passed; 84 Playwright configurations,
  209 projects, 14 inventory-managed Vite configurations and 23 TypeScript
  projects. Added only the new Playwright policy snapshot, verifying prior
  snapshots unchanged. The standalone Vite config is exercised by its build.
- `npm run build:circle-trig`: passed after correcting a copied entry path.
  Static-artifact checks, resolved project inputs and the actual build protect
  against shipping a page whose configured entry does not exist.
- `npm run test:project-vision`: 75 passed after trimming a redundant historical
  contract reference from the active thread to preserve its reading budget.

Numerical investigation found two lossy boundaries: adding a turn before
evaluating a tiny angle can round it onto an axis, and normalized playback
progress cannot encode every input precisely. Evaluation now uses the signed
remainder; exact axis values require an actual quarter-turn input. Direct seek
pins its source value at that progress, while moving playback uses the clock.
URL and input admission share the same bounded number language, including the
exponent notation used by number serialization. Unit/browser regressions cover
near-axis signs and a 1e−14 input surviving reload. This is floating-point numeric
evaluation, not arbitrary precision or symbolic trigonometric proof.

Numeric readouts have declared precision/ranges and fixed tabular slots.
Rounding affects only displayed numbers. The circle and function markers share
stable source identities but distinct visual nodes; runtime frames only update
coordinates and numeric text. Playback pauses on blur, document hiding and
offscreen figures; disposal releases the clock, observers and handlers.

The complete standalone output contains **17,067 gzip bytes of JavaScript/CSS**
and **934,336 gzip bytes across 64 emitted assets**, including HTML and every
emitted KaTeX/font format. The static HTML is approximately 6.7 KB gzip.
Fixed definitions are prerendered, so the interactive JavaScript does not need
the KaTeX renderer. These are per-file gzip estimates, not network transfer,
memory or frame-time measurements. This additive route is not imported by the
existing notebook or reader; no payload change to those hosts is claimed or needed.

Desktop, phone dark and enlarged-text screenshots were inspected. The shared
review URL returned HTTP 200. Stable commands reproduce disposable captures.
The impact selector has no focused rule for this experimental route and chose
the broad fallback. This discovery tranche uses the declared focused laws,
full types/architecture, standalone build and small two-browser smoke. Root
production build, repository-wide unit suite, WebKit and a performance profile
were not run. Learner understanding and reusable authoring remain unproved.

The accepted circle reference closes at 4/4. The user accepts its presentation
and resumes the approved horizon with [polynomial accumulation](2026-11-27-polynomial-accumulation.md).
Second-host reuse and angle-addition remain separate; the actual-model
annotation revision trial remains pending.
