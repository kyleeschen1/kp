# Natural collection layout cost amendment

User-approved natural equation endpoints retain native KaTeX rows alongside the
existing working tokens, with exclusive paint ownership. This is a measured
presentation cost, not an optimization claim. Standing engineering budget repair
authority applies.

Production union grows from 131403 JS / 17367 CSS gzip bytes to 134207 / 17417:
+2804 JS and +50 CSS. It failed the old 131500 JS ceiling. The local adapter
reuses selector-annotated LaTeX and native subtree paint measurement; these
established mechanisms plus trusted annotation validation account for the new
production modules (132 → 138). No new framework, clock or semantic model is
introduced. All closure consumers and forbidden imports remain measured.

| Consumer | Before JS / CSS | After JS / CSS | New JS ceiling |
| --- | ---: | ---: | ---: |
| All-mode union | 131403 / 17367 | 134207 / 17417 | 136000 (was 131500) |
| Guided row addition | 112864 / 15571 | 115673 / 15621 | 117000 (was 115000) |
| Composition | 116682 / 16463 | 119491 / 16513 | 121000 (was 117500) |
| Composition variation | 117525 / 16463 | 120336 / 16513 | 122000 (was 118500) |
| Collection system | 108304 / 15412 | 111109 / 15462 | 112000, unchanged |
| Collection polynomial | 107464 / 15412 | 110272 / 15462 | 112000, unchanged |
| Collection reordered | 108095 / 15412 | 110902 / 15462 | 112000, unchanged |
| Cold default | 94847 / 14686 | 94876 / 14686 | 100000, unchanged |
| Workbench | 107616 / 15523 | 107645 / 15523 | 110000, unchanged |
| Matrix composition | 111045 / 14533 | 111060 / 14533 | 111500, unchanged |

All CSS ceilings and other entry ceilings are unchanged. Small nonconsumer
differences arise from shared emitted chunks. Headroom is bounded: 1793 JS
bytes in the union, 1327 guided, 1509 composition, 1664 variation.

The prior production cost harness measured 297 elements for the representative
collection stage. The rebuilt candidate measures 404, failing the 340-element
cap. Native KaTeX rows and fragment wrappers add 107 elements. Amend only the
collection cap to 450 (46 above the observed representative); retain complete
one/ten identical/different-instance, cache and disposal checks. This bound is
for the stage-only collection harness, not the three-surface composed player.

Rejected alternatives: fixed spacing would fail the requested natural typography;
an equation-wide fade would break correspondence; remounting fragments during
playback would add measurement/lifecycle work and threaten reverse seeking;
duplicating the existing paint measurement would introduce another inconsistent
measurement owner. Native geometry is cached at prepare, font and resize
boundaries; frame sampling performs no geometry reads.

Reproduce with `npm run build:semantic-cost`, `npm run measure:semantic-cost`,
and `npm run visual:semantic-cost -- --grep 'one and ten'`. Browser timing and
heap observations are local measurements, not universal performance guarantees.

The rebuilt harness passed. Representative stages used 404 / 4040 / 3370
elements for one / ten identical / ten varied sources. Mounted times were
26.4 / 123 / 99.8 ms locally, versus 24.7 / 30.1 / 27.3 ms in the pre-change
built harness. These single-run timings are noisy, but the added preparation
work is real; do not claim many simultaneous mounts are free. Sampled p95 frame
intervals were 17.3 / 17.2 / 17.1 ms. After repeated disposal, DOM nodes and
listeners returned to baseline (59 nodes, 29 listeners); no new resources loaded
after warmup. Heap did not return exactly to its starting value, so this is
bounded lifecycle evidence rather than a proof of zero retained allocation.
