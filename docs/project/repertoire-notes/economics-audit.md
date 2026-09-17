# Economics implementation audit

Source inspection: 2026-09-16. Economics rows include model construction,
assumptions, interpretation, comparison and empirical reasoning, not only graph
shifts. Most remain unaudited; a correct economic identity does not establish
causal interpretation or learner understanding.

## Positive evidence

- `econ.equilibrium`, `econ.demand-shift`, `motif.econ.parameter`:
  [exact semantic/graph adapter](../../../src/animation/economics-equilibrium-adapter.ts),
  [canonical publication capability](../../../tests/economics-demand-shift-animation-capability.test.ts),
  [static publication checks](../../../tests/economics-demand-shift-static-publication.test.ts),
  [tutorial tests](../../../tests/economics-demand-shift-tutorial.test.ts).
  The bounded linear market's demand-intercept change is coordinated with the
  fixed supply curve and new equilibrium. This does not establish a dynamic
  market-adjustment law or unrestricted source authoring.
- `econ.tax.wedge`, `.revenue`, `.surplus`, `.loss` and wedge/welfare motifs:
  [exact tax model](../../../domains/economics/per-unit-tax-welfare-model.ts),
  [model tests](../../../tests/economics-supply-tax-model.test.ts),
  [asset](../../../src/animation/economics-supply-tax-asset.ts),
  [built canonical reader checks](../../../tests/canonical-tax.production.spec.ts).
  The untaxed equilibrium is Q=5, P=7. A tax of 4 gives Q=3, buyer price 9,
  seller price 5; revenue is 12 and deadweight loss 4. The canonical reader
  presents the model through its eight named beats and retained static facts.
  These checks concern that linear tax example, not arbitrary tax types,
  market structures, incidence elasticities or empirical policy predictions.

## Partial and unknown

`econ.along-versus-shift` has relevant prose and curve identity in the demand-shift
publication; the general reusable contrast is not established by this audit.
All other unchecked economics rows are unaudited, rather than confirmed absent.
Consumer optimization, games, macroeconomics and econometric identification need
their own domain assumptions and presentation evidence. Matrix, gradient or
probability machinery is potentially reusable but does not earn these checks.

The previous broad tax-model check has been split into individually named price,
revenue and welfare moves. Static facts and source tests were inspected; the
existing full production browser suite was not automatically rerun by this audit.
The run verification record distinguishes actual test execution from file review.
