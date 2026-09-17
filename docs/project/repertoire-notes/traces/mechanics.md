# Mechanics trace pressure

## Express kinetic energy through momentum

Assume Newtonian mechanics, one constant positive mass m, and p=mv in one frame.

| Step | Reason | Inventory rows |
| --- | --- | --- |
| K=(1/2)m||v||² → (1/2)m||p/m||² | Substitute the momentum definition | `mech.momentum-substitute` |
| ||p/m||=||p||/m | Norm homogeneity uses m>0 | `mech.norm-scale` |
| K=(1/2)m||p||²/m² | Square the quotient | `alg.power.quotient-expand` |
| K=||p||²/(2m) | Cancel the nonzero mass factor | `alg.fraction.cancel-factor`, `mech.momentum-substitute` |
| Rotate p while keeping ||p|| fixed | Energy depends on magnitude, not direction | `mech.turning-energy` |

Finding: the complete energy passage and turning example exist at their bounded
scopes; see [audit](../mechanics-audit.md). Their general algebra counterparts
can remain partial because a physics-owned caller is not arbitrary algebraic
authoring. The saved `reading.middle` experiment concerns nonterminal unfolding
and transfer, not a missing proof of the displayed energy identity.

## Constant-force work and an explicit boundary

For the existing horizontal constant-net-force model, F=3 N and displacement is
4 m. W=12 J, initial K=4 J, final K=16 J. `mech.work-constant` covers this bounded
model and the work-energy relation. `alg.units.dimension` names the needed unit
reasoning, but is not separately established as a general instructional move.

Replacing the force by F(x) changes the required operation to `mech.work-variable`
and `calc.int.work`. Changing the body/system introduces `mech.variable-mass` or
`mech.energy-conserve` assumptions. Neither variation is covered merely because
the original animation has an adjustable force parameter.
