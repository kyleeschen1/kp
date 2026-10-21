# Calculus authoring transfer

The first two cases are source-only variations of the existing change-propagation
model. Neither requires new differentiation, geometry, timing or rendering code.
The reference presentation is still unaccepted; these checks establish mathematics
and authoring reach, not teaching effectiveness.

`content/authoring/transfer/stationary-change.json` asks why a zero derivative
does not imply zero finite change. Its static baseline is the identity
3(x+h)² − 3x² = 6xh + 3h². At x=0 the first-order prediction vanishes,
while the residual remains positive for nonzero h. The existing visual job is
to compare prediction with actual change as h shrinks, not animate a proof.

`content/authoring/transfer/two-reversals.json` instead asks how two local
reversals yield an increase. At x=1, the intermediate value is −1 and both
local rates are −2. The outer derivative must be evaluated at the intermediate
value. The composed function is x⁴. Claims about the initial rates are qualified
because the learner can change the evaluation point.

Both assume familiarity with derivatives and composition. Five fixed passages,
bounded polynomial/trigonometric expressions and a fixed parameter window are
real constraints. Editorial prose is not machine-verified. No arbitrary chain-rule
derivation or learning-effectiveness claim follows from a successful source check.

Source audit: `npm run test:change-propagation` passes all 11 tests, including
both actual source files over positive, negative and zero increments and several
base points; exact residual formulas; deterministic reverse projection; and
located rejection of undeclared variables, division and unsupported functions.
An initial assertion incorrectly distinguished IEEE negative zero from zero;
the numerical assertion now uses the same tolerance as the other identities.
No engine behavior was changed to accommodate that test.
