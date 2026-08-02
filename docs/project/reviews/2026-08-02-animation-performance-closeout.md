# Animation Performance Closeout

Date: 2026-08-02  
Status: measured debt closed except for one attributed native-KaTeX residual

## Result

The direct economics catalogue route now boots through
`animation-catalogue-application.ts`, not the legacy full editor application.
It preserves the same canonical asset, player clock, native graph surface,
catalogue navigation, review capture, and compact controls while leaving full
editor diagnostics and gestalt inspection behind an explicit dynamic caller.

The change reduced initial script transfer from **324,087 bytes** at the end of
the layout-reservation slice to **187,003 bytes**: 137,084 fewer bytes, or
42.3%. The route is now 62,997 bytes below the unchanged 250,000-byte product
target. Exact two-run capability attribution also proves that all six sampled
catalogue routes load the catalogue application, none load `src/main.ts`, and
none load the animation-player gestalt capability.

The production-script closure for that exact application + economics pack +
graph/KaTeX surface is **169,321 gzip bytes**, 20,679 bytes below its unchanged
190,000-byte static ceiling. The bundle gate now names this real route closure
instead of subtracting capability chunks from the unrelated legacy editor.

## Representative matrix

| Metric | Before route split | Current result | Existing target | State |
| --- | ---: | ---: | ---: | --- |
| Initial script transfer | 324,087 B | 187,003 B | 250,000 B | pass |
| Constrained LCP | 3,368 ms | 2,188-2,444 ms | 2,500 ms | pass |
| Constrained CLS | <0.0003 | 0.000105 | 0.1 | pass |
| Constrained interaction paint | 35.8 ms | 30.1-37.2 ms | 200 ms | pass |
| Constrained animation-frame p95 | 17.6 ms | 17.6-33.4 ms | 33 ms | one 0.4 ms noisy sample; otherwise pass |
| Constrained loading long task | 106 ms | 104-251 ms | 50 ms | residual |

The browser laboratory uses 6x CPU throttling and emulated constrained
networking. Single-run timing varies, so the table reports the observed range
rather than presenting one favorable sample as deterministic truth. Static
resource closure is exact and reproduced twice.

## Repairs made

- Bootstrap chooses a catalogue-specific application boundary for catalogue
  URLs and retains `src/main.ts` only for explicit legacy/full-editor views.
- The catalogue starts pack and selected-surface capability loading in
  parallel, then hydrates the same canonical player in the reserved stage.
- Full-editor gestalt inspection, elevated-focus experiments, and inspection
  cadence live in a lazy capability. The compact catalogue publishes none of
  that diagnostic work during its frame window.
- The performance probe now records long-task start times and nearby resource
  completions, while keeping the interaction proxy and animation-frame probe
  separate.

## Exact residual

The fixed 50 ms loading-long-task target remains unchanged. Under 6x CPU
throttling, the remaining tasks correlate with two boundaries:

- final catalogue/player shared-chunk evaluation, observed at 58-138 ms; and
- KaTeX module evaluation plus the first native mathematical render, observed
  at 80-251 ms.

The largest task begins as the KaTeX chunk settles and includes the first
native economics-label paint. Closing it requires a separately designed
change such as precompiled KaTeX output, worker-compatible parsing, or a
progressive settlement policy. Each changes the mathematical typography
pipeline or the definition of visual settlement, so it exceeds this slice's
preservation boundary. Native KaTeX, accessible/static truth, and the 50 ms
target are all retained; the residual is not normalized into a wider budget.

## Durable checks

- `npm run perf:animation:attribution`
- `npm run perf:animation`
- `npm run perf:animation:strict` (expected to fail only recorded timing
  residuals, never script, LCP, CLS, interaction, or fidelity gates)
- `npm run test:browser:animation-equation-capability`
- `npm run test:browser:economics-equilibrium` (Chromium, Firefox, WebKit)
- `npm run test:browser:vector-dot-projection`
- `npm run test:browser:animation-catalogue-3d`
- focused capability-boundary and performance-budget tests
- `npm run typecheck`
- `npm run build`
- `npm run check:animation-library-bundle-boundary`

This closes the approved performance slice through the proposal's explicit
"exact attributed residual" path. It does not authorize a KaTeX architecture
rewrite or a weaker performance target.

## Final convergence revalidation

Slice `s30` reran the production build after the programming host and persistent
review-composer lifecycle landed. The economics route measured 187,174 initial
script bytes, the static route closure measured 169,490 gzip bytes, and
constrained LCP, CLS, interaction paint, and frame p95 remained inside their
unchanged targets. The sole reported target miss was the same attributed KaTeX
loading boundary, observed at 102 ms against 50 ms. The small byte differences
from the slice-25 table reflect the final committed caller closure, not a budget
change.
