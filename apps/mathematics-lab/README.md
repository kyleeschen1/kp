# Mathematical objects lane

This independent fixture applies a numerical 2×2 matrix to a 2D vector. It uses
KP's existing typed-math multiplication and semantic-state dependency evaluator;
it imports no notebook application, editor, chat, or experimental renderer.

`src/math-resources/public-api.ts` supplies the complete resource API. Hosts
that only need JSON admission can import `src/math-resources/data-api.ts`
without loading evaluation. The notebook consumer at
`/experiments/fraction-notebook/?notebook=matrix` exercises the same API through
native editor history; its G2 presentation review remains separate from this lab.

From the repository root:

```sh
npm run --prefix apps/mathematics-lab dev
npm run --prefix apps/mathematics-lab test
npm run --prefix apps/mathematics-lab typecheck
npm run --prefix apps/mathematics-lab build
```

The development command requires the repository's installed dependencies, binds
strictly to `http://127.0.0.1:8012/`, and fails if that port is occupied. It does
not launch KP's main application or change its development service. Production
output stays in this app's ignored `dist/`. Use the integrator's managed service
for previews that must outlive a terminal session.

## Observable workflow

1. The initial shear matrix and vector produce `Av = (3, 2)`.
2. Change matrix row 1, column 1 to `3`; both views and the equation give `(5, 2)`.
3. Enter `-` in the same input. Its draft persists while the last valid result
   remains, with an explicit incomplete-input explanation.
4. Change View 1's range to `25`; View 2 stays at `10`.
5. Reload. All identities, references, admitted values, partial drafts and local
   view ranges survive in `kp.lab.mathematics.matrix-vector.v1` local storage.

The SVG views reuse Graph2D axes and coordinate projection. Dashed green marks
the input; solid red marks its image. They clip to each occurrence's own domain
and explain when a vector extends beyond it. KaTeX renders the symbolic result.
This is a static authoring fixture, with no new animation choreography.

## Boundary

`src/math-resources/public-api.ts` exports validated data, edits and a disposable
evaluator. `createMatrixVectorDocument` supplies a starter with independent
source/result/occurrence UUIDs. `readMatrixVectorDocument` admits immutable plain
JSON and rejects wrong recipes, inconsistent drafts, missing dependencies,
duplicate IDs, unsupported dimensions and invalid numeric bounds.

`editMatrixVectorDocument` retains invalid drafts alongside admitted numeric
values. `editOccurrenceExtent` changes a view without changing resource truth.
`createMatrixVectorRuntime(document)` returns `update`, `sample`, `inspect`, and
`dispose`; it rejects updates that change its document/resource identities.
Create a new owner for another document. The host owns persistence and UI.

Mathematical authority is `src/math/typed-semantic-math.ts`; the typed-state
adapter is `src/math/typed-math-state-value.ts`. The existing semantic-state
schema, transforms and bounded derived cache own evaluation. The sole notebook
module imported is the pure `src/notebook/model.ts` for UUID admission/generation
and the matrix tuple type; it has no editor/runtime dependencies.

The resource schema intentionally supports one matrix, one vector, one product
recipe and up to eight occurrences. Input coefficients are finite decimals in
[-10, 10]. This is not a general resource registry, arbitrary matrix authoring,
cross-document import, or promoted KP notebook feature. The kernel bounds
retained edits at 128 between rebases and keeps at most three derived cache
entries. Caller history belongs outside that disposable evaluator.

## Verification and ownership

The seven unit tests cover independent numeric identities (including singular
and zero matrices), JSON restoration, selective recomputation, invalid drafts,
immutable admission, rejected updates, 300-edit retention and disposal/isolation.
The browser spec is `tests/mathematics-lane.browser.spec.ts` and accepts
`KP_MATHEMATICS_LAB_URL`; root's aggregate visual command owns its execution.

Owned paths are this app, `src/math-resources/`, the two mathematics-lane test
files and `config/typescript/tsconfig.mathematics-lane.json`. Root integration
owns dependency policy, shared schemas, root package scripts and lockfile.
No extra npm dependency or duplicate mathematical evaluator was introduced.

Worker verification on 2026-11-27: all seven unit tests, the complete scoped
TypeScript check and the standalone production build pass. Initial typechecking
exposed the distinction between a typed-math object and its JSON-safe state
value; using the existing `createKpTypedMathStateValue` adapter repaired it
without casts or shared-owner changes. Build output is 343.03 kB JS / 99.36 kB
gzip and 30.49 kB CSS / 8.74 kB gzip, plus emitted KaTeX font alternatives. Those
are build sizes, not measured browser transfers or latency. Browser checks are
authored but await the integrator's stable aggregate visual command.
