# Governed Animation Generation Baseline

Date: 2026-08-17
Status: accepted baseline evidence for
`run-contract.kp.governed-animation-generation-foundation-v3`

## Result

KP has substantially more working animation and authoring infrastructure than
its narrow generation entrance exposes. The current authorities are internally
consistent, but they answer different questions and must not be collapsed into
one hand-authored readiness claim.

This baseline records the starting evidence only. It does **not** classify a
capability as Direct, Registered, Exemplar, or Missing; that projection belongs
to later slices and must be derived from named gates.

## Evidence Authorities

| Question | Current authority | Baseline observation |
| --- | --- | --- |
| Which semantic assets can the eager test catalogue construct? | `src/animation/catalog.ts` | 45 unique assets |
| Which assets can the product load without importing every family? | `src/animation/catalog-loader.ts` | 13 lazy pack declarations own all 45 eager asset IDs |
| Which rows can the internal catalogue display? | `src/editor/animation-library-display-catalog.generated.json` | 53 rows: 52 playable and 1 planned |
| Which concrete equation assets have preservation and loading evidence? | `src/architecture/equation-asset-manifest.generated.json` | 30 equation assets |
| Which equation surfaces can semantic authoring describe? | `src/authoring/equation-llm-authoring-catalogue.ts` | 30 surfaces, 15 recipes, and 29 promoted-operation definitions |
| Which equation requests can the tool-neutral entrance compile directly? | `src/authoring/compile-equation-intent.ts` | 3 surface vocabularies |
| Which pages are reachable through shared development navigation? | `src/dev-toolbar/development-page-directory.ts` | 28 pages in 4 groups |
| Which catalogue state is URL-addressable? | `src/editor/animation-catalogue-route.ts` | view, artifact, and bounded playhead |
| Which chrome is globally owned in development? | `src/dev-toolbar/dev-toolbar-protocol.ts` | Review and Pages are host-owned; route controls are contributed |
| Which selected-state evidence reaches Review? | `src/dev-review/animation-catalogue-capture-provider.ts` and `src/dev-review/editor-animation-library-capture-provider.ts` | asset, projection, progress, direction, phase/checkpoint when present, accessibility mode, tuning, parameters, renderer, viewport, and semantic target |

## Inventory Snapshot

### Asset and display inventory

- 45 unique semantic animation assets.
- Asset counts by render-target kind are 30 equation, 8 graph, 6
  programming, and 3 diagram. Multi-target assets intentionally make this sum
  greater than 45.
- The 30 equation assets expose 33 equation render-target slots; the equation
  asset manifest covers all 30 unique equation asset IDs exactly once.
- The display catalogue contains 53 rows: 8 ported, 3 partial, and 42 legacy.
- Its representations comprise 64 editor links, 17 card links, 13 reader
  links, and 3 diagnostic links. A row may intentionally expose more than one
  representation.

The eight display-only IDs are not missing lazy-pack assets. Seven are
reader-owned playable representations and one is the explicitly planned
quadratic branching row:

- `animation.numerator-split-merge.round-trip`
- `animation.fractional-linear.x-over-2.balanced-proof`
- `animation.fractional-linear.x-over-2.fluent-projection`
- `animation.fraction-composition.two-thirds-solve`
- `animation.foldable-distribution.collect-like-terms`
- `animation.divide-both-sides.solve-3x-equals-12`
- `animation.algebra.quadratic.solution-branching`
- `animation.fractional-linear.solve-x-over-2`

This is the first important vocabulary boundary: **display row**, **semantic
asset**, and **directly generated capability** are different concepts.

### Equation preservation and authoring inventory

The 30 equation manifest entries currently have these dispositions:

| Disposition | Count |
| --- | ---: |
| Canonical | 3 |
| Adapter-backed | 22 |
| Static-only | 4 |
| Retirement candidate | 1 |

The equation authoring catalogue describes all 30 surfaces. Its current
authoring statuses are:

| Authoring status | Count |
| --- | ---: |
| Promoted | 18 |
| Visual checkpoint pending | 6 |
| Static-only | 4 |
| Diagnostic-only | 1 |
| Retirement-only | 1 |

Neither table proves direct generation. The narrow tool-neutral compiler has
exactly these three direct surface/operation pairs:

1. `animation.generated.function-wrap.apply-f` →
   `kp.algebra.wrap-function`
2. `animation.generated.cancellation.additive-inverses` →
   `kp.algebra.cancel-additive-inverses`
3. `animation.generated.distribution.expand-a-sum` →
   `kp.algebra.distribute-multiplication`

The accepted generation proof shows all three compile first-pass with zero
repair through existing compiler-owned authorities. It is not live-model
evidence and it does not imply that the other 27 equation surfaces can be
generated through this entrance.

## URL, Dock, and Review Baseline

- The catalogue route defaults to `view=animation-catalogue` semantics and
  restores `artifact` plus a playhead in `[0, 1]`. It does not yet own theme,
  display settings, or a Coverage view.
- Catalogue links and browser history change selection in place; ordinary
  navigation does not require a full page reload.
- The shared development toolbar owns Review and the 28-page directory. It
  does not yet expose Catalogue/Coverage switching, a direct theme toggle, an
  exact-link action, or consolidated display settings.
- The catalogue capture provider already records rich player state, but the
  current contract does not prove that view/theme/display settings and the
  exact browser URL are captured as one reproducible state.
- Review placement has responsive policies, while the fixed global toolbar
  and page-local playback controls do not yet share an explicit collision
  reservation. “Visible” therefore does not yet prove “never covers the
  scrubber.”

## Contradictions The Coverage Projection Must Surface

1. A playable display row can be reader-owned and have no loadable catalogue
   asset.
2. An adapter-backed or promoted authoring surface can still lack a direct
   generation entrance.
3. A canonical asset disposition does not by itself prove LLM exposure.
4. An existing animation does not prove that arbitrary endpoint shapes,
   cardinalities, or operation sequences are supported.
5. A planned row belongs in the capability plan, not the concrete asset-first
   catalogue.
6. A direct deterministic request proves the governed tool contract, not
   natural-language planning quality.

These are typed evidence joins to preserve, not inconsistencies to erase.

## Verification

The baseline was captured with the repository-owned authority checks:

- `npm run test:equation-asset-manifest` — 6/6 passed.
- `npm run test:equation-generation-boundary` — 12/12 passed.
- `npm run test:svelte-catalogue-shell` — 36/36 passed.
- `npm run test:dev-toolbar` — 29/29 passed.
- `theseus workspace validate` — valid before implementation started.

The manifest tests prove exact asset coverage, lazy-pack ownership, source
joins, and display projection. The generation boundary proves the three direct
cases and tool-neutral import closure. Catalogue and toolbar suites freeze
in-place navigation, the single review lifecycle, page directory authority,
and host-owned chrome.

## Next Boundary

The next slice may define the authored capability-plan schema. It must carry
stable identity, domain, order, scope, and explicit requirements, while all
readiness language remains derived from the evidence authorities named here.
