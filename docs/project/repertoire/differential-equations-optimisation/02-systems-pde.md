# Differential equations

## Systems, stability and PDE boundary topics

### Semantic moves

- [ ] `ode.system` Rewrite a higher-order ODE as a first-order state system.
  Example: x₁=y, x₂=y′ → x₁′=x₂
  Audit: unaudited
- [ ] `ode.linear-system` Use eigenmodes to solve a diagonalizable linear system.
  Example: x′=Ax → x(t)=Σc_i e^(λ_i t)v_i
  Audit: unaudited
- [ ] `ode.linearize` Linearize a nonlinear system near an equilibrium.
  Example: δx′≈J_f(x*)δx; x* is an equilibrium
  Audit: unaudited
- [ ] `ode.stability` Distinguish local linear stability from a global guarantee.
  Example: Negative real eigenvalue parts imply local asymptotic stability under standard smoothness conditions
  Audit: unaudited
- [ ] `ode.phase` Interpret a phase portrait without treating it as a position plot.
  Example: A closed curve in (position,velocity) is a periodic state orbit
  Audit: unaudited
- [ ] `ode.bifurcation` Track a qualitative change as a parameter crosses a threshold.
  Example: x′=μ-x² changes equilibria as μ crosses 0
  Audit: unaudited
- [ ] `pde.classify` Distinguish time evolution, spatial derivatives and boundary data.
  Example: u_t=κu_xx needs initial and boundary conditions
  Audit: unaudited
- [ ] `pde.separate` Separate variables in a compatible linear PDE problem.
  Example: u(x,t)=X(x)T(t) yields linked ordinary equations
  Audit: unaudited
- [ ] `pde.fourier` Represent a field using modes compatible with boundary conditions.
  Example: Sine modes vanish at both ends of a fixed interval
  Audit: unaudited
- [ ] `pde.diffusion-wave` Contrast dissipating diffusion with propagating waves.
  Example: Heat smooths high-frequency modes; the ideal wave equation transports oscillation
  Audit: unaudited

### Visual motifs

- [ ] `motif.ode.phase` Coordinate time traces with the same moving point in state space.
  Example: Two coordinates describe one state, not two particles
  Audit: unaudited
- [ ] `motif.pde.modes` Show individual modes and their combined field at the same time.
  Example: Mode amplitude changes explain the changing total
  Audit: unaudited
