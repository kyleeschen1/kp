# Compositor extension participation: source-budget checkpoint

Date: 2026-09-10. Outcome: historical STOP_CONDITION, now resolved by user approval.
Accepted amendment and standing authority:
`../decisions/2026-09-10-engineering-budget-repair-autonomy.md`.
The findings below preserve the pre-amendment measurement and recommendation;
their pending-approval wording is historical, not a current stop.
Contract: `run-contract.kp.compositor-extension-occupancy-v2`.
Proposal: `../reviews/2026-09-10-compositor-extension-occupancy-long-loop-proposal.md`.
Theseus owns live slice status; this record owns the cost findings and explicit
amendments. At the initial checkpoint no amendment or production change had
been applied; later sections record the implemented repairs and allowances.

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

## Authentication boundary allowance (s10)

Under the accepted [engineering-budget repair authority](../decisions/2026-09-10-engineering-budget-repair-autonomy.md),
raise the core source ceiling from 145,000 to 150,000 bytes. Exact assembly
authentication adds required checks at both plan issuance and the raw renderer
entrypoint; measured core was 145,104 bytes, 104 over the previous ceiling.
The obsolete callback combiner was already removed in s09. Moving these calls
elsewhere would not remove their responsibility, and a broad core refactor is
not justified to avoid two guard calls. This is explicit bounded headroom, not
a claim that 5,000 bytes are necessary. Aggregate remains 530,000, planner
315,000, support 80,000, and every module/dependency/runtime gate is unchanged.
Final accounting must report actual growth, including the assembly module.

## Whole-scene measurement allowance (s11)

The shared measurement capture now protects an assembly even when it has no
extensions; contribution-only validation left that case unbound. Reusing the
same capture removed duplicated measurement logic. Actual aggregate is 530,266
bytes (781 above s10), exceeding 530,000 by 266. Under the same standing authority,
raise aggregate to 535,000; all other gates stay unchanged. This is bounded
headroom for the approved authentication/invalidation work, not a new feature
allowance. Neither an unrelated refactor nor hiding this small shared guard
outside the counted closure is warranted. Publish final actual costs.

## Optical owner integration and complete accounting (s14)

The final optical evaluation owner identified in s07 now participates in the
counted closure. At baseline `2ecc4b0b6`, its wrapper was 18,358 bytes and its
ink-knot geometry helper 1,911 bytes, both outside the prior manifests. Count
those existing 20,269 bytes as well as the extracted pure optical sampler;
do not describe the resulting measurement increase as all newly written code.
After extraction and integration, the measured aggregate is 561,878 bytes:
30,709 above s12, comprising 20,269 newly accounted existing bytes and 10,440
net implementation growth across the expanded comparison boundary.

The useful consolidation is executed: DOM and inspected contribution callers
share one optical calculation. Endpoint dwell is also one shared function;
native successor ink is measured once per plan, not per inspection sample.
The wrapper remains counted while its other existing callers migrate; deleting
it prematurely would discard their accepted behavior.

Under standing engineering-budget authority, amend planner bytes to 330,000,
support to 9 modules / 100,000 bytes, and aggregate to 34 modules / 575,000 bytes.
Measured values at this checkpoint are planner 321,510 (20 modules), support
94,970 (9), aggregate 561,878 (33), core 145,398 and direct dependencies 173,740.
Core and direct-dependency ceilings, runtime/inference/browser/payload gates
stay unchanged. This is a bounded implementation/accounting amendment for the
approved second mechanism, not authority for new motifs. Final cost reporting
must distinguish accounting expansion from actual source growth.
# Complete inference coverage and bounded type allowance (s23)

The release membership gate caught the new negative contribution fixture as
unassigned. It was already included by the inference tsconfig glob; the explicit
cohort ledger now assigns it to core and therefore combined coverage. No consumer
was removed or excluded. Core membership metadata advances from 48 to 49.

Measured complete `npm run check:inference`: core 114,668 types / 196,324
instantiations passes the unchanged 115,000 / 198,900 limits; combined 173,243 /
288,463 exceeds only the 172,800 type limit, by 443. The last M1b release reported
113,698 / 194,449 core and 172,065 / 286,160 combined; the new required seam and
fixture increase those counts by 970 / 1,875 and 1,178 / 2,303 respectively.
This comparison measures the complete change, not attribution to one symbol.

Under standing budget-repair authority, amend **only combined types** from
172,800 to 176,800 (approximately 2% above the measured 173,243). Keep combined
instantiations at 289,700 and every core ceiling unchanged. Record current
combined measurements explicitly rather than presenting this as optimization.
Shared optical/dwell consolidation and callback retirement are already done;
no further useful duplication repair was established for this modest increase.
Excluding the new negative fixture, erasing issued-frame types, or broad
unrelated compiler refactoring would undermine the proof or exceed this repair.
Exact membership, negative tests and fixed-budget assertions remain executable.
# Final source and reader measurements

`npm run check:compositor-extension-cost` after migration: core 144,979 / 150,000
bytes (4 modules), planner 322,467 / 330,000 (20), support 94,970 / 100,000 (9),
direct dependencies 174,396 / 295,000 (15), aggregate 562,416 / 575,000 (33 of
34 allowed modules). All gates pass; direct dependencies overlap the other
cohorts and must not be added again.

The aggregate is 47,461 bytes above the initial 514,955. Of that, 20,269 bytes
are previously existing optical-owner/helper code newly included in accounting;
the remaining 27,192 is net source growth over that expanded baseline. This
work strengthens integration and removes bypasses; it is not a source-size
optimization. The final rebuilt shared reader closure is 142,144 gzip bytes,
84 above the previous 142,060 and below the unchanged 145,000 limit. All twelve
reader route budgets pass, with unchanged HTML and growth policies.
