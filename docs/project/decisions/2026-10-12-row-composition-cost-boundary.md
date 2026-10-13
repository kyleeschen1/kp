# Row composition delivery boundary

Standing budget-repair authority applies. This is an explicit feature-cost
amendment following measurement, not a claim of optimization.

The accepted linked-row revision `bb33a4267` measured 126214 JS / 17153 CSS gzip
bytes for the full rectangular union. The composition candidate measures 129547 /
17367 and fails the 128000 JS ceiling; CSS remains within 17600. The emitted
inventory adds three local composition modules. The existing row renderer now
accepts explicit layout positions, and the shared host gains one lazy mode.
No new dependency, solver, clock or unrelated schema enters the runtime.

| Complete consumer | Before JS / CSS gzip | After JS / CSS gzip | Ceiling JS / CSS gzip |
| --- | ---: | ---: | ---: |
| Rectangular all-mode union | 126214 / 17153 | 129547 / 17367 | **131500** / 17600 |
| Cold rectangular default | 94806 / 14686 | 94832 / 14686 | 100000 / 16000, unchanged |
| Workbench | 106545 / 15523 | 107397 / 15523 | 110000 / 16000, unchanged |
| Guided addition | 112430 / 15571 | 112700 / 15571 | 115000 / 16000, unchanged |
| Collection system | 107867 / 15412 | 108139 / 15412 | 112000 / 16000, unchanged |
| Composed explanation | none | 115680 / 16463 | **117500 / 17000**, new |
| Matrix composition | 111045 / 14533 | 111045 / 14533 | 111500 / 16000, unchanged |

All-mode JS grows 3333 bytes; CSS grows 214. The union-only JS amendment adds
3500 bytes of allowance and retains 1953 bytes headroom. The new composed mode
gets a complete activation gate, including both original renderers and their
dependencies, with 1820 JS / 537 CSS headroom. It does not replace or omit any
old consumer. All other ceilings and forbidden import checks remain unchanged.

The workbench's 852-byte increase includes the explicit layout input and the
emitted shared-chunk boundary; the composed caller does not import its session,
authored-example registry or linked-panel host. The small host route change and
chunk identities account for the cold/guided differences. Shared row-model code
includes equation projection and cross-view attention already used by the actual
workbench consumer; no semantic owner is duplicated to improve accounting.

Runtime tradeoff: three native surfaces are prepared for exact endpoint handoff,
with one paint owner and one shared clock. This retains more DOM than a single
static matrix. Surface-level compositing avoids stale per-glyph raster layers
under repeated reversal. This is bounded exemplar evidence, not an assertion
that arbitrarily many such compositions are cheap.

Rejected alternatives: copy arithmetic or collection code to avoid a shared
layout input; remove the preserved guided/workbench modes from union accounting;
remount fonts and native geometry during playback; or claim that lazy loading
reduces the full union. Lazy activation remains useful and is measured separately.

Reproduce with `npm run build:matrix-interpretations` and
`npm run measure:semantic-cost`. These are sums of compressed emitted assets,
not actual network/heap measurements; existing separate font accounting remains.

## Accepted-exemplar authoring continuation

Source parameterization and one lazily selected variation add 1856 JS gzip bytes
to the all-mode union: 131403 / 17367. The existing 131500 / 17600 union ceiling
is unchanged, leaving only 97 JS bytes of headroom; further growth needs fresh
diagnosis. The original composition activates 116682 / 16463, within its unchanged
117500 / 17000 gate. The variation adds 843 JS bytes on top of that closure and
receives a new complete-consumer gate of 118500 / 17000 for its measured
117525 / 16463. No previous consumer or ceiling is removed or increased.

The initial measurement deliberately failed on the missing new-consumer budget.
The new gate accounts for the complete host, shared source compiler, both
renderers and variation source, rather than measuring only the small new chunk.
Cold default is 94847 / 14686, workbench 107616 / 15523, guided 112864 / 15571,
collection-system 108304 / 15412; all retain their prior ceilings. Matrix
composition remains 111045 / 14533. New compiler checks, a reusable view factory
and example navigation account for shared growth; no CSS, clock, geometry or
motion module was added. The alternative of embedding another fixed sequence
would avoid the source checks but perpetuate caller-specific implementation.
