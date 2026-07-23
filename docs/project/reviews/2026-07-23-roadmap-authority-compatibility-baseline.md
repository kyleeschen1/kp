# Roadmap Authority and Compatibility Baseline

Status: verified

Date: 2026-07-23

Run contract: `run-contract.kp.authoritative-roadmap-workbench-v1`

Slice: `s01`

## Authority baseline

- `plan-revision.kp.v5` is the sole node with domain `kp`, node status
  `active`, and approval status `approved`.
- Revisions v1 through v4 remain historical predecessors; none is an
  alternative active authority.
- The successor roadmap must be activated through the typed plan-revision
  transaction. Markdown roadmap and decision files remain narrative sources,
  not executable state.
- The legacy `canonical-plan --domain kp` compatibility report returns
  `missing` because it searches for the retired canonical-plan decision shape.
  That result is a compatibility baseline, not permission to infer authority
  from titles or introduce a parallel canonical-plan store.

## Package compatibility baseline

The existing v1 plan-revision and run-contract behavior is protected by these
passing package tests:

- plan revision activation and atomic rollback;
- plan revision change approval and digest binding;
- plan revision reporting and conflict detection;
- run-contract progress reporting;
- run-slice mutation;
- canonical-plan read-only reporting and linkage compatibility.

Focused command:

`npm test -- src/plan-revision-activation.test.ts src/plan-revision-change.test.ts src/plan-revision-report.test.ts src/run-contract-report.test.ts src/mutation-run-contract-slices.test.ts src/canonical-plan-report.test.ts src/canonical-plan-linkage-report.test.ts`

Observed result: 7 test files passed, 25 tests passed.

`npm run typecheck`

Observed result: passed.

## Preservation and rollback boundary

- Schema evolution must load all existing `theseus.plan-revision.v1` nodes
  without rewriting graph or event history.
- New roadmap fields must be generic plan metadata and must survive every
  projection; KP-specific curriculum rules stay in KP.
- Run-slice linkage must use an explicit phase identifier. Existing slices
  without linkage remain valid.
- The smallest rollback unit for package work is one verified Theseus slice
  committed in the Theseus repository.
- The smallest rollback unit for KP adoption is one verified KP slice committed
  in the KP repository.
