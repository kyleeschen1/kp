# Common-factor release budget checkpoint

Decision resolved: the user accepted the recommendation and requested
implementation on 2026-09-09. The exact three HTML-gzip baseline replacements
below are approved and applied. The 5% policy, all route coverage, raw-HTML and
runtime limits remain unchanged. Earlier failure measurements are retained as
history; final release verification is owned by s23 of the existing contract.
Release subsequently passed: 6,887 tests, full build/types, all 12 reader budgets
and production closures. This checkpoint is resolved historical evidence; see
`../reviews/2026-09-09-common-factor-authoring-closeout.md` for completion and
the next proposal boundary.

At the checkpoint, M1a had completed the accepted primary card and numeric
source-only reuse. The release gate could not be marked passed while three
existing reader routes exceeded their fixed compressed-HTML limits. Theseus owns live slice state;
this is not a new implementation plan or a completed-loop report.

## What the current approval delivered

The exact renderer source-size ceiling is now 515,000 bytes; measured source is
512,619 bytes. At that checkpoint no reader-budget or other non-TypeScript
ceiling had been raised; the subsequent explicit HTML-budget approval is above.
The visually accepted native factoring pipeline is shared by the primary
`ab + ac` → `a(b + c)` and numeric `2x + 2y` → `2(x + y)` examples. The numeric
caller adds source JSON, not production TypeScript or renderer glue.

Actual compositor regression checks cover continuant paint, exclusive ownership,
native/material seams and reverse replay. Boundary tests preserve typed repairs
for unsupported notation/presentation and reject forged proof or stale revisions.
The author packet is `../authoring/common-factor-authoring-packet.md`.
`npm run check:common-factor-workflow` replays both source/edit/repair/export
workflows; these are deterministic scripted fixtures, not live LLM evidence.

## Release measurements

`npm run check:reader-budgets` failed on the checkpoint production build:

| Reader route | HTML gzip bytes | Fixed allowed bytes | Excess |
| --- | ---: | ---: | ---: |
| `/reader/divide-both-sides/` | 4,381 | 4,371 | 10 |
| `/reader/split-merge-fractions/` | 4,161 | 4,135 | 26 |
| `/reader/radical-succession/` | 4,392 | 4,373 | 19 |

All runtime-code budgets pass. The shared equation runtime is 141,933 gzip bytes,
3,067 below its limit. Raw HTML also passes. The output contains shared dependency
script URLs, so compiled-HTML gzip depends on build chunking and content hashes
as well as lesson markup. This is not evidence that the factoring animation is
slower. The precise attribution of every added compressed byte is not established.

A read-only probe of safe script-URL unquoting did not bring all routes under
their limits; it was not implemented. Do not trade loading-order correctness,
accessibility, semantic payload, or accepted paint behavior for a tiny byte saving.
Do not change gzip measurement or drop routes from the gate.

Passed release checks so far:

- `npm run build`, including full TypeScript/Svelte checks and publication
  freshness. Existing large-chunk advisory remains; no deployment occurred.
- `npm run visual:common-factor-authoring:cohort`: 24 tests across Chromium,
  Firefox and WebKit, including both static editions, controls, reverse motion,
  phone/reduced-motion layout and repeated Apply/disposal checks.
- `npm run visual:authoring-entrypoints`: 23 earlier-exemplar Chromium checks.
- `npm run test:real-katex-glyph-compositor`: 82 tests.
- `npm run test:common-factor-authoring`: 32 tests.
- Reader production closure: 12 routes; dev-review closure: 457 files and 12
  forbidden markers; compositor diagnostic closure: 9 forbidden markers.
- Complete inference gates: core 113,052 types / 193,425 instantiations;
  combined 169,965 / 282,610, with all consumer coverage retained.

Full `npm test` completed in 763 seconds: 6,885 passed, two failed. Both failures
were stale generated metadata: the discovery catalog still named pre-verifier
factoring evidence, and the reachability graph omitted the new common-factor
callers. Their owning `generate:equation-operation-discovery-catalog` and
`generate:equation-reachability` commands refreshed the artifacts; all 20 tests
in `test:equation-operation-discovery-api` and `test:equation-reachability` then
passed, including both formerly failing tests. Existing freshness assertions
remain intact. The full suite and production build must be rerun after the
release-budget decision; this is not a claim of a green final full-suite run.

## Decision and exact continuation

Accepted recommendation: a bounded amendment for these three HTML-gzip baselines,
retaining the 5% policy, all routes, raw-HTML and runtime limits, and executable
checks: divide-both-sides 4,162 → 4,381; split-merge-fractions 3,938 → 4,161;
radical-succession 4,164 → 4,392. These measured-baseline replacements were
subsequently explicitly approved and applied, instead of a separately scoped
build-output optimization. Authority comes from that new approval, not the
earlier 515,000-byte renderer-source ceiling. No automatic budget waiver applies.

After the decision, resume `run-contract.kp.common-factor-authoring-v1` at s23,
rerun the release gate, and finish s24 documentation/closeout. No new family or
successor loop starts automatically. Fresh-session entry: `theseus work resume`,
then `npm run --silent loop:status`; if resume hits its own output budget, use
`theseus plan run` and the exact contract above without changing Theseus policy.

Inspect the accepted card at
`http://localhost:8000/experiments/reusable-reasoning/?example=common-factor`.
For the numeric caller, paste `src/authoring/examples/common-factor-numeric.json`
into that page and Apply. This bounded task has two stops and one transition;
multidigit/composite factors and general polynomial factoring remain unsupported
presentation or semantic gaps. Static editions are reading-only. Browser-engine
tests do not constitute physical-device or comprehension-study evidence.
