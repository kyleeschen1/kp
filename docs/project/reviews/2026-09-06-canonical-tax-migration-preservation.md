# Canonical tax migration preservation manifest

Approved scope: `2026-09-05-structural-authoring-canonical-tax-long-loop-proposal.md`.
Theseus owns ordered execution and verification; this is a preservation inventory,
not another slice queue. Baseline: `ac2be16ee`, after explicit G2 acceptance.

## Canonical path and authority

The actual reader URL is `/experiments/kinetic-figure/supply-tax/`, not the
similarly named source directory. Its physical document is
`experiments/kinetic-figure/supply-tax/index.html`; it loads
`src/experiments/kinetic-figure-supply-tax/kinetic-figure-supply-tax-page.ts`.
That page currently calls `mountKpSupplyTaxKineticFigure` without a source.
The host is `kinetic-figure-supply-tax-entry.ts` beside it. Existing SVG and
native KaTeX adapters own paint; the existing reader timeline clock owns time.
The migration changes the source to retained semantic-state assembly and verified
tax lowering, never domain legality, exact economics, paint or navigation design.

`rg -n 'mountKpSupplyTaxKineticFigure' src tests scripts` finds exactly two live
callers: the canonical page and `authoring-market/authoring-market-host.ts`.
The latter already supplies its own authority, instruction and frame sampler.
No other caller needs the host's absent-source branch. Retire that branch,
its adjacent default Article/score assembly and its local `exactProgress` helper
in the same commit as the route switch. Keep the injected host usable by both
callers; do not import preview lifecycle code into it.

The original `createKpEconomicsSupplyTaxAnimationAsset` and
`sampleKpEconomicsSupplyTaxAnimationFrame` remain domain-facing owners used by
the standalone Scroll Score and semantic parity tests. Their continued use is
not a second sampler in the migrated page. Preserve these constructors, the
shared score, scene and SVG modules, and the existing Article/import lock.

## Observable parity

| Boundary | Preserve |
| --- | --- |
| Economics | Demand `P=12-Q`, original supply `P=2+Q`, tax `4`; `(Q,P)=(5,7)` before, quantity `3`, buyer/seller prices `9/5` after; private surplus `25/2` to `9/2` each, revenue `12`, loss `4` |
| Instruction | Existing Article wording, eight reference addresses and beat order; existing score titles/claims and stage formulas; one model revision for prose, facts, attention and samples |
| Navigation | Eight semantic stops; only tax-input to supply-translation owns tax motion; hash restoration, history, find, arrows, replay, scrub, native swipe, wheel and interrupted/distant requests |
| Presentation | Existing CSS, protected stage, passage typography, graph geometry, original-supply historical evidence, native labels and attention; no new transition or timing table |
| Siblings | Log/exponent, TypeScript and surface/contour cards remain mounted through their existing owners and clocks |
| Lifecycle | Reduced-motion settlement, resize, pagehide/bfcache behavior, disposal, HMR full-document revision boundary |
| Delivery | Same physical route under ordinary build; no authoring preview HTTP dependency or browser execution of author templates |

The preview's current wording and exact-label mode differ from the canonical
reader. Do not mistake equal economics for visual parity. Prepare the canonical
reference instruction explicitly and preserve its label policy during cutover;
do not attach preview specimen labels, history tables or comparison UI to the
reader. Preview revision replacement and reader page lifetime stay separate.

Canonical instruction preparation reuses the existing literal Article file and
score claims, binds them to the framework-derived reference revision, and checks
that revision against the reviewed domain input before publishing. A different
model returns `kp.authoring.canonical-tax-instruction-gap`; it cannot silently
inherit the reference lesson. This is a bounded parity migration, not automatic
truth verification or parameterization of free prose. The existing parameter-bound
preview remains the place to explore variants. Explicitly authored future
canonical variants need matching instruction and their own review.

The existing physical document has only an empty `#app` before enhancement.
Build-served verification must distinguish that baseline from any newly supplied
meaningful static source; neither a successful dev endpoint nor a no-JS preview
fact fixture proves ordinary reader delivery.

## Executable preservation surface

`npm run test:economics-supply-tax` covers 81 domain, Article, score, scene, route,
SVG and exact-accounting tests. `npm run test:browser:economics-supply-tax`
covers the real canonical URL, all eight stops, native input, phone geometry,
reduced motion and visual checkpoints. `npm run test:authoring-integration`
covers exact state-derived frame parity, revision isolation, source ownership,
bound facts and preview failures. Extend these owners for cutover-specific
assertions rather than testing a parallel page. Use ordinary production-build
delivery checks for the final reader boundary.

Rollback unit: route source injection plus adjacent default wiring retirement.
The preserved domain constructors and sibling cards are outside that rollback.
G3 remains required before merge or further generalization.
