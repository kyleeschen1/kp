# Signed polynomial accumulation

Date: 2026-11-27
Status: implemented, checked and accepted by the user ("approve! resume").
Authority: studio horizon outcome 9, resumed after circle-reference acceptance.
Execution: `run-contract.kp.polynomial-accumulation-20261127`.

## Outcome and boundary

Readers can sweep an endpoint across a supported polynomial, compare signed
integral with geometric area, reverse bounds, and connect the same endpoint to
an accumulation graph and its exact antiderivative. This advances the approved
reference collection beyond pointwise function views.

Canonical artifact: a selected bounded polynomial and oriented interval. Host:
`/experiments/polynomial-accumulation/`. Existing exact-rational arithmetic owns
exact values; a bounded mathematics adapter applies the polynomial power rule
and existing expression evaluation/differentiation owns numerical graph functions.
Graph2D/SVG paints curves and areas; native KaTeX paints static definitions; the
existing reader timeline clock owns playback. This is a new reference adapter,
not a certified governed equation-transformation animation or author:check task.

Admit six explicit cases: x²−1, x, x², 1, −1, and 0, on [−3,3]. Their roots are
known exactly; the supported power-rule primitive and every selected endpoint
integral are rational. Bounds admit hundredths; playback projects to that same
declared resolution. No quadrature or inferred general root solver. Source and
numeric projection are separate; graph samples never determine area totals.

Preserve accepted notebook resources, circle/reference hosts, theme tokens,
scrolling, editor history and renderer contracts. Rollback is the additive
domain adapter, exemplar, scoped tooling and evidence. Exclude notebook reuse,
general coefficient editing, irrational-root geometric area, integration of
arbitrary expressions, shared animation promotion, paid models and publication.

## Explanation and medium

Assume coordinates and derivatives. Explain that thin signed strips contribute
f(t) dt: above-axis strips add, below-axis strips subtract when moving right.
An antiderivative F has derivative f, so the accumulated total from a to x is
F(x)−F(a). The second graph shows that total, starting at zero at a. Its slope
is f(x): the total can fall while the geometric area continues growing.
Reversing limits negates the oriented total but preserves geometric area.

Static baseline: a shaded curve, native formula and a worked cancellation case.
Meaningful control: move the endpoint through both roots of x²−1, then reverse
the limits. Motion makes the changing contribution and resulting slope visible;
it is not a derivation of the fundamental theorem. Keep the connecting prose
and complete initial figure available without JavaScript.

Transfer question: why can the integral of x from −2 to 2 be zero while its
geometric area is four? Expected reasoning: equal opposite signed contributions.
Then reverse the same bounds; neither zero nor geometric area changes, whereas
a nonzero signed integral would negate. Distinguish sign of function from
orientation of integration; area colors always describe above/below-axis regions.

Two compact graphs require comparison effort, especially when stacked on a
phone. Human judgment must select this treatment before another host uses it.
Use written labels and hatching as well as palette roles, stable numeric slots,
ordinary document flow, no scroll control, and reduced-motion direct inspection.

## Packages and checks

1. **semantics:** bounded exact power-rule evaluation, oriented integrals,
   root-partitioned geometric area, degree-zero/zero cases and deterministic seek.
2. **exemplar:** static reference, paired graph projection, source controls,
   local playback, URL return, theme/accessibility and disposal.
3. **verification:** focused semantic/preservation tests, scoped/full types,
   architecture, generated static HTML, standalone complete output cost, tooling
   configuration and a small Chromium/Firefox phone/theme/lifecycle smoke.
4. **review:** judge signed-versus-geometric distinction, same-endpoint
   correspondence and compactness. Stop before reuse or wider promotion.

Use a six-hour ceiling with the last hour reserved for verification and backup;
finish earlier at the human checkpoint. The impact selector has no focused rule
and suggests its broad fallback. This additive discovery route uses the bounded
checks above; root production build, full unit suite and WebKit are not gates.
Commit coherent implementation and evidence together, then back up.

## Review packet

Open http://127.0.0.1:8000/experiments/polynomial-accumulation/ .
The initial x²−1 example from −2 to 2 has signed integral 4/3 and geometric
area 4. Use Replay or the slider to follow the endpoint through the roots.
Open “Inspect the exact totals” for the rational values. Reverse bounds: the
same shaded region remains, the signed total becomes −4/3, and area stays 4.
Select x with bounds −2 and 2 to see a zero total despite nonzero area.
Try the constant, negative and zero cases, or reload a partially swept interval.

Judge whether the positive solid region and negative hatched region make the
distinction clear, and whether the point in the second graph makes accumulation
easier to understand. Phone diagrams stack in document flow; comparison requires
scrolling and playback pauses offscreen. Enlarged text retains access without
shrinking typography. No scroll manipulation or new host promotion is involved.

## Executed checks and safeguards

- `npm run test:polynomial-accumulation`: 17 passed. Exact additivity, reversal,
  equal bounds, signed/geometric accounting, zero/tangent/negative cases, root
  partitioning and bounded admission are tested. Differentiating each primitive
  through the existing expression owner reproduces the supported function.
- `npm run author:polynomial-accumulation -- --check`: static source matches the
  generator; unit checks additionally compare the final committed HTML bytes.
- `npm run visual:polynomial-accumulation -- --project=firefox`: eight final
  Chromium/Firefox checks passed. Covers live edits, incomplete draft retention,
  unchanged nodes during seeks, exact URL return, reversal, equal bounds, clock
  interruption, reduced motion, page lifecycle, light/dark, phone/enlarged text,
  stable readouts/following prose, axis-label alignment and no-JavaScript reading.
  The initial run failed because a test selector matched both a control and
  state metadata; selecting the slider by accessible role repaired the harness.
- `npm run typecheck` and `npm run typecheck:polynomial-accumulation` passed.
  `npm run check:architecture` passed ownership and conformance gates.
- `npm run check:tooling-configs`: passed; 85 Playwright configs / 212 projects,
  24 TypeScript projects and 14 inventory-managed Vite configurations. Only the
  new Playwright snapshot was added after verifying every old entry unchanged.
  The standalone Vite configuration is exercised by its actual build.
- `npm run test:project-vision`: 75 passed. Circle acceptance and the finite
  accumulation successor are source-linked; the active thread remains bounded.
- `npm run build:polynomial-accumulation`: passed. Complete output estimates:
  **19,471 gzip bytes JS/CSS**, **942,699 gzip bytes across 64 assets**, including
  static HTML and every emitted font format. HTML is about 12.7 KB gzip. These
  are per-file estimates, not measured network, memory or frame-time costs.

Inspected Firefox desktop, phone dark and enlarged-text captures; the shared
server returned HTTP 200. The graph tick-label review found text-spacing drift:
labels now use domain positions, with executable center-alignment checks at
ordinary and enlarged sizes. Text widths no longer choose graph coordinates.

All accepted sources remain untouched. New mathematics is a bounded adapter
over exact arithmetic, with finite catalogue admission and known rational roots;
it is not a general integration or root algorithm. Sampled geometry never
determines exact totals. The hundredth endpoint grid makes source precision
explicit, while the display rounds only declared readout values. Graph ranges
remain fixed through playback; source edits may change them. The local player
uses the existing clock and releases subscriptions, observers and event handlers.
Static KaTeX is generated once for every case; interactive code does not import
the KaTeX renderer. Existing notebook/reader routes do not import this exemplar.

No repository-wide unit run, root production build, WebKit or performance
profile was run. Tests establish bounded truth and lifecycle, not learner
understanding or reusable authoring. User acceptance closes this reference at
4/4. Continue with [saddle/section reuse](2026-11-27-saddle-section-reuse.md),
retaining its prerequisite clipping review. Accumulation reuse and the
actual-model annotation trial remain separate.
