# Canonical fraction shared-host visual matrix

Date: 2026-08-10

Outcome: `MIGRATION_PARITY_CONFIRMED`

The canonical fraction reader now uses the extracted chrome-free canonical
equation session. The migration preserves the canonical stage, semantic
choreography, responsive policy, native endpoint ownership, deterministic
sampling, salience, and compositor lifecycle.

## Complete matrix result

`npm run visual:fraction-composition-canonical` exercised 16 viewport, fold,
and DPR configurations with 81 direct-seek samples each. All ownership,
endpoint, fit, overflow, opacity, review-capture, and runtime assertions passed.
The final unrelated-contact gate remains red for six contact families.

The same command, run against the pre-recovery commit `e123bccb` with the stale
Review launcher selector corrected only in the test harness, produced the
exact same six families, occurrence counts, sample positions, and maximum
overlap dimensions. This proves the clearance debt predates the shared-host
migration:

1. `additive-cancelled.right.10` / `additive-cancelled.right.minus4.minus` —
   18 occurrences, maximum 12.022 by 0.860 CSS pixels.
2. `coefficient-cancelled.right.18` /
   `coefficient-cancelled.right.fraction-rule` — 16 occurrences, maximum
   17.524 by 1 CSS pixel.
3. `constant-product.left.12` /
   `constant-product.left.constant.fraction-rule` — 16 occurrences, maximum
   14.312 by 1 CSS pixel.
4. `denominator-cancelled.right.3` /
   `denominator-cancelled.right.operator.1` — 12 occurrences, maximum 1.337
   by 1.542 CSS pixels.
5. `constant-product.left.constant.denominator` /
   `constant-product.left.constant.fraction-rule` — 8 occurrences, maximum
   9.610 by 0.999 CSS pixels.
6. `fraction-normalization.target.6.factor` /
   `fraction-normalization.target.6.numerator.operator.1` — 8 occurrences,
   maximum 1.093 by 1.409 CSS pixels.

This comparison does not whitelist the contacts or turn the red gate green.
It bounds them as pre-existing debt outside the article-host migration. The
gate must continue to require zero unrelated contacts when clearance repair is
scheduled.

## Lifecycle regression found and repaired

The narrower motif-fidelity run exposed one migration-only lifecycle defect:
a ResizeObserver refresh during navigation teardown invalidated the extracted
session after its stage had left paint. The session then measured a transient
645 by 190 viewport and raised a false readability-floor failure.

The shared session now defers invalidation and reuses its last certified layout
while the stage has no client rectangles. The next visible sample consumes the
pending invalidation, advances the layout revision, and remeasures normally.
This preserves fail-closed certification for visible stages while matching the
legacy reader's teardown boundary.

## Verification

- `npm run visual:fraction-composition-motif-fidelity` — Chromium and Firefox
  pass actual wide/phone cancellation paint, direct-seek/rewind fidelity,
  review navigation, and the new no-page-error assertion.
- `node --disable-warning=ExperimentalWarning --test
  tests/chrome-free-canonical-equation-session.test.ts` — the bounded session
  lifecycle and hidden-stage invalidation guard pass.
- `npm run visual:fraction-composition-canonical` — all matrix assertions pass
  until the unchanged six-family pre-existing clearance gate described above.

The canonical Article embedding work may proceed. Clearance repair remains a
separate, explicitly visible debt and is not part of this recovery contract.
