# Semantic matrix product: accepted-exemplar migration

Authority: [approved first package](2026-09-30-semantic-operation-next-step-review.md),
steps 1–2 only. Theseus owns execution and final verification status under
`run-contract.kp.semantic-matrix-product-v1`.

## Author capability

`src/math/matrix-product.ts` adds a renderer-independent operation over existing
immutable typed matrices. The inputs remain the original objects. Result shape
inference and arithmetic reuse `typed-semantic-math.ts` and `expression.ts`.

```ts
const product = matrixProduct({ id: "AB", left: A, right: B });
const cell = product.cell(0, 1); // zero-based row and column

cell.row.entries;       // original A entries, not visual copies
cell.column.entries;    // original B entries
cell.dot.pairs;         // left, right, and derived product for every inner index
cell.result;            // the identical scalar in product.result

product.columns[1];     // all contributions to the second result column
product.leftParts.row(0);
product.rightParts.column(1);
```

Rows and columns overlap through shared entry references. Result cells are
cached and shared between row-major, column-major and individual access; order
does not mint new identities. Numeric simplification retains all original pairs,
including zero contributions. The operation is deeply immutable, has no scene
or DOM imports, and carries no timing or geometric interpretation.

Literal dimension incompatibility is rejected by TypeScript, with a negative
type test. Runtime checks reject dynamic dimension mismatches, invalid indices,
mutable operands, malformed shapes and conflicting IDs. Real-valued symbolic
expressions use the existing numeric-scope semantics; this is not an exact
arithmetic upgrade, arbitrary algebraic-domain model, inverse solver or proof
certificate. Reverse querying is dependency traversal, not inversion.

## Integration and preservation

The canonical host remains
[the column-first animation](http://localhost:8000/experiments/matrix-column-product/).
`environment.ts` is an explicit import/projection adapter from the trusted
generated fixture and existing choreography validation. It imports authored
entry identities into typed operands, computes the semantic product, and checks
its results and operand references against the fixture. It retains the mapping
from semantic result cells to native result selectors and intermediate objects.
The environment exposes `A`, `B`, `product` and the existing renderer projection;
each projected cell retains its semantic cell reference.

The projection is data-only; `presentation.ts`, its style, shared clock and
milestone cadence are unchanged. A regression test compares the complete prior
renderer input against the new projection, including source/result IDs. Browser
checks cover sampled motion, native ownership, seeks, rewind, controls, narrow
screens and reduced motion. The captured milestone contact sheet was inspected.
An unchanged treatment does not need another human approval.

The current visual adapter and score remain fixed to the accepted 2x2 sequence.
Rectangular and symbolic cases are demonstrated in the semantic layer, not in
the browser. Reusable staged dot-product motion, generic layout bindings and
other interpretations remain the next proposed packages.

## Verification and cost

- `npm run test:matrix-column`: 20 tests passed, including rectangular 2x3 by
  3x2 multiplication, repeated values, symbolic/negative/zero contributions,
  immutable input/output references, index/identity rejection and fixture parity.
- `npm run visual:matrix-column`: both Chromium tests passed; milestone captures
  inspected. This is preservation evidence, not broad compositor certification.
- `npm run typecheck`: passed, including tests, Svelte and domain checks.
  The first attempt caught a generic-type reference comparison; using
  `Object.is` expresses that comparison without weakening dimension types.
- `npm run typecheck:tests`: passed again after adding projection parity coverage.
- `npm run build:matrix-column`: passed. Final JavaScript 100.18 KB gzip versus the
  prior recorded 98.73 KB (+1.45 KB); CSS unchanged at 14.12 KB gzip. Fonts and
  transfer overhead excluded. The local build traverses 41 modules versus 36.
- `npm run build:bundle`: passed; existing large-chunk warnings remain.
- `npm test`: 7,224 of 7,225 tests passed. The sole failure was stale generated
  equation reachability evidence, including prior inspector callers and the
  source-file count. `npm run generate:equation-reachability` updates the count
  from 4,829 to 4,856 and adds five caller entries; all 68 root declarations
  remain unchanged. No assertion or budget was weakened. The focused
  `node --disable-warning=ExperimentalWarning --test tests/exact-equation-reachability-graph.test.ts`
  rerun passed all three tests, including exact equality with freshly computed
  evidence and root classification. The full suite was not repeated after this
  generated-data-only correction; do not report it as a clean full-suite run.

No engineering budget was raised. The new core and import adapter add two small
modules; existing math owners, renderer and legacy catalogue paths are preserved.
Rollback is the single package commit, including its focused tests and evidence;
no merge or deployment is included.
