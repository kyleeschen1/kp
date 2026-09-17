# Bounded scalar cancellation in the persistent reader

Status: accepted bounded transfer; see the paired review for scope.
Current paired review: `../reviews/2026-09-17-chain-first-transfer-review.md`.
Original canonical owners: `../threads/2026-09-15-scalar-reader-review.md`.
This is not a task in the `author:check` inventory yet. Do not invent an inventory
task ID or describe this file-based workflow as an editor Apply capability.

## Start from the real caller

- Mathematical source: `examples/algebra/scalar-cancellation.json`.
- Prose and written chain: `examples/algebra/scalar-cancellation.article.md`.
- Shared-server preview:
  <http://localhost:8000/experiments/scalar-cancellation/?derivation-detail=expandable#remaining-factor>.

The source declares exactly:

```json
{
  "schema": "kp.algebra.scalar-cancellation.v1",
  "result": "R",
  "factor": "x",
  "numerator": "b",
  "factorDomain": "positive-real",
  "numeratorDomain": "real"
}
```

It licenses only `(1/2) x (b²/x²) → b²/(2x)` and the three checked finer steps.
`numerator` names the real scalar whose square is retained. Symbol fields accept
distinct single Latin letters. For a supported variation, change these fields
and the corresponding Article notation/prose together, then reload the preview.
The Article ID and `remaining-factor` passage remain its binding addresses.
An empty Article imports mapping uses `imports:` with no `{}` shorthand.

## Authority and repairs

`checkScalarCancellation` in `domains/public-api.ts` accepts unknown source and
returns checked authority or a typed diagnostic. `createScalarCancellationPlan`
issues renderer bindings only from that checked authority. The publication
adapter invokes the same governed compiler, scaffold, controls and native KaTeX
compositor as the physics reader. Do not copy its renderer or write new timings.

Changing `factorDomain` to `real` is rejected at `$.factorDomain`, expecting
`positive-real`, with `algebra.scalar-cancellation.unsupported-source`.
LaTeX in a symbol field, coincident symbol names, extra proof/geometry fields,
or a vector assumption are also outside this source contract. Changing the
Article's chain without matching checked mathematics rejects publication.
The browser rechecks source and compares its fingerprint with the published
binding before inspection. There is no silent replacement animation.

Compact inspection now composes the same checked child operations exposed by
the expanded view. It does not infer a proof from endpoint LaTeX or substitute
a coarse generic fusion when children are unavailable. The coefficient's `2`
has persistent lineage through collection. This scalar treatment is accepted for
the retained caller; a materially new treatment still needs its own exemplar review.

`npm run visual:mechanics-relations -- --grep scalar` checks the real caller.
`node --disable-warning=ExperimentalWarning --test tests/scalar-cancellation-reader.test.ts`
checks the retained source, a coherent symbol/prose variation and rejected
inputs. These are handwritten authoring probes, not a live-LLM benchmark.

Shared styles affect both fresh builds; already bundled immutable editions
need explicit regeneration. Free prose is reviewable editorial content, not
verified mathematical proof. Other cancellation forms, arbitrary deductions,
new motifs and additional media still require their own bounded authority.
