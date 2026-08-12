# KP System Vocabulary

Status: canonical
Accepted: 2026-08-12

## Purpose

Use one language from verified computation through learner products. This file
joins architecture, authoring, animation, and product terms; the more detailed
lesson vocabulary remains in `motion-passage-vocabulary.md`.

## Canonical Terms

| Term | Meaning |
| --- | --- |
| **Semantic object** | An immutable, stably identified mathematical, program, graph, or conceptual entity with provenance. |
| **Semantic transformation** | A meaningful operation from source objects to target objects, with correspondence, assumptions, and lineage. |
| **Canonical semantic trace** | Verified causal transformations supplied by a solver, interpreter, authored proof, or trusted fixture. |
| **Pedagogical score** | A typed choice of grouping, disclosure, emphasis, and explanation order that may simplify a trace without contradicting it. |
| **Presentation profile** | Reusable renderer-neutral policy for expressing a semantic operation through named motifs and phases. |
| **Motion plan** | The resolved renderer-neutral choreography produced from semantic truth plus a presentation profile. |
| **Motion block** | One seekable semantic timeline with meaningful beats. It is not a page-layout container. |
| **Sampled frame** | The complete deterministic semantic and presentation state at one playhead position. |
| **Renderer adapter** | A medium-specific projection that paints sampled state in KaTeX/DOM, SVG, Canvas, WebGL, or a code surface. It owns paint, not meaning or time. |
| **Animation asset** | A reusable executable semantic animation: objects, transformations, capabilities, motion, checks, and projection metadata. |
| **Vignette** | A versioned reusable preset that binds an animation asset to named checkpoints, transitions, object paths, accessibility, and a projection contract. |
| **Article** | A canonical `kp.article.v1` Markdown source containing ordinary prose plus sparse typed references to vignettes, focus, and motion. |
| **Lesson document** | The general content category for an article, tutorial, or essay; use **Article** when referring to the v1 source contract. |
| **Stage** | One visual display instance of a vignette inside a projection. |
| **Passage** | One authored textual unit with a stable identity when semantic focus, navigation, or motion requires it. |
| **Projection** | A replaceable presentation of Article IR and vignettes, such as static, stacked, split, deck, embed, or export. |
| **Host** | The application or custom-element boundary that mounts projections and capabilities. Svelte may own host composition but not semantic/runtime authority. |
| **Internal Studio** | The first-party development application containing the Catalogue and Internal Editor. |
| **Public Web** | The first-party learner-facing application containing the mission site and curated content. |

## Authority Order

```text
solver / interpreter / authored proof
-> canonical semantic trace
-> pedagogical score and presentation profile
-> motion plan
-> sampled frame
-> renderer adapter
-> vignette
-> Article projection and product host
```

Downstream layers may add presentation information but may not rewrite upstream
truth. Layout never becomes semantic identity. Renderer nodes never become
canonical objects. The Article never owns frame-by-frame geometry.

## Usage Rules

- Use **trace** for verified causal truth and **score** for pedagogical
  selection. Do not call the browser's execution order a lesson plan.
- Use **motion block** for runtime time and **motion passage** for compound
  lesson content.
- Use **stage** for the display instance and **projection** for the layout
  representation.
- Use **vignette** for reusable presentation and **animation asset** for its
  executable semantic source.
- Treat `card`, `screen`, `scene`, `row`, `column`, `scroll block`, and
  `attention stage` as visual styles, projection names, or historical terms;
  they are not architecture primitives unless a local implementation literally
  requires them.
- Do not perform repository-wide renames solely for vocabulary. Migrate public
  names when their owning slice is already changing and compatibility is
  explicit.

## Related Authority

- `motion-passage-vocabulary.md` defines lesson-content and scroll terms.
- `kp-article-v1.md` defines the authoring grammar and vignette boundary.
- `../authoring/llm-generation-entrypoint.md` routes model-authored work.
- `../../../src/architecture/semantic-animation-layer-ownership.ts` enforces compiler
  dependency direction.
