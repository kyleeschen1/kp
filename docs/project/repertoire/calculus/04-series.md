# Calculus and multivariable calculus

## Sequences, series and approximation

### Semantic moves

- [ ] `calc.series.sequence-limit` Distinguish a sequence limit from a series sum.
  Example: 1/n→0 does not imply Σ1/n converges
  Audit: unaudited
- [ ] `calc.series.geometric` Sum an infinite geometric series within its domain.
  Example: Σ from n=0 to ∞ of r^n = 1/(1-r), |r|<1
  Audit: unaudited
- [ ] `calc.series.tests` Choose a comparison, ratio or integral convergence test.
  Example: Σ1/n² converges by comparison/integral reasoning
  Audit: unaudited
- [ ] `calc.series.alternating` Bound truncation error in a decreasing alternating series.
  Example: For alternating decreasing terms, error ≤ next term
  Audit: unaudited
- [ ] `calc.series.taylor` Build a Taylor approximation from derivatives at one point.
  Example: e^x ≈ 1+x+x²/2 near 0
  Audit: unaudited
- [ ] `calc.series.radius` Find a power series' radius and test endpoints separately.
  Example: Σx^n/n converges for |x|<1; x=±1 require separate checks
  Audit: unaudited
- [ ] `calc.series.error` Choose approximation order from an error requirement.
  Example: Taylor remainder bounds connect interval and order
  Audit: unaudited
- [ ] `calc.series.termwise` Differentiate or integrate a power series within its validity region.
  Example: Differentiate Σx^n for |x|<1 to obtain Σn x^(n-1)
  Audit: unaudited

### Visual motifs

- [ ] `motif.calc.approximation` Compare successive approximations with a retained target and interval.
  Example: A polynomial fits locally without implying global accuracy
  Audit: unaudited
- [ ] `motif.calc.series-tail` Separate retained terms from the unresolved tail.
  Example: A truncation boundary carries an explicit error claim
  Audit: unaudited
