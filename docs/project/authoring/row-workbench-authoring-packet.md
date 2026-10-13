# Authored row-operation workbench

## October 13 composed explorer extension

The standalone interactive workbench below retains its 2-equation/3-unknown
envelope. The composed host also accepts checked 2×2 and 3×3 systems, zero rows
and exact fractions. `composeCheckedRowSteps` consumes 1–16 predecessor-linked
checked records; it preserves their referents rather than checking reconstructed
numbers under new identities. `compileRowSequenceComposition` remains the
source-authored route. Intermediate collection coefficients have numerator
magnitude ≤9 and denominator ≤9; RHS numerator magnitude ≤99 and denominator
≤9. Unsupported input returns a located repair.

`createSystemsExplorer({size: 3, kind: 'infinite', seed: 1, rank: 1})` is the
bounded generated route, using the same player/view. It retries up to 64 seeds
for presentation eligibility and requires a nonempty trace. Tests pressure 72
source-only variations without renderer edits; this is evidence for this typed
source family, not a measured LLM authoring benchmark. See the
[delivery review](../reviews/2026-10-13-systems-explorer-direction.md#generator-delivery).

Status: bounded authoring interface; both explanatory examples accepted. The accepted
motion remains local to the two-equation, three-unknown workbench.

Canonical host: `/experiments/rectangular-product/?view=row-operation`.
The native KaTeX/SVG view and shared clock render exact operations checked by
`src/math/linear-system-row-operation.ts`. No second arithmetic authority or
animation scheduler is introduced.

## Authoring

Add data in `src/experiments/rectangular-product/row-workbench-examples.ts`:

```ts
const source: RowWorkbenchSource = {
  id: 'redundant',
  title: 'When an equation adds nothing',
  introduction: 'Subtract twice the first equation from the second.',
  unknowns: ['x', 'y', 'z'],
  coefficients: [[1, 2, 3], [2, 4, 6]],
  rhs: [7, 14],
  steps: [{
    id: 'expose-redundancy',
    operation: { kind: 'add', sourceRow: 0, targetRow: 1, factor: -2 },
    during: 'Subtract the complete equation, including its right-hand side.',
    after: 'The second equation is 0 = 0; it adds no constraint.',
  }],
};
```

Compile with `compileRowWorkbenchSource`; inspect its discriminated result:
`compiled` or `repair-required` with a located path and message. The registry
uses `requireRowWorkbenchSource` for developer-owned sources. It throws on a
repair instead of silently substituting an example. Register a unique query key,
label and compiled model in `rowWorkbenchExamples` to expose the selector.

Rows are zero-indexed. Operations are `swap {first, second}`,
`scale {row, factor}`, and `add {sourceRow, targetRow, factor}`. Use safe integer
numbers or explicit fraction strings such as `"1/2"`. Scale factors cannot be
zero. Stable source and step IDs name the story independently of display text.

The compiler validates the entire ordered sequence before playback, including
each intermediate arithmetic presentation. The player uses the existing checked
transaction path for authored steps and manual controls. Cancellation restores
the prior annotation; Undo/Redo follow committed history. Manual branching
disables the next authored step until that history prefix is restored or reset.
Changing examples starts a fresh session.

## Supported boundary

- Exactly two equations and three distinct single-letter unknowns.
- One to 24 named steps; each annotation has one to 600 characters.
- Displayed exact values have numerators -99 through 99 and denominators 1–9;
  intermediate arithmetic must also fit. This is a layout limit, not a claim
  that the underlying mathematics ends there.
- Input is typed TypeScript, not an untrusted JSON decoding API.
- Annotations are authored prose. Arithmetic and inverse witnesses are checked;
  the prose is not automatically proved.

## Readings and evidence

The expandable authored walkthrough starts at the original system and includes
every checked operation, result, inverse and annotation. It is distinct from
the current session history. `npm run author:row-readings` emits standalone,
script-free native MathML files under `tmp/codex/row-workbench-readings/`.

Run `npm run test:row-operation` and `npm run visual:row-operation` for compiler,
history and browser evidence. The browser pressure caller changes unknowns,
coefficients, RHS, IDs and annotations through the same compiler and player.
It establishes same-shape authoring reuse, not a new geometry or general LA
renderer. Acceptance covers the redundant and inconsistent stories; broader
promotion still requires structural pressure beyond this fixed shape.

## Linked equations inspection experiment

The same host now derives a conventional equation for each committed row. The
source schema is unchanged: ordered unknowns, exact coefficients and independent
RHS values supply both representations. Negative terms use subtraction, unit
coefficients are implicit, zero terms are omitted, and an all-zero sum reads `0`.
The matrix's `b = Ax` order is preserved, so the contradiction is visibly `1 = 0`.
Static readings include the equations too.

Select a numbered matrix row or equation to inspect the same constraint. Selection
means the row position in the current system; after a swap its referents are the
checked values now at that position. During preview, the equations explicitly
retain the committed system; selection paint is suspended until completion or
cancellation. Reset clears selection. No partial arithmetic frame is asserted to
be a settled equation, and no extra equation animation is implied.

`row-equations.ts` retains coefficient/unknown IDs for every term, including
omitted zeros and implicit units, and supplies the existing cross-view map and
attention compiler. The local panel uses the reader semantic-focus service;
there is no second solver, clock or global focus store. Coefficient-level
interaction and a general scene API are outside this candidate. The linked
panel's [review](../reviews/2026-10-12-linked-row-equations.md) is closed with
qualified acceptance: technically fine, but the user does not anticipate using
this animation. Retain its correspondence evidence without treating its layout
as a recommended presentation or promoting it broadly.

## Composed explanation and bounded authoring reuse

Both composed explanations are accepted. Their shared collection view now has
a natural resting-layout candidate, recorded in
`../reviews/2026-10-12-natural-collection-layout.md`.

`?view=row-composition` now uses the actual `linearSystemModel` objects through
collection, one checked row addition and reverse collection of the derived
result. `row-composition-model.ts` owns the bounded sequence and located
projection repairs. It does not copy numerical source data into a second fixture.
`CollectionOutput` now explicitly permits RHS IDs owned by checked derivations;
they need not resemble the original source's naming convention.

The existing collection view owns its geometry; the existing row renderer takes
matching positions and uses its ordinary fusion sampler. An outward copy lane
has a small lateral clearance to avoid crossing the receiving glyphs. The
shared host still owns the sole clock. Three prepared native surfaces have
exclusive paint ownership at matching endpoints, including direct reversal.

This is one opt-in sequence, not a generic authoring API. Expansion still rejects
whole-zero rows, fractional coefficients and coefficient magnitudes above nine.
The standalone workbench's wider numeric envelope does not remove those gaps.
Review continuity and explanatory value before generalizing the adapter.

Author with `RowCompositionSource` and `compileRowComposition` from
`row-composition-model.ts`. Supply an existing compiled linear-system collection,
one unit row addition, a title/introduction and four named annotations:

```ts
const source: RowCompositionSource = {
  id: 'my-system.add-first-to-second',
  before: myCompiledCollection,
  title: 'Eliminate an unknown from one equation',
  introduction: 'Opposite coefficients cancel when the equations are added.',
  operation: { kind: 'add', sourceRow: 0, targetRow: 1, factor: 1 },
  annotations: {
    equations: 'Find the opposite coefficients.',
    matrix: 'They occupy the same column in the two rows.',
    changed: 'Add row 1 to row 2, including the right-hand side. Retain row 1.',
    expanded: 'Read the resulting equations. Their joint solutions are unchanged.',
  },
};
const result = compileRowComposition(source);
// result is compiled or repair-required with a located path and message.
```

Start from `row-composition-variation.ts` for a complete runnable source. It uses
`[[1,2,-1],[-1,1,2]]`, RHS `[4,2]`, and unknowns `u,v,w`. The resulting second
equation is `6 = 3v + w`; the first remains `4 = u + 2v - w`. Preview through
`?view=row-composition&example=eliminate-second`; the menu links both examples.
The original route and default remain intact. A new source needs explicit host
selection; this is not a file-upload or arbitrary runtime ingestion interface.

Indices are zero-based. The type admits only unit addition; the exact checker
rejects self-addition, while the projection rejects unsupported endpoints. For
example, opposite entire rows produce `repair-required` at
`after.coefficients.<target>` rather than an empty equation. Missing annotations
are located at `annotations.<beat>`. Text remains editorially reviewed; the
checker verifies arithmetic and correspondence, not authored teaching claims.

The parameterization changed the existing view into a factory and generalized
the model sampler. The second caller itself changes only source and host
selection: no new coordinates, easing, CSS, renderer, clock or arithmetic.
No new row-operation families, arbitrary sequence length or larger grid support
are inferred from this test. `test:row-operation`, `visual:row-operation` and the
complete `measure:semantic-cost` consumers retain both examples.

## Multi-operation composition candidate

`RowSequenceCompositionSource` and `compileRowSequenceComposition` now connect
one to eight named swap/scale/add operations through the same host and checked
step compiler. Start from `row-composition-sequence.ts`; preview at
`?view=row-composition&example=elimination`. This new connected presentation is
awaiting human review, not promoted as a general elimination interface.

Supply `before`, title/introduction, `steps` using the workbench's existing
`id`, `operation`, `during`, `after` fields, and `equations`, `matrix`, `expanded`
annotations. Each step's short ID is a host milestone; it must be unique and
cannot shadow those three reserved milestones. Every intermediate system must
fit the current collection envelope; repairs locate `steps.<index>.after`.
Fractions can be operation factors when results remain supported integers;
whole-zero rows and fractional collection endpoints remain explicit gaps.

The candidate demonstrates echelon then reduced echelon form with one free
variable. Those prose claims are reviewed authored explanations, not a new rank
checker or generator. The source uses no coordinates, timing or per-example CSS.
