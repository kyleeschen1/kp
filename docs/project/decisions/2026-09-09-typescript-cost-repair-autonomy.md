# TypeScript cost-repair autonomy and complete R4A coverage

Status: accepted
Date: 2026-09-09
Authority: “implement rec and resume. also, record new policy: all typescript
cost repairs are automatically approved”

Apply the recommendation from
`../reviews/2026-09-09-authoring-entrypoint-complete-cohort-stop.md`: the complete
six-owner baseline is 139,337 types / 235,826 instantiations. Its fixed combined
ceilings become 142,200 / 243,000 using the existing 2% / 3% headroom formula,
rounded up to hundreds. Original core ceilings remain 112,500 / 195,800. Retain
every original fixture and all six frontend owners under mandatory membership
and negative-type checks. Resume the existing R4A contract at s19, not a new run.

## Persistent approval

All TypeScript cost repairs are automatically approved across sessions, including
measured import/type-boundary refactors and evidence-backed budget or cohort
corrections. No separate user check-in is needed solely for these repairs, even
where an older run contract required another TypeScript cost approval.

Diagnose the source of cost first. Prefer behavior-preserving repairs at the
responsible dependency or type boundary. For a necessary policy correction,
record the complete measured coverage, before/after costs, reason and bounded
headroom; do not describe a raised ceiling as an optimization. Budgets remain
executable fixed gates between deliberate recorded amendments, not self-adjusting
limits. Preserve historical evidence and original core membership.

This is not permission to remove consumers, weaken negative tests, use casts or
type erasure to bypass invariants, disable checking, reduce semantic validation,
or change visual behavior. TypeScript cost alone no longer causes an approval
stop, but safety, semantic/product scope, external authority, destructive actions
and required visual judgment retain their normal boundaries. Unrelated runtime,
reader-payload and Theseus output budgets are not covered.

Record evidence and continue approved work. At completion of that work, do not
invent a successor loop under this repair policy.
