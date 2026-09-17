# Numerical methods

## Interpolation, quadrature and numerical dynamics

### Semantic moves

- [ ] `num.interpolate` Interpolate values while distinguishing fit between and beyond samples.
  Example: A polynomial through data does not guarantee good extrapolation
  Audit: unaudited
- [ ] `num.spline` Join piecewise low-degree approximations with stated continuity.
  Example: Cubic splines constrain derivatives at internal knots
  Audit: unaudited
- [ ] `num.differentiate` Approximate derivatives with truncation and roundoff tradeoffs.
  Example: [f(x+h)-f(x-h)]/(2h) has competing errors as h shrinks
  Audit: unaudited
- [ ] `num.quadrature` Approximate an integral by weighted samples.
  Example: Trapezoidal rule uses endpoint values and interval width
  Audit: unaudited
- [ ] `num.adaptive` Refine where an error estimate is large.
  Example: Split a difficult integration interval rather than uniformly oversample everything
  Audit: unaudited
- [ ] `num.euler` Advance an ODE using the current slope.
  Example: y_(n+1)=y_n+h f(t_n,y_n)
  Audit: unaudited
- [ ] `num.runge-kutta` Combine multiple within-step slopes.
  Example: A Runge–Kutta step samples intermediate trial states
  Audit: unaudited
- [ ] `num.stability` Relate step size to stability rather than only local accuracy.
  Example: Forward Euler on y′=-ky needs |1-hk|<1 for decay
  Audit: unaudited
- [ ] `num.stiff` Recognize why multiple time scales can force tiny explicit steps.
  Example: A fast decaying mode constrains stability despite slow visible behavior
  Audit: unaudited
- [ ] `num.convergence` Estimate observed convergence by refining a discretization.
  Example: Compare errors at h and h/2 with the method's expected order
  Audit: unaudited
- [ ] `num.monte-carlo` Estimate an expectation with random samples and uncertainty.
  Example: Sample mean error typically scales as n^(-1/2) under finite variance
  Audit: unaudited
- [ ] `num.fft` Separate transform meaning from the fast algorithm computing it.
  Example: A DFT represents sampled frequencies; FFT changes computational cost
  Audit: unaudited

### Visual motifs

- [ ] `motif.num.refinement` Compare approximations on nested discretizations with common reference points.
  Example: A finer mesh reveals error without shifting the problem
  Audit: unaudited
- [ ] `motif.num.time-step` Expose trial states within one numerical step.
  Example: Intermediate RK values are estimates, not additional physical observations
  Audit: unaudited
