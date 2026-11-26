# Quadratic authoring exemplar evidence

Date: 2026-11-25
Scope: approved M0 in [the mathematical programme](../2026-11-25-mathematical-authoring-programme.md).
Execution: `run-contract.kp.quadratic-authoring-20261125`.

## Mathematical resource boundary

The notebook adapter now has validated quadratic, derivative and tangent resources,
persistent UUIDs/revisions and explicit registered recipe versions. Invalid numeric
drafts retain admitted values and remain recoverable. The finite recipe family
requires a source quadratic, so cycles, missing sources and unsupported derivative
chains produce explicit gaps. This is not yet an integrated authoring result.

Existing expression constructors, differentiation and evaluation remain authority.
The semantic-state model/graph owns dependency evaluation. Source coefficients map
to the stable notebook/resource namespace; occurrences will reference resource UUIDs.
Derivative dependencies deliberately exclude the constant coefficient. One notebook
owner shares computed values, releases removed sources and disposes its cache.

The first pressure test exposed unbounded retained fingerprints in the existing
caller cache. An optional positive capacity now uses least-recently-used eviction;
existing callers keep their prior default. The quadratic owner retains at most
three computed fingerprints and 128 temporary parameter edits before rebasing.
No runtime snapshot escapes that owner; notebook/ProseMirror history owns user
undo. A 300-edit test checks bounded retention and correct results across rebasing.

The existing Graph2D SVG implementation is extracted into a 2D-only entrypoint;
the legacy path reexports it. Scene construction, sample policy, geometry and paint
output are preserved. This avoids importing 3D depth/lighting into the new caller.
Complete notebook payload and interaction measurements belong to integration;
no bundle or latency improvement is claimed from source separation alone.

Checks: six mathematical object tests; 33 existing rendering/cache tests;
`npm run typecheck:fraction-notebook`, including affected rendering/cache consumers;
75 `npm run test:project-vision` checks. Initial compiler/runtime checks also caught
a missing explicit return and strip-only TypeScript syntax; both were repaired.
The direction update exceeded the active-thread budget by one word and was shortened
within its unchanged ceiling. No checks or bounds were weakened.

The impact selector has no focused rule for these dev-host paths and falls back
to production promotion checks. This unpromoted exemplar uses the approved standard
tier: domain invariants, complete affected types, legacy preservation tests and one
canonical Chromium workflow before human visual judgment. Release/promotion remains
outside M0.
