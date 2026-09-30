# One product, another explanation

Status: HUMAN_CHECKPOINT; column-combination candidate ready for review.
Authority: [approved experiment](../2026-09-30-matrix-interpretations.md).
Contract: `run-contract.kp.matrix-interpretations-v1`.

Open [the column-combination example](http://localhost:8000/experiments/matrix-column-combinations/).
Play or choose Columns, Weights, Scaled, Sum and Placed. The first result column
is built as 2[1,3] + 1[2,4] = [2,6] + [2,4] = [4,10]. The second result column
is intentionally not calculated in this bounded presentation. The
[accepted dot-product view](http://localhost:8000/experiments/matrix-column-product/)
is unchanged and linked from the new page.

Review whether copied columns remain recognizable, whether the weights clearly
come from B, and whether the three levels of the calculation are easy to read.
The evaluation steps introduce derived values at native reading checkpoints;
they are not an approved general-purpose arithmetic morph. Layout, timing and
the original numerical example are provisional. Narrow screens use horizontal
stage scrolling, not shrunken math.

## What the abstraction test establishes

`columnCombinations(product)` groups existing contributions. Every scaled-column
entry is the identical scalar product already referenced by a dot-product pair;
every coefficient and vector entry is the original input object. It performs
no new arithmetic and creates no substitute scalar IDs. This is direct evidence
that these two interpretations can share one mathematical relationship.

```ts
const columns = columnCombinations(product);
const term = columns.column(0).terms[1];
term.vector;       // A's second column
term.coefficient;  // B's entry at row 1, column 0 (zero-based)
term.pairs[0] === product.cell(0, 0).dot.pairs[1]; // true
term.entries[0] === term.pairs[0].product;         // true
```

Identity tests use the same combinations: zero contributions remain inspectable,
and a weight of one selects the original source column. The derived result has
its own identity even when its value equals the input.

`transposeKpTypedMatrix` changes positions while retaining original scalar
objects and literal transposed dimensions. `gramMatrix` builds Q-transpose times
Q through the existing product owner; its dot pairs therefore refer directly to
the original two columns. This is real Euclidean algebra, not a general
Hermitian or arbitrary-inner-product implementation.

`inspectOrthonormality` returns numerical evidence with a frozen binding scope,
explicit tolerance, per-cell expected/actual values and errors. It tests all
original source entries for finite evaluation before checking the Gram matrix.
Its result is within-tolerance or outside-tolerance, not a symbolic proof or
permission to call arbitrary columns a basis. Rectangular orthonormal columns,
nonorthogonal/unit-length failures, dimension limitations, missing bindings,
nonfinite values and tolerance sensitivity are exercised.

The semantic tests cover identity and orthonormality now. Their visual transfer
remains behind this exemplar checkpoint. No universal mathematical ontology,
new renderer framework, geometric map or public scene DSL follows from this test.

## Boundaries and verification

The new host consumes the existing checked matrix environment and the pure
interpretation adapter. Native KaTeX supplies static endpoints; the existing
computed-style clone, authority stripping and reader playback clock supply
material and time. Copied occurrences retain source IDs. New layout and
projection stay local to the removable experiment. There is no catalogue or
canonical-compositor promotion claim.

- `npm run test:matrix-interpretations`: 17 tests passed.
- `npm run test:matrix-column`: 20 existing semantic/presentation tests passed.
- `npm run visual:matrix-interpretations`: two Chromium tests passed. Covers
  six endpoint captures, three transit captures, source-reference metadata,
  native target values, clone marker stripping, direct seek/reversal, actual
  playback to a checkpoint, keyboard, URL restore and reduced-motion behavior.
  Phone/dark captures are discovery evidence, not a supported-browser matrix.
- Contact sheet, coefficient transit, result transit and phone capture inspected.
- `npm run typecheck`: passed with zero Svelte errors/warnings. The first run
  caught an index-signature access in a test; corrected and rerun in full.
- `npm run check:architecture`: passed, including eight conformance tests.
- `npm run build:matrix-interpretations`: passed; 41 modules, JS 97.38 KB gzip,
  CSS 14.26 KB gzip, HTML 0.49 KB gzip, excluding fonts and transport overhead.
  This is a separate preview entry, not an increase to the accepted page.
- Generated equation-reachability inventory refreshed for the new files; all
  three exact inventory/root tests pass. No root declarations or limits changed.

The discovery contract uses focused semantic and preservation checks. Full
repository tests, promotion/browser cohorts and learner-effectiveness claims
were not part of this checkpoint. The two packages remain reversible separately:
semantic adapters/tests, and the local preview/host/configs. No budget was raised.

After visual acceptance, resume the contract's transfer slice; do not ask for a
redundant resume. Pressure the selected treatment with identity and orthonormality
and extract only what those callers actually share. If this layout is rejected,
keep the semantic adapters and revise the local presentation.
