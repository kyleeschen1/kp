# Bounded LA collection authoring

Status: bounded mechanism and second caller accepted October 12, including
responsive factor gaps, signed-addend notation and overlapping settling/enclosure.
Timing and text remain editable and are not claims of measured learning benefit.
This is an internal typed TypeScript source boundary, not a universal LA format,
JSON ingestion endpoint, parser, proof checker or promoted native compositor.

## Start here

- Polynomial source: `src/experiments/rectangular-product/polynomial-model.ts`.
- System source: `src/experiments/rectangular-product/linear-system-source.ts`.
- Changed order/shape: `src/experiments/rectangular-product/collection-variation.ts`.
- Checker: `compileCollectionSource` in `collection-source.ts` returns either
  `compiled` or `repair-required` with `code`, `path`, and `message`.
- All three use `polynomial-view.ts` and the existing pouring-player clock.

Preview on the shared server:

- `/experiments/rectangular-product/?view=polynomials`
- `/experiments/rectangular-product/?view=system`
- `/experiments/rectangular-product/?view=polynomials&example=reordered`

## What authors change

The source supplies stable ID, coefficients, explicitly ordered expressions,
domain, annotations, optional row/column focus and optional beat pacing. The
renderer supplies geometry, paths, easing and brackets. For example:

```ts
const source: CollectionSource = {
  id: 'system',
  coefficients: [[2, -1, 3], [0, 1, -2]],
  inputs: [variable('x'), variable('y'), variable('z')],
  domain: { kind: 'linear-system', rhs: [7, -1] },
  focus: { row: 1, column: 2 },
  annotations: {
    polynomials: 'Two equations constrain the same three unknowns.',
    align: 'Align x, y and z; make the missing x coefficient explicit.',
    notice: 'Follow z in both equations.',
    collect: 'Keep coefficients in place; collect repeated unknowns.',
    pivot: 'Turn the ordered unknowns into a column.',
    matrix: 'The same constraints, written as b = Ax.',
    rows: 'The second row still says y − 2z = −1.',
    columns: 'The third column contains the coefficients of z.',
    hold: 'Which column would move if z came first?',
  },
  pacing: { notice: 4500, matrix: 4500, hold: 5000 },
};
const result = compileCollectionSource(source);
```

`polynomials` remains the initial beat ID for compatibility with existing links;
it does not identify the caller's mathematical domain. Indices are zero-based.
Pacing is milliseconds for the transition **into** the named beat, including its
existing settling interval. It is not a new independent hold-duration language.
Default intervals remain 3500ms; the existing polynomial lasts 28000ms. The
clock, navigation and sampler use the same weighted stops. Changing pacing must
not change mathematical endpoints or reverse-seek behavior.

October 12 timing refinement: brackets begin during the last part of the pivot
and finish just after the column settles. Equality returns only after enclosure,
followed by a completed-equation hold. Next/Previous, keyboard stepping and the
milestone menu treat collect → matrix as one event. The internal `pivot` beat
remains in the score for annotations, pacing, scrubbing and existing deep links;
it is no longer an extra reader-facing stop. Numeric/structural players retain
their existing stops.

Polynomial callers instead supply `domain: { kind: 'polynomials', names: [...] }`.
Outputs identify derived expressions. A system supplies independent RHS values;
the view displays `b = Ax`, equivalent to `Ax = b`, and does not solve or certify
the system for arbitrary inputs. No linear-independence proof is inferred from
an arbitrary input list. The polynomial adapter accepts distinct monomials in
one variable; a reordered subset is not a claim to span every cubic polynomial.

## Supported envelope and repairs

- Exactly two rows and two to four distinct input expressions.
- Coefficients are integers from −9 to 9. Individual zeros and units work;
  entirely zero rows return a presentation repair rather than an empty opening.
- Polynomial inputs are single-letter variables, their powers 2–4, or 1, all
  in the same variable. Short output labels such as `p(t)` are supported.
- System inputs are distinct single-letter unknowns; RHS integers are −99…99.
- All nine annotations must be present; selected row/column must exist.
- Each paced interval is 250…30000ms. Larger geometry and longer labels are
  explicit presentation gaps, not claims that the mathematics is invalid.

Malformed rectangular dimensions and nonlinear system inputs are source gaps.
A valid coefficient 12 is a presentation gap for this bounded layout. See
`tests/collection-source.test.ts` for executable rejected examples. This is a
typed source API; arbitrary external JSON still needs a decoder before use.

## Reading and verification

`npm run author:la-collection-readings` emits standalone no-script MathML
documents under ignored `tmp/codex/la-collection-readings/`. They contain expanded
equations, the matrix equation, correspondence explanation and escaped annotation
text. This is a separate export; the interactive experiment itself still mounts
through JavaScript, not a newly introduced Article publication path.

Run `npm run test:matrix-pouring` and `npm run visual:matrix-pouring:cohort`. The latter
retains the accepted polynomial, numeric and structural checks and adds the
system and reordered-source cases. Verification covers source identity, distinct
RHS, signed/zero/unit inputs, constant-first ordering, located repair gaps,
weighted stops, direct/reverse seeks, static reading and existing paint continuity.
The cohort runs Chromium, Firefox and WebKit, including narrow-width horizontal
access, light/dark themes and forced-color keyboard navigation. Screenshots
support inspection; these checks do not certify contrast or every accessibility
requirement. Timing/text quality and understanding remain human judgments.

## Cost and evidence limits

The second domain adds a source file and host selection, not a second renderer or
CSS file. The reordered polynomial changes only source after that host support.
Discovery did require shared-view repairs: the three-input caller exposed an
inherited four-input factor gap, signed inputs needed explicit grouped addition,
and constant-first order needed role-based visibility/spacing. The accepted
view now owns those decisions. Do not report this as zero engine intervention
over the entire trial; source-only reuse describes the resulting bounded API.
This is current-agent authoring evidence, not an independent LLM benchmark or
proof of arbitrary shapes. Runtime continues to use one clock and the existing
local token/SVG mechanism; no framework/library was added. Production measurement
uses `npm run build:semantic-cost`, `npm run measure:semantic-cost` and
`npm run visual:semantic-cost`. See the
[cost boundary](../decisions/2026-10-12-la-collection-cost-boundary.md) for the
explicit all-view budget amendment, preserved cold-page limit and runtime limits.
The final polynomial/system/reordered closures measure approximately 106.5,
107.2 and 107.1 kB compressed JavaScript, plus 15.4 kB CSS each, excluding fonts.
Those shared assets are cached; additional mounted stages still incur DOM and
clock work. One/ten-instance desktop observations do not establish mobile scale.

The static generator measured 4542 bytes for the original, 4104 for the system,
and 4154 for the reordered source on this candidate, uncompressed with no JS,
fonts or stylesheet dependencies. These are reading-export sizes, not animation
bundle sizes. Reader comprehension testing remains deferred.
