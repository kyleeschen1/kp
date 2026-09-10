# Standing approval for recommended engineering-budget repairs

Date: 2026-09-10. Status: accepted, persistent across sessions.

The user accepted the aggregate source-budget recommendation and directed:
"you are free to follow the recommended repair in cases where the issue is
budget, so you do not need to consult me" (spelling normalized).

## Decision

Agents may diagnose and implement recommended engineering-budget repairs within
otherwise approved work without a separate approval checkpoint. This extends
the 2026-09-09 TypeScript policy to source/module accounting, bundle and reader
payloads, runtime/resource limits and tool-output/context budgets. It includes
evidence-backed baseline/cohort corrections and bounded ceiling amendments,
not only optimizations that preserve a previous number.

Prefer useful implementation or ownership-boundary repairs. Where an amendment
is the sensible recommendation, document the measured problem, alternatives,
exact old/new policy, bounded headroom and complete affected consumers. Measure
before/after and verify the applicable checks. An implementation allowance is
an estimate until actual final cost is measured; do not describe raising a
ceiling as a performance improvement.

Do not hide code outside accounting, exclude real consumers, disable checks,
erase semantic/type guarantees, minify readable code to game source size, or
automatically refresh every failing ceiling. Preserve visible behavior and
accessibility. Budget-only issues no longer require human consultation; repair,
record evidence and continue an already approved loop.

This supersedes the budget-only consultation restrictions in older proposals,
contracts and the TypeScript decision. Their measurements remain provenance.
It does not approve new scope, semantic/product changes, new visual treatments,
unsafe actions, external spending/model calls, deployments or unrelated
repository changes. Those boundaries and required visual reviews remain intact.

## First application

The user explicitly approves the recommendation in
`../threads/2026-09-10-compositor-extension-source-budget-checkpoint.md`:
`maximumProductionAggregateSourceBytes` changes from 515,000 to 530,000.
The measured production source remains 514,955 bytes; new headroom is 15,045.
Only the aggregate ceiling changes. Partition/module, reader/runtime, inference
and isolation limits remain unchanged in this application.

The existing compositor run retains its 24-slice scope and order. Its prior
budget-only stop is resolved by this authority amendment, not by claiming the
unimplemented compositor migration complete. Theseus owns the resume state.
