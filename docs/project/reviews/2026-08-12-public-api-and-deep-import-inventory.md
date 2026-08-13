# Public API And Deep-Import Inventory

Date: 2026-08-12

## Finding

KP's apparent “public API” is not one namespace. Thirteen `public-api.ts`
modules exist because concept publication, animation construction, domain IR,
provider integration, projections, kernel, motifs, and reader layers have
different authorities. Collapsing them into one barrel would reduce filenames
while increasing coupling and accidental bundle reach.

The useful simplification is therefore a small set of named seams with caller
ratchets—not a repository-wide ban on relative imports. Same-owner modules may
import their internals. Cross-owner production callers should use the narrowest
declared facade or a ledgered compatibility boundary.

## Declared Seams

| Seam | Disposition | Production caller shape |
| --- | --- | --- |
| `src/authoring/canonical-animation-public-api.ts` | Canonical governed construction boundary | No production callers yet; 11 focused test consumers prove the released request/compiler/repair contract. |
| `src/animation/public-api.ts` | Narrow balanced-solve asset facade | Exactly two production callers. |
| `src/authoring/public-api.ts` | Concept manifest and publication fitness | One bootstrap caller; intentionally excludes animation construction. |
| `src/integrations/public-api.ts` | Verified provider-trace integration | Six animation, adapter, and tutorial callers. |
| `src/domain-ir/public-api.ts` | Semantic equation intermediate | Internal compiler/animation boundary. |
| `src/animation/motifs/public-api.ts` | Renderer-neutral equation motifs | No production barrel caller; internal motif modules remain the owner. |
| Reader app/compiler/document/renderers/runtime facades | Reader-internal ownership boundaries | Callers remain predominantly within `src/reader`; learner facades narrow route closure further. |
| App adapters, kernel, and projections facades | Narrow integration and product views | Retain separate authority and bundle boundaries. |

## Deep-Import Interpretation

The animation asset core has 142 direct source callers and the reader runtime
facade has 20. Those numbers do not imply 162 violations: most are same-owner
implementation imports. A raw repository regex also counts fixtures, tests,
and intentionally internal compiler modules. It is not an actionable health
metric.

The existing caller ledger is the actionable instrument because it resolves
imports and classifies each target by authority and disposition. This slice
adds the previously omitted governed canonical-construction facade to that
ledger. Later enforcement should ratchet only migrated directories and known
cross-owner seams; a repository-wide rewrite remains explicitly deferred.

## Current Risks

- The canonical governed construction facade has no production caller, so
  documentation and tests—not product usage—currently establish its public
  status. The fresh-model benchmark must test whether this seam is usable.
- `src/animation/asset.ts` is broad and widely imported. It is a semantic core,
  not a public compatibility promise.
- Reader facades are public-looking but internal to the first-party reader.
  They should not be presented to model authors as alternatives to animation
  construction.
- The editor API catalog is an editorial projection, not executable authority.

## Executable Evidence

- `npm run audit:animation-api-callers -- --summary` reports 19 classified
  surfaces after this slice.
- `tests/animation-api-caller-ledger.test.ts` freezes direct callers of the
  canonical construction, animation, concept, provider, reader, motif,
  metadata, compatibility, and generated-session seams.
- `tests/animation-api-pruning-verdict.test.ts` prevents naming similarity from
  becoming unsupported deletion.

