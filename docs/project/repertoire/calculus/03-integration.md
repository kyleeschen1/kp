# Calculus and multivariable calculus

## Integration and accumulation

### Semantic moves

- [ ] `calc.int.riemann` Form a signed Riemann sum and take its refinement limit.
  Example: Σ f(x_i*)Δx → ∫ f(x) dx on a bounded interval
  Audit: unaudited
- [ ] `calc.int.ftc-evaluate` Evaluate a definite integral with an antiderivative.
  Example: ∫₀¹ 2x dx = [x²]₀¹ = 1
  Audit: unaudited
- [ ] `calc.int.ftc-rate` Differentiate accumulation with a moving upper limit.
  Example: d/dx ∫ₐˣ f(t)dt=f(x) for continuous f
  Audit: unaudited
- [ ] `calc.int.power` Integrate a power with an integration constant — bounded caller. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: ∫x² dx → x³/3+C
  Audit: partial — governed power-rule fixture exists; exact scope/rendering audit remains
- [ ] `calc.int.reciprocal` Treat the exceptional exponent minus one separately.
  Example: ∫1/x dx = ln|x|+C on an interval avoiding 0
  Audit: unaudited
- [ ] `calc.int.substitute` Change variables and transform the differential.
  Example: ∫2x cos(x²) dx → ∫cos(u)du with u=x²
  Audit: unaudited
- [ ] `calc.int.bounds` Transform definite-integral bounds with the variable.
  Example: ∫₀¹ 2x e^(x²)dx → ∫₀¹ e^u du
  Audit: unaudited
- [ ] `calc.int.parts` Integrate by parts with boundary terms.
  Example: ∫u dv=uv-∫v du
  Audit: unaudited
- [ ] `calc.int.partial-fractions` Decompose a rational integrand before integration.
  Example: 1/[x(x+1)] = 1/x-1/(x+1), x≠0,-1
  Audit: unaudited
- [ ] `calc.int.trig-substitution` Choose a trigonometric substitution with a valid branch.
  Example: x=a sin θ can simplify √(a²-x²) on -π/2≤θ≤π/2
  Audit: unaudited
- [ ] `calc.int.improper` Express an improper integral as a limit and test convergence.
  Example: ∫₁∞ x^(-2) dx converges to 1
  Audit: unaudited
- [ ] `calc.int.area` Separate signed integral from geometric area.
  Example: Area between curves is ∫|f-g| dx, with crossings handled
  Audit: unaudited
- [ ] `calc.int.volume` Choose slices or shells for a volume.
  Example: A disk of radius r(x) contributes πr(x)² dx
  Audit: unaudited
- [ ] `calc.int.average` Compute a function's average value over an interval.
  Example: f_avg=(b-a)^(-1)∫ₐᵇ f(x)dx
  Audit: unaudited
- [ ] `calc.int.arc-length` Accumulate length using the local metric.
  Example: L=∫√(1+[y′(x)]²)dx
  Audit: unaudited
- [ ] `calc.int.work` Accumulate work from a variable force.
  Example: W=∫ F(x)dx along a one-dimensional displacement
  Audit: unaudited

### Visual motifs

- [ ] `motif.calc.accumulate` Retain accumulated quantity while exposing an incremental contribution.
  Example: An added strip changes the running total
  Audit: unaudited
- [ ] `motif.calc.substitution` Coordinate the transformed variable, differential and bounds.
  Example: All three change under one substitution
  Audit: unaudited
- [ ] `motif.calc.boundary` Keep boundary evaluation distinct from indefinite integration.
  Example: F(b) and F(a) are separate evaluations before subtraction
  Audit: unaudited
