# Verified Linear Problem Animation Bridge Contract

Date: 2026-08-01
Status: frozen for the first generated solve-x exemplar

## Boundary

`inspectVerifiedLinearProblemAnimationTrace` is the fail-closed boundary
between `linear-problem.v1` mathematical verification and trusted KP animation
compilation. It accepts only:

- strict, diagnostic-free, solution-verified `kp.linear-equation-trace.v1`
  traces;
- `linear-problems.exact-rational` provider version `1.0.0` with the provider's
  stable `linear-<hash>` problem identity;
- one ordered operation between every adjacent pair of frames;
- exact `canonical-operation` classifications whose normalized kind equals
  the provider operation; and
- the currently proven presentation set: `subtract-both-sides` and
  `divide-both-sides`.

Anything else returns a typed rejected result with path-specific diagnostics.
There is no permissive fallback and no partially compilable output.

## Identity and provenance

The bridge derives one stable instance namespace from the verified problem ID:

```text
generated.linear-solve.<problemId>
```

It exposes the resulting instance and animation IDs, preserves the source
trace and problem IDs, copies provider provenance, and records source operation
and equation semantic IDs. The downstream compiler must create
instance-scoped object, transformation, and selector IDs beneath that
namespace rather than reusing canonical-fixture IDs.

## Ownership

The provider owns the generated equation, exact solution, verified operation
classification, and provenance. The bridge owns only trust admission,
normalization, and identity. It does not import animation or rendering code and
cannot carry timing, geometry, layout, prose, visual recipes, or renderer
state. Those remain trusted KP compiler and host concerns.

This initial operation set is deliberately narrow. Adding
`add-both-sides`, `multiply-both-sides`, `simplify`, or
`equivalent-rewrite` requires independent semantic and presentation proof; it
is not inferred from provider validity alone.

## Next slice

Compile the accepted canonical provider trace into one canonical
`KpAnimationAsset`, expanding each accepted provider operation through trusted
KP semantic states while preserving the bridge identity and provenance.
