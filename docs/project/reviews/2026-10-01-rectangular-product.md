# Rectangular product: first-cell review

Status: HUMAN_CHECKPOINT; the rectangular slice remains in progress.
Contract: `run-contract.kp.matrix-authoring-v1`.

Canonical page: http://localhost:8000/experiments/rectangular-product/.
Shared menu: http://localhost:8000/experiments/matrix-examples/ →
Rectangular product · first cell. The existing three-term dot page remains the
choreography reference. Native KaTeX supplies paint and `matrix-product.ts`
retains the mathematical operands, pair products and destination result.

The candidate shows A (2×3), B (3×2) and a 2×2 result above the existing passage.
Row 1 and column 1 are selected; the working vector occurrences retain their
source IDs. The unchanged dot passage computes −3, then a sixth beat moves its
sum directly into the top-left result. One owner paints the sum during travel;
the target-native occurrence takes over only at the endpoint. Seeking, reverse,
resize, larger text and reduced-motion milestones are checked. Complete static
matrices and the calculation remain in the accessible disclosure.

Use Play or the milestone menu. Judge whether the upper context and lower
calculation feel connected, and whether the final result's destination is clear.
The source row/column already have working representations below; this is not
yet an animated extraction from the full matrices. Only the first cell is wired
into this review host. All-cell selection and source-only variation follow
acceptance, as approved; do not claim them delivered from the underlying model.

The requested presentation controls remain: 20px math by default (20–32px),
matched row/column center spacing, 6px lift (0–24px), full-size background at 40%
opacity, and no shadows. Light mode uses explicit warm beige #f7f3e8
through the existing shared configuration, with dark focus ink and normal
KaTeX smoothing (the thinner treatment remains dark-only); both player and
menu expose the toggle. Theme changes preserve the held geometry/playhead.

The rollback unit is the rectangular host/context integration; the accepted
standalone arithmetic and presentation controls are preserved. The local context
renderer is loaded only for the rectangular caller. No universal scene API,
arbitrary matrix renderer, new semantic arithmetic or knowledge-graph payload
was introduced. Reuse required a bounded context slot and sixth beat in the
existing player; it was not purely a source-only addition.

Verification commands: `npm run test:rectangular-product`,
`npm run visual:rectangular-product`, `npm run visual:dot-passage`,
`npm run typecheck`, `npm run build:matrix-interpretations`,
`npm run measure:semantic-cost`.
The first rectangular browser run caught a malformed test slider value; it was
corrected and the full scoped suite rerun. The first light-mode regression used
viewport coordinates affected by screenshot-driven scrolling; its invariant now
compares stage-relative geometry, and the complete dot suite passes.

The rectangular consumer is included in the cost gate with its dynamically
activated context, using the existing dot ceiling (100,000 B JS gzip estimate,
16,000 B CSS). No existing ceiling was raised. This is a delivery-size check,
not a ten-instance runtime certification of the new layout. Visual acceptance
is still required before the remaining integration work.

Final build estimates: rectangular page plus its activated context is 94,669 B
JS gzip and 14,896 B CSS gzip; the standalone dot page is 93,505 B and 14,536 B.
Fonts are separate. Eight unit tests, ten standalone browser tests, two
rectangular browser tests, full typecheck, the scoped production build and
delivery-budget checks pass.
