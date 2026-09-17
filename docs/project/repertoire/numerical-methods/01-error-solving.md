# Numerical methods

## Numerical error and solving equations

### Semantic moves

- [ ] `num.floating` Distinguish exact arithmetic from floating-point approximation.
  Example: 0.1+0.2 need not equal 0.3 in binary floating point
  Audit: unaudited
- [ ] `num.error` Separate absolute and relative error.
  Example: |x_hat-x| versus |x_hat-x|/|x|; relative error needs x≠0
  Audit: unaudited
- [ ] `num.condition` Separate problem sensitivity from algorithm stability.
  Example: Near-singular Ax=b can amplify small input changes
  Audit: unaudited
- [ ] `num.cancellation` Avoid subtracting nearly equal approximate quantities when an equivalent form helps.
  Example: sqrt(x+1)-sqrt(x) = 1/[sqrt(x+1)+sqrt(x)] for x≥0
  Audit: unaudited
- [ ] `num.bisection` Maintain a sign-changing bracket while bisecting.
  Example: Continuous f with f(a)f(b)<0 has a root in [a,b]
  Audit: unaudited
- [ ] `num.newton-root` Use a tangent intercept as a root iteration with safeguards.
  Example: x_next=x-f(x)/f′(x); f′ must not vanish
  Audit: unaudited
- [ ] `num.fixed-point` Check convergence conditions for fixed-point iteration.
  Example: A contraction g can make x_next=g(x) converge locally
  Audit: unaudited
- [ ] `num.pivot` Choose a pivot to reduce numerical instability in elimination.
  Example: Swap rows rather than divide by a tiny available pivot
  Audit: unaudited
- [ ] `num.residual` Distinguish a small residual from a small solution error.
  Example: Small ||Ax-b|| may coexist with large error for ill-conditioned A
  Audit: unaudited
- [ ] `num.iterative-linear` Iterate a large linear solve with a convergence criterion.
  Example: Residual norms guide an iteration but do not change the original system
  Audit: unaudited

### Visual motifs

- [ ] `motif.num.error` Keep exact target, approximation and uncertainty conceptually distinct.
  Example: A displayed decimal is not an exact symbolic identity
  Audit: unaudited
- [ ] `motif.num.bracket` Preserve the guaranteed interval as trial points change.
  Example: The bracket shrinks without losing its root-containment claim
  Audit: unaudited
- [ ] `motif.num.sensitivity` Compare input perturbations and corresponding output changes.
  Example: Large amplification belongs to the problem, not automatically the solver
  Audit: unaudited
