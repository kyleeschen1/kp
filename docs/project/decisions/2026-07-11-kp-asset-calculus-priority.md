# Decision: Make KP Asset Calculus The Next Priority

Date: 2026-07-11
Status: accepted

## Decision

Make KP Asset Calculus and the denotational animation/time protocol the next
priority before generated tutorial families, media encoder integration, or
graph/visual runtime unification.

KP assets should be immutable semantic diagrams with denotational
time-varying interpretations. Future LLM and human authoring should compose
assets through a small shared framework rather than inventing new animation,
export, flashcard, or external-port paths.

## Rationale

The recent capability-loading loop created a metadata dependency layer for
SemanticObjects, tutorial dependencies, export artifacts, and dashboard rows.
The next bottleneck is compositionality: humans, LLMs, generated problem
systems, external symbolic systems, program-trace systems, renderers, exports,
and flashcards need one predictable way to describe and inspect assets.

Category theory is used as design inspiration and law vocabulary:

- semantic objects behave like objects;
- semantic transformations behave like morphisms;
- composition, identity, representation changes, and external ports should
  satisfy explicit laws or report why they are lax/lossy.

Functional reactive programming is used as the time model:

- animation means a denotation such as `Time -> Frame`;
- playback, rewind, scroll, export sampling, and browser rendering all sample
  the same underlying behavior;
- effects such as DOM measurement, font readiness, WebGL allocation, and
  external imports stay at the boundary.

## Scope

The framework should define and document:

- `SemanticObject`;
- `SemanticTransformation`;
- `SemanticDiagram`;
- `Timeline`;
- `KpBehavior<T>`;
- `Interpreter`;
- `Port`;
- `FlashcardSpec`;
- `AssetBundle`;
- composition forms for sequence, parallel, tree/operad substitution, focus,
  and representation reinterpretation;
- law-checking levels for type checks, runtime validators, sampled equivalence,
  browser/pixel tests, and qualitative review.

## External Port Requirement

Deterministic external systems should be able to power KP animations by
mapping their artifacts into KP asset bundles.

Examples:

- a symbolic algebra system maps expressions, rewrite rules, assumptions, and
  proof traces into semantic objects and transformations;
- a generated problem system maps problem instances and solution steps into
  tutorial assets and flashcards;
- a program-trace system maps source files, call stacks, variable values,
  dataflow edges, and LSP references into source-code semantic objects,
  timelines, and focus animations.

Ports must preserve composition where possible and emit explicit diagnostics
when mappings are partial, lossy, opaque, or approximate.

## Priority Balance

Generated tutorial families remain the preferred first pressure test after the
framework is captured. Media encoder integration, graph/visual runtime
unification, dynamic package loading, and curriculum-scale generation should
follow the asset-calculus doctrine rather than preceding it.

This is not a decision to build a broad abstract category theory framework.
It is a decision to create a small KP-specific intermediate representation,
authoring guide, law suite, and canonical examples that make composition
predictable and inspectable.

## Law-Checking Policy

Laws are not purely qualitative and not purely type-checked.

- TypeScript should enforce structural shape, discriminated unions, branded
  ids where useful, source/target compatibility that can be known statically,
  and valid composition APIs.
- Runtime validators should enforce cross-reference integrity, selector
  existence, source/target alignment, provenance, package closure, and external
  port diagnostics.
- Law tests should check identity, associativity, composition preservation,
  deterministic sampling, rewind equivalence, and representation-shift
  commutation on canonical examples.
- Browser and pixel tests should check renderer-level equivalence only where
  semantic/sample tests cannot prove behavior.
- Human review remains necessary for pedagogy, visual clarity, and whether a
  lossy mapping is acceptable for an explanation.

## Next Actions

1. Write the KP Asset Calculus doctrine and composition-laws specs.
2. Write the LLM authoring guide for new assets, ports, animations, and
   flashcards.
3. Add dashboard/Theseus rows so future sessions can find the framework.
4. Implement the smallest core IR and law-checking helpers.
5. Prove the framework with one canonical vertical example, preferably linear
   equation solve followed by a generated algebra-trace port.
