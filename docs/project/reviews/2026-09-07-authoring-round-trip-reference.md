# R1 canonical reference and preservation boundary

Date: 2026-09-07
Baseline: `e7f5f62e7` (runtime inherited from approved `60b8cd90c`)

## Canonical path

| Responsibility | Owner |
| --- | --- |
| Canonical product host | `/experiments/kinetic-figure/supply-tax/`; `src/tutorial/kinetic-figure-supply-tax/kinetic-figure-supply-tax-page.ts` |
| Author input | `src/experiments/authoring-market/authoring-market-model-source.ts` and `authoring-market-article-source.ts` |
| Author preview host | `/experiments/authoring-market/`; `authoring-market-page.ts` / `authoring-market-host.ts` in that experiment |
| Semantic source | `src/tutorial/typed-linear-supply-demand/authoring-market-source.ts`; domain-owned economics and verified tax operation |
| Shared preparation | `src/tutorial/authoring-market/authoring-market-prepare.ts` |
| Fractional frames/history | `src/tutorial/authoring-market/authoring-market-frame.ts`; one session per mounted revision |
| Canonical delivery | `scripts/compile-canonical-tax-source.ts` -> generated data and instructions -> `canonical-tax-source.ts` |
| Paint | Existing economics SVG and native KaTeX owners; host and artifact identity alone do not establish paint parity |
| Card form | `src/tutorial/focus-deck-scaffold.ts` and shared styles; code/log/3D siblings retain their domain owners |

The author source declares reference demand intercept 12 and tax 4, and a
separate variation with intercept 14 and tax 2. Demand changes are settled
history, not authorized demand animation. Canonical publication intentionally
pins the reference; selecting a preview variant does not currently select a
publication. R1 must make source selection explicit without silently replacing
the published reference or weakening its instruction guard.

The canonical build rewrites filesystem source identity to the portable
`article.economics.supply-tax.reference`; do not treat that as source navigation.
The preview currently reports candidate source revision separately from the
mounted preview's revision dataset. R1 may improve their author-facing clarity.

## Preserve

- Exact reference facts, eight tax passages, labels, settled endpoints, direct
  navigation, reverse and fractional seek, disposal, and sibling controls.
- Shared preparation with separate preview/reader lifetimes; no preview-service
  or trusted author-module dependency in ordinary browser delivery.
- Existing approved distribution/log/code/3D visuals and gradual code passage input.
- Author-written prose; no automatic truth certification of free prose.
- Static reference output is eight bound tax phrases and facts, not an assertion
  of complete four-card graphical no-JavaScript publication.

## Verification and rollback

`tests/authoring-integration-canonical-source.test.ts` executes reference/domain
sampling parity, single-session source wiring, reverse/reset/dispose and isolated
preview revisions. `tests/authoring-integration-canonical-build.test.ts` covers
deterministic generated data, static prose, sibling instruction identity and
production import isolation. Existing runtime browser cohorts remain required
when visible or lifecycle owners change; this source inventory does not replace
them or claim fresh visual certification.

Smallest R1 rollback unit is a changed authoring binding/UI/build path and its
tests. Do not roll back semantics, clocks or native paint to fix authoring UX.
Do not overwrite user source files for demonstrations without capture/restore
and a scoped test owner. No route or renderer replacement is authorized.

Before s11, pin the particular already-supported equation chain and its actual
canonical host/renderer from the generation entrance and executed evidence.
This reference does not invent an equation artifact or claim that every series
compiler result is already a canonical Focus Card.
