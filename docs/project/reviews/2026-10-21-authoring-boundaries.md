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
