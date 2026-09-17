# Classical mechanics

## Analytical mechanics bridge

### Semantic moves

- [ ] `mech.generalized` Choose independent generalized coordinates under constraints.
  Example: A planar pendulum can use θ instead of constrained x,y
  Audit: unaudited
- [ ] `mech.lagrangian` Build a Lagrangian from the model's kinetic and potential energies.
  Example: L=T-U for a standard conservative mechanical system
  Audit: unaudited
- [ ] `mech.action` Distinguish a path variation from evolution along a path.
  Example: δS compares neighboring paths with fixed endpoints
  Audit: unaudited
- [ ] `mech.euler-lagrange` Derive equations using Euler–Lagrange derivatives.
  Example: d/dt(∂L/∂q_dot)-∂L/∂q=0
  Audit: unaudited
- [ ] `mech.cyclic` Infer conserved conjugate momentum from a cyclic coordinate.
  Example: ∂L/∂q=0 → d(∂L/∂q_dot)/dt=0
  Audit: unaudited
- [ ] `mech.symmetry` Relate a continuous symmetry to a conserved quantity under its hypotheses.
  Example: Time-translation symmetry relates to energy conservation
  Audit: unaudited
- [ ] `mech.hamiltonian` Perform a regular Legendre transform from velocities to momenta.
  Example: p=∂L/∂q_dot; H=p q_dot-L when the transformation is invertible
  Audit: unaudited
- [ ] `mech.hamilton-equations` Read coupled phase-space evolution from Hamilton's equations.
  Example: q_dot=∂H/∂p, p_dot=-∂H/∂q
  Audit: unaudited
- [ ] `mech.phase-energy` Interpret energy contours as constraints on autonomous one-degree-of-freedom motion.
  Example: A trajectory remains on its Hamiltonian level set
  Audit: unaudited
- [ ] `mech.poisson` Compute a Poisson bracket under a declared canonical convention.
  Example: {q,p}=1
  Audit: unaudited
- [ ] `mech.normal-modes` Separate small coupled oscillations into independent modes.
  Example: Diagonalize the linearized mass/stiffness problem
  Audit: unaudited
- [ ] `mech.approx-regime` Compare a simplified model with the neglected terms that limit it.
  Example: Linearization is local; large-amplitude behavior may differ
  Audit: unaudited

### Visual motifs

- [ ] `motif.mech.variation` Compare neighboring paths without pretending they are simultaneous trajectories.
  Example: A virtual variation is distinct from time motion
  Audit: unaudited
- [ ] `motif.mech.phase-space` Coordinate q(t), p(t) and their joint phase-space point.
  Example: Position and momentum are two properties of the same state
  Audit: unaudited
- [ ] `motif.mech.symmetry` Keep the conserved relationship visible through an allowed transformation.
  Example: Coordinate change and physical symmetry are distinguished
  Audit: unaudited
