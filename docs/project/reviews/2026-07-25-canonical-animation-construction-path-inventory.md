# Canonical animation construction path inventory

Date: 2026-07-25  
Run contract:
`run-contract.kp.canonical-animation-construction-governed-round-trip-v1`  
Slice: 2, construction-path inventory

## Finding

KP already has the necessary authorities, but it does not yet have one public
construction contract that joins them. The product fraction path is
hand-authored and complete through the compatibility renderer. The governed
provider path reaches verified operation plans, and the canonical native-KaTeX
session reaches correct paint, but their only end-to-end connection is a
test-local bridge in
`tests/governed-llm-canonical-renderer-proof.test.ts`.

The next contract should join those existing authorities. It must not create a
second asset, compiler, presentation plan, renderer, clock, or product route.

## Current construction map

| Stage | Current authority | Inputs and outputs | Disposition |
|---|---|---|---|
| Exact mathematical truth | `src/semantic/numerator-split-merge-equation-asset.ts` | Exact states, registered transformations, laws, assumptions, selector correspondence, and split/merge multiplicity | Canonical; preserve |
| Human-authored animation assembly | `src/animation/numerator-split-merge-equation-adapter.ts` | Semantic asset to transformation tree, focus intent, one timeline, render target, checks, exports, and typed presentation profile | Canonical exemplar input; preserve |
| Provider request | `src/authoring/governed-semantic-request.ts` | Verified source refs, operation ref, role and lineage intent, focus, cadence, normal form, and compression | Canonical governed boundary; narrow in slice 16 |
| Provider verification and repair | `src/authoring/governed-semantic-compiler.ts` | Registered operation resolution, exact pack pins, source and role checks, deterministic plan, provenance, typed repair | Canonical compiler authority; preserve and extend |
| Older model-draft path | `src/animation/llm-animation-draft-v2.ts` and `src/animation/llm-animation-draft-v2-compiler.ts` | Broad generated semantic draft to resolved operation records and epistemic gaps | Compatibility and retained evidence; do not make a second construction API |
| Fixture interchange | `src/authoring/transform-fixture-contract.ts` | Versioned KaTeX fixture import/export with semantic refs, motif timelines, artifact expectations, and diagnostics | Fixture boundary only; not product or provider authority |
| Proof-cohort bridge | `tests/governed-llm-canonical-renderer-proof.test.ts` | Manually projects governed correspondence to synthetic observed scenes and a canonical renderer session | Test-only gap to replace with the slice-3 construction contract |
| Product lesson compilation | `src/reader/compiler/numerator-split-merge-equation-lesson-model.ts` and `src/reader/compiler/numerator-split-merge-equation-lesson.ts` | Markdown plus the hand-authored animation asset to semantic document, searchable static HTML, hydration manifest, and native annotated KaTeX | Canonical document and static authority; preserve |
| Reader composition | `src/reader/app/equation-lesson-descriptor.ts` | Lesson variant to animation factory and structural-anchor binder | Canonical reader registry; preserve |
| Durable reader plans | `src/reader/renderers/equation-render-plan.ts` and `src/reader/renderers/equation-material-plan.ts` | Semantic transitions to renderer-neutral endpoint, lineage, anchor, and material-owner plans | Canonical durable presentation seam; preserve |
| Product runtime | `src/reader/app/exemplar-entry.ts` | Shared reader clock, responsive fit, focus, native states, compatibility material frames, and optional canonical session | Migration seam; fraction still uses compatibility paint |
| Reader-to-renderer adapter | `src/reader/renderers/equation-scene-compositor-adapter.ts` | Durable render/material plans plus ephemeral observed endpoints to canonical relations, reconciliation, hierarchy, tracks, and session | Canonical adapter; preserve |
| Canonical live renderer | `src/rendering/native-katex-rendered-scene.ts` and `src/rendering/native-katex-scene-compositor.ts` | Ephemeral native DOM measurements to one native-KaTeX renderer session with capability-selected modes | Sole live equation paint authority for migrated transitions |
| Static/headless projection | `src/animation/asset-projections.ts`, `src/animation/sampled-frame-envelope.ts`, and reader compiler output | Renderer-neutral semantic, presentation, product, sampled-frame, no-JS, and headless artifacts | Canonical projections; renderer sessions must never serialize |
| Iframe/static-step export | `src/tutorial/iframe-export-document.ts`, `src/tutorial/frame-sequence-preview.ts`, and `src/tutorial/static-step-export-smoke-fixture.ts` | Escaped HTML/attribute text and script-safe JSON around static artifacts | Existing export authority; parity consumer, not a new animation path |

## Product fraction baseline

The `/reader/split-merge-fractions/` route currently follows:

1. authored Markdown and the exact numerator split/merge semantic asset;
2. the existing animation adapter and reader lesson model;
3. the shared equation render and material plans;
4. the shared reader clock, responsive-fit, attention, and semantic DOM; and
5. compatibility material-frame construction in `exemplar-entry.ts`.

The canonical session is currently selected only for
`transform.linear-solve.cancel-left-additive-inverse`. This is the intended
slice-14 migration seam. The fraction migration must add eligibility for one
approved transition and bypass its compatibility frames in the same rollback
unit.

## Safety and utility ledger

The repeated “HTML sanitation” concern resolves into several different
contracts:

| Cluster | Evidence | Classification | Slice-27 action |
|---|---|---|---|
| Material-clone authority stripping | `src/rendering/computed-style-clone.ts` is shared by the reader material layer, native glyph compositor, and rendering material-layer DOM | Already canonical. This is DOM authority sanitation, not string escaping. | Retain one implementation and its adversarial browser tests |
| Tutorial text, quoted-attribute, and script-JSON escaping | Three export files have the same `escapeHtml`, `escapeAttr`, and `escapeScriptJson` trio; several tutorial card builders share the same text/attribute pair | Strong candidate: same generated-document lifetime and untrusted-string boundary | Consolidate only after all consumer and adversarial export tests cover the shared contract |
| Editor and review `innerHTML` escaping | Multiple editor shells escape text plus quotes, often including apostrophes | Candidate within the editor/review boundary, but not automatically identical to export or SVG serialization | Compare insertion contexts; consolidate only identical contexts |
| SVG and graph serialization escaping | Graph and diagram renderers escape XML/markup strings | Retain distinct until XML, attribute, and HTML context equivalence is proved | Do not fold into a generic HTML helper by name |
| Capture-script contact-sheet escaping | Two Node capture scripts generate disposable review HTML | Tooling lifetime differs from product HTML | Keep tooling-local unless a tooling-owned helper has complete tests |
| CSS selector escaping | Browser code uses native `CSS.escape` or local fallback wrappers | Selector syntax, not HTML | Retain distinct |
| Schema validators and `requireText` helpers | Validators encode domain-specific issue paths, repairs, cardinality, and trust decisions | Similar shape but different authority and failure contracts | Do not create a catch-all validator |
| `deepFreeze` helpers | Several authoring modules recursively freeze accepted artifacts | Possible authoring-local mechanical duplicate; not a sanitation mechanism | Compare generic typing, cycles, prototypes, and error behavior before consolidation |

The inventory baseline contains 29 private `escapeHtml` definitions, nine
private attribute-escaping definitions, and three private script-JSON escaping
definitions across `src/` and `scripts/`. Those counts are evidence of
duplication, not proof that all implementations should merge.

## Canonical ownership decision

The slice-3 contract should be renderer-neutral and should carry only:

- verified semantic object and expression refs;
- registered operation refs and exact operation-pack pins;
- canonical role bindings and lineage;
- explanation, composition, compression, and checkpoint intent; and
- deterministic compiler evidence.

Existing authorities continue to own:

- mathematics and normal forms: semantic sources and registered operations;
- timing and causal order: compiler-owned choreography and the shared clock;
- layout and responsive fit: presentation and reader plan compilers;
- DOM measurement, typography, glyphs, rules, paths, and paint ownership:
  the canonical renderer session;
- accessibility and interaction: native reader DOM; and
- no-JS, static, headless, iframe, and static-step output: existing projection
  and export compilers.

This inventory found no need to bypass an existing canonical authority and no
need for a parallel implementation.
