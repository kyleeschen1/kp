# Calculus and multivariable calculus

## Limits and local change

### Semantic moves

- [ ] `calc.limit.substitute` Evaluate a continuous function's limit by substitution.
  Example: lim x→2 (x²+1)=5
  Audit: unaudited
- [ ] `calc.limit.cancel` Remove a removable singularity for a limit without changing the original domain.
  Example: lim x→1 (x²-1)/(x-1)=2
  Audit: unaudited
  Uses: alg.fraction.factor-before-cancel
- [ ] `calc.limit.one-sided` Compare one-sided limits and detect a jump.
  Example: The left/right limits of sign(x) at 0 differ
  Audit: unaudited
- [ ] `calc.limit.squeeze` Bound a difficult limit by two agreeing limits.
  Example: x² sin(1/x) lies between -x² and x²
  Audit: unaudited
- [ ] `calc.limit.infinity` Read dominant terms and horizontal asymptotes.
  Example: lim x→∞ (2x²+1)/(x²-3)=2
  Audit: unaudited
- [ ] `calc.limit.continuity` Separate a limiting value from the value assigned at the point.
  Example: A hole can have a limit but no function value
  Audit: unaudited
- [ ] `calc.derivative.definition` Pass from secant slopes to the derivative.
  Example: [(x+h)²-x²]/h → 2x as h→0
  Audit: unaudited
- [ ] `calc.derivative.linearize` Use a local linear model with an error term.
  Example: f(a+h)=f(a)+f′(a)h+o(h)
  Audit: unaudited
- [ ] `calc.derivative.nondifferentiable` Identify a corner despite continuity.
  Example: |x| is continuous but not differentiable at 0
  Audit: unaudited
- [ ] `calc.derivative.units` Interpret derivative units and signed rate.
  Example: d(position)/dt is velocity, not distance traveled
  Audit: unaudited

### Visual motifs

- [ ] `motif.calc.secant` Retain the base point as the second point approaches it.
  Example: A secant becomes tangent without changing the question
  Audit: unaudited
- [ ] `motif.calc.error` Compare a local approximation and its residual at the same input.
  Example: Show the error shrinking as h decreases
  Audit: unaudited
