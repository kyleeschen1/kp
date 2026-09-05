# Authoring Integration — Source Authority Stop

Date: 2026-09-05
Outcome: STOP_CONDITION — unresolved semantic authority
Disposition: historical stop; user approved the bounded amendment and resuming
s13–s28 with "approve" on 2026-09-05. Approval resolves the decision gate, not
the implementation or verification obligations below.
Run: `run-contract.kp.authoring-integration-market-preview-v1`
Scope: s13 source-authority lowering; s01–s12 complete, s13 incomplete.
The [approved proposal](2026-09-05-authoring-integration-market-preview-long-loop-proposal.md)
still owns scope; Theseus owns live execution and resume state.

## What is now established

The authoring-first direction is recorded and implemented through internal
model/explanation assembly, explicit query/cache lifetime, repair diagnostics,
and aggregate-pinned typed math. The market specimen retains exact baseline
behavior with 59.6% less charged orchestration. Static and existential matrix
shapes remain honest. Shared costs and unchanged inference ceilings are recorded
in [the assembly evidence](2026-09-05-authoring-assembly-evidence.md).

The next step exposed an assumption in the proposal: the existing market asset
does not yet carry the operation-pack and lifecycle authority required by the
governed construction entrance. Numeric economics correctness is intact; it is
not sufficient evidence for a different semantic lineage contract.

## Executed evidence

Run `node --disable-warning=ExperimentalWarning --test tests/authoring-integration-lowering-gap.test.ts`,
or the containing `npm run test:authoring-integration` suite.

- The real canonical asset from `src/animation/economics-supply-tax-asset.ts`
  reaches the existing governed validator and reports missing exact operation
  pack pins and missing rich correspondence. Its market-clearing and tax-wedge
  checks remain true.
- No populated canonical operation registry entry matches the asset's operation
  ID, `definition.economics.per-unit-tax`, or `imposePerUnitTax` transform type.
  Pinning an unrelated algebra/core pack would not supply economics authority.
- The existing legacy correspondence normalizer is an available alternative,
  but its output fails seven complete-lifecycle checks: unrepresented source
  and target tax selectors, duplicate source-price ownership, and unrepresented
  taxed supply, wedge, government revenue, and deadweight-loss targets.
- More fundamentally, role-preserving legacy pairs normalize to `identity`,
  including the changing tax and the untaxed price's two successors. This is
  not the same claim as immutable identity/value preservation. Existing domain
  correspondence already calls the price relation a split; the adapter must
  preserve that meaning rather than force it through equality-like relations.

These tests characterize missing support, not a successfully shipped lowering.
The canonical asset, renderer, compiler, and registry are unchanged. No alternate
host, animation, browser code evaluation, or public facade has been introduced.

## Accepted bounded amendment — approved 2026-09-05

Resolve the domain contract before resuming source-to-preview integration:

1. Define and register a narrowly scoped economics per-unit-tax operation
   contract and exact version pin, tied to the existing domain validators,
   assumptions, and laws. Do not select a generic update or unrelated equation
   operation as its semantic authority.
2. Specify explicit immutable before/after state and lifecycle references for
   tax, equilibrium, incidence, and welfare. Distinguish a persistent economic
   role from equal values, and a price split from duplicate identity claims.
   Reuse existing correspondence forms where they express the domain honestly;
   return a typed gap for any unrepresentable relation. Do not invent a universal
   relation or expand the renderer to force a fit.
3. Verify total source/target coverage, exact economics, pinned revision/pack
   matching, and rejection of forged generic updates before feeding the existing
   governed compiler. Keep this source authority separate from paint.
4. Resume the existing s13–s28 order only after that contract is accepted. Keep
   the canonical route, reader clock, SVG/KaTeX owners, Article semantics, fixed
   budgets, and mandatory human exemplar checkpoint unchanged.

This prerequisite is now approved within s13 of the existing run, not a queue
refill or second run plan. No new operation registration or lifecycle
interpretation was implemented under the original adapter-only assumption;
the resumed slice owns that work. The original stop evidence remains intact.

## Verification and handoff

- Full suite at the preceding broad boundary: 6,512 tests passed. That is not a
  claim of a new full release gate after this stop.
- Current authoring suite: 37 passed, including three explicit gap probes.
- Existing supply-tax suite: 81 passed; full typecheck reports no errors or
  Svelte warnings. Fixed inference gate passed at 111,257 types / 192,271
  instantiations, with ceilings unchanged at 112,500 / 195,800.
- Exact reachability regeneration adds six legitimately scanned math/test
  files (4,223 to 4,229) and the diagnostic test as four test-call edges; all
  68 roots and production caller edges remain unchanged. No ceiling was raised.
- Successful implementation commits span `6a7085755` through `f744b98b1` on
  `feature/20260905-authoring-integration-market-preview`; the stop evidence is
  a separate rollback unit. Nothing was merged into the default branch.

The long loop was useful for the independently testable foundation and made the
authoring cost concrete. Its adapter assumption was too optimistic at the
domain/compiler boundary. Stopping protects the main architectural promise:
authoring convenience cannot manufacture mathematical or animation authority.

For a fresh agent, run `theseus work resume` from the repository root. Resolve
the recorded contract decision first; that command does not itself authorize
new operation registration or clear the stop. Sixteen approved slices remain
incomplete, including s13; the next implementation action depends on approval
of the bounded prerequisite above.
