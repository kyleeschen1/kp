# Rectangular product: first-cell review

Status: first-cell layout accepted by the user's “This looks great!” on October 2.
The [pouring successor](2026-10-02-matrix-pouring.md) is now the visual checkpoint;
historical pending-review language below describes the earlier gate.
Contract: `run-contract.kp.matrix-authoring-v1`.

Resumed after convergence and signed-fraction repair: the user approved the
inspectable-authoring direction. The existing first-cell checkpoint remains
the prerequisite; no all-cell or inspector rollout occurred. The shared server
returned HTTP 200 and `npm run visual:rectangular-product` passed both Chromium
checks again. Current captures show substantial separation between source
matrices and working terms; whether this preserves a clear explanatory connection
is the concrete visual question. No layout change was made during revalidation.

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

The requested presentation controls remain: 20px math by default in dark mode
(20–32px); light mode restores the original responsive math size (roughly
19–21px), with an independent 16–32px override. Other controls retain
matched row/column center spacing, 6px lift (0–24px), full-size background at 40%
opacity, and no shadows. Light mode uses the historical cream page (#fffdf8)
and beige panel (94% cream, 6% #806548)
through the existing shared configuration, with dark focus ink and normal
KaTeX smoothing (the thinner treatment remains dark-only); both player and
menu expose the toggle. Theme changes preserve the playhead, remeasure geometry
for that theme's size, and restore its previous size selection when returning.

Subsequent light-only typography tuning uses a small current-color glyph stroke
for tokens and operators, stronger parentheses, and vector borders with a 2px
minimum. Vector column gaps shrink from .5em to .4em; the existing measured
column projection keeps vertical center spacing equal to horizontal spacing.
The Three-term dot product remains the visual reference. These local CSS rules
are the rollback unit; dark paint, semantic identity and choreography are
preserved. Browser checks compare native/moving stroke, theme restoration,
matched axis spacing and unchanged dark paint. This remains exemplar tuning,
not a catalogue-wide KaTeX policy.

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

Subsequent startup correction: the menu opens the Three-term dot product in
light mode; reset returns to light and child theme toggles synchronize the outer
menu. Default-reader accounting now measures menu plus dot, not menu plus column
combinations: 94,262 B JS and 28,553 B CSS gzip estimates. CSS includes both
documents' emitted stylesheets; this changes the entry cohort, not a cost ceiling.
