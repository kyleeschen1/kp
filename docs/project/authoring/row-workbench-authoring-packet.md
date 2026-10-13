# Authored row-operation workbench

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
