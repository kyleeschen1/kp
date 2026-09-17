# Probability and statistics

## Random variables and distributions

### Semantic moves

- [ ] `prob.rv` Map outcomes to a random variable without changing outcome probabilities.
  Example: Two dice outcomes map to their sum
  Audit: unaudited
- [ ] `prob.pmf-cdf` Convert a discrete mass function into cumulative probability.
  Example: F(k)=Σ over x≤k of P(X=x)
  Audit: unaudited
- [ ] `prob.density` Distinguish density height from probability mass.
  Example: P(a<X<b)=∫ₐᵇ f(x)dx; a continuous point can have zero mass
  Audit: unaudited
- [ ] `prob.expectation` Compute expectation as a probability-weighted value.
  Example: E[X]=Σx p(x)
  Audit: unaudited
- [ ] `prob.variance` Measure spread around the mean.
  Example: Var(X)=E[X²]-E[X]²
  Audit: unaudited
- [ ] `prob.covariance` Separate covariance from individual variance.
  Example: Var(X+Y)=Var X+Var Y+2Cov(X,Y)
  Audit: unaudited
- [ ] `prob.linearity` Use expectation linearity without requiring independence.
  Example: E[X+Y]=E[X]+E[Y]
  Audit: unaudited
- [ ] `prob.binomial` Model a count of independent identical Bernoulli trials.
  Example: P(X=k)=C(n,k)p^k(1-p)^(n-k)
  Audit: unaudited
- [ ] `prob.poisson` Model event counts under a Poisson assumption.
  Example: P(X=k)=e^(-λ)λ^k/k!
  Audit: unaudited
- [ ] `prob.normal` Standardize a normal variable.
  Example: Z=(X-μ)/σ, σ>0
  Audit: unaudited
- [ ] `prob.exponential` Interpret exponential waiting time and memorylessness.
  Example: P(T>s+t|T>s)=P(T>t), s,t≥0
  Audit: unaudited
- [ ] `prob.transform` Transform a random variable with the appropriate Jacobian.
  Example: Y=aX+b: f_Y(y)=f_X((y-b)/a)/|a|, a≠0
  Audit: unaudited
- [ ] `prob.total-expectation` Condition first and average over the conditioning variable.
  Example: E[X]=E[E[X|Y]]
  Audit: unaudited
- [ ] `prob.lln-clt` Distinguish concentration of an average from a normal limit approximation.
  Example: Large samples make the mean stable; CLT additionally describes scaled error
  Audit: unaudited
- [ ] `prob.markov` Propagate a finite-state distribution through a transition matrix.
  Example: p_(t+1)=p_t P under a row-vector convention
  Audit: unaudited

### Visual motifs

- [ ] `motif.prob.mass-density` Preserve total probability while changing representation.
  Example: Bins approximate density integrals, not point probabilities
  Audit: unaudited
- [ ] `motif.prob.expectation` Link contributions to a weighted average and its reference distribution.
  Example: Large values with tiny probability need not dominate
  Audit: unaudited
- [ ] `motif.prob.sampling` Separate a distribution of observations from a distribution of estimates.
  Example: Repeated sample means form a different distribution
  Audit: unaudited
