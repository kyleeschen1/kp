# Structural authoring release verification stop

Status: STOP_CONDITION; required release evidence fails; G2 not reached
Contract: `run-contract.kp.structural-authoring-canonical-tax-v2`

The approved compiler-boundary repair is committed as `1da51de31`. The actual
consumer gate passes at 112,087 types / 191,096 instantiations with unchanged
budgets and fixtures. See `2026-09-06-structural-authoring-two-caller-cost-stop.md`
for API, source accounting, preservation and implementation evidence.

## Executed release evidence

- `npm run build`: passed, including full TypeScript, Svelte and domain checks.
  Vite retains its large-chunk warning; it is not a failed build.
- `npm run check:equation-reachability`: initially stale; after the standard
  generator, passed with 68 roots. The generated diff changes only scanned file
  count (4287 to 4294), not roots or ownership.
- `npm run visual:authoring-structural -- --project=firefox --project=webkit`:
  includes the command's existing Chromium project, so executes 24 tests.
  19 passed; one Firefox and four WebKit checks failed.
- `npm run visual:authoring-structural -- --project=firefox --project=webkit --grep 'phone links|canonical distribution traverses'`:
  bounded repeat, 4 passed / 2 failed. Both distinct browser failures reproduced.
- `npm test`: architecture, inference, catalogue and promotion-memory preflights
  passed. The unit run exposed stale caller-ledger and project-direction
  assertions. It was intentionally interrupted after the browser stop reproduced;
  cancellation diagnostics are not additional diagnosed product defects. There
  is no complete passing full-suite result and no final full-suite count claim.
- `node --disable-warning=ExperimentalWarning --test tests/animation-api-caller-ledger.test.ts`:
  9 passed after charging the already-approved distribution projection caller
  and extracted frame sampler to the exact expected inventories.
- `node --disable-warning=ExperimentalWarning --test tests/current-direction-authoring-ratchet.test.ts`:
  1 passed / 2 failed. It still expects the predecessor architecture/API
  checkpoint wording and predecessor proposal in every live queue document.
  Reconcile those assertions with accepted current direction, preserving the
  approval and provenance checks rather than restoring an obsolete queue.

## Browser failure boundaries

Firefox: the authored `2 × 1 → 2` Focus Card's phone/resize/reduced-motion test
throws `Native KaTeX endpoint handle is stale-viewport` from the existing carrier
settlement guard, via the shared surface adapter's `applyFrame`. The adapter's
revision check detects drift, but render can reach sampling before asynchronous
measurement replacement. Investigate synchronous invalidation/queued replacement
and measurement-transaction consistency; retain the stale-handle guard and latest
pending semantic playhead. The exact race cause is not yet established.

WebKit: the canonical fraction reader and authored distribution path both reject
a non-rigid endpoint seam involving fraction-rule paint at distribution/normalize
or normalize/constant-product boundaries. The exception originates in
`canonical-equation-transition-continuity.ts`, reached during stage measurement.
The canonical reader remains at progress 38 when the harness seeks to zero.
This is an observed shared presentation/measurement failure, not evidence that
authored semantic values or the schema are wrong. No pre-repair checkout was
tested, so its introduction is not attributed to the latest compiler refactor.

The canonical authoring product exemplars remain the distribution and
simplification Focus Cards on port 8000. Their semantic sources are the verified
structural model/receipt adapters; paint remains owned by the existing native
equation session and carrier compositor. The full fraction reader is supporting
stage-path evidence, not a replacement product target.

## Next bounded repair and preservation

First repair carrier measurement invalidation with deterministic immediate-seek
pressure, then investigate WebKit fraction-rule measurement on the unchanged
canonical path and pressure the authored path. Repair shared measurement or
lifecycle owners, not individual glyph offsets. Do not widen continuity tolerance,
remove browser coverage, change approved timing, or alter semantic contracts to
obtain a pass. A new paint mechanism or subjective redesign requires scoped review.
Rerun the focused cohort, full release gates, and then present G2 evidence.

The stop is the approved s18 condition: required release evidence missing. It is
not another compiler-cost stop or a request to approve a broken visual. Canonical
supply-tax migration has not started; G2 remains required before that cutover work.
The run's remaining slice order is unchanged and owned only by Theseus.

Resume: invoke `$theseus-long-loop` and resume s18 browser-measurement repair;
for a fresh agent, start with `theseus work resume` in the repository and follow
the active contract. Do not infer G2 approval from routine nonvisual preapproval.
