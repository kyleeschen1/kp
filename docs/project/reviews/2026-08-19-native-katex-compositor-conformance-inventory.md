# Native KaTeX Compositor Conformance Inventory

Date: 2026-08-19
Status: active implementation evidence
Run: `run-contract.kp.native-katex-compositor-conformance-v2`
Slice: `ncc03`

## Finding

The repository already contains most of the physical machinery required for a
conformance suite. The missing seam is not another renderer or another endpoint
model. It is one test-only observer that follows the same semantic paint owner
through native source, material clone, and native target and compares the
browser-realized ink at those ownership boundaries.

Existing tests prove planned rectangles, endpoint settlement, paint ownership,
and lifecycle invalidation. They do not currently prove that the cloned glyph's
visible ink occupies the planned rectangle after computed-style cloning. That
is why the italic `x` can drop while all present contracts remain green.

## Existing authority by phase

| Phase | Existing authority | What is reusable | Current gap |
| --- | --- | --- | --- |
| Semantic identity | `carrier-preserving-simplification-recipe.ts` and verified correspondence evidence | Explicit carrier, removal cohort, and stationary-context refs; no glyph inference | None for the `2`/`x` exemplar |
| Native endpoint construction | `carrier-preserving-simplification-native-endpoints.ts` | Trusted annotated LaTeX, explicit selector/motion IDs, roles, native HTML+MathML | Endpoint builder is carrier-specific; the suite needs test-only shape fixtures rather than broadening it |
| Font/layout settlement | `native-katex-fragment-observer.ts` and `native-katex-rendered-scene.ts` | Consecutive-frame settlement, style fingerprints, font revisions, viewport keys | Settlement compares native endpoint observations, not the realized material clone |
| Native paint measurement | `native-katex-paint-geometry.ts` | Text ink, baseline, subtree paint, CSS-rule paint, and stage-relative coordinates | No single public observation record currently packages actual material paint with the same metric |
| Endpoint transaction | `KpNativeKatexRenderedEndpointHandle` | Immutable renderer-session measurements; stale font/viewport detection; cannot serialize | None; reuse unchanged |
| Ownership topology | `native-katex-endpoint-ownership.ts` | Every leaf owned exactly once; compound owners without overlapping paint | Suite needs topology descriptors and negative fixtures, not another ownership implementation |
| Carrier binding | `native-katex-carrier-preserving-simplification-binding.ts` | Semantic refs resolve to measured paint, ink baselines, and native elements in one transaction | Binding proves planned source/target owners only; it does not observe the material DOM after cloning |
| Stationary alignment | `native-katex-carrier-preserving-simplification-alignment.ts` | One target-root translation derived from explicit stationary correspondences | The root translation changes layout context; the suite must trace it without treating it as carrier identity |
| Track compilation | `native-katex-scene-compositor.ts`, `native-katex-carrier-preserving-simplification-motion.ts`, and `native-katex-scene-track-sampling.ts` | Measured start/end paint, deterministic progress, expected paint projection, one shared clock | Planned `expectedPaintRect` can be correct while clone ink is wrong |
| Typography handoff telemetry | `measureKpNativeKatexCorrelatedHandoff` and the typography style-plan functions in `native-katex-scene-compositor.ts` | Semantic source/material/target correlation, fingerprints, opacity, revision identity, and a target-style reverse-FLIP plan | The material observation uses its owner `getBoundingClientRect`, not the cloned glyph's actual ink rectangle; its baseline is then derived from that box. It can therefore approve the owner while missing the `x` drop |
| Material ownership | `equation-material-layer-dom.ts` | Persistent inert owners, computed-style clones, semantic IDs, exact owner rects, measured-ink correction data | Clone measurement is internal and not exposed as a correlated conformance observation; italic typography can diverge despite owner alignment |
| Native handoff | `native-katex-endpoint-ownership.ts` and compositor ownership sessions | Exactly one visual owner and one accessible native endpoint | Ownership count says nothing about position continuity at the instant ownership changes |
| Settlement | `native-katex-carrier-preserving-simplification-settlement.ts` | Exact planned terminal geometry, stable completion, revision guards | Settlement checks planned frame geometry against the target, not rendered clone ink immediately before handoff |
| Host lifecycle | `carrier-preserving-simplification-surface-adapter.ts` | Direct seek, rewind, interruption, font/resize/DPR invalidation, reduced motion, dispose | Existing browser checks sample state and ownership, not actual correlated ink traces |

## Existing observation APIs to reuse

1. `measureKpNativeKatexTextInkRect` is the atomic-text metric. It combines
   native inline baseline measurement with canvas `actualBoundingBox*` metrics.
2. `measureKpNativeKatexSubtreePaintRect` is the compound/rule metric. It
   unions direct text ink and visible borders while ignoring KaTeX struts and
   MathML.
3. `measureKpNativeKatexBaselineY` supplies a stage-relative inline baseline.
4. `KpNativeKatexRenderedEndpointHandle` supplies immutable font and viewport
   revision identity.
5. `measureKpNativeKatexCorrelatedHandoff` already groups the three ownership
   sides by verified correlation. The suite should preserve that grouping but
   replace the material owner-box proxy with actual cloned-paint measurement.
6. Material owners already expose renderer-session correlation through
   `data-kp-equation-material-semantic-entity-id` and
   `data-kp-equation-material-endpoint-paint-atom-id`.
7. `KpVisualReviewHarness` already owns one Vite server, one Chromium process,
   and reusable profile-keyed pages. The conformance browser harness should
   adapt it rather than start a server or browser per case.

## Existing checks and what they establish

- `tests/native-katex-fragment-observer.test.ts` and its browser counterpart
  establish explicit fragment selection, stage-relative native rectangles,
  paint inventory, rules, ownership, and native settlement.
- `tests/native-katex-rendered-scene.test.ts` establishes scene atoms/groups,
  expected paint projection, compositor topology, and static frame contracts.
- `tests/native-katex-equivalent-pose-seam.test.ts` establishes planned
  equivalent-pose behavior.
- `tests/native-katex-compositor-ownership.test.ts` establishes exclusive
  visual ownership.
- `tests/carrier-preserving-simplification-native-endpoints.test.ts` and the
  focused carrier tests establish exact endpoint binding, revision guards,
  carrier opacity, stationary context, and terminal settlement.
- `tests/carrier-preserving-simplification.browser.spec.ts` establishes direct
  URL restore, seek, rewind, interruption, remount, resize, font, DPR, reduced
  motion, one paint surface, and one accessible endpoint.
- `scripts/capture-carrier-preserving-simplification.ts` provides a reusable
  checkpoint route and diagnostics, but its screenshots and current 96-sample
  matrix are review evidence rather than a cost-bounded conformance canary.

## Missing contracts

The new suite should add only these missing layers:

1. A test-only shape/risk/context descriptor and deterministic coverage
   planner.
2. A correlated actual-paint observation for native and material owners using
   the existing ink and baseline metrics.
3. An ordered seam trace with coordinate-space and lifecycle identity.
4. Continuity laws over realized ink, baseline, scale, and ownership.
5. A compact diagnostic report that identifies the failing semantic owner and
   sample, rather than merely failing a screenshot.
6. A persistent-page browser canary with hard scenario and sample budgets.
7. A negative production-closure gate proving all of the above remains
   development-only.

## Non-goals confirmed by inventory

- Do not replace native endpoint handles or semantic correspondence.
- Do not add a second clock, compositor, material layer, or measurement
  algorithm.
- Do not generalize the carrier-specific endpoint builder into production
  fixture infrastructure.
- Do not use screenshots as the primary continuity oracle.
- Do not infer identity from glyph text, geometry, DOM order, or proximity.
- Do not repair `x` until the actual-paint observer can reproduce and name the
  failing seam.
