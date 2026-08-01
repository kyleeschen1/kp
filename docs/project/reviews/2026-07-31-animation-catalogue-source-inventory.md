# Animation Catalogue Source Inventory

Date: 2026-07-31
Status: frozen baseline for catalogue simplification slice s01

## Purpose

This inventory freezes the existing sources that currently contribute
animation identity, loading, display rows, host selection, related contexts,
and review capture. It does not choose a new shared renderer, change runtime
behavior, or declare every visible row to be a concrete animation asset.

The catalogue contract will use this baseline to remove accidental authority
from projections one seam at a time. Existing routes remain diagnostic evidence
until their unique consumers and review contracts have been accounted for.

## Measured Baseline

The committed source state at recovery closeout produces:

| Projection | Count | Important distinction |
| --- | ---: | --- |
| Concrete `KpAnimationAsset` objects | 33 | One stable ID per object from `createKpAnimationAssets()` |
| Lazy capability packs | 10 | Every concrete ID resolves through one literal dynamic-import pack |
| Editor descriptors | 50 | 33 asset IDs plus 17 family/sample descriptors |
| Workbench identities | 34 | 33 catalog-backed identities plus one planned-only quadratic identity |
| Workbench representation relationships | 69 | Editor, card, lesson, and concept-room relationships, not assets |
| Display-catalog entries | 41 | 33 concrete assets, seven reader-only playable IDs, and one planned-only ID |
| Display-catalog representation records | 82 | Canonical hosts, projections, and diagnostics, including iframe targets |

All 33 concrete IDs load successfully through the catalog loader and exercise
all 10 packs. Their declared render targets are 24 equation, five graph, three
diagram, and two programming targets; an asset can contribute to more than one
target count.

`animation.linear-solve.solve-x` has three editor descriptors, six Workbench
representation relationships, and seven display representations. This context
breadth is why it is the shell exemplar, not a reason to expose a representation
picker in the default catalogue.

## Source Ownership

### Concrete identity and loading

- `src/animation/catalog.ts` constructs the complete in-process set of 33
  concrete `KpAnimationAsset` objects. This is the current construction
  authority used by generation and conformance tests.
- `src/animation/catalog-loader.ts` maps every concrete ID to one of 10 lazy
  capability packs and loads one exact asset from that pack. This is the
  browser loading authority and already protects independent chunks.
- `src/animation/asset.ts` owns the durable asset identity, semantic bundle,
  transformation tree, timeline, render-target, check, export, dashboard, and
  metadata contracts.
- `src/editor/animation-library-metadata.generated.json` is a compact generated
  runtime projection of the concrete catalog. Its 50 descriptors are useful
  discovery metadata, but descriptor identity is not asset identity.

The new catalogue index must be one row per concrete asset ID. It may use the
generated metadata to avoid eagerly constructing every semantic bundle, but it
must retain exact equality with the concrete catalog and lazy loader.

### Display and lifecycle projections

- `src/editor/animation-catalog-projection.ts` intentionally adds family/sample
  descriptors around each asset. Those associations belong under Details.
- `src/editor/semantic-animation-workbench-data.ts` combines descriptors,
  one planned identity, representations, presentation audits, and selected
  Theseus records.
- `src/editor/semantic-animation-workbench-index.ts` owns the current mixed
  lifecycle index. Its planned and operational projections remain useful
  context, but they do not define catalogue membership.
- `src/editor/animation-library-display-catalog-builder.ts` merges Workbench
  identities, learner experiences, supplemental diagnostic hosts, promotion
  evidence, and preferred representations. Its `playable` flag means at least
  one presentation exists; it does not prove that a concrete asset can load in
  the shared native host.
- `src/editor/learner-experience-library.ts` contributes seven playable
  reader-only animation IDs that are absent from the concrete catalog. These
  remain related reader contexts until they acquire concrete loadable assets.

The current display catalog therefore cannot be renamed into the new asset
catalogue. It is an important context source whose representation and promotion
evidence should be joined onto concrete rows.

### Hosting and adapters

- `src/editor/animation-surface-adapter-registry.ts` resolves one registered
  adapter by slot kind, priority, and player state. Missing resolution is
  already observable as `data-kp-editor-animation-adapter-status="missing"`.
- `src/main.ts` installs the generic equation, diagram, and graph adapters.
- The exact-quantity, place-value, and operation-evaluation packs register
  specialized adapters when their lazy packs load.
- A programming slot kind and programming assets exist, but the default host
  registers no programming surface adapter. The programming external port also
  remains explicitly provisional. A playable display label must not hide that
  gap.
- `src/editor/editor.ts` owns the existing native player host. It preserves the
  current controller and surface dispatch without requiring an iframe.

No current source computes asset-level native hostability across the complete
catalog. Slice s04 must derive that truth from asset requirements and adapter
capabilities without inventing a universal surface contract.

### Related contexts and routes

- `src/editor/semantic-animation-workbench-representation-adapter.ts` joins
  editor, card, lesson, and concept-room relationships and records canonical,
  projection, and superseded-fixture roles.
- `src/editor/learner-experience-library.ts` owns reader and concept-room links.
- `src/editor/semantic-animation-workbench-route.ts` owns the current nested
  Workbench query, representation, and roadmap URL state.
- `canonical-animation-review.html` and
  `src/experiments/canonical-animation-review.ts` own the current searchable
  Animation Library. It selects among representation URLs and renders the
  selected host in an iframe.
- `src/project-dashboard/` owns project, report, and historical catalog views.

These sources remain diagnostic comparators. The new catalogue will attach
their useful links and evidence under Details rather than preserve their mixed
row models or representation controls in the default shell.

### Review capture

- `src/dev-review/animation-library-review-bootstrap.ts` mounts the persistent
  development review shell with Animation Library placement.
- `src/dev-review/animation-library-capture-provider.ts` captures artifact,
  representation, progress, phase, transformation, renderer, viewport, and
  semantic-target evidence from the current iframe host.
- `src/editor/editor-animation-library-review-capture-loader.ts` and
  `src/editor/semantic-animation-workbench-review-capture-loader.ts` preserve
  development-only loading boundaries for the native editor and Workbench.

The protocol and captured evidence are reusable. The current Animation Library
provider's iframe lookup is not: the lower-left native catalogue capture must
read the selected native stage directly while preserving the same automatic
state and screenshot contract.

## Frozen Boundary For The Next Slices

1. Catalogue membership starts with the 33 concrete loadable asset IDs.
2. A descriptor, learner experience, planned identity, roadmap row, review,
   representation, or Theseus node cannot independently add a catalogue row.
3. Loadability, native hostability, derived health, promotion, and human
   disposition are separate facts.
4. Related contexts remain addressable metadata under Details.
5. Existing iframe, Workbench, editor, reader, dashboard, and diagnostic routes
   remain available until their unique evidence has been inventoried.
6. The solve-x exemplar may change only its surrounding catalogue shell before
   the mandatory human checkpoint.

## Reproduction And Existing Checks

The baseline was reproduced directly from the exported construction and
projection functions. Existing durable checks that protect these sources are:

- `tests/animation-catalog-loader.test.ts`;
- `tests/animation-library-metadata.test.ts`;
- `tests/kp-editor-animation-catalog-projection.test.ts`;
- `tests/semantic-animation-workbench-index.test.ts`;
- `tests/animation-library-display-catalog.test.ts`; and
- `tests/kp-editor-animation-surface-adapter-registry.test.ts`.

Slice s02 will encode the one-row-per-loadable-ID characterization behind a
small typed projection. This document remains the pre-change map of the seams
that projection must preserve.
