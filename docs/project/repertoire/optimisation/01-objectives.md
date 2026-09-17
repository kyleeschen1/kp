# Optimization

## Objectives, constraints and optimality

### Semantic moves

- [ ] `opt.formulate` Separate decision variables, objective and constraints.
  Example: Minimize cost c·x subject to resource limits Ax≤b
  Audit: unaudited
- [ ] `opt.stationary` Find stationary points without assuming they are minima.
  Example: f′(x)=0 can identify a maximum or saddle as well
  Audit: unaudited
- [ ] `opt.convex` Use convexity to distinguish local from global optimality.
  Example: For convex f on a convex set, a local minimum is global
  Audit: unaudited
- [ ] `opt.boundary` Compare interior candidates with feasible boundary points.
  Example: Minimize (x-2)² on [0,1]: the solution is the endpoint 1
  Audit: unaudited
- [ ] `opt.lagrange` Introduce multipliers for smooth equality constraints.
  Example: ∇f=λ∇g with g(x)=c and a regular constraint
  Audit: unaudited
- [ ] `opt.kkt` Use complementary slackness with inequality constraints.
  Example: λ≥0, g(x)≤0, λg(x)=0 under the chosen sign convention
  Audit: unaudited
- [ ] `opt.duality` Interpret a dual bound and distinguish it from attained equality.
  Example: Weak duality provides a bound; strong duality needs hypotheses
  Audit: unaudited
- [ ] `opt.sensitivity` Interpret a multiplier as a local value of relaxing a constraint.
  Example: A marginal extra resource changes optimal value under regularity
  Audit: unaudited
- [ ] `opt.linear` Locate a linear-program optimum on the feasible polytope when attained.
  Example: A linear objective on a nonempty bounded feasible polytope attains an optimum at an extreme point
  Audit: unaudited
- [ ] `opt.integer` Distinguish a relaxation from a feasible discrete solution.
  Example: A fractional assignment may bound but not solve an integer problem
  Audit: unaudited

### Visual motifs

- [ ] `motif.opt.feasible` Keep constraints visible while comparing objective levels.
  Example: A lower objective outside the feasible set is not a better solution
  Audit: unaudited
- [ ] `motif.opt.tangency` Show a local no-improvement direction at a constrained optimum.
  Example: Objective and constraint gradients become dependent
  Audit: unaudited
- [ ] `motif.opt.active` Distinguish active from inactive constraints at the current solution.
  Example: A slack resource does not bind the local motion
  Audit: unaudited
