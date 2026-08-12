# KP LLM Generation Entrypoint

Status: canonical routing guide
Updated: 2026-08-12

## Purpose

Give an LLM the smallest sufficient contract for creating or revising KP work.
Do not load the whole project history or ask a model to invent a complete
animation object graph from prose.

## Context Loading Order

1. `../roadmap.md`
2. `../threads/architecture-convergence.md`
3. `../principles/system-vocabulary.md`
4. the exact task source and its canonical exemplar
5. one relevant authoring contract or renderer guide
6. a brief Theseus context packet for selected executable work

Retrieve historical decisions only to answer a named provenance question.
Older experiments are evidence, not default implementation authority.

## Route The Task Before Generating

| Intended change | Canonical target |
| --- | --- |
| Revise learner prose or sparse semantic references | `kp.article.v1` source |
| Reuse an existing animation in new prose or a flashcard | Versioned vignette import and a new Article/projection instance |
| Propose a new semantic animation | `kp.llm-animation-draft.v2` with exact operation-pack pins and role bindings |
| Change how a known operation is taught | Typed pedagogical score or presentation profile |
| Change paint for one medium | Renderer adapter or theme role, preserving semantic/frame contracts |
| Change desktop/mobile composition | Projection, never Article semantics or motion truth |
| Import a verified problem or execution | Deterministic solver/interpreter trace, then governed semantic operations |

## Required Generation Sequence

1. Identify the canonical artifact, host, renderer, and accepted reference.
2. State the semantic source of truth and exact operation/capability pins.
3. Declare stable objects, roles, identity, correspondence, and provenance.
4. Select a registered semantic operation and presentation profile.
5. Compile through typed validation.
6. Repair only the rejected typed path.
7. Render through the existing sampled-frame and host boundary.
8. Verify semantic endpoints, direct seek/rewind, accessibility, and the
   smallest relevant visual checkpoint.

## The Model May Author

- prose and claims that are explicitly reviewable;
- semantic objects and source/target roles;
- references to registered operations and exact versioned packs;
- selector paths and correspondence claims when supported by provenance;
- pedagogical grouping, disclosure, focus target, and necessary context; and
- explicit uncertainty or typed gaps.

## The Model Must Not Author

- DOM, SVG paths, WebGL handles, Canvas commands, or renderer node identity;
- coordinates, measured bounds, keyframes, per-token delays, or timing tables;
- arbitrary CSS, typography, shadows, or colors as semantic truth;
- a new clock, scheduler, stage lifecycle, or lesson-local state store;
- semantic lineage inferred from equal text or glyphs;
- unverified mathematics, execution results, or causal order; or
- silent fallback to a generic fade or unrelated animation when an operation is
  unsupported.

## Failure Contract

Unknown operations, missing roles, incompatible correspondence, unavailable
capabilities, or unsupported renderer behavior produce a typed repair gap. A
repair gap names the rejected path, expected contract, available candidates,
and preservation boundary. The previous valid artifact remains active while a
draft is invalid.

## Generation Evaluation

Track:

- first-pass validity;
- validity after one typed repair;
- correct operation, motif, and renderer selection;
- role-binding and reference-closure errors;
- semantic endpoint and seek/rewind parity;
- silent-fallback count, which must remain zero;
- caller-specific code introduced; and
- human findings categorized as semantic, architectural, choreography,
  editorial, or purely aesthetic.

Promote a model-authored pattern only after one approved exemplar and a
structurally different second caller. Provide one accepted example and one
useful rejected/repair example for every promoted generation pattern.

## Related Guides

- `kp-animation-asset-llm-authoring-spec.md` contains the detailed animation
  asset and governed-operation contract.
- `kp-asset-authoring-guide.md` covers human-authored asset construction.
- `../principles/kp-article-v1.md` defines Article source and vignette imports.
- `../principles/codex-collaboration-protocol.md` governs implementation and
  visual review cadence.
