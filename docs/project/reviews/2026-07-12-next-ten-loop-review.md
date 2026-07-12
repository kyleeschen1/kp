# KP Next Ten Loop Review

Date: 2026-07-12
Status: planning review

## Recommendation

Keep the roadmap ordering unchanged:

```text
semantics first
-> runtime second
-> renderers third
-> authoring and generation fourth
```

The next ten loops should turn the Asset Calculus from a proven linear-solve
path into a cross-domain authoring/runtime substrate. The sequence should
prioritize semantic coverage and renderer-neutral frame contracts before media,
curriculum, or dynamic package loading.

## Candidate Order

| # | Loop | Primary Value | Risk | Recommendation |
|---:|---|---|---|---|
| 1 | Generated math family expansion | Reuse, demo value, generation | Medium | Do first |
| 2 | KaTeX semantic transform library | Identity semantics, visual motif coverage | Medium | Do second |
| 3 | Transformation composition tree editor | Runtime reliability, author control | Medium | Do third |
| 4 | Graph/vector frame adoption | Cross-renderer proof | Medium-high | Do fourth |
| 5 | Layout and synchronized panel protocol | Tutorial composition | Medium | Do fifth |
| 6 | Dashboard authoring actions | Authoring workflow | Medium | Do sixth |
| 7 | External trace ports | CAS/program/LSP integration | Medium-high | Do seventh |
| 8 | Export/media encoder adoption | Product output | Medium-high | Do eighth |
| 9 | Flashcard/problem-generation capsule | Learning layer | High | Do ninth |
| 10 | Capability package loading boundary | Shipping scale | High | Do tenth |

## Loop Sketches

1. **Generated Math Family Expansion**
   Expand generated fixtures beyond linear solves into fractions, radicals,
   exponents, function wrapping, distribution/factoring, and simple calculus
   forms. The goal is to prove that generation can produce semantic objects,
   transformations, flashcards, drill-downs, exports, manifests, diagnostics,
   and browser-rendered samples without hand-authored special cases.

2. **KaTeX Semantic Transform Library**
   Promote unusual equation geometry into named semantic transformations and
   visual motifs: cancellation, vanish, simplify, wrap, unwrap, exponentiate,
   radicalize, distribute, factor, fraction split/merge, limit/int/sum/product
   entry, matrix bracket switch, and operator-only disappearance. This is the
   identity-preservation lab for the whole system.

3. **Transformation Composition Tree Editor**
   Make transformation trees inspectable and editable: sequence, parallel,
   nested transforms, higher-order transforms, pauses, annotations, focus, and
   emphasis. This protects the authoring goal: humans and LLMs can decompose or
   recompose existing explanations without changing semantic truth.

4. **Graph And Vector Frame Adoption**
   Convert graph/vector panels to consume semantic frames instead of owning
   their own timing model. Start with synchronized equation/graph comparisons:
   line solving, vector transforms, rotation/scale matrices, tangent lines,
   tangent planes, Jacobian/Hessian comparison, and local linearization.

5. **Layout And Synchronized Panel Protocol**
   Make row, column, stack, split, grid, tabs, overlay, pinned stage, and scroll
   sequence into first-class layout objects with sampled layout state. This is
   the bridge from isolated cards to composed lessons.

6. **Dashboard Authoring Actions**
   Turn dashboard maturity rows into actions: create fixture, inspect closure,
   open sample, compare variants, run smoke, export sample, view dependencies,
   and jump to source refs. Keep the agenda-style table as the navigation layer.

7. **External Trace Ports**
   Build real adapter patterns for deterministic external sources: symbolic
   algebra traces, generated problem solutions, program dataflow, call stacks,
   LSP references, and proof traces. Ports should emit KP assets plus
   provenance and diagnostics, not renderer-specific commands.

8. **Export And Media Encoder Adoption**
   Make GIF/video/image-sequence encoders consume the same frame-sequence
   artifact and dependency manifests used by previews. This should happen only
   after generated fixtures and graph/code frames share stable contracts.

9. **Flashcard And Problem-Generation Capsule**
   Add problem templates, problem instances, solution-step verification,
   prompt/reference cards, blankable regions, predict-next-step prompts, and
   concept refs. This starts the curriculum layer without pretending KP is a
   full CAS or theorem prover.

10. **Capability Package Loading Boundary**
    Once math, graph, programming, export, and dashboard paths all use package
    manifests consistently, define the first dynamic loading boundary. The goal
    is small embeddable capsules with lazy capabilities and honest fallbacks,
    not premature package splitting.

## Why This Order

- Generated math expansion tests whether the current Asset Calculus contracts
  scale beyond the hand-authored linear-solve path.
- KaTeX remains the best proof lab because identity errors and geometry
  problems are immediately visible.
- Composition and layout should come before broad authoring so authors and LLMs
  have stable primitives to compose.
- Graph/code ports should adopt the same frame contract before media encoders
  harden the output format.
- Curriculum, spaced repetition, and package loading become powerful only after
  the semantic/runtime/renderer seams are boring and repeatable.

## Roadmap Impact

No roadmap change is recommended. This review refines the current near-term
priority order while preserving the documented active direction.
