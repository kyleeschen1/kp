# Semantic reuse and delivery cost: measured result

The approved [bounded experiment](2026-10-01-semantic-cost-next-step.md) supports
keeping the existing mathematical product and its shared contribution identities.
For these small examples, rendering costs far more than constructing mathematical
inputs. It does not establish that a universal knowledge graph would be cheap,
or that arbitrary dimensions are supported by the current presentations.

## Delivered authoring boundary

`matrixEnvironmentFromProduct(product)` and
`columnExampleFromProduct(product, column)` accept the same immutable product.
Both retain its actual operand entries, scalar contributions and result objects.
Ten signed/zero/two-digit numerical variations and both result columns pass
identity and value checks without renderer edits. Result narration now derives
from the input instead of retaining the original example's answers.

The boundary deliberately supports finite numerical 2×2 factors. Unsupported
dimensions, unresolved parameters and invalid column selections return the existing
typed `MatrixColumnGap`; no generic fallback choreography was added. Existing
stacked/side layouts, density controls and reflow at a held pose pass their browser
preservation checks. No new layout or animation treatment is promoted here.

## Production delivery

Bytes below are Node gzip estimates of complete emitted JS/CSS dependency
closures, not network transfer claims. The ordinary build excludes the research
graph, editor, Three.js and diagnostic host, checked through its module inventory.

| Reader | JS gzip before | JS gzip after | CSS gzip after |
| --- | ---: | ---: | ---: |
| Dot passage | 91,031 | 91,031 | 14,461 |
| Row–column product | 100,520 | 100,608 | 14,082 |
| Column combinations | 100,319 | 100,336 | 14,357 |
| Menu plus default child, unique assets | — | 100,987 | 28,439 |

The menu's own 1,027-byte script is not its complete cost: its child and both CSS
files count. This exposes duplicated CSS across documents rather than hiding it.
The existing gallery keeps one live iframe while switching all five examples.
Required fonts are recorded separately from the actual browser requests; emitted
font files are not all fetched. Cold/warm requests use a loopback gzip/cache fixture,
not production deployment. Warm JS/CSS/font transfers were zero in this sample.

## Instance cost

Chromium samples on the local machine, ten different numerical inputs:

| Presentation | Prepare inputs | Mount ten views | Mounted elements | New assets after warm-up |
| --- | ---: | ---: | ---: | ---: |
| Dot passage, full player | 0.5 ms | 292 ms | 4,334 | 0 |
| Row–column, stage and clock | 0.5 ms | 374 ms | 4,162 | 0 |
| Column combinations, stage and clock | 0.7 ms | 290 ms | 5,269 | 0 |

One instance mounted in 30–35 ms. Ten copies of the same product also required
roughly ten sets of rendered elements; sharing mathematics does not share DOM.
The records distinguish loaded-but-inactive inputs, mounted views, playback and
disposal. Mount time includes two animation frames, so it is not pure CPU time.
Row/column stage measurements exclude their standalone controls and prose.

Sampled frame intervals had a p95 around 17–18 ms. All ten clocks ran, including
offscreen instances; this is not evidence for ten fully visible, continuously
painted animations on all hardware. Timing remains diagnostic, not a flaky CI gate.

Forced-GC DOM/listener counts returned to their warmed baselines after repeated
mount/play/dispose cycles. Retained JS heap increased roughly 0.36–0.69 MB across
the cohort, including warmed code and caches. Rows/columns retained stable baseline
node counts of 481/651; this experiment does not explain every retained node or
prove absence of leaks. It detects growth across repeated cycles, not total
browser process memory. Disposable host elements were removed each time.

## Repair and guards

Reversal testing found stale transforms on hidden row–column paint occurrences
after visiting another column. The presentation now resets hidden transforms
before deriving each frame. Full source-bound style equality is checked across
forward, reverse and direct seeking, alongside existing visible milestone tests.
Unsupported numeric projection is guarded at the adapter boundary; identity and
arithmetic remain owned by the existing semantic constructors.

`scripts/semantic-cost-budgets.json` establishes measured JS/CSS ceilings with
roughly 9–15% headroom, a complete menu-plus-child ceiling, forbidden dependency
checks, per-instance element ceilings, and zero new assets after warm-up.
Browser lifecycle checks bound node/listener growth. These are initial explicit
budgets, not automatic baseline refreshes. Fonts and heap remain separately
reported; the byte gates do not pretend to cover every browser resource.

The semantic constructor eagerly creates m×n×p contributions. Local Node medians
were 0.07 ms for 2×2, 2.12 ms for 10×10, and 14.39 ms for 20×20. These samples do
not justify lazy construction for current small callers; larger consumers need
their own limits and measurements. No lazy model or serialization framework was added.

The actual pages construct objects locally. An illustrative naive JSON encoding
of a small product occupied 102,179 raw bytes versus 68 for numeric inputs, but
neither is sent by these pages. Shared in-memory identity does not imply efficient
JSON transport. A future export boundary should select objects and encode IDs.

## Verification and next decision

- `npm run build:semantic-cost` and `npm run measure:semantic-cost`.
- `npm run test:semantic-cost`: 19 tests.
- `npm run visual:semantic-cost`: production cold/warm and three instance cohorts.
- `npm run visual:matrix-column`: two preservation tests.
- `npm run visual:matrix-interpretations`: eight tests, including existing layouts.
- `npm run typecheck`: repository TypeScript, Svelte and domain checks.

The [baseline and final records](semantic-cost/) preserve measured observations;
reruns write disposable output under `tmp/codex/semantic-cost`.

Next recommendation: one basis-aware composition example that pressures whether
the current product can retain domain, codomain and basis context through a change
of representation. Propose that scope separately. Keep the existing rectangular
authoring visual checkpoint unchanged. Do not expand the textbook graph or design
universal runtime objects until a concrete caller demonstrates the missing boundary.
