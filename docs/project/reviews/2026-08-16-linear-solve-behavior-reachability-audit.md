# Linear-solve behavior reachability audit

The upward dependency from `src/semantic/linear-solve-asset.ts` to the tutorial
card sampler is not part of semantic asset construction. It exists solely in
`createLinearSolveKpBehavior`, a convenience wrapper over the tutorial's 2400ms
parent timeline.

The TypeScript-AST reachability check finds no production module importing that
symbol. Three tests import it to exercise generic behavior inspection,
decomposition, and determinism. The project dashboard only names it as an
example API; it does not call or import it.

Disposition: move the behavior wrapper and its frame type to the experience
layer, retain the semantic asset bundle in neutral core, update the three tests
and dashboard description, and retire the exact dependency exception. Preserve
the behavior ID, duration, absolute samples, active transformation identity, and
determinism. No visual output or semantic object is authorized to change.
