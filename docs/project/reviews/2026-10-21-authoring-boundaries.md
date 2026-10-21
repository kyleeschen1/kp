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
