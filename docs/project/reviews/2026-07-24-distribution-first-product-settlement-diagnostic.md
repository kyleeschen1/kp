# Distribution first-product settlement diagnostic

Date: 2026-07-24

Status: active presentation defect; diagnosed; implementation not yet
authorized

Reported behavior: in the distribution animation, the first copied factor
appears to land too far from its first term and then corrects late with a
visible jerk.

## Scope and canonical reference

The canonical product behavior is the lesson choreography at
`/reader/distribution-area/`: the copied factor and its persistent addend
should settle as one readable product without changing their relative spacing
late in the motion.

The defect is in the card/Workbench equation projection for
`animation.generated.distribution.expand-a-sum`, not in the lesson's measured
KaTeX endpoints. The Workbench correctly identifies the lesson as canonical,
but its live preview still renders through the generic equation surface and
reconstructs the distribution timing there.

Preservation boundary for a future fix:

- keep semantic distribution, factor-copy lineage, exact seek, rewind, and
  native KaTeX endpoint ownership unchanged;
- do not alter the lesson's accepted algebra-and-area choreography;
- limit the rollback unit to distribution product-cluster timing and its
  focused tests.

## Diagnosis

The first factor and first term are members of one target product, but the card
renderer does not move them as one timed cluster:

- `sampleKpDistributionChoreography` drives the persistent addend with
  `addendReflowProgress`, which reaches `1` at global progress `0.78`;
- the leading copied factor uses `factorLeaderProgress`, derived from the
  lesson motion profile over global progress `0..1`;
- `sampleDistributionRelation` applies the addend clock to the term relation
  and the leader clock to the factor split relation.

Consequently, after progress `0.78` the first term is already at its target
anchor while the factor still has roughly 12% of its source-to-target travel
remaining. The factor only reaches the exact target at progress `1`, when
native target ownership also becomes visible. The positions are individually
continuous, but their relative gap is not semantically stable; the late
closure is perceived as a corrective jerk.

This is not:

- a missing or stale KaTeX measurement;
- a literal position discontinuity in the lesson motion plan;
- a final native-KaTeX handoff error;
- evidence that only the leftmost term can ever fail.

The concrete exemplar exposes the defect on the first product because the
leader copy and persistent addend use different schedules there. The
underlying omission is general to any persistent multi-token product whose
members are reconstructed by independent relation clocks. The second product
in this exemplar is not a clean comparison because it is intentionally
evaluated or collapsed rather than preserved as a stable product.

## Why existing checks passed

Current checks establish semantic topology, endpoint ownership, factor-copy
indices, phase state, reverse sampling, and continuity of individual tokens.
They also check the former-transfer seam around progress `0.36`. They do not
assert:

- the factor-to-term gap immediately before endpoint transfer;
- preservation of relative product geometry across the settle interval;
- the visual delta between progress just below `1` and the native target at
  `1`.

This permits every token to have a valid start, valid end, and continuous path
while the product still reads as temporarily broken.

## Recommended fix direction

Treat the first factor and its addend as a persistent target product cluster
for settlement. The factor may keep its independent fan-out arc during the
branch, but both members should share one convergence clock once product
settlement begins. A focused browser regression should measure the
factor-to-term edge gap, not only token centers, through the settle interval
and across the final native-owner handoff in both directions.

Do not solve this with a one-off pixel offset. The anchors are correct; the
defect is the mismatch between clocks and ownership boundaries.
