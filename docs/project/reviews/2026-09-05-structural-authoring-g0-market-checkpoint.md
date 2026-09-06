# G0: economics authoring review ready

Outcome: HUMAN_CHECKPOINT
Contract: `run-contract.kp.structural-authoring-canonical-tax-v2`
Target: `next-action.kp.structural-authoring-canonical-tax`

The exact 28-slice proposal is approved. Slice 1 prepares the existing market
authoring/API/visual review; explicit G0 acceptance is still absent. Machine
verification is complete, but human visual judgment is not recorded as passed.
No structural integration, canonical source cutover, renderer change, merge or
branch deletion occurred.

## Fresh evidence

- `npm run test:authoring-integration`: 68 passed, zero failed (5.918 seconds).
- `npm run visual:authoring-market`: eight Chromium checks passed (58.2 seconds).
  The real source-save test deliberately introduces a syntax error, observes
  retained last-valid preview, and repairs the draft. Its logged parse error is
  expected negative-fixture evidence, not a failing check.
- `npm run typecheck`: passed; Svelte zero errors and zero warnings; domain
  checking passed.
- `npm run check:architecture`: passed, including framework-neutral boundaries,
  equation governance and eight cross-domain conformance checks.
- `npm run check:dependency-direction`: passed.
- Post-browser source diff: the model and Article source files were restored
  exactly. No authored edit remains from the reversible tests.
- `theseus plan run`: valid active-run autonomy gate after metadata correction.

The browser suite exercised original/authoring baseline parity, forward and
reverse SVG equality, exact native labels, endpoint accounting, actual local
edits/errors/repair, the demand-14/tax-2 variation, fixed-playhead restoration,
deep-link reload/resize, disposal, and adapter release. It also regenerated
desktop/phone, reduced-motion and plain static-fact review captures.
This is Chromium evidence, not a supported-browser release matrix. Full suite
and production build were not rerun at this existing-preview review boundary;
they remain mandatory at the proposal's structural and migration release gates.

## Human review

Run `npm run dev` and open `/experiments/authoring-market/`.
Use `2026-09-05-authoring-market-author-review.md` for the exact author sources,
variant selection, query examples and cost accounting. The existing canonical
`/experiments/kinetic-figure/supply-tax/` page still uses its original source.

Review three things:

1. Model inputs and explicit prose fact slots are an acceptable internal
   authoring surface for proceeding to structural pressure.
2. Invalid edits retaining the prior preview, with revision diagnostics, are
   understandable and do not obscure which revision is visible.
3. The reference and variation are readable, and demand as settled history
   while only tax animates is an acceptable bounded specimen.

Agent inspection of the fresh reference phone baseline shows readable endpoint
prose and native labels in the preserved layout. That inspection and automated
checks do not constitute the user's visual/API approval. The named review
captures are reproducible through `npm run visual:authoring-market`; scratch
images are disposable and are not promoted goldens.

## Continuation

G0 acceptance unlocks slice 2, exact structural-reference and preservation
mapping. It does not waive G1 distribution review, G2 two-caller review before
migration, or G3 canonical parity review. The recorded slice-1 disposition is
review-ready, not an accepted visual treatment.

Resume after explicit G0 acceptance:
`theseus work resume next-action.kp.structural-authoring-canonical-tax`.

The long-loop structure remains appropriate for the approved integration and
migration scope, but it is too early to assess its implementation payoff. This
slice protected the existing source/paint separation and established current
review evidence. The old review branch is intentionally retained. The Git
skill's branch helper is not exposed by this repo; resolve clean successor
branch setup before structural implementation without merging the old branch.
