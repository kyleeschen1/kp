# Compositor extension participation: source-budget checkpoint

Date: 2026-09-10. Outcome: historical STOP_CONDITION, now resolved by user approval.
Accepted amendment and standing authority:
`../decisions/2026-09-10-engineering-budget-repair-autonomy.md`.
The findings below preserve the pre-amendment measurement and recommendation;
their pending-approval wording is historical, not a current stop.
Contract: `run-contract.kp.compositor-extension-occupancy-v2`.
Proposal: `../reviews/2026-09-10-compositor-extension-occupancy-long-loop-proposal.md`.
Theseus owns live slice status; this record owns the cost finding and proposed
authority amendment. No amendment or production behavior change is applied.

## Measured baseline

`npm run check:compositor-extension-cost` reads the existing policy, reports every
counted module and checks all its current ceilings. It introduces no parallel
baseline. The architecture tests separately verify direct dependency membership
and the unchanged actual consumer closure.

| Cohort | Modules / ceiling | Source bytes / ceiling | Headroom |
| --- | --- | --- | --- |
| Core | 4 / 4 | 144,225 / 145,000 | 775 |
| Planner | 16 / 20 | 291,936 / 315,000 | 23,064 |
| Renderer support | 8 / 8 | 78,794 / 80,000 | 1,206 |
| Direct dependencies (overlapping cohort) | 15 / 15 | 171,738 / 295,000 | 123,262 |
| Aggregate (unique core + planner + support) | 28 / 31 | 514,955 / 515,000 | 45 |

Do not add direct-dependency bytes to the aggregate again. Planner headroom is
not aggregate headroom. Moving implementation to another counted partition does
not reduce the aggregate.

Fresh checks pass:

- `npm run test:canonical-equation-renderer`: 29 tests, including actual import
  closure and partition accounting.
- `npm run typecheck`: all stages pass; Svelte has zero errors and warnings.
- `npm run check:inference`: core 113,698 types / 194,449 instantiations;
  combined 172,065 / 286,160. All existing consumers remain included.
- `npm run check:reader-budgets`: all 12 routes pass against the existing build;
  main runtime closure 142,060 gzip bytes against its 145,000-byte baseline.
  This is not a fresh release build or evidence about future implementation.
- `npm run check:compositor-extension-cost`: all current source gates pass.

## Useful consolidation and its limits

The inventory is in `2026-09-10-compositor-extension-owner-inventory.md`.
At production baseline `c54ed5a56`, these are the relevant replacement candidates:

| Existing block | Gross bytes | What must remain |
| --- | --- | --- |
| Factoring binding's `inspectTransit` method | 1,337 | Native fusion-pose law; measured material participation; publication evidence |
| Canonical plan's late supplemental assembly | 350 | Composition of the actual successor and factoring samplers |
| Pure-scene input signature | 1,248 | Semantic, style, font and occupancy invalidation inputs |
| Pure-scene geometry capture | 604 | Actual endpoint and protected-stage geometry checks |

The first two blocks are a genuine consolidation opportunity: final assembly
should replace the separate factoring audit and late callback assembly. Their
1,687 gross bytes are not net savings, because their required responsibilities
move to the coupled seam. The cache blocks are not duplicate dead code; deleting
them would remove existing safety. Extending their evidence to contributions
does not make their complete size available as savings.

The minimal design still needs required contribution/participant types, measured
frame validation, a final sampler shared with inspection, authenticated issuance,
and cache rejection for changed contributors/geometry/fonts/frame identity.
Existing ready-plan WeakSet issuance can be reused, but currently authenticates
only a plan object, not this complete relationship. A required boolean or a
separately supplied audit would leave the demonstrated bypass intact.

I have not established a credible fixed-budget implementation from these
replacement candidates. This is an engineering feasibility assessment, not a
proof that no smaller implementation exists. A new broad refactor of typography,
contact semantics or the motion planner merely to obtain source bytes would
expand the approved finite repair. Minification and uncounted helper extraction
are expressly disallowed. No speculative refactor or oversized implementation
was applied to manufacture a measurement.

## Proposed amendment — awaiting explicit approval

Raise only `maximumProductionAggregateSourceBytes` from **515,000 to 530,000**
(15,000 bytes, approximately 2.9%). Keep every other source partition/module,
runtime, reader, inference, isolation and visual gate unchanged. The allowance
is a bounded implementation envelope, **not a measured final cost** or a claim
that all 15,000 bytes are necessary. Any new participant owner must be included
in the planner and aggregate manifests; imports must match their owning policy.

Continue the same approved slices and useful consolidation. Re-measure the full
boundary after consolidation and migration; publish actual net growth at
closeout. If another unchanged gate is exceeded, repair in scope or stop under
the existing authority rules. Do not spend the allowance on new motifs or a
generalized motion framework.

The user's standing automatic TypeScript cost approval does not cover this
source-policy change. The approved proposal explicitly requires this stop when
a credible fixed-budget path is not established.

## Resume

After explicit approval of the aggregate-only amendment, resume this same
contract at its cost slice, record the accepted decision and apply the exact
policy/test amendment before continuing bypass characterization. Do not restart
the inventory, open a successor run, or request another unchanged-visual review.

Entry command: `theseus plan run` from the repository root. Use the returned
contract and the pending cost checkpoint, not an automatically suggested refill.
No browser review is needed for the current changes: animation code is unchanged.

## Selected consolidation after approval

Use one measured contribution assembly upstream of renderer construction, with
the same actual sampler supplying paint and occupancy. Replace factoring's
separate whole-context audit and successor sampling's nested supplemental
callback; retain the factoring fusion-pose law as an owner-specific invariant.
Do not consolidate typography measurement or change motion-planner routing.
Keep cache input checks and extend them to the issued contribution identity.
The existing renderer-ready issuance boundary will consume authenticated final
assembly rather than accept independent sampler and audit payloads.

This selection is bounded to the two inventoried producers and reuses the
existing protected-transit inspector. New code belongs to the counted planning
boundary; the renderer consumes the issued assembly, not another motif engine.
The 530,000 aggregate limit now leaves 15,045 measured bytes before this work.
Net savings are not claimed until the replacement is implemented and measured.
