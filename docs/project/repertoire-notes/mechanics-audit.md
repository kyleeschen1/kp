# Classical mechanics implementation audit

Source inspection: 2026-09-16. Mechanical quantities retain their system,
reference-frame, constant-mass and force-model assumptions. Examples do not imply
arbitrary combinations of forces or arbitrary differential-equation solvers.

## Positive evidence

- `mech.momentum-substitute`, `mech.norm-scale`, `motif.mech.energy-derive`:
  [norm-scaling composition](../threads/2026-09-16-norm-scaling-composition.md),
  [retained disclosure record](../threads/2026-09-16-disclosure-persistence.md).
  The checked energy passage substitutes p=mv, applies norm homogeneity for m>0,
  squares the quotient and cancels its scalar factor. This is the bounded
  momentum/energy exemplar, not completed nonterminal unfolding transfer.
- `mech.turning-energy`, `motif.mech.turning`:
  [canonical graph/text record](../threads/2026-09-16-force-energy-graph.md).
  Momentum direction changes while its magnitude and associated energy remain
  fixed in the checked turning example. It does not certify a general simulator.
- `mech.power`: [force/energy inspection](../threads/2026-09-16-force-energy-inspection.md).
  The fixed-mass vector product rule, equal-contribution collection and Newtonian
  substitution give dK/dt=F·v. Separate general scalar calculus rows remain unearned.
- `mech.work-constant`: [constant-force model](../../../tests/kp-constant-force-work-energy-model.test.ts),
  [animation asset](../../../tests/kp-constant-force-work-energy-animation-asset.test.ts),
  [physics pack](../../../src/animation/catalog-packs/physics.ts).
  A bounded model supplies work and kinetic-energy quantities to synchronized
  representations. Variable forces, system-boundary changes and general
  path-dependent work are separate unaudited scopes.

## Unknown scope

Other Newtonian, rotational, oscillatory and analytical-mechanics rows are
unaudited here. A personal mechanics study note or an equation that KaTeX can
typeset is not implementation evidence for an instructional move. Lagrangian
and Hamiltonian rows are an introductory bridge, not a claim to cover an entire
advanced mechanics course. Vector and calculus primitives may be referenced by
future callers; their composition and physical assumptions still need evidence.
