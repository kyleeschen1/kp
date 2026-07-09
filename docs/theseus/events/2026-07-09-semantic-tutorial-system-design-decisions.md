# Semantic Tutorial System Design Decisions

Date: 2026-07-09
Project: kp
Status: design-record

## Summary

Recorded the design direction from the semantic animation, object catalog,
curriculum, and embeddable tutorial-card discussion. The core decision is that
Kinetic Press should not become a collection of one-off JavaScript animations.
It should become a semantic tutorial system where LLMs generate and edit
structured explanations, while KP validates, executes, derives, renders, and
exports them through deterministic object, transformation, layout, and timeline
protocols.

## Primary Decisions

### Semantic Truth Is Separate From Visual Motion

- `SemanticObject` stores stable structured value and selectors.
- `SemanticTransformation` stores structure-aware operations from source
  objects to target objects.
- `CorrespondenceMap` records identity and provenance between selectors.
- `MotionPrimitive` stores reusable presentation behavior such as shift, fade,
  vanish, reveal, wrap, split, merge, focus, and morph.
- `VisualMotif` composes primitives into named animation styles such as
  cancelation, simplify-into, fraction-lift, matrix-row-operation,
  dot-product-accumulate, jacobian-local-linearization, and execution-step.

The current equation cancelation behavior is therefore not the semantic
operation itself. `cancelAdditiveInverse` is semantic; `cancelled-by` is
correspondence; "tokens meet, shrink to a minimum size, fade, then survivors
shift" is a visual motif.

### Use `SemanticTransformation`, Not `SemanticMapping`

`SemanticTransformation` is the durable category name. It better matches the
category-theory intuition that transformations are structure-preserving
morphisms between semantic objects and carry correspondence/provenance.

### Keep Runtime Types Small

Do not encode every mathematical category as a subclass. Use a small nominal
type system plus traits, predicates, constructors, capabilities, and curriculum
concept links.

Runtime types answer: "what structural data shape and core operations does this
object have?"

Examples of durable runtime types:

- `Matrix`
- `Vector`
- `Equation`
- `Function`
- `LinearMap`
- `AffineMap`
- `Graph2D`
- `Graph3D`
- `SourceFile`
- `ExecutionTrace`
- `Problem`
- `Solution`
- `LayoutObject`

Examples that should not become runtime subclasses:

- `IdentityMatrix`
- `SquareMatrix`
- `InvertibleMatrix`
- `PolynomialEquation`
- `QuadraticEquation`
- `EasyProblem`
- `HardProblem`

Those should be traits, predicates, constructors, templates, or curriculum
concepts. For example, an identity matrix is a `Matrix` with an identity
definition and traits such as `square`, `diagonal`, `symmetric`, and
`orthogonal`.

### Constructors, Templates, And Limited LaTeX Parsing Are Authoring Layers

Quick authoring helpers should not create type explosion.

- `identityMatrix(3)` is a constructor/template.
- `square` is a trait or predicate.
- a rendered `bmatrix` is a LaTeX representation.
- the semantic object remains `Matrix`.

Limited LaTeX parsing should return structured parse results with diagnostics:

- exact semantic object when meaning is clear;
- partial semantic object with unresolved diagnostics when incomplete;
- visual-only LaTeX when semantics are ambiguous or unsupported.

LaTeX templates may generate semantic objects, views, or visual-only LaTeX, but
the template itself is not usually the semantic object.

### Add A First-Class Derive/Representation Capability

Objects need a capability that produces alternate semantic representations:

- `Function -> Graph2D`
- `Equation -> Graph2D` when classifiable;
- `Graph2D -> LaTeX` when it preserves a symbolic source reference;
- `Rotation -> Matrix`
- `Scale -> Matrix`
- `AffineMap -> homogeneous Matrix`
- `Matrix -> LinearMap`
- `LinearMap -> Matrix` in a selected basis.

The rule is that exact source provenance matters. A graph generated from
`y = x^2` can recover/show the LaTeX source. A graph that only contains sampled
points can expose sampled data and an approximate fit, but must not pretend it
has exact symbolic LaTeX.

### Capabilities Are Optional And Lazy

Objects should advertise optional capabilities:

- `select`
- `render`
- `derive`
- `execute`
- `transform`
- `compare`
- `diagnose`
- `animate`
- `link`

Computational execution belongs only to qualifying objects. Results should be
structured semantic objects with provenance, not ad hoc raw values. Examples:

- `Matrix.execute("det") -> Scalar`
- `Matrix.execute("inverse") -> Matrix`
- `Function.execute("evaluate") -> Scalar`
- `Function.execute("sampleGrid") -> Dataset` or `Surface`
- `Equation.execute("solve") -> SolutionSet`
- `Code.execute("runTests") -> TestResult` or `ExecutionTrace`

### Organize Huge Libraries By Domain And Capability

Use domain libraries split into capability chunks. Avoid one giant math library
and avoid one package per tiny object.

Recommended shape:

```text
src/objects/
  record.ts
  registry.ts
  selectors.ts
  capabilities.ts
  refs.ts

src/domains/
  math-core/
  algebra/
  linear-algebra/
  calculus/
  graphs/
  diagrams/
  code/
```

Each domain should be internally split by capability:

```text
linear-algebra/
  metadata.ts
  selectors.ts
  render-latex.ts
  render-visual.ts
  execute.ts
  transform.ts
  animate.ts
  register.ts
```

The browser should load only metadata first, then lazily load render,
execution, WebGL, animation, inspector, or authoring capabilities when needed.

### Layout Objects Are First-Class Composition Objects

Layouts should be addressable and animated, but separate from math/code
semantics.

Add `LayoutObject` or `CompositionObject` for:

- row
- column
- stack
- grid
- split
- tabs
- overlay
- scroll sequence
- pinned stage
- synchronized panel
- callout

Layouts compose views of semantic objects. They expose selectors such as
`layout.tabs["matrix-views"].tab["grid"]` or
`layout.row["equation-and-graph-row"].child[1]`. Focus, active tab, scroll
position, and panel selection are presentation state rather than structural
semantic mutation.

### Add Curriculum Concepts As A Separate Graph

Curriculum concepts should not be confused with semantic objects. Add
`CurriculumConcept`, `Skill`, `Misconception`, `Fixture`, and `AssessmentItem`
as separate graph entities.

Example:

```text
Concept: Eigenvector
  prerequisites:
    - Vector
    - LinearMap
    - MatrixVectorMultiplication
    - ScalarMultiplication
  canonical objects:
    - Vector
    - Matrix
    - LinearMap
    - EigenSystem
  common misconceptions:
    - eigenvectors are not unique
    - eigenvalues are not vectors
    - most vectors change direction
  animation motifs:
    - linear-map-deform
    - direction-preservation
    - matrix-vector-action
```

This concept graph supports customized curriculum, learner modeling,
dependency-aware generation, and targeted remediation.

### Problems, Solutions, And Cards Are Semantic Objects

Problem generation should produce structured semantic objects and verified
solutions, not plain text.

Add:

- `ProblemTemplate`
- `ProblemInstance`
- `Solution`
- `SolutionStep`
- `AssessmentItem`
- `SpacedRepetitionCard`
- `LearnerMemory`
- `ReviewEvent`

Capabilities:

- `generateVariants(template, constraints)`
- `solve(problem)`
- `verifySolution(solution)`
- `gradeResponse(response)`
- `diagnoseWrongAnswer(response)`
- `scheduleReview(card, learnerState)`
- `adaptNextProblem(learnerState)`

Generated math/science problems must be verified by execution whenever possible.
LLMs may propose; KP should compute, verify, diagnose, and render.

### Mini Tutorial GIFs Are Exports Of Executable Tutorials

The high-value artifact is an executable semantic tutorial, not the exported
GIF. A mini tutorial should contain:

- concept refs;
- object graph;
- transformation sequence;
- layout;
- timeline;
- captions/narration;
- verification checks;
- export settings.

The same source should render as an interactive card, scrubbable embed,
animated GIF, MP4/WebM, static step sequence, spaced-repetition card, worked
example, or nested lesson section.

Generation pipeline:

```text
LLM proposes tutorial spec
-> KP resolves semantic objects
-> KP executes/verifies computations
-> KP validates transformations
-> KP compiles timeline/layout
-> KP renders preview
-> KP exports GIF/video/card
-> KP stores provenance and dependency tags
```

### Embeddable Cards Should Be Semantic Capsules

Cards should not each ship the full runtime. They should be semantic capsules
with dependency manifests and progressive rendering.

Two embed modes:

- web component/same-page card for pages we control or trust;
- iframe capsule for external websites and sandboxing.

Cards should render a cheap fallback first, then lazy-load only needed
capabilities. A pure equation card should not load Three.js. A 3D graph card
may load graph WebGL and Three.js only when it becomes visible or interactive.

Iframe nesting should be avoided when possible. Prefer one iframe containing a
KP layout tree rather than many independent iframes each booting a separate
runtime.

### Three.js Is A Lazy Graph Capability

Three.js is acceptable as a cached/lazy dependency for 3D graph cards, but it
must not be part of the core runtime or every card.

Costs to manage:

- download cost is mostly cacheable;
- parse/compile cost may repeat per JS context;
- memory cost persists per active runtime;
- WebGL contexts are GPU resources;
- iframes duplicate runtime worlds.

Therefore graph/WebGL capabilities should be dynamically loaded by manifest
classification: critical, interactive, optional, and fallback.

### LLMs Should Orchestrate; KP Should Verify

The durable product is:

```text
LLM generates and edits semantic explanations
-> KP validates/executes/transforms them
-> KP renders synchronized animated views
-> learner model chooses what to show next
```

LLMs should choose concepts, instantiate objects, compose transformations,
select views/layouts, request derived representations, and revise explanations.
KP should own mathematical truth, execution, derivation, validation, identity,
sampling, and rendering.

## Current Implemented Anchors

- Equation motion is operation-first for the `x + 3 = 7` demo.
- Cancelation and final simplification use semantic operations with sampled
  token motion.
- The equation collapse minimum-size slider defaults to 35%.
- Graph rendering has active WebGL/Three.js work, but graph playback still needs
  unification under the shared time/playhead protocol.
- Project dashboard v1 already has work cards, galleries, report cards, and a
  source-backed write protocol.

## Source Refs

- `docs/superpowers/specs/2026-07-08-structured-instructional-objects-design.md`
- `docs/superpowers/specs/2026-07-08-rendering-time-protocol-design.md`
- `docs/superpowers/specs/2026-07-08-operation-first-equation-motion-design.md`
- `docs/superpowers/specs/2026-07-08-katex-webgl-equation-transitions-design.md`
- `docs/superpowers/specs/2026-07-08-project-dashboard-v1-design.md`
- `docs/superpowers/specs/2026-07-09-animation-entity-taxonomy-design.md`
- `src/editor/equation-motion-demo-controller.ts`
- `src/editor/editor.ts`
- `src/project-dashboard/data.ts`
- `src/semantic/document.ts`

## Recommended Next Records

- Create a spec for `derive` / representation capability.
- Create a spec for domain library and capability chunk organization.
- Extend the animation entity taxonomy with `LayoutObject`, `CurriculumConcept`,
  `ProblemTemplate`, `ProblemInstance`, `Solution`, and
  `SpacedRepetitionCard`.
- Add dashboard gallery cards for the new object families once the taxonomy
  stabilizes.

## Verification

This is a manual design-provenance record. No runtime behavior changed in this
event.

## Theseus CLI Status

`npm run theseus` remains unavailable because this repository has no `theseus`
package script. This design record is stored manually under
`docs/theseus/events`.
