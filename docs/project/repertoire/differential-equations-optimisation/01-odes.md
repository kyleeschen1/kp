# Differential equations

## Differential equations and initial conditions

### Semantic moves

- [ ] `ode.model` Translate a rate law into a differential equation.
  Example: Proportional decay: y′=-ky, k>0
  Audit: unaudited
- [ ] `ode.verify` Verify a proposed solution and its initial condition.
  Example: y=C e^(-kt) gives y′=-ky; y(0)=C
  Audit: unaudited
- [ ] `ode.field` Read local slopes without confusing them with solution points.
  Example: At (t,y), y′=f(t,y) supplies a tangent direction
  Audit: unaudited
- [ ] `ode.separate` Separate variables while retaining excluded equilibrium solutions.
  Example: dy/[y(1-y)]=dt requires separately checking y=0 and y=1
  Audit: unaudited
- [ ] `ode.integrating-factor` Solve a first-order linear ODE with an integrating factor.
  Example: y′+p(t)y=q(t); μ=e^(∫p dt) gives (μy)′=μq
  Audit: unaudited
- [ ] `ode.initial` Use initial data to select a member of a solution family.
  Example: y′=y → y=Ce^t; y(0)=2 selects C=2
  Audit: unaudited
- [ ] `ode.uniqueness` Recognize when a uniqueness hypothesis fails.
  Example: y′=√|y| at y=0 lacks local Lipschitz regularity
  Audit: unaudited
- [ ] `ode.equilibrium` Find equilibria and infer stability from nearby flow.
  Example: y′=y(1-y): 0 unstable, 1 stable in the local scalar model
  Audit: unaudited
- [ ] `ode.logistic` Interpret carrying capacity in a logistic model.
  Example: y′=ry(1-y/K), r,K>0
  Audit: unaudited
- [ ] `ode.second-order` Solve a homogeneous constant-coefficient second-order ODE.
  Example: y″+3y′+2y=0 → C₁e^(-t)+C₂e^(-2t)
  Audit: unaudited
- [ ] `ode.repeated-complex` Handle repeated or complex characteristic roots.
  Example: Repeated r gives (C₁+C₂t)e^(rt)
  Audit: unaudited
- [ ] `ode.forced` Separate homogeneous response from a particular forced response.
  Example: y=y_h+y_p in a linear equation
  Audit: unaudited
- [ ] `ode.resonance` Adjust a trial solution when forcing overlaps a homogeneous mode.
  Example: Resonant sinusoidal forcing introduces a factor of t
  Audit: unaudited
- [ ] `ode.laplace` Transform derivatives while retaining initial-value terms.
  Example: L[y′]=sY(s)-y(0)
  Audit: unaudited
- [ ] `ode.convolution` Express linear system response as an impulse-response convolution.
  Example: y(t)=∫₀ᵗ h(t-τ)u(τ)dτ for zero initial conditions
  Audit: unaudited

### Visual motifs

- [ ] `motif.ode.family` Retain the solution family while an initial condition selects one curve.
  Example: A selected trajectory does not erase other admissible initial states
  Audit: unaudited
- [ ] `motif.ode.flow` Connect a local rate arrow to the trajectory it constrains.
  Example: Flow direction and state position have different meanings
  Audit: unaudited
- [ ] `motif.ode.forcing` Separate input, transient and steady response.
  Example: A common time coordinate preserves causal correspondence
  Audit: unaudited
