# Equation Surface Cost and Bundle Baseline

Date: 2026-08-15

Status: measured pre-convergence baseline for run slice `s04`

Stable command: `npm run measure:equation-surface-cost`

## Result

The current equation catalogue is operationally bounded but architecturally
wide. Its 28 equation surfaces form 14 preservation families. One representative
from each family loaded reproducibly in two clean production-browser runs,
mounted exactly one player, advanced from the shared player clock, and loaded no
Graph3D or programming-surface capability.

The central cost is shared closure rather than a large marginal cost per asset.
The family matrix has 72 emitted files in common. Most generated algebra
families load 438,367 gzip bytes of script even though a representative's
source authority crosses only 10–12 files. The migration should therefore
reduce shared authority and pack coupling before optimizing individual motifs.

## Measurement Method

The stable command performs one production build, starts one preview server and
one headless Chromium instance, and measures all 14 family representatives. It
disables browser caching per route and repeats each route twice. A route fails
when the emitted-file closure changes between runs, the selected pack or adapter
does not settle, more than one player mounts, progress does not advance, or an
unrelated Graph3D/programming-surface owner appears.

The full disposable report is written to
`tmp/codex/equation-surface-cost-baseline.json`. It contains emitted file names,
manifest owners, raw/gzip/transfer bytes, exact route-only closures, active-frame
evidence, source paths, and compatibility counts. This review records the
durable interpretation; generated hashes and transfer sizes remain disposable.

## Source Touch Tax

The 14 representatives reach 35 unique source files. A single family currently
requires 9–11 authority nodes and 10–12 source files spanning catalogue, pack,
compiler, registry, motif, timing, renderer, fallback, sampler, and clock
ownership.

| Authority category | Source files | Raw bytes | Gzip bytes |
| --- | ---: | ---: | ---: |
| Clock | 1 | 30,481 | 6,409 |
| Compiler | 4 | 60,900 | 12,628 |
| Direct sampler | 18 | 265,082 | 60,545 |
| Fallback | 4 | 210,863 | 38,553 |
| Local timing | 4 | 266,180 | 48,527 |
| Motif | 4 | 26,477 | 6,030 |
| Registry | 2 | 7,662 | 2,256 |
| Renderer inference | 4 | 206,913 | 36,210 |

These category totals are diagnostic rather than additive: one large adapter
can own more than one authority role. They expose the present concentration of
timing, inference, fallback, and sampling inside a few broad files.

## Production Route Closure

Script figures are emitted gzip bytes. Styles are 25,418 gzip bytes for every
family except logarithms (25,731). Nine KaTeX fonts total 252,303 gzip bytes for
most families; logarithms load five fonts and the transform-pair route loads
ten.

| Representative family | Script gzip | Route-only files | Source files |
| --- | ---: | ---: | ---: |
| Linear solve | 453,109 | 3 | 12 |
| Operation evaluation | 444,107 | 15 | 11 |
| Cancellation | 438,367 | 0 | 12 |
| Distribution/factoring | 438,367 | 0 | 11 |
| Exponent/radical | 438,367 | 0 | 11 |
| Fraction | 438,367 | 0 | 11 |
| Function wrap | 438,367 | 0 | 11 |
| Inequality | 438,367 | 0 | 11 |
| Comparison | 437,674 | 10 | 10 |
| Logarithm | 386,735 | 3 | 11 |
| Calculus | 372,222 | 0 | 11 |
| Linear algebra | 372,222 | 0 | 11 |
| Substitution | 367,046 | 2 | 11 |
| Transform pair | 363,110 | 3 | 10 |

The zero route-only rows are not free. They are almost entirely inside the
large common closure. The comparison pack's ten exclusive files include Lisp,
Scheme, TypeScript, and programming-adapter implementation even for the
Jacobian/Hessian representative. It does not load the programming surface
capability, so this is not the slice stop condition, but it is clear pack-level
coupling evidence for later disposition work.

## Active Frame and Compatibility Baseline

Every representative mounted one player and visibly advanced after Play. The
shared `editor-animation-player` remains the sole clock authority; no row owns a
CSS animation or private clock.

| Compatibility signal | Count |
| --- | ---: |
| Generic compatibility rows | 23 |
| Specialized adapter rows | 5 |
| Rows with at least one non-semantic transition | 5 |
| Non-semantic transitions | 8 |
| Rows retaining whole-equation fallback | 23 |
| Local sampler nodes | 16 |
| Private-clock rows | 0 |
| CSS-animation-authority rows | 0 |

These counts are the denominator for the convergence run. Later slices must not
claim lower compatibility or marginal cost by moving work into an unmeasured
chunk, loading an unrelated capability, or replacing semantic motion with a
static/whole-equation fallback.

## Decisions

1. Preserve the one-player, one-clock active-frame contract.
2. Treat the 35-file source closure and 9–11-node authority path as the current
   touch tax, not as a desirable API.
3. Measure migration progress against generic fallback rows, non-semantic
   transitions, local sampler nodes, and exact production route closures.
4. Do not set a new public bundle budget from this diagnostic baseline. The
   existing product budgets remain authoritative.
5. Keep emitted hashes and transfer bytes out of committed truth; reproduce
   them with the stable command when a migration wave changes ownership.

No visual behavior, catalogue disposition, runtime authority, or product
budget changes in this slice.
