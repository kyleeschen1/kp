# Checked immutable semantic data issuance

The generic compatibility constructor aliases `value`. The new regression
reproduces a retained input changing that legacy object's meaning under the same
ID. This is a real ownership escape, not proof that the domain trace validators
or native motion pipeline are absent.

The new `createKpImmutableSemanticAssetObject` uses the existing wrapper
construction/validation after taking an owned data snapshot. It exposes deeply
readonly payload types and a private issuance brand; a WeakSet check distinguishes
an issued value from a structurally similar/serialized copy. This proves data
ownership, not a mathematical theorem or global uniqueness of every ID.

## Supported shape and boundaries

Inspection found about sixty direct-constructor source files across equations,
economics, code, Graph3D, diagrams and fixtures. This is an inventory, not an
authorization to migrate all of them. Bounded adoption candidates are the
canonical supply-tax source/asset pair, TypeScript refactor operation set,
Bayesian state evidence and fraction-equivalence exemplar. Their values are
plain records/arrays: exact rational DTOs, source revisions/entities, serialized
probability masses and equation/parameter data. Existing domain verifiers retain
semantic authority.

Accepted data: finite numbers, strings, booleans, bigint, null/undefined, dense
arrays and enumerable plain/null-prototype records. Optional presence and exact
bigints are preserved rather than coerced through JSON. Shared acyclic aliases
remain shared inside the owned snapshot. Caller inputs remain mutable and are
not frozen. Selectors, metadata and provenance are also captured/frozen.

Cycles, accessors, hidden/symbol fields, functions, symbols, nonfinite numbers,
sparse arrays and class/runtime objects return `KpSemanticDataRepairGap` with a
code and path. Traversal is bounded to depth 100 and 100000 visits. Literal
`__proto__` data cannot invoke a prototype setter. This is not a sandbox for
hostile JavaScript proxies or a universal serializer/renderer-handle freezer.

Static guarantees cover deep readonly output and structurally unsupported
function/class-method fields. Runtime checks remain necessary for finite numbers,
actual prototypes, descriptors, cycles and external input. The existing legacy
factory stays explicitly documented as an aliased compatibility wrapper; no
catalogue-wide immutability claim is made before real caller adoption.

## Evidence and cost

`node --disable-warning=ExperimentalWarning --test tests/kp-immutable-asset.test.ts tests/kp-asset-core.test.ts`
passes seven checks including nested mutation, provenance/metadata, typed gaps,
getter non-execution, exact data and issuance identity. Negative TypeScript
checks exercise nested fields, arrays, functions and Date methods. Full types
are the standard gate. The legacy test's misleading “immutable” title is now
“serializable compatibility wrapper”; its assertions were retained.

The repeatable unit probe clones/freezes 1000 two-number records 25 times:
local p50 3.32 ms, p95 8.67 ms in this run (a compiler check was concurrent).
That is an observed issuance cost, not a hot-frame operation, optimized benchmark
or physical-device guarantee. Supported caller/build costs are checked on adoption.
