# Optimization

## Optimization algorithms and tradeoffs

### Semantic moves

- [ ] `opt.descent` Choose a descent direction from local derivative information.
  Example: x_next=x-α∇f(x); a suitable step is still required
  Audit: unaudited
- [ ] `opt.step-size` Compare a direction with the choice of step length.
  Example: An oversize step can increase f despite a descent direction
  Audit: unaudited
- [ ] `opt.newton` Use curvature to propose a Newton step.
  Example: H(x) p=-∇f(x); singular/indefinite H needs care
  Audit: unaudited
- [ ] `opt.project` Restore feasibility after a trial gradient step.
  Example: x_next=Proj_C(x-α∇f(x))
  Audit: unaudited
- [ ] `opt.stochastic` Distinguish a noisy gradient estimate from the full gradient.
  Example: A minibatch direction can differ from the population descent direction
  Audit: unaudited
- [ ] `opt.regularize` Trade data fit against a complexity penalty.
  Example: Minimize loss+λ||w||² with λ≥0
  Audit: unaudited
- [ ] `opt.multiobjective` Compare nondominated alternatives without inventing one universal score.
  Example: Improving cost may worsen accuracy
  Audit: unaudited
- [ ] `opt.stop` Separate small step, small gradient and objective convergence.
  Example: A tiny step due to a tiny learning rate does not prove stationarity
  Audit: unaudited

### Visual motifs

- [ ] `motif.opt.step` Retain the trial step and its actual consequence.
  Example: Predicted descent is compared with evaluated objective change
  Audit: unaudited
- [ ] `motif.opt.tradeoff` Keep competing objectives visible while choosing an alternative.
  Example: A Pareto comparison preserves what is sacrificed
  Audit: unaudited
