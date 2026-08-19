# Fraction Common-Denominator Authority Reconciliation

Date: 2026-08-19
Status: current implementation boundary

## Existing authority

- `src/semantic/exact-fraction-quantity-trace.ts` already seals the exact
  `1/3 + 1/6 = 1/2` quantity proof. Its common-denominator certificate proves
  that `[1/3, 1/6] -> [2/6, 1/6]` preserves both addends through explicit
  unit multipliers and reaches one denominator.
- `src/semantic/fraction-equivalence.ts` owns the reusable equation law for
  scaling one numerator and denominator by the same verified nonzero factor.
- The operation-evaluation family owns evaluation of visible products such as
  `2 * 1 -> 2` and `2 * 3 -> 6`. Fraction equivalence does not authorize that
  evaluation.
- The exact-fraction quantity presentation owns partition refinement and
  selection merging. Those concrete quantity motions are not equation-
  renderer authority.

## Missing boundary

The repository does not yet have a governed equation-series contract that:

1. selects one or more fraction-equivalence operations inside a larger
   expression;
2. preserves the surrounding operator and untouched terms by semantic ID;
3. verifies that the resulting denominators align;
4. keeps visible product evaluation as a separate adjacency; and
5. exposes typed repair when the proposed factors, target denominators, or
   source evidence are invalid.

This is an authoring and composition gap, not a missing fraction theorem. The
implementation should compose the existing fraction-equivalence law and exact
rational arithmetic. It must not create a second common-denominator proof, a
general LCM solver, or a universal fraction renderer.

## Like-denominator combination boundary

The exact quantity trace also proves that selected sixths merge, but an
equation-series operation still needs explicit numerator-contributor lineage
and denominator persistence. That operation may become `Registered` during
this run. It may not claim animated `Direct` support until a later reviewed
presentation exists.
