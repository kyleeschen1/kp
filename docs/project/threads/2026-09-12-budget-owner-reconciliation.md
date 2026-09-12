# Budget ownership reconciliation

Scope: approved architecture readiness slice s10 and standing automatic approval
for measured nonvisual budget repairs. No visual/runtime migration and no claim
that changing a ceiling improves performance.

## Canonical construction versus development review

`kp-application-entry-ownership.ts` explicitly classifies the canonical review and
glyph review pages as development-only, erased from production. The old checker
required these absent entries and could not run its full gate. It now consumes
that ownership record and requires no development-only artifact in the production
manifest, while retaining ordinary-reader leakage checks and the original
construction, verification, sampling and serialized-projection ceilings.

Retired: four obsolete production review size/file metrics and their independent
closure/gzip traversal. This is a stronger no-shipment requirement for those
artifacts, not a zero-byte measurement masquerading as a successful build.
The independent Studio/library bundle policy is unchanged.

Measured canonical checks: construction p95 3.61ms (50ms ceiling), verification
p95 3.75ms (10ms), batched compound sample p95 0.0026ms (0.1ms), serialized
projection 26,725 bytes (48,000). No development artifact or ordinary-reader leak.
These machine-local timing observations are not browser animation benchmarks.

## Algebra and the shared reader

The shared reader baseline and five-percent allowance now come directly from the
existing route manifest/checker (152,463 baseline; 160,087 allowed). The measured
closure is 152,506. The obsolete independent 145,000 ceiling and 124,778 baseline
are removed. The common group is identified by the actual fraction-composition
route, not an assumption that exactly ten routes must share it.

The article entry statically imports its canonical native progressive reader.
Its old lazy-editor HTML/startup baselines do not describe that accepted pipeline.
This explicit policy amendment uses the measured 10,500-byte HTML and 216,218-byte
startup JS/CSS baselines, each with the existing five-percent allowance. The old
274,397 activation-increment and 310,616 activated JS/CSS baselines remain, with
the same allowance. Startup and activated limits stay independent. Startup debt
is exposed, not repaired by this amendment; no rendering or loading semantics
were changed to force a pass.

The investigation also reproduced a real accounting defect: activation inspected
only dynamic imports directly on the entry and reported zero. Nested declarations
add 106,587 gzip bytes, for a complete 322,805-byte declared activated JS/CSS
closure, within the retained 326,147-byte limit. This is a conservative reachable
declaration closure, not an observed request claim for one interaction. HTML,
JS/CSS and fonts must not be conflated; the separate browser audit reports actual
font/route requests.

## Shared accounting and negative checks

`bundle-closure-attribution.ts` now owns manifest traversal for the two affected
collectors. Startup follows static edges; declared activation follows nested
dynamic edges too. Sets deduplicate shared/cyclic dependencies. Missing roots or
imports fail closed instead of silently disappearing from the reader tally;
missing physical files also fail measurement. The existing gzip attribution
owner remains unchanged.

Regression checks cover exact limits, each independent one-byte overrun,
forged report ceilings, authoring leakage, development artifacts, absent files,
missing static/dynamic imports, nested activation, cycles and deterministic
deduplication. No tests or product budgets are waived. Commands:
`npm run check:algebra-fraction-composition-budgets`,
`npm run check:canonical-animation-budgets`, `npm run check:reader-budgets`,
the three affected budget/closure test files, and full typecheck.
