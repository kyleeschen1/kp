# Unit-Scalar Map Helper API Gate

Status: retained internally after the approved s12 gate.

## Decision

Retain `defineKpAuthoredUnitScalarMap` in the internal math-authoring layer
without a public-facade export or another input-shape revision. The market and
circle pressure callers demonstrate the intended affine and nonlinear cases.

The helper owns repeated mechanics: stable space/map/derivative IDs, unit
guards, existing differentiable and pointwise-linear wrappers, tested-law
metadata, declared source metadata, and derivative-unit LaTeX. Authors still
state both numerical rules, both units, semantic paths, diagnostic labels,
source identity, and the named law suite. It therefore removes ceremony
without claiming mathematical authority it does not possess.

## Evidence

The frozen pre-helper fixture records 148 setup lines, 16 mechanical
statements, 8 low-level constructor calls, 6 local unit-guard calls, 13 path
calls, and 2 derivative-unit projections across the two callers. The accepted
fixture records 76 setup lines, 7 mechanical statements, 2 helper calls, no
caller-local guards, 5 path calls, and no caller-local unit projections.

That is a 48.6% setup-line reduction, a 56.3% mechanical-statement reduction,
and a 75% constructor-call reduction. Focused TypeScript work rose from 33,441
types / 39,168 instantiations to 33,845 / 40,058: approximately 1.2% and 2.3%.
The increase is local and does not require a global inference-ceiling change.

Autocomplete remains local because the one-call input is a named object with
`domain`, `codomain`, numerical rules, diagnostics, source, and law-suite
fields. Unit IDs remain inferred from the descriptors, while invalid callback
signatures and reversed domain/codomain identities fail in the focused type
fixture. Runtime diagnostics retain caller-authored labels at evaluation,
derivative-point, and derivative-change boundaries.

## Rejected Expansions

- No inferred derivatives, derived-unit algebra, physical predicates, or law
  evidence.
- No overload family, builder chain, mutable registry, or import-order cache.
- No public authoring-facade promotion until another independently motivated
  caller demonstrates that boundary.
- No migration beyond the two approved pressure callers.

The original fixture remains immutable before-evidence. The accepted fixture
is a separate checked artifact so later work cannot rewrite the comparison.
