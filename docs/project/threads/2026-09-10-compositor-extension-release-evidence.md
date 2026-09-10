# Compositor extension release evidence

Date: 2026-09-10. Contract: `run-contract.kp.compositor-extension-occupancy-v2`.

## Executed final gates

- `npm test`: **6,959 passed**, zero failures, cancellations or skips;
  665,398 ms. This is a complete green run after the repairs below, including
  architecture, complete inference, catalogue and promotion-memory pre-gates.
- `npm run build`: full app/node/test/Svelte/domain types, publication freshness
  and production bundle pass. The existing over-500-kB chunk advisory remains;
  no warning threshold was changed.
- `npm run check:reader-budgets` and `npm run check:reader-production`: all twelve
  routes pass. Shared equation-reader runtime is 142,144 gzip bytes against
  145,000; existing HTML baselines and 5% policy are unchanged.
- `npm run check:dev-review-production`: 461 files / twelve forbidden markers
  pass. `npm run check:native-katex-compositor-conformance-production`: nine
  forbidden markers pass. Both were rerun against the final build.
- `npm run check:compositor-extension-cost`: complete aggregate 562,416 / 575,000
  bytes, 33 / 34 modules; every partition and direct-dependency gate passes.
- Complete inference: core 114,668 types / 196,324 instantiations; combined
  173,243 / 288,463. All 49 core fixtures and both frontend fixtures remain.
- `npm run check:composed-algebra-workflow`: both source/edit/repair/export
  workflows pass through canonical owners. This is scripted fixture evidence,
  not an independent author or live LLM trial.
- `npm run check:equation-reachability`: generated inventory current, 68 roots.
- `git diff --check` passes. Theseus validation is recorded with the slice.

The s22 supported-browser result is retained: **63 composed-algebra + 24
common-factor checks**, Chromium/Firefox/WebKit, on the shared port-8000 server.
Release repairs below affect inventories/cost policy, not browser production
behavior; no redundant visual approval or motif change was introduced.

## Immutable edition reproduction

All four commands pass, preserving existing content-addressed editions:

```
npm run author:composed-algebra-publication -- --source src/authoring/examples/composed-algebra-primary.json --check
npm run author:composed-algebra-publication -- --source src/authoring/examples/composed-algebra-product.json --check
npm run author:common-factor-publication -- --source src/authoring/examples/common-factor-primary.json --check
npm run author:common-factor-publication -- --source src/authoring/examples/common-factor-numeric.json --check
```

They are static readings/self-checks, not animated exported editions or a deploy.

## Diagnosed release repairs

The first full attempt stopped before test execution because the authority
ledger still located endpoint dwell in the compositor and omitted the two
extracted shared sampler paths. Update only those exact source owners and
regenerate the authority graph; the prohibition on novel unregistered paths
remains. Six authority tests pass. One focused run raced the generator and
read the old JSON; its ordered rerun passes, and the final full suite verifies
freshness independently.

The next attempt found an unassigned negative contribution fixture. Assign it
to core and combined membership rather than excluding it. Complete measurement
then exceeded only combined types by 443. The standing-approved, recorded
amendment raises that ceiling 172,800 → 176,800; core and combined-instantiation
limits are unchanged. Exact membership and budget assertions remain. See
`2026-09-10-compositor-extension-source-budget-checkpoint.md` for measurements,
alternatives and the distinction between accounting expansion and new code.

The exact reachability generator also updates its scanned-file count from
4,572 to 4,579; production root membership remains 68. No generated file was
hand-edited and no freshness check was weakened.

## Limits

These gates establish the exercised semantic, ownership, native-paint,
lifecycle and publication facts. They do not establish new math coverage,
learning outcomes, universal compositor certification or continuous-time
clearance. See `2026-09-10-compositor-extension-assurance.md` and the implemented
extension guide for the exact in-scope producer boundary and explicit gaps.
