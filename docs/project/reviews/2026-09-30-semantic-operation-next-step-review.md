# Semantic operations behind the matrix animation

Status: first package (steps 1–2) approved by the user's “go”; later packages remain proposals.
Execution: `run-contract.kp.semantic-matrix-product-v1` owns the single combined
semantic-product/exemplar-migration slice. Keep one verified implementation
commit as its rollback boundary; do not merge or deploy. Bound this run to this
package and its verification/closeout, with no optional expansion into steps 3–5.

The user accepted the matrix animation with “this looks great” and identified
semantic subobjects and reusable operation knowledge as the next priority.
Matrix multiplication should retain both factors, expose their rows/columns and
cell contributions, and support different valid interpretations. This accepts
the direction, not a universal renderer, unrestricted mathematical domain, or
new autonomous implementation contract. The subsequent “go” authorizes the
explicitly recommended first implementation package, not the later new visuals.

## Recommendation

Build a small semantic matrix-product object behind the accepted animation,
then prove reuse with a standalone dot product and a second interpretation.
Keep mathematical meaning independent of the chosen traversal and layout.
Do not begin with a general parser, an expanded content library, or a complete
scene framework. Concise author syntax should be tested against these concrete
uses before being frozen as a public API.

The current implementation is useful evidence but remains specialized:
`src/experiments/matrix-column-product/score.ts` selects a fixed generated 2x2
fixture and an ordinal sequence. The existing
`src/math/typed-semantic-math.ts` already provides typed matrices, expressions,
dimension validation and multiplication provenance. Its multiplication function
returns a result matrix; it does not expose the proposed navigable operation.
Extend/reuse these owners rather than introducing another arithmetic engine.

## Proposed outcome packages

1. **Semantic operation and lenses.** Retain immutable left/right operands and
   a derived result. Expose rows, columns, cells, matched entry pairs, individual
   products and their sum through stable semantic references. A cell's dot
   product retains its source context and destination. Rows and columns are
   overlapping selections, not competing ownership trees. Traversal order must
   not change identity. Test rectangular operands, repeated equal values,
   symbolic expressions supported by the existing owner, invalid dimensions,
   and source immutability. Separate backward dependency tracing from inversion.
2. **Preserve the accepted exemplar through migration.** Drive the existing
   column-first animation from that object. Scene occurrences refer to semantic
   sources; copying creates a new occurrence without rebinding the matrix.
   Preserve the existing appearance, shared clock, native endpoints and ownership
   checks. Remove duplicated fixture-to-cell knowledge where the new owner
   demonstrably replaces it. This does not require unchanged-visual reapproval.
3. **Reusable dot-product passage.** One passage handles operand arrangement,
   multiplication syntax, individual product evaluation and sum evaluation.
   Use it both independently and inside matrix multiplication. The current
   exemplar does not establish this complete staged arithmetic vocabulary.
   Review one bounded visual example, then pressure three terms and negative
   entries before treating it as reusable. Expose placement, pacing, emphasis
   and ordering as authored choices; retain semantics in the operation.
4. **Matrix representations and authoring proof.** Expose a matrix as a grid,
   stack of rows or stack of columns, preserving source references. Demonstrate
   both row-first and column-first traversal and a rectangular numerical case
   with no renderer edits. Bind annotations to semantic selections and named
   milestones. Use these examples to refine the concise env/scene/transform
   API, rather than implementing every proposed spelling in advance.
5. **One genuinely different interpretation.** Express each result column as a
   linear combination of the left matrix's columns, using the same product
   object. Validate the correspondence first, review one visual exemplar, and
   only then generalize. Geometric composition follows when spaces, bases and
   domain assumptions are explicit; reverse playback never implies an inverse
   exists. Interpretation adapters remain modular rather than pulling every
   renderer into the semantic core.

Each package is a separately reversible change. The canonical visual reference
is `experiments/matrix-column-product/index.html`, served at
`http://localhost:8000/experiments/matrix-column-product/`; its renderer is the
local native-KaTeX adapter in `presentation.ts`, and its current semantic source
is the generated matrix fixture plus existing composition validation. Preserve
the catalogue renderer and inspector. Use cheap semantic/type checks first,
existing scoped browser checks for preservation, and broader visual coverage
after each new treatment passes review. Measure type and reader costs before
and after promotion; no numerical budget is invented by this planning review.

Success means changing supported values, dimensions or traversal requires
author data/score edits rather than renderer edits; every contribution can be
traced to its operands and destination; and two presentations share the same
operation. Record authoring effort and remaining special cases. This is evidence
of reuse, not yet evidence of a market or universal mathematical coverage.

## Alternatives

Scores are judgments, not measurements; 5 is high, including risk.

| Candidate | Authoring | Reliability | Reuse | Risk | Recommendation |
|---|---:|---:|---:|---:|---|
| Semantic product plus accepted-exemplar migration | 5 | 5 | 5 | 2 | First bounded package |
| Add more fixed matrix examples | 2 | 3 | 2 | 2 | Only as pressure cases |
| General parser and complete scene DSL first | 4 | 2 | 3 | 5 | Defer until concrete uses constrain it |
| Full geometric/multidomain operation framework | 3 | 2 | 4 | 5 | Preserve direction; scope later |
| Further inspector polish | 2 | 3 | 2 | 3 | Keep parked pending a clear author task |

The recommendation offers small initial scope and continuity with working code,
reduces duplicate semantic reconstruction, and preserves older planning as
provenance. It supersedes the immediate recommendation in the earlier
[inspector next-step review](2026-09-30-next-step-review.md). The inspector's
unaccepted checkpoint remains unaccepted. No executable contract or runtime
code is changed by this review.
