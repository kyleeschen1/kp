# Authoring dependency measurements and repairs

Authority and scope: [continuation plan](../2026-10-21-authoring-boundaries-continuation.md).
Live execution/evidence: `run-contract.kp.authoring-boundaries-v1`.

## Baseline

`npm run measure:authoring-boundaries -- --types` independently builds complete
matrix, source-reading, compile/serialize and editor consumers. All entry exports
are retained, every emitted JS chunk is counted, and fixtures do not substitute
stubs for semantic authorities. TypeScript independently checks the same four
consumers with repository test options. These figures include compiler library
types and overlapping closures; do not sum them or equate them to runtime cost.
The runtime collector was corrected to exclude inline `export { type ... }`;
a regression test also retains mixed value/type exports.

Before boundary changes, October 21:

| Complete consumer | Static local files | Emitted JS gzip | TS types | TS instantiations | Checked local files |
| --- | ---: | ---: | ---: | ---: | ---: |
| Real convergence matrices/results | 7 | 2,315 B | 62,088 | 82,471 | 8 |
| Algebra read/parse/repair | 183 | 78,821 B | 111,489 | 162,536 | 292 |
| Algebra compile/serialize | 183 | 89,286 B | 111,493 | 162,536 | 292 |
| Algebra compile/check/serialize/session | 183 | 89,759 B | 111,489 | 162,536 | 292 |

The source-only barrel reaches compiler initialization despite bundling; this is
not merely a static-import warning. Compile and editor outputs also include the
default example JSON. The direct source reader itself has a two-file closure.
Matrix authoring is already narrow and needs no module reorganization.

Local production bytes are not network latency or observed learner performance.
Browser host acceptance and preservation checks remain separate from these
complete authoring-consumer measurements.

## Explicit capability boundaries

`algebra/source.ts` now exposes plain-data read/parse/repair without importing
proof, animation or editor code. `algebra/compile.ts` requires selected source
and retains the same issued proof and canonical presentation. `algebra/session.ts`
owns the existing transaction convenience. The full `algebra.ts` namespace is
still available for complete editors. The old long-form v2 session module retains
its no-argument example, while real page/editor callers select example content
explicitly. CLI publication and author-check consumers now use the compiler seam.

After separation, same complete consumers and measurement configuration:

| Consumer | Static files | JS gzip | TS types | TS instantiations | Checked local files |
| --- | ---: | ---: | ---: | ---: | ---: |
| Matrices | 7 | 2,315 B | 62,088 | 82,471 | 8 |
| Algebra source | 4 | 1,549 B | 59,238 | 77,226 | 4 |
| Algebra compiler | 181 | 88,758 B | 111,350 | 162,508 | 290 |
| Algebra editor | 184 | 89,165 B | 111,436 | 162,536 | 293 |

Source-only gzip falls 98%; editor/compile savings are modest. No compiler or
editor output contains the default example JSON. The editor's file count grows
by one due to explicit capability modules, disclosed rather than hidden. Full
compilation still pays for canonical presentation and compiler ownership; this
change neither removes those checks nor claims an 89 KB compiler is tiny.

Source parsing accepts structurally valid but mathematically false transitions;
compilation rejects them. Tests prevent source data from impersonating issued
presentation authority, preserve legacy default output, and reject source-less
calls to the concise compiler. Existing browser download/reload preserves exact
revision IDs for both extended source variants. The author guide documents the
distinction and migration.

## Acceptance policy

`npm run check:authoring` runs focused authority/compatibility tests, then all
four complete runtime and TypeScript consumers. The budget is explicit and
checked, not automatically refreshed: matrix/source gzip ceilings are 2,500 /
1,700 bytes; compile/editor are 94,000 / 95,000. Type ceilings are 65,000 /
62,000 / 117,000 / 117,000; instantiations 87,000 / 82,000 / 172,000 / 172,000.
This gives roughly 5–10% measured headroom. Any amendment must explain the
cause and preserve complete consumers. The source-only dependency allowlist
and no-example-output condition are independent of byte budgets.

The compiler still statically reaches a tutorial-fixture builder through the
distribution adapter, which mixes proof-driven construction with catalogue
examples. The next bounded investigation separates that demonstrated owner
boundary without changing its shared asset/timeline constructor. Presence in
source reachability alone does not establish shipped fixture bytes; emitted
output and type costs must be measured before claiming savings.

## Distribution follow-through

Moved the three proof-driven factories and their unchanged shared constructor
to `distribution-semantic-adapter.ts`. The historical adapter still selects
fixtures and delegates to that same constructor, preserving its exports. The
canonical operation binder now imports the proof-driven boundary directly.
The compiler's runtime closure contains no fixture modules. Primary compilation
retains revision `b06aee221f9f9bb0b0dbb13d4794758028f033fe66e3c82e8eb7f7f98925a92c`
and exact animation JSON digest
`267d8737df36bba834e09d658b0d2297b6806500c541d8716a12122dbaea91f3`
before/after, including every checkpoint and timing field.

This is an isolation/type-cost repair, **not** a runtime-byte optimization.
Compile raw JS remains 380,053 bytes; gzip changes 88,758 → 88,802 from output
ordering. Editor gzip changes 89,165 → 89,211. Compiler static files fall
181 → 176, checked files 290 → 287, types 111,350 → 109,851, instantiations
162,508 → 161,897. Editor checked files fall 293 → 290; types 109,937 and
instantiations 161,925. Existing ceilings remain unchanged. A closure regression
prevents fixture builders from returning through this proof-driven path.

## Starter-example loading

The existing author-task dispatcher already loads only the selected owner.
However, five example factories shared modules with their heavy checkers.
Moved those factories into source-only modules, retained compatibility exports,
and changed only the example dispatch imports. Mechanics retains its required
public domain entrypoint. No new registry, schema,
compiler or renderer was introduced.

Fresh-process CLI example loads, measured by the Node module load hook in
`tests/fixtures/author-example-load.ts`:

| Task | Local modules before | After |
| --- | ---: | ---: |
| Algebra intuition | 182 | 10 |
| Composed algebra | 176 | 8 |
| Common factor | 131 | 8 |
| Fraction chain | 229 | 7 |
| Binary Bayes | 94 | 10 |
| Momentum/energy (unchanged control) | 12 | 12 |

These are actual module loads, not emitted browser bytes or latency claims.
Each selected example still passes its existing semantic checker; the fraction
example retains its hint stripping. The scoped authoring gate now runs six
fresh-process regressions, forbids renderer/compiler capabilities in example
loads, and allows only two modules of explicit count headroom per cohort.
Existing CLI tests also exercise every declared task and invalid selection.
No compilation capability or supported mathematics was removed.

The architecture gate rejected a trial direct mechanics-domain import.
Restored the public boundary instead of weakening that gate for a five-module
saving. Its small existing example closure is retained as a control cohort.
