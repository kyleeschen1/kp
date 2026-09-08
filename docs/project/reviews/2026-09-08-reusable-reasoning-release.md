# R2 release verification

Date: 2026-09-08. Outcome: PASSED, approved R2 s23.
Execution authority: `run-contract.kp.reusable-reasoning-v1`.
Both equation and code visual checkpoints were accepted before this boundary.

## Executed final gates

- `npm test`: **6,736 passed, zero failed or skipped**, plus its architecture,
  inference, concept-catalog and promotion-memory preflights. Fresh full rerun
  after the inventory repair, not a failed suite represented as passing.
- `npm run test:reusable-reasoning`: **61 passed**, including actual filesystem
  publication, both navigation models, held-out edits and captured-output replay.
- `npm run typecheck`; `npm run build`: full app/node/test/Svelte/domain types
  and final production build passed. Svelte: zero errors/warnings.
- `npm run check:reader-production`: **12 manifest routes**, passed.
- `npm run check:reader-budgets`: passed with existing fixed limits unchanged.
- `npm run visual:reusable-reasoning:shared -- --project=firefox --project=webkit`:
  **54 passed** on a fresh complete Chromium/Firefox/WebKit run at port 8000.
  Covers equation/code motion, semantic keys, continuous passage/stage control,
  live count, backward travel, full/compact, exact return, history/refresh,
  source edits, no-JavaScript export, reduced motion and phone-width composition.
- `npm run visual:canonical-tax-production -- --project=firefox --project=webkit`:
  **18 passed against the final build**, including all four sibling keyboard
  paths, gradual code passage input, exact tax endpoints and no-JavaScript truth.
- `npm run visual:authoring-market -- --grep 'equation authoring numeric|actual local-file rebuild'`:
  **2 Chromium checks passed**. Actual source corruption was intentional; the
  original files were restored. Numeric JSON still reaches verified native ink.
- `npm run test:equation-reachability`: **12 passed**;
  `npm run check:equation-reachability`: current **68 roots**.
- `node_modules/.bin/tsc --project tsconfig.node.json --noEmit --incremental false`:
  passed after the final trial-output isolation hardening.

The shared development server remains port 8000. Existing production/authoring
test commands used their scoped temporary preview and stopped it afterward;
no additional persistent server, merge or deployment was introduced.

## Initial failures and durable corrections

The first full test run had 6,735 passes and one stale generated dependency
inventory failure. The existing generator refreshed the file count from 4,332
to 4,381 and added the observed R2 callers; the 68 declared roots did not change.
No freshness assertion, dependency boundary or budget was removed.

The first browser cohort had 51 passes and three failures of the same assertion:
piecewise interpolation produced `0.05384615384615385`, while direct division
produced `0.05384615384615384`. Only the intermediate numerical sample now uses
14-decimal precision. Semantic endpoints and captured return values remain
bit-exact assertions. The focused three-browser repair check and then the whole
54-case cohort passed. No motion timing or rendering change was needed.

An extra direct node typecheck initially could not write its incremental cache
under the restricted filesystem. The read-only `--incremental false` check above
passed; the ordinary full build/type gate also passed. No source type error or
permission-policy broadening was hidden by this fallback.

The live-trial harness now allocates a fresh per-run directory. A child exit
without a newly written response cannot accidentally consume an earlier run's
output and report it as fresh evidence. The captured s22 trial remains the
original actual two-call run, not an additional trial claimed after hardening.

## Scope and residual limits

`npm run report:canonical-tax-delivery` measured **368,214 gzip bytes** of static
JavaScript/CSS across 69 files, plus 3,202 gzip HTML bytes. This is not total
network cost, activation latency or frame-rate certification. The build still
reports large-chunk warnings for existing broad tooling/3D bundles; fixed reader
budgets pass and were not increased to suppress warnings.

The two reasoning hosts remain isolated development exemplars. Production
closure/tax tests certify preservation of existing built routes, not public
deployment of those new hosts. Equation static editions are local immutable
readings, not interactive deployed packages. Code has no live JSON editor,
selected-source publication, full/compact/practice parity or URL-history parity
with the equation host yet.

Playwright WebKit and phone-sized viewports are not physical iOS Safari tests.
Rapid native wheel-axis switching remains an explicitly unclaimed hardware/OS
case. No universal KaTeX mechanism certification, curriculum coverage, general
code equivalence, or learner-comprehension result follows from this release.
