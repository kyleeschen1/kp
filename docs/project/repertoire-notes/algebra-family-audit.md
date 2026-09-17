# Algebra family audit: recovered coverage and reuse boundaries

Audited 2026-09-16 under the [approved audit](../reviews/2026-09-16-repertoire-check-population-review.md).
All 23 previously partial algebra rows were reviewed. Twelve now have explicitly
bounded checked implementations; eleven remain partial. No engine, renderer or
lesson changed. The inventory remains 747 rows, with 94 checked overall.

The checkbox rule is unchanged: a demonstrated semantic-to-presentation caller at
the stated scope. Original example strings were sometimes illustrative, not
executed fixtures. Recovered rows now show their actual caller. This is recovery
of existing examples, **not arbitrary authorability or twelve new capabilities**.
The limits below preserve broader needs instead of hiding them behind a check.

## Twelve recovered checks

| Row | Evidence inspected and executed | Exact scope and outstanding limit |
| --- | --- | --- |
| `alg.evaluate` | [Fractional asset/material tests](../../../tests/fractional-linear-equation-animation-asset.test.ts) | Separate constant-product synthesis `x=2·4 → x=8`; all six transitions project to material plans. Arbitrary symbolic arithmetic such as `2·3x` remains unproved. |
| `alg.fraction.reduce` | [Asset](../../../tests/kp-fraction-animation-asset.test.ts), [stage](../../../tests/kp-editor-fraction-visible-animation.test.ts), [choreography](../../../tests/kp-fraction-choreography.test.ts) | `2/4 → 1/2` through factor split, common-factor extraction and unit absorption. Registry has this concrete fixture; `6/9`, GCD selection and arbitrary reduction are not established. |
| `alg.fraction.same-add` | [Quadratic native projection](../../../tests/quadratic-completing-square-katex.test.ts), [reader](../../../tests/quadratic-branching-reader-surface.test.ts), [route governance](../../../tests/quadratic-route-presentation-governance.test.ts) | `-24/4+25/4 → 1/4` inside the quadratic reader. The separate raw-combination verifier is not connected to this presentation by this audit. Standalone `2/7+3/7` and the common-denominator chain remain reuse work. |
| `alg.fraction.split-numerator` | [Governed variation](../../../tests/governed-fraction-split-merge-variation.test.ts), [source owner](../../../src/authoring/governed-fraction-split-merge-variation.ts) | `(3y+9)/3 → 3y/3+9/3`, with exact equality, governed construction, seek and material split ownership. This existing variation changes semantic parameters only. Arbitrary symbolic denominators and nonlinear numerators remain unproved. |
| `alg.power.quotient-expand` | [Momentum-energy tests](../../../tests/momentum-energy.test.ts), [domain source](../../../domains/physics/momentum-energy-derivation.ts) | `(‖p‖/m)² → ‖p‖²/m²` under positive mass inside the energy equation. Scalar squaring follows norm homogeneity; independent algebra authoring remains unproved. |
| `alg.root.even-equation` | [Exact states](../../../tests/even-root-solve-exemplar.test.ts), [native transit](../../../tests/even-root-native-transit.test.ts), [catalogue](../../../tests/even-root-catalogue-integration.test.ts) | `x²=9 → x=±√9 → x=±3`, preserving branch identities across inversion and evaluation. Zero, negative radicands and other even powers remain outside this caller. |
| `alg.poly.complete-square` | [Authority](../../../tests/quadratic-completing-square-authority.test.ts), [projection](../../../tests/quadratic-completing-square-katex.test.ts), [reader](../../../tests/quadratic-branching-reader-surface.test.ts) | The `x²-5x+6=0` chain adds `25/4` to both sides and recognizes `(x-5/2)²`. Expression-only `x²+6x+5` and arbitrary coefficients remain unproved. |
| `alg.eq.multiply` | [Multiplicative registration](../../../tests/registered-both-sides-multiplicative-callers.test.ts), [material path](../../../tests/fractional-linear-equation-animation-asset.test.ts) | `x/2=4 → 2(x/2)=2·4`, with nonzero evidence and causal binding. Cancellation and evaluation remain separate. This goes beyond registration alone. |
| `alg.ineq.negative` | [Asset](../../../tests/kp-inequality-sign-flip-animation.test.ts), [surface authority](../../../src/domain-ir/equation-surface-family-declarations.ts) | Forward `x<3 → -2x>-6`. Explicitly declared generic semantic Native KaTeX transition, **not a promoted narrow recipe**. No negative-division caller or new aesthetic approval is claimed. |
| `alg.exp.sum-to-product` | [Authoring](../../../tests/exponential-homomorphism-authoring.test.ts), [catalogue](../../../tests/exponential-homomorphism-catalogue-integration.test.ts), [transit](../../../tests/exponential-homomorphism-transit-session.test.ts) | Registered `e^(a+b) → e^a e^b`, exact operation and specialized host. Not arbitrary bases, scalar-power transport or an authored inverse. |
| `alg.exp.difference-to-quotient` | [Authoring](../../../tests/exponential-homomorphism-authoring.test.ts), [semantics](../../../tests/exponential-homomorphism-difference-pressure.test.ts), [catalogue](../../../tests/exponential-homomorphism-catalogue-integration.test.ts) | Registered `e^(a-b) → e^a/e^b`, distinct quotient topology through the existing host. No new browser paint certification. |
| `alg.sequence.sigma` | [Asset](../../../tests/finite-binder-sum-asset.test.ts), [catalogue](../../../tests/finite-binder-sum-catalogue.test.ts), [motion](../../../tests/finite-binder-sum-motion.test.ts), [plan](../../../tests/finite-binder-sum-presentation-plan.test.ts) | `Σ a_i` for `i=1..3 → a_1+a_2+a_3`. Candidate-local presentation rejects unreviewed cardinality. The former `Σ k²` example and arbitrary bodies are not established by this caller. |

## Eleven partial rows retained

| Rows | Conclusion and next evidence needed |
| --- | --- |
| `alg.distribute-nested`, `alg.poly.multiply` | [Distribution tests](../../../tests/kp-distribution-choreography.test.ts) pressure nested target grouping/ordering, not recursive expansion or a cross-term-and-collection chain. Need checked source through presentation. |
| `alg.fraction.same-subtract` | [Combination tests](../../../tests/fraction-like-denominator-combination-semantics.test.ts) execute subtraction and reject hidden reduction. Addition in another reader does not establish subtraction presentation. |
| `alg.power.expand-integer` | [Registry](../../../src/semantic/generated-algebra-fixture-registry.ts) exposes the square caller. Arbitrary positive integer expansion needs an executable variation; a parameter type is insufficient. |
| `alg.root.root-to-power` | [Operation source](../../../src/semantic/generated-algebra-tutorial-fixture.ts) runs `rewritePowerAsRoot`. The opposite registry title and rewind do not establish an authored inverse. |
| `alg.root.odd-equation` | [Pressure tests](../../../tests/odd-root-pressure.test.ts) reach `x³=8 → x=∛8`, with synthetic paint observations. The row's negative radicand and numerical endpoint remain unproved. |
| `alg.eq.quadratic-formula` | [Authority](../../../tests/quadratic-formula-authority.test.ts), [native projection](../../../tests/quadratic-formula-katex.test.ts) and reader tests establish the positive-discriminant `x²-5x+6=0` caller. The row explicitly requires discriminant cases, so stays partial. |
| `alg.log.product-combine`, `alg.log.quotient-expand` | [Product](../../../tests/log-product-semantic-caller.test.ts) and [quotient contract](../../../tests/log-quotient-contract.test.ts) retain declared forward endpoints and rewind. Need separately authored inverse operations. |
| `alg.log.power-general`, `alg.log.power-absorb` | [Solve contract](../../../tests/log-exponent-exemplar-contract.test.ts) establishes extraction only within `2^x=7`. [Exponent absorption](../../../tests/governed-exponent-absorption-fixture.test.ts) unwraps a unit exponent; it is **not logarithm coefficient absorption**. Structured arguments and authored inverse remain unproved. |

## Next shared gaps, in practical order

1. **Reusable fraction presentation.** Inspect whether the quadratic addition
   treatment can serve the verified raw-numerator operation without copying its
   reader; pressure subtraction next. Then connect alignment → addition → reduction.
   Individual examples do not establish that chain or parameter variation.
2. **Independent source-only reuse.** Split/merge supplies a positive example.
   The saved scalar-transfer experiment can pressure quotient-square/cancellation
   and exact evaluation with stable assumptions and surrounding context. Record
   engine intervention as well as successful endpoints.
3. **Authored inverses and structured arguments.** Logs and roots need explicit
   operation authority and domain assumptions. Reverse playback or similar fixture
   names must not silently expand support.

These are follow-up candidates, not implementation started here. Full quadratic
discriminant cases and arbitrary finite-sum bodies are later pressure cases.

## Verification and maintenance

Existing tests exercise semantic authority, registered authoring, runtime sampling,
native projection and material ownership. Synthetic paint tests are identified
above; they are not real-browser compositor certification. Dashboard browser
checks validate the inventory host, not the animation families. No new aesthetic
was promoted and no source-only variation was newly implemented in this audit.

The first focused cohort passed 155 tests in 27 files; the supplemental cohort
passed 27 tests in eight files. Exact repeatable commands are recorded below.
No test or assertion was removed. Claims still require source review; a link or
test name cannot automatically establish mathematical meaning.

```sh
node --disable-warning=ExperimentalWarning --test --test-concurrency=2 \
  tests/kp-fraction-animation-asset.test.ts \
  tests/kp-fraction-choreography.test.ts \
  tests/governed-fraction-split-merge-variation.test.ts \
  tests/fraction-like-denominator-combination-semantics.test.ts \
  tests/fractional-linear-equation-animation-asset.test.ts \
  tests/registered-both-sides-multiplicative-callers.test.ts \
  tests/exponential-homomorphism-authoring.test.ts \
  tests/exponential-homomorphism-catalogue-integration.test.ts \
  tests/exponential-homomorphism-difference-pressure.test.ts \
  tests/exponential-homomorphism-transit-session.test.ts \
  tests/governed-exponent-absorption-fixture.test.ts \
  tests/even-root-solve-exemplar.test.ts \
  tests/even-root-catalogue-integration.test.ts \
  tests/even-root-native-transit.test.ts \
  tests/odd-root-pressure.test.ts \
  tests/kp-inequality-sign-flip-animation.test.ts \
  tests/finite-binder-sum-asset.test.ts \
  tests/finite-binder-sum-catalogue.test.ts \
  tests/finite-binder-sum-motion.test.ts \
  tests/quadratic-completing-square-authority.test.ts \
  tests/quadratic-completing-square-katex.test.ts \
  tests/quadratic-formula-authority.test.ts \
  tests/quadratic-formula-katex.test.ts \
  tests/quadratic-branching-reader-surface.test.ts \
  tests/quadratic-branching-animation-asset.test.ts \
  tests/kp-distribution-choreography.test.ts \
  tests/momentum-energy.test.ts

node --disable-warning=ExperimentalWarning --test --test-concurrency=2 \
  tests/kp-editor-fraction-visible-animation.test.ts \
  tests/quadratic-route-presentation-governance.test.ts \
  tests/fraction-composition-multiplicative-cancellation-plan.test.ts \
  tests/fraction-composition-publication.test.ts \
  tests/finite-binder-sum-presentation-plan.test.ts \
  tests/log-product-semantic-caller.test.ts \
  tests/log-quotient-contract.test.ts \
  tests/log-exponent-exemplar-contract.test.ts
```
