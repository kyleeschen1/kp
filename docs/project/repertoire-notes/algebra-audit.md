# Algebra implementation audit

Source inspection: 2026-09-16. The [family audit](algebra-family-audit.md) adds
executed evidence and supersedes provisional partial conclusions where named.
Checked rows mean the bounded caller exists from
semantic source through presentation; they do not certify every example string,
every browser, current aesthetic approval, or general authorability. Examples
with a different scalar spelling describe the move, not a newly executed fixture.
The broader unaudited rows remain unchecked. Final executed commands are recorded
in the run evidence; reading the tests below is not the same as rerunning them.

The [fixed-input authoring trial](../reviews/authoring-repeatability/coverage-reconciliation.md)
adds two source variations and accessible static math to the existing bounded
fraction passage evidence. It adds no checkmarks or general authorability claim.
That note maps all affected stable rows and preserves the factoring, mechanics
and code limitations found by the trial.

## Audited support and limits

| Row family | Inspected evidence | Conclusion |
| --- | --- | --- |
| `alg.log.product-expand`, `alg.log.product-three`, product motif | [Semantic caller tests](../../../tests/log-product-semantic-caller.test.ts), [asset adapter](../../../src/animation/log-product-adapter.ts), [lazy pack](../../../src/animation/catalog-packs/log-product.ts) | Exact natural-log product-to-sum callers for two and three positive factors. Reverse sampling exists; the separate combine-as-authored-operation row remains partial. |
| `alg.log.quotient-combine`, quotient motif | [Exact contract](../../../tests/log-quotient-contract.test.ts), [catalogue integration](../../../tests/log-quotient-catalogue-integration.test.ts) | Forward direction is difference-to-quotient. Explicit ordered endpoints reject swapping the contract states. Expansion is partial, not a second check earned by rewind. |
| `alg.log.power-solve`, `alg.exp.solve`, exponent motif | [Exemplar contract](../../../tests/log-exponent-exemplar-contract.test.ts), [adapter](../../../src/animation/log-exponent-adapter.ts) | Bounded chain 2^x=7 → ln(2^x)=ln(7) → x ln(2)=ln(7) → x=ln(7)/ln(2). General logarithmic arguments and coefficient absorption are not established by it. |
| `alg.log.base-change`, base motif | [Native endpoints and catalogue tests](../../../tests/logarithm-change-of-base-exemplar.test.ts) | Exact log_2(7) caller and scalar endpoint pressure with log_10(100); not arbitrary expressions or arbitrary target bases. |
| `alg.fraction.scale`, scale motif | [Semantic/presentation/native tests](../../../tests/fraction-equivalence-exemplar.test.ts) | Unit factor branches into numerator and denominator. Explanatory and compact paired-operation modes exist. |
| `alg.fraction.align-multiple`, alignment motif | [Semantic alignment](../../../tests/fraction-common-denominator-semantics.test.ts), [pressure asset](../../../src/animation/common-denominator-pressure-exemplar.ts) | 1/3+1/6 becomes 2/6+1/6. The pressure asset's final endpoint does not combine the addends; do not count it as a completed addition lesson. |
| `alg.fraction.same-add`, `alg.fraction.same-subtract` | [Combination semantics](../../../tests/fraction-like-denominator-combination-semantics.test.ts), [family audit](algebra-family-audit.md) | Raw numerator arithmetic and equal-denominator checks exist. Follow-up recovered bounded addition in the quadratic reader; subtraction and shared standalone reuse remain partial. |
| `alg.fraction.cancel-factor`, cancellation motif | [Scalar authoring packet](../authoring/scalar-cancellation-reader-packet.md), [domain source](../../../domains/algebra/scalar-cancellation.ts) | Checked scalar passage exposes/cancels one inverse pair and collects its coefficient while retaining the remainder. This does not certify all rational-expression shapes. |
| `alg.distribute`, `alg.factor-common`, distribution/factoring motifs | [Asset adapter](../../../src/animation/distribution-adapter.ts), [choreography tests](../../../tests/kp-distribution-choreography.test.ts), [factoring plan](../../../src/animation/distribution-factoring-presentation-plan.ts) | Explicit expansion and factoring paths exist. Nested product grouping is tested, but an arbitrary nested expression or complete polynomial multiplication is left partial. |
| `alg.eq.add`, `alg.eq.subtract`, balanced-operation motif | [Registered callers](../../../tests/registered-both-sides-additive-callers.test.ts) | Canonical subtraction and generated addition bind into the shared causal and rendering path. |
| `alg.eq.divide` | [Exact asset trace](../../../tests/divide-both-sides-equation-asset.test.ts), [adapter](../../../src/animation/divide-both-sides-equation-adapter.ts) | Three-x equals twelve has explicit divide, cancellation and evaluation states. |
| `alg.eq.multiply` | [Governed declarations](../../../tests/equation-series-both-sides-authoring.test.ts), [family audit](algebra-family-audit.md) | Follow-up traced the fractional-linear caller through causal binding and material projection; bounded multiplication is now checked. |
| `alg.power.expand-square`, `alg.root.half-power`, `alg.root.root-to-power`, related motifs | [Governed candidates](../../../tests/governed-exponent-radical-promotion.test.ts), [asset adapter](../../../src/animation/exponent-radical-adapter.ts), [semantic fixture](../../../src/semantic/generated-algebra-tutorial-fixture.ts) | Bounded square/product and power-to-root examples exist. Despite the registry's square-root-as-power title, the actual `rewritePowerAsRoot` operation has power source and radical target. Reverse playback does not certify root-to-power authoring. The evidence distinguishes reviewable exponent and promoted radical; dashboard check is not aesthetic promotion. |

## Partial evidence to investigate next

- Exponential sum/product and difference/quotient are distinct rows. The [family audit](algebra-family-audit.md) verifies their two exact registered authoring callers beyond the initially inspected pack. Broader shapes and directions remain unproved.
- General rational-expression composition: [governed split/merge variation](../../../src/authoring/governed-fraction-split-merge-variation.ts), [multiplicative cancellation plan](../../../tests/fraction-composition-multiplicative-cancellation-plan.test.ts), [distributed sum composition](../../../tests/fraction-distributed-sum-composition.test.ts). These are substantial machinery, not a reason to mark every fraction variant implemented.
- Numerical evaluation/reduction: [fraction adapter](../../../src/animation/fraction-adapter.ts), [exact quantity pack](../../../src/animation/catalog-packs/exact-quantity.ts). Separate checked computation from a reusable explanation of each arithmetic operation.
- Quadratic methods: [formula authority](../../../src/semantic/quadratic-formula-authority.ts), [formula KaTeX tests](../../../tests/quadratic-formula-katex.test.ts), [completing-square tests](../../../tests/quadratic-completing-square-authority.test.ts). Method authority/native forms do not alone prove the general reader experience.
- Roots and inequalities: [odd-root semantics](../../../src/semantic/odd-root-solve-exemplar.ts), [even-root tests](../../../tests/even-root-solve-exemplar.test.ts), [inequality animation](../../../tests/kp-inequality-sign-flip-animation.test.ts).
- Quotient squaring: the mechanics [norm-scaling record](../threads/2026-09-16-norm-scaling-composition.md) establishes a bounded caller, not arbitrary algebraic transfer.
- The [finite-sum exemplar](../../../src/animation/finite-sum-expansion-exemplar.ts) now has a checked three-index caller. The [exponent absorption fixture](../../../src/authoring/governed-exponent-absorption-fixture.ts) removes a unit exponent; its initial association with logarithm coefficient absorption was incorrect. General log absorption remains unverified.

## Prior checklist corrections

The old broad “apply a supported operation to both sides” check is now separated
into addition, subtraction, multiplication, division and logarithm operations.
The bundled log-product/quotient motif check becomes independently scoped rows.
No underlying implementation was removed. Remaining unaudited rows mean that this
audit has not yet established their exact support, not that the repository has
no related mathematics.
