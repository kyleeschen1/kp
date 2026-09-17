# Classical mechanics

## Energy, work and momentum

### Semantic moves

- [x] `mech.momentum-substitute` Express kinetic energy using momentum — retained energy passage. [Evidence](../../repertoire-notes/mechanics-audit.md)
  Example: p=mv → K=||p||²/(2m); constant m>0
  Audit: implemented
- [x] `mech.norm-scale` Factor a scalar out of a vector norm — checked energy refinement. [Evidence](../../repertoire-notes/mechanics-audit.md)
  Example: ||p/m||=||p||/m for m>0
  Audit: implemented
- [x] `mech.turning-energy` Separate direction change from kinetic-energy change — momentum-space caller. [Evidence](../../repertoire-notes/mechanics-audit.md)
  Example: Rotating p at fixed ||p|| leaves K=||p||²/(2m) fixed
  Audit: implemented
- [x] `mech.power` Derive instantaneous power from kinetic energy and Newton's law — fixed-mass caller. [Evidence](../../repertoire-notes/mechanics-audit.md)
  Example: dK/dt=F·v
  Audit: implemented
- [x] `mech.work-constant` Connect constant-force work and kinetic-energy change — bounded physics asset. [Evidence](../../repertoire-notes/mechanics-audit.md)
  Example: W=F·Δr=ΔK under the constant-force model
  Audit: implemented
- [ ] `mech.work-variable` Accumulate work along a path for a variable force.
  Example: W=∫F·dr
  Audit: unaudited
- [ ] `mech.potential` Relate conservative force to potential energy.
  Example: F=-∇U; ΔK=-ΔU when no other work enters
  Audit: unaudited
- [ ] `mech.energy-conserve` Specify the system and conditions for mechanical-energy conservation.
  Example: K+U is constant for an isolated conservative mechanical model
  Audit: unaudited
- [ ] `mech.dissipation` Account for mechanical-energy loss without asserting total energy disappears.
  Example: Friction can transfer mechanical energy into internal energy
  Audit: unaudited
- [ ] `mech.impulse` Relate integrated external force to momentum change.
  Example: Δp=∫F dt
  Audit: unaudited
- [ ] `mech.momentum-conserve` Use negligible external impulse to conserve system momentum.
  Example: p_before=p_after for a collision system with negligible external impulse
  Audit: unaudited
- [ ] `mech.collision-elastic` Combine momentum and kinetic-energy conservation for an elastic collision.
  Example: Two conservation conditions restrict final velocities
  Audit: unaudited
- [ ] `mech.collision-inelastic` Conserve momentum without assuming kinetic-energy conservation.
  Example: Perfect sticking fixes a common final velocity
  Audit: unaudited
- [ ] `mech.center-mass` Separate center-of-mass motion from internal motion.
  Example: R=Σm_i r_i/Σm_i
  Audit: unaudited
- [ ] `mech.variable-mass` Choose a system boundary before using a variable-mass momentum equation.
  Example: A rocket exchanges momentum with expelled mass
  Audit: unaudited

### Visual motifs

- [x] `motif.mech.energy-derive` Retain the original energy relationship while exposing its checked child steps. [Evidence](../../repertoire-notes/mechanics-audit.md)
  Example: Momentum substitution and norm/cancellation justifications remain connected
  Audit: implemented
- [x] `motif.mech.turning` Coordinate prose, invariant magnitude and changing direction — momentum-space passage. [Evidence](../../repertoire-notes/mechanics-audit.md)
  Example: Attention passes from direction change to fixed norm to energy consequence
  Audit: implemented
- [ ] `motif.mech.transfer` Track transfers across an explicit system boundary.
  Example: Internal exchange differs from external work or impulse
  Audit: unaudited
