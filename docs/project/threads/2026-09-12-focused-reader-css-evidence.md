# Focused reader CSS partition

Preservation boundary: canonical supply-tax host, all four native cards and
surface-contour renderer. No palette, typography, trajectory or layout redesign.
One slice commit is the rollback unit.

`src/document-base.css` owns the existing document defaults.
`src/rendering/focus-card-runtime.css` owns existing renderer paint/control rules,
including native KaTeX ownership and responsive equation rules. `src/styles.css`
imports both before application chrome. Tax and embedded/standalone surface
entries import these focused owners, so later 3D activation does not restore the
dashboard stylesheet. Values are moved, not independently restated.

An AST comparison against pre-partition commit `9b562fe3e` preserved all 641
selector/declaration/media-context records exactly once. This is content
preservation evidence, not by itself a cascade/visual proof. Scoped Chromium
checks separately pressure native exponent travel, fraction construction,
reverse motion, material-scene visibility and activated desktop/phone layout.

Matched tax production probes (three samples each at 1x and 6x CPU) passed with
no page errors. CSS changed from 153,438 raw / 31,360 gzip bytes immediately
before partition to 101,733 raw / 22,520 gzip: 51,705 raw and 8,840 gzip bytes
removed from this route's requests. Activation adds no CSS. Initial JavaScript
is 509,856 gzip bytes and later activation adds 140,662. The original audit
baseline remains distinct: 153,370 raw / 30,307 gzip CSS before loading splits.

Commands: `npm run build:bundle`,
`npm run visual:architecture-cost -- --tax-only --activation`,
`npm run visual:focus-deck-multi-card` with scoped native-motion and visual
checkpoint filters; full `npm run typecheck`; 52 unit checks across route CSS,
native foreground ordering, focus profiles, rendering and economics stylesheet
ownership/baseline. Existing assertions follow relocated owners; none were
deleted. New route-owner assertions protect early imports and native ownership
without dashboard leakage.

The first build exposed a misplaced CSS import despite exiting successfully;
it was corrected and rebuilt without that warning. This is why build exit alone
is not CSS conformance evidence. A material-scene test also assumed eager
offscreen loading; it now visits the equation before asserting the same native
paint conditions.

Verification-economics follow-up: `verify:impact` has no focused rule for the new
CSS owner and falls back to the full suite. Keep that safe default until the
approved verification-routing slice proves a narrower selection. No stylesheet
deletion or support claim follows from a single unused-CSS coverage sample.
