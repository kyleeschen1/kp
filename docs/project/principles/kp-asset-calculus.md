# KP Asset Calculus Doctrine

Date: 2026-07-11
Status: active doctrine

## Purpose

KP Asset Calculus is the small shared framework that lets humans, LLMs,
generated problem systems, external symbolic systems, program traces,
renderers, exports, and flashcards talk about the same instructional artifact.

It exists to make composition predictable. An author should be able to build a
small correct asset, compose it with other assets, sample it at any time,
inspect what it is doing, and reuse it in a tutorial, dashboard card, export,
or flashcard without inventing a new path.

The doctrine is intentionally KP-specific. Category theory supplies vocabulary
for identity, composition, representation change, and preservation. Functional
reactive programming supplies the time model. KP supplies the concrete artifact
types, tests, validators, and renderer seams.

The companion law document is
`docs/project/principles/kp-composition-laws.md`.

## Core Rule

Semantic truth is immutable; presentation is derived and mutable.

Semantic assets record stable objects, transformations, diagrams, provenance,
selectors, and laws. Renderers, DOM nodes, WebGL objects, layout boxes,
measurement caches, playback controls, and focus effects are runtime
representations of that truth. They can be recreated, retimed, replaced, or
optimized without changing the semantic asset.

## Vocabulary

### SemanticObject

A `SemanticObject` is an immutable structural value with a stable id, type,
selectors, metadata, and optional capabilities.

Examples:

- equation;
- expression;
- matrix;
- vector;
- graph;
- curve;
- source file;
- execution trace;
- table;
- network;
- layout.

Changing the object's mathematical, programmatic, or instructional structure
creates a new object. Changing its current focus, layout, sampled time, theme,
or renderer node does not.

### SemanticTransformation

A `SemanticTransformation` is a structure-aware mapping from source objects to
target objects. It records what identity it preserves, what selectors
correspond, what assumptions it depends on, and what provenance it creates.

Examples:

- subtract from both sides;
- cancel additive inverses;
- distribute;
- factor;
- wrap in a function;
- differentiate;
- apply a matrix;
- step an execution trace;
- reinterpret an expression as a graph.

The transformation is not the animation. The animation is one possible
interpretation of the transformation.

### SemanticDiagram

A `SemanticDiagram` composes objects and transformations. It is the artifact
level at which KP can say:

- these steps run in sequence;
- these steps run in parallel;
- this operation is a tree of sub-operations;
- this transformation can be drilled into;
- this representation is a different view of the same structure;
- this generated trace maps into this authored explanation.

The diagram is the main unit for tutorial cards, generated solutions, exports,
flashcards, and future external ports.

### KpBehavior

A `KpBehavior<T>` is a deterministic denotation over time:

```ts
type KpBehavior<T> = (time: KpTime) => T;
```

Playback, rewind, scroll, scrubbers, media export, tests, and browser rendering
must sample the same behavior. Rewind is not a second animation; it is the same
behavior sampled with decreasing time.

Behaviors may depend on prepared renderer measurements, font readiness, or
WebGL resources, but those effects must be resolved before or outside the pure
sampling function.

### Interpreter

An `Interpreter` maps semantic assets or diagrams into a target representation.

Examples:

- KaTeX/DOM frame interpreter;
- WebGL graph interpreter;
- static-step export interpreter;
- frame-sequence export interpreter;
- flashcard interpreter;
- dashboard preview interpreter;
- program-trace panel interpreter.

Interpreters should preserve composition where practical: interpreting a
composed diagram should match composing the interpretations of its parts, or
the interpreter should report an explicit reason why it is lax, partial, or
lossy.

### Port

A `Port` maps deterministic external data into KP assets.

Examples:

- CAS/proof trace to equation transformation diagram;
- generated algebra problem and solution steps to tutorial asset;
- program execution trace to source-code and dataflow assets;
- LSP references to selectable source relationships;
- graphing library data to graph semantic objects.

Ports are allowed to be partial. They are not allowed to be silent. A port that
cannot preserve source identity, assumptions, selector correspondence, or step
semantics must emit diagnostics.

### FlashcardSpec

A `FlashcardSpec` asks a question over an asset, diagram, time slice, selector,
or transformation.

Examples:

- blank this selector;
- predict the next transformation;
- explain why this cancellation is valid;
- identify what changes under this representation;
- compare Jacobian and Hessian structure;
- focus the line that caused this program state.

Flashcards are not separate hand-authored copies of tutorial content. They are
queries and prompts over reusable assets.

## Composition Forms

KP supports a small set of composition forms first:

- identity: an object or diagram does nothing but preserve its value;
- sequence: one transformation follows another;
- parallel: independent transformations share a clock or layout;
- tree substitution: a composite operation expands into child operations;
- focus: a semantic object or selector is emphasized without changing
  structure;
- reinterpretation: the same or related semantic structure is viewed through a
  different representation;
- port import: an external deterministic trace becomes a KP asset bundle with
  provenance and diagnostics.

These forms are enough to express algebra solution steps, matrix operations,
graph/equation comparisons, code execution explanations, and flashcard
variants without inventing custom orchestration for each example.

## Denotational Time

Every animated asset should have one source of time truth.

```text
asset + diagram + layout context + time -> sampled frame
```

The sampled frame is explicit enough for renderers and tests. It can include
selector poses, visibility, focus state, annotations, layout regions, graph
camera state, code highlights, and export markers.

The frame is not canonical semantic state. It is a deterministic projection of
semantic state at one time.

## Boundary Discipline

Pure layer:

- semantic objects;
- semantic transformations;
- diagrams;
- timelines;
- behaviors;
- selectors;
- provenance;
- law helpers;
- deterministic fixtures.

Effect boundary:

- DOM measurement;
- KaTeX rendering;
- font loading;
- WebGL allocation;
- image/video encoding;
- external CAS or LSP calls;
- browser event handling;
- renderer caches.

The effect boundary may cache aggressively for speed, but it must not become
the owner of semantic identity.

## Authoring Rules

1. Start from semantic intent, not visual effect.
2. Assign stable ids to objects, transformations, selectors, and examples.
3. Record source and target objects for every structural change.
4. Record selector correspondence where identity persists.
5. Use standard composition forms before inventing a custom orchestration.
6. Represent visual motifs as interpretations of transformations.
7. Make every animation seekable and deterministic before adding playback UI.
8. Emit diagnostics when a port or interpreter cannot preserve structure.
9. Prefer one canonical example with strong laws over many weak examples.
10. Keep qualitative pedagogy review separate from structural correctness.

## First Vertical Proof

The first proof target is the existing linear equation solve:

```text
x + 3 = 7
subtract 3 from both sides
x + 3 - 3 = 7 - 3
cancel additive inverses
x = 4
```

The proof should demonstrate:

- immutable equation objects at each structural state;
- transformations for subtracting both sides, cancellation, and simplification;
- selector correspondence for persistent `x`, `=`, and surviving constants;
- a behavior that can be sampled forward, backward, by scroll, and by export;
- flashcards over hidden terms, next steps, and transformation explanations;
- an algebra-trace port fixture that can generate the same asset bundle.

## Non-Goals

- building a general category theory library;
- making every mathematical adjective a type;
- proving all laws at compile time;
- replacing renderer-specific optimization;
- implementing live CAS, LSP, GIF, MP4, or graph-runtime unification before the
  core asset contract is stable.
