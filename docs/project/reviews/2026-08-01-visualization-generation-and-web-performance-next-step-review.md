# Visualization Generation And Web Performance Next-Step Review

Date: 2026-08-01
Status: closed by the approved economics-and-physics successor

## Recommendation

Revise the economics exemplar under the accepted dimensional-continuity graph
language and repair the catalogue performance harness in the same bounded
checkpoint. Use that work to discover the smallest typed presentation profile
and route-specific budgets. Do not continue to physics, globally restyle the
catalogue, or build a universal renderer until the revised economics graph has
human approval.

## Candidate Review

Scores use 5 as strongest except Risk, where 5 is most speculative.

| Candidate | Authoring | Reliability | Reuse | Slice size | Risk | Recommendation |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Revise economics and repair its performance proof | 5 | 5 | 4 | 4 | 2 | Do next |
| Continue physics with the current graph treatment | 2 | 2 | 3 | 3 | 4 | Do not propagate an unapproved language |
| Build a universal graph/profile system first | 4 | 3 | 5 | 1 | 5 | Wait for the second caller |
| Pause promotions for a broad site-wide performance program | 2 | 4 | 4 | 1 | 4 | Defer; add bounded route proof now |

## Current Evidence

KP has useful loading architecture, but it is not currently able to certify
the new catalogue against Core Web Vitals.

| Area | Evidence | Assessment |
| --- | --- | --- |
| Metadata-only review shell | 10,232 gzip bytes against a 50,000-byte ceiling; no forbidden runtime files | Strong proof that isolation is possible; this is not the default main-host route |
| Main host closure | 400,402 gzip bytes against a 490,000-byte regression ceiling after the exemplar revision | Passing the ratchet, still too broad for a default product route |
| Place-value incremental pack | 71,739 gzip bytes against 75,000 | Passing with only 3,261 bytes of headroom |
| KaTeX in main closure | 76,151 JS + 7,954 CSS + 18,534 texture-atlas gzip bytes, before route-used fonts | Material and currently eager through `src/main.ts` |
| Three.js | Separate 132,210-byte gzip chunk in the current production build | Split correctly, but the old baseline observed it during initial load |
| Economics | Separate small adapter chunk, about 3,765 gzip bytes | Good capability-pack evidence |
| Runtime audit | `npm run perf:animation` now measures the direct economics catalogue route under normal and constrained profiles | Restored; records route identity, transfer, fonts, LCP, CLS, interaction-to-paint, long tasks, and frame distribution |
| CWV coverage | Isolated layout-shift and long-task observers exist in feature tests | No catalogue-route LCP, CLS, or INP matrix |
| Code rendering | Mostly native `pre`/`code`; no large syntax-highlighter dependency found | Good current baseline; preserve it |

The build also emits several large chunks, including roughly 132 KiB gzip for
the Three.js graph capability, 77 KiB for KaTeX JS, and 122 KiB for the semantic
animation workbench. Vite reports chunks over its 500 KiB minified warning
threshold. These are not all initial-route costs, but aggregate host budgets do
not prove that a specific deep link requests only what it needs.

The last stored animation-performance baseline is from 2026-07-17 and belongs
to the retired editor flow. It recorded 489,079 initial script-transfer bytes,
56,028 font-transfer bytes, 3,436 ms constrained hydration, 34 ms constrained
p95 frame time, and an initial Three.js request. Those measurements are useful
historical debt evidence, not a certification of the current catalogue.

## Economics Checkpoint Outcome

The repaired 2026-08-01 lab run completes without a regression and does not
request the Three.js chunk for the SVG-only economics route. It records:

| Metric | Normal | Constrained | Current target | Result |
| --- | ---: | ---: | ---: | --- |
| Hydration | 314 ms | 3,579 ms | constrained ≤5,000 ms | Pass |
| Initial script transfer | 411,605 bytes | 411,605 bytes | ≤250,000 bytes | Target debt |
| Initial font transfer | 43,312 bytes | 43,312 bytes | baseline only | Measured |
| LCP | 372 ms | 3,688 ms | ≤2,500 ms | Constrained target debt |
| CLS | 0.0251 | 0.0250 | ≤0.1 | Pass |
| Interaction-to-paint lab proxy | 26 ms | 42.2 ms | ≤200 ms | Pass |
| Animation frame p95 | 17.6 ms | 33.2 ms | constrained ≤33 ms | Marginal target debt |
| Longest task | 0 ms | 0 ms | ≤50 ms | Pass |

These results replace “unknown because the harness is broken” with explicit
route evidence. They do not turn a synthetic interaction proxy into field INP
or bless the current main-host closure. The main-host transfer and constrained
LCP debts are cross-route loading concerns and remain candidates for the
post-economics/physics consolidation and pruning boundary. The marginal frame
target should be remeasured and optimized only after the visual treatment is
approved. Economics cannot receive its final release certificate while these
named target debts remain unresolved or without an explicit later decision.

## Bounded Performance Plan

### 1. Preserve restored route truth

The stable performance harness now targets the persistent catalogue shell with
artifact selection explicit in the URL. Extend that restored pattern to:

- the default catalogue route;
- a direct economics deep link;
- a direct 3D graph deep link;
- a direct equation/KaTeX deep link; and
- a direct code example once its missing adapter exists.

Run cold-cache desktop and constrained mobile profiles. Record actual resource
requests, hydration/readiness, LCP, CLS, interaction latency, long tasks, and
animation-frame distribution. A route must not inherit success from an
aggregate bundle closure.

Recommended promotion budgets are LCP at or below 2.5 seconds, CLS at or below
0.1 with a 0.05 lab target, and INP at or below 200 milliseconds. Keep the
existing 50 ms long-task and 33 ms constrained-frame p95 targets. Establish
route transfer ceilings from the repaired baseline, then ratchet them down;
do not bless the present 399 KiB main closure as the product target.

The official Core Web Vitals verdict is a field result at the 75th percentile,
not a single Playwright or Lighthouse run. Before the public site has real
traffic, the catalogue harness supplies repeatable lab guardrails. A public
release should add the small `web-vitals` field collector for `onLCP`, `onCLS`,
and `onINP`, segment mobile and desktop, and compare the resulting p75 values
with the same thresholds. Lab and field evidence should be reported separately.

### 2. Split by selected capability

The catalogue bootstrap should load metadata and shell code first, then the
selected asset and only its surface capabilities:

- keep 2D SVG graph projection independent of Three.js;
- request Three.js only when a visible selected surface needs depth or
  rotation, then release renderer and GPU resources when ownership ends;
- load KaTeX JS and CSS only for selected mathematical surfaces, or emit
  pre-rendered KaTeX for static publication paths;
- keep code as semantic HTML by default and load a highlighter only for a
  visible code surface that benefits from it; and
- avoid eager imports from the all-purpose `src/main.ts` entry for routes that
  can use a smaller host.

KaTeX's distributed CSS declares WOFF2, WOFF, and TTF sources with
`font-display: block`. Production should serve WOFF2 as the primary format,
cache it immutably, and preload only faces proven critical for the selected
route. Corpus-based subsetting may follow measurement, but must not silently
remove notation that generated content can request.

### 3. Reserve geometry before content arrives

Catalogue metadata should expose the selected stage's aspect ratio or bounded
size class before its pack loads. The shell reserves that box, transport, and
review dock immediately. Renderers then fit inside it rather than resizing the
page after fonts, labels, or WebGL settle.

For mathematical labels, construct KaTeX nodes once, wait for the required
font readiness at the renderer boundary, measure once per label/style/scale
key, and cache the geometry. During playback, reuse those nodes and update
transforms. Batch `ResizeObserver` reactions, avoid interleaved DOM reads and
writes, and animate transform/opacity rather than layout properties. The same
principle applies to code line numbers, annotations, and diagram callouts.

### 4. Make conformance and budgets generated-artifact gates

A generated graph is promotable only when its typed profile validates and its
representative route stays within resource and CWV budgets. Stable checks
should cover:

- no raw mathematical SVG labels;
- no Three.js request for an SVG-only artifact;
- no unexpected KaTeX or code capability on the metadata shell;
- reserved stage geometry before pack and font settlement;
- dynamic accessible descriptions and reduced motion;
- deterministic label placement at named responsive widths; and
- per-capability transfer attribution rather than one opaque main-host total.

This is stronger than adding graph rules to an LLM prompt: the generator can
propose content, but the schema, compiler, renderer profile, and catalogue
health gate decide whether it is executable and promotable.

## Promotion Boundary

The economics revision may add only the smallest local profile or token seam
needed to express the accepted treatment. Human review selects its visual
language. Physics then tests whether the same seam survives a diagram, units,
and an area-under-curve relationship. Only after both callers pass should KP
name a general profile type, migrate other graphs, or tighten global generated
artifact validation.

The economics semantic model, exact values, runtime clock, native SVG paint
ownership, parameter behavior, catalogue shell, and review evidence are the
preservation boundary. The economics presenter, local visual tokens, label
layer, and scoped performance harness are the independently reversible unit.

## Sources

- `src/main.ts`
- `src/bootstrap.ts`
- `src/animation/performance-budget.ts`
- `src/semantic/graph.ts`
- `src/rendering/graph-transitions.ts`
- `src/rendering/economics-equilibrium-svg.ts`
- `src/editor/animation-catalogue-shell.css`
- `scripts/animation-performance.ts`
- `scripts/check-animation-library-bundle-boundary.ts`
- `tests/fixtures/animation-performance-baseline.json`
- `docs/project/decisions/2026-08-01-kp-dimensional-continuity-graph-and-diagram-language.md`
- `https://web.dev/articles/vitals`
- `https://web.dev/articles/defining-core-web-vitals-thresholds`
- `https://web.dev/articles/optimize-cls`
- `https://web.dev/learn/performance/code-split-javascript`
