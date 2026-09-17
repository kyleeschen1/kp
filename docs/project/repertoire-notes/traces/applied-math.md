# Applied mathematics trace pressure

Original inventory probes; no new lesson or solver is implemented here.

## Evaluate ∫ from 0 to 1 of 2x exp(x²) dx

| Step | Reason | Inventory rows |
| --- | --- | --- |
| Set u=x², du=2x dx | Match the inner derivative and transform the differential | `calc.diff.power`, `calc.int.substitute` |
| Transform x=0,1 to u=0,1 | New bounds belong to the new variable | `calc.int.bounds` |
| Integrate exp(u) to exp(u) | Use the exponential antiderivative | `calc.int.exp` |
| Evaluate exp(1)-exp(0)=e-1 | Use the definite-integral endpoint rule | `calc.int.ftc-evaluate` |

Finding: an exponent-power differentiation caller does not make an integral
substitution sequence implemented. The trace exposed the missing exponential
antiderivative row; exponential/trigonometric antiderivatives and integral
linearity were added as explicit unaudited entries. Substitution and bounds
must be coordinated rather than treated as a cosmetic relabeling.

## Solve y′=-2y with y(0)=3

| Step | Reason | Inventory rows |
| --- | --- | --- |
| Check the equilibrium y=0 separately | Dividing by y could lose a solution family | `ode.separate`, `ode.equilibrium` |
| For nonzero y, integrate dy/y=-2dt | Separation uses the reciprocal antiderivative | `ode.separate`, `calc.int.reciprocal` |
| ln|y|=-2t+C → y=A exp(-2t) | Restore either sign and the zero solution via A | `alg.log.inverse`, `alg.exp.growth` |
| Set A=3 and verify | Initial data selects one solution | `ode.initial`, `ode.verify` |

Finding: the logarithmic algebra, zero-division guard, solution-family meaning
and initial condition are distinct needs. This is an unaudited ODE path, not
coverage earned by an exponential animation.

## Least-squares fit of one constant to observations 1 and 3

Let A be the column [1,1] and b=[1,3]. Minimize ||Ax-b||² over real scalar x.

| Step | Reason | Inventory rows |
| --- | --- | --- |
| AᵀAx=Aᵀb → 2x=4 | Orthogonal residual gives the normal equation | `la.proj.least-squares`, `la.matrix.transpose` |
| x=2 | Divide by a nonzero coefficient | `alg.eq.divide` |
| Ax=[2,2], r=b-Ax=[-1,1] | Separate fit and residual | `la.proj.residual` |
| Aᵀr=0 and ||Ax-b||² is minimized | Connect orthogonality and closest-point interpretation | `la.proj.closest` |

Finding: the checked two-by-two matrix-vector caller and bounded 3x=12 divide
caller do not prove this rectangular least-squares composition. Projection,
normal-equation construction and interpretation remain unaudited. Algebraic
similarity is a reuse opportunity, not evidence of source-only reuse.

## Conditioning a flagged ticket

Use the existing binary caller: P(U)=1/5, P(F|U)=4/5, P(F|not U)=1/10.

| Step | Reason | Inventory rows |
| --- | --- | --- |
| P(U and F)=4/25; P(not U and F)=2/25 | Form joint masses | `prob.joint` |
| P(F)=6/25 | Sum the two relevant leaves | `prob.marginal` |
| P(U|F)=(4/25)/(6/25)=2/3 | Restrict the population and normalize | `prob.condition`, `prob.bayes` |
| Reorder the binary tree | Preserve all joint masses while changing the first split | `prob.tree-reorder` |

Finding: this exact chain has a joint semantic model and rendered tree path;
see [audit](../applied-math-audit.md). It provides positive evidence for an actual
composed example. It does not establish continuous inference or causal intervention.

## Constrained optimum and numerical root pressure

Minimize (x-2)² on [0,1]. The unconstrained stationary point x=2 is infeasible;
the endpoint values are 4 and 1, so x=1 is optimal. Rows `opt.formulate`,
`opt.stationary`, `opt.boundary` and `opt.convex` distinguish these steps.
For constraints -x≤0 and x-1≤0, KKT uses multipliers 0 and 2 at x=1:
the derivative -2 is balanced by the active upper-bound multiplier. This is
`opt.kkt`, not a generic tangency diagram. These scopes are unaudited.

To approximate √2, apply `num.bisection` to f(x)=x²-2 on [1,2]. The first two
midpoints 1.5 and 1.25 leave [1.25,1.5]. Its midpoint 1.375 has an absolute-error
bound of 0.125 from the retained bracket. Rows `num.error` and `num.convergence`
distinguish an error bound from a claim of exact equality. This numerical
curriculum path remains unaudited; the existence of a graph slider proves none
of its mathematical containment obligations.
