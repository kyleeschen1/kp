# Unit-Scalar Differentiable-Map Helper Boundary

Date: 2026-09-02
Status: accepted for one bounded experimental implementation

## Decision

The linear supply-demand and nonlinear circle-area pressure callers repeat
enough implementation mechanics to justify one optional internal authoring
helper for unit-tagged scalar differentiable maps. The next bounded iteration
may implement a helper shaped approximately as:

```ts
defineKpAuthoredUnitScalarMap(author, {
  path,
  domainUnit,
  codomainUnit,
  evaluateMagnitude,
  derivativeMagnitudeAt
});
```

The helper may derive deterministic domain and codomain space IDs, map and
derivative IDs, runtime unit guards, derivative linear-map wrapping, source
identity, derivative-unit LaTeX, and named tested-law evidence. It must remain
experimental until both pressure callers use it successfully.

## Reason

The two structurally different callers share the same non-mathematical work:

- require the standard numeric scalar default;
- construct two unit-tagged scalar spaces with stable semantic IDs;
- guard the evaluation input, derivative point, and derivative change units;
- wrap an authored scalar rule in a differentiable map and each pointwise
  derivative in a linear map;
- attach source identity and tested linearity evidence; and
- project the declared derivative units to LaTeX.

The circle is nonlinear, so this repetition is not an artifact of the
market's affine curves. Its focused compiler closure added only 174 types and
319 instantiations, which leaves room to test a narrow convenience layer
without first redesigning the algebra.

## Consequences

- The caller continues to author `evaluateMagnitude` and
  `derivativeMagnitudeAt`; the helper does not calculate a derivative.
- Units remain explicit descriptors. The helper does not infer products such
  as square meters or price-times-quantity.
- Law evidence remains named and inspectable. The helper does not convert a
  boolean assertion into proof.
- The helper does not infer a basis, equality, physical-domain predicate, or
  semantic source. In particular, `radius >= 0` is a separate domain
  constraint because the current differentiable map is between vector
  spaces.
- Migrate only the supply-demand and circle callers, compare authored lines
  and compiler cost, and stop for API review before public-facade promotion.

## Alternatives Considered

- Keep both callers local. Rejected for the next experiment because the
  repeated plumbing is now demonstrated across affine economics and nonlinear
  geometry.
- Add a universal unit algebra or HKT/typeclass hierarchy. Rejected because
  neither caller requires automatic unit products, global instance
  resolution, or broader algebraic abstraction.
- Add a general symbolic differentiation engine. Rejected because both
  callers can state their derivative rules directly and no CAS capability is
  needed.

## Follow-Ups

1. Implement the helper as an internal experimental authoring utility.
2. Migrate only the two pressure callers without changing their public object
   shapes, IDs, values, derivative behavior, or diagnostics.
3. Measure author-line reduction and the focused TypeScript inference delta.
4. Stop for review; public promotion, derived-unit algebra, domain predicates,
   economics reconciliation, and visible inspection remain separate choices.
