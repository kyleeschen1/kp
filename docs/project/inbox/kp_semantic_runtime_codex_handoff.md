# Kinetic Press Semantic Runtime — Codex Handoff

## Purpose

This document hands off the current design direction for Kinetic Press (KP) to Codex.

The central idea is to make KP more than an animation library. KP should provide a **small semantic runtime plus a large extensible standard library of mathematical and technical objects, transformations, derivations, examples, and presentations**.

The runtime should make it easy to author explanations where meaning, identity, dependencies, transformations, and reusable presentations are explicit enough that KP can automate boilerplate such as:

- labeling semantic sub-objects at multiple scales,
- linking related concepts and dependencies,
- generating useful popups and reference views,
- selecting canonical animations,
- generating flashcards and exercises,
- finding backlinks and invocation sites,
- checking units and assumptions,
- validating transformations and rewrite rules,
- warning when shared semantic resources change incompatibly,
- helping LLMs retrieve and compose trusted explanatory “vignettes.”

The system must remain easy to author. The semantic model may be rich internally, but the public API should stay small, composable, discoverable, and progressively adoptable.

---

# 1. Product Thesis

KP should become a **semantic substrate for technical communication**.

The important abstraction is not “animated equation.” It is:

> Meaningful objects undergo meaningful transformations while retaining identity across representations.

Animation is one useful projection of that semantic structure.

Other projections include:

- equations,
- graphs,
- tables,
- diagrams,
- reference rows,
- popups,
- search results,
- worked examples,
- canonical derivations,
- flashcards,
- exercises,
- LLM context.

The same semantic object or transformation should be reusable across many of these without rewriting the underlying knowledge.

---

# 2. Design Goals

## 2.1 Authoring goals

KP should optimize for:

1. **Low boilerplate**
2. **Typed-string ergonomics**
3. **Extensibility**
4. **Composition over inheritance**
5. **Graceful fallback to KaTeX**
6. **Good defaults**
7. **Progressive enrichment**
8. **Strong diagnostics**
9. **Reusable semantic knowledge**
10. **LLM-friendly retrieval and composition**

A lesson author should usually work with simple constructors and registered semantic IDs, not graph internals.

A semantic-library author may use lower-level schemas and composition.

KP internals can be more general still.

These three layers should not be exposed equally.

---

## 2.2 Non-goals

Do **not** turn KP into:

- Mathematica,
- Lean,
- Coq,
- a complete theorem prover,
- a universal ontology of mathematics,
- a graph database product,
- a full CAS,
- a programming language that authors must learn before using KaTeX.

KP should encode enough semantics to improve explanation, transformation, reuse, validation, and interaction.

It should not attempt to exhaust mathematical meaning.

---

# 3. Core Architectural Principle

Keep the **semantic graph rich** while keeping the **author-facing API small**.

Prefer a small set of generic operations such as:

```ts
obj(...)
ref(...)
rel(...)
template(...)
rule(...)
match(...)
apply(...)
query(...)
select(...)
view(...)
math(...)
```

Avoid APIs that grow one bespoke method per concept:

```ts
jacobian.showRows()
jacobian.getDependencies()
jacobian.makeFlashcard()
jacobian.findExamples()
jacobian.animateCanonical()
```

The vocabulary may become large. The API surface should not.

---

# 4. Semantic Objects

A semantic object is an entity with stable identity and composable semantic components.

Do not encode mathematics as a rigid inheritance hierarchy.

For example, a Jacobian is not best modeled as:

```text
MathematicalObject
  -> Matrix
    -> Jacobian
```

A Jacobian is more naturally a relationship-rich object that may participate in several structures:

- derivative,
- local linear map,
- matrix representation,
- function-dependent object,
- dimensional object,
- coordinate-dependent representation.

Prefer composition:

```text
Jacobian
+ derivative semantics
+ matrix-like representation
+ parameterization
+ dependencies
+ canonical views
+ canonical derivations
```

The same applies throughout applied mathematics, where no single hierarchy captures all useful roles.

---

# 5. Identity

Identity is a first-class concern.

Distinguish at least:

## 5.1 Semantic identity

“This is the same mathematical object.”

Example: three rendered occurrences of `x` may all refer to the same variable.

## 5.2 Occurrence identity

“This is this particular appearance of the object.”

Two occurrences of the same variable in one formula should remain separately addressable.

## 5.3 Structural identity

“These expression trees have the same shape.”

Useful for matching and caching.

## 5.4 Mathematical equivalence

“These expressions denote the same thing under assumptions.”

Do not conflate this with object identity.

## 5.5 Transformation correspondence

“This output fragment arose from, copied, merged, split from, or replaced that input fragment.”

Correspondence may be:

```text
one -> one
one -> many
many -> one
one -> none
none -> one
```

This is crucial for animation and provenance.

---

# 6. Objects, Occurrences, Anchors, and Bindings

Rendered content and semantic content should remain separate.

Internally distinguish:

## Entity

The semantic object.

## Occurrence

A particular use of an entity in a representation or explanation.

## Anchor

An addressable rendered fragment.

## Binding

Connects an occurrence and semantic role to one or more rendered anchors.

Illustrative shape:

```ts
type Binding = {
  occurrence: OccurrenceId
  subject: EntityId
  context: ContextId
  role?: RoleId
  anchors: readonly AnchorId[]
}
```

This is especially important because mathematical semantics are often nested and overlapping.

For a Jacobian entry:

```math
\frac{\partial f_i}{\partial x_j}
```

the same rendered region can participate in:

- a partial derivative,
- a Jacobian entry,
- row `i`,
- column `j`,
- the whole Jacobian,
- a local linear map,
- a larger derivation step.

Do not force the semantic graph to match the DOM tree.

---

# 7. Context and Emergent Meaning

Meaning is often not intrinsic to an object.

It may arise from:

- role in a larger structure,
- current goal,
- disciplinary context,
- active proof state,
- chosen representation,
- local assumptions,
- current pedagogical focus.

Example:

```math
P(k)
```

is not intrinsically an “induction hypothesis.”

It becomes the induction hypothesis inside a proof-by-induction context.

Similarly, `x` may be:

- a coordinate,
- a random variable,
- a decision variable,
- a state variable,
- a dummy variable,
- a parameter.

Therefore use layered semantics:

## Intrinsic-ish semantics

Stable facts such as:

- scalar-like,
- references variable `x`,
- has unit `m/s`.

## Relational semantics

Facts such as:

- derivative of `f`,
- depends on `x`,
- justified by chain rule.

## Contextual semantics

Facts such as:

- induction hypothesis here,
- decision variable here,
- target quantity here,
- currently viewed as a local linear map.

Context should be first-class enough that a lens can render:

```ts
view(x, "popup", { context })
```

and show the locally useful meaning.

Do not require one canonical decomposition of an object.

Overlapping interpretations are expected.

---

# 8. Representations

Objects should support multiple representation levels.

## 8.1 Abstract representation

Captures generic structure without committing to symbols.

Example: an `m x n` Jacobian with entries:

```math
(J_f(x))_{ij} = \frac{\partial f_i}{\partial x_j}
```

The object knows:

- input dimension,
- output dimension,
- rows,
- columns,
- input variables,
- output components,
- entry semantics.

## 8.2 Symbolic representation

Compact handle:

```math
J
```

or:

```math
J_f
```

or:

```math
Df_x
```

The symbol should remain linked to the full semantic object.

## 8.3 Minimal concrete representation

A canonical generated instance with sensible defaults.

For a `2 x 2` Jacobian:

```math
f(x,y)=
\begin{bmatrix}
f_1(x,y)\\
f_2(x,y)
\end{bmatrix}
```

and:

```math
J_f(x,y)=
\begin{bmatrix}
\frac{\partial f_1}{\partial x} &
\frac{\partial f_1}{\partial y}\\
\frac{\partial f_2}{\partial x} &
\frac{\partial f_2}{\partial y}
\end{bmatrix}
```

Defaults should be configurable, not hardcoded into ontology.

## 8.4 Concrete instance

A specific bound example:

```math
f(x,y)=
\begin{bmatrix}
x^2y\\
\sin x+y
\end{bmatrix}
```

with its actual Jacobian.

These should all be views or instantiations of the same semantic object family.

---

# 9. Templates

Templates generate semantic structure.

They should be more powerful than string or AST templates.

Example:

```ts
const J = jacobian({
  inputDim: 3,
  outputDim: 2,
})
```

The template may automatically generate:

- source function,
- inputs,
- outputs,
- entries,
- row groupings,
- column groupings,
- dimensions,
- symbolic form,
- abstract form,
- minimal concrete form,
- standard relationships,
- default labels,
- default semantic selectors.

This is where most boilerplate reduction should happen.

Templates can operate at large scales too.

Example:

```ts
CompetitiveMarket({
  supply,
  demand,
  tax,
})
```

may generate:

- supply curve,
- demand curve,
- equilibrium,
- equilibrium price,
- equilibrium quantity,
- consumer surplus,
- producer surplus,
- tax revenue,
- deadweight loss,
- dependency graph.

Templates should emit semantic objects and relationships, not only rendered notation.

---

# 10. Parameterization and Substitution

Objects should be parameterizable.

The point is not merely string interpolation.

A semantic template should support meaningful substitution of compatible sub-objects.

Example:

```ts
quadraticFamily.instantiate({
  a: slider("a"),
  x: quantity("position"),
})
```

or, where semantically valid:

```ts
substitute(quadraticFamily, {
  square(x): normSquared(v),
})
```

This enables semantic macros and reusable explanation structures.

---

# 11. Relationships and Backlinks

Semantic relations should be traversable in both directions.

Examples:

```text
contains
depends-on
derived-from
instance-of
example-of
counterexample-of
used-by
invokes
justified-by
represents
corresponds-to
implements
```

If:

```text
A --justified-by--> ChainRule
```

then KP should automatically make the reverse query possible:

```text
ChainRule <--justifies-- A
```

Backlinks should be generated, not manually maintained.

A principle’s reference page might include:

- definition,
- canonical form,
- canonical animation,
- examples,
- counterexamples,
- invocations,
- dependencies,
- related principles,
- flashcards,
- derivations.

Backlinks should preserve scope.

Say:

> used in this document

or:

> used in this indexed library

rather than implying universal completeness.

---

# 12. Properties

Properties should be first-class semantic entities or entity facets, not mere tags.

Examples:

- symmetric,
- continuous,
- differentiable,
- invertible,
- positive definite,
- commutative.

A property may expose:

- predicate,
- domain of applicability,
- equivalent characterizations,
- tests,
- examples,
- counterexamples,
- consequences,
- ways to establish it.

Example:

```ts
PositiveDefinite = Property({
  appliesTo: MatrixLike,
  predicate: ...
})
```

The same property may have multiple equivalent characterizations.

KP should know that these are alternative views of one property, not unrelated facts.

---

# 13. Methods and Algorithms

Abstract methods such as Gaussian elimination, implicit differentiation, proof by contradiction, and proof by induction should be semantic entities with typed internal roles.

## 13.1 Gaussian elimination

An algorithm-like entity may describe:

- input shape,
- allowed moves,
- invariants,
- stopping condition,
- goal state.

An execution of Gaussian elimination produces a concrete transformation sequence.

The abstract algorithm and the execution trace are distinct objects.

## 13.2 Implicit differentiation

This is better modeled as a goal-directed method than a fixed procedure.

It may include roles such as:

- implicit relation,
- dependent variable,
- independent variable,
- differentiated relation,
- target derivative.

A method can compose other methods and transformations.

## 13.3 Proof by induction

A proof method can generate typed roles:

```text
ProofByInduction
├── proposition schema
├── induction variable
├── base case
├── induction hypothesis
├── induction step
├── step target
└── conclusion
```

These are semantic roles, not merely headings.

Likewise proof by contradiction may contain:

- original claim,
- negated assumption,
- derived consequences,
- contradiction,
- discharged assumption,
- conclusion.

General principle:

> A method is often a semantic template plus roles, applicability conditions, allowed transformations, and goal structure.

---

# 14. Transformations

Transformations should be first-class semantic objects.

A transformation should carry:

- inputs,
- outputs,
- applicability,
- assumptions,
- effects,
- invariants,
- correspondence,
- justification,
- provenance,
- optional presentation hints.

Illustrative form:

```ts
type Transformation = {
  parameters
  applicability
  inputs
  outputs
  assumptions
  effects
  correspondence
  justification
  semanticDependencies
  presentationHints?
}
```

A transformation sequence should itself be a first-class transformation-like object.

Examples:

- Complete the square
- Factor quadratic
- Solve by elimination
- Derive Euler-Lagrange equation

Nested transformation sequences should be possible.

The semantic transformation should exist independently of animation.

Animation is one presentation of the transformation.

---

# 15. Rewrite Rules and Matching

Rewrite rules are transformations with match behavior.

Example:

```ts
rewrite({
  pattern: multiply($a, add($b, $c)),
  replace: add(
    multiply($a, $b),
    multiply($a, $c)
  )
})
```

A match result should return useful bindings:

```ts
{
  target,
  bindings: {
    a: ...,
    b: ...,
    c: ...
  },
  assumptions,
  confidence: "exact"
}
```

Matching should be composable.

Useful primitives may include:

```text
structure(...)
semanticRole(...)
hasCapability(...)
dependsOn(...)
hasForm(...)
contains(...)
dimension(...)
units(...)
assumption(...)
```

Avoid one enormous magical matcher.

Keep matching bounded.

Start with:

- structural matching,
- typed slots,
- explicit side conditions,
- hygiene for variable binding.

More expensive matching strategies should be opt-in.

Distinguish:

- no match,
- match,
- conditional match,
- search budget exhausted.

---

# 16. Canonical Derivations

Canonical derivations should be first-class named semantic objects.

Example:

```math
K=\frac12mv^2
```

and:

```math
p=mv
```

lead to:

```math
K=\frac{p^2}{2m}
```

The relationship matters, but so does the route.

A canonical derivation is a named reusable pathway connecting concepts.

Example shape:

```ts
defineDerivation("mechanics.kinetic-energy-from-momentum", {
  from: [KineticEnergy, Momentum],
  assumptions: [ClassicalMechanics, ConstantMass],
  result: relation`K = p^2 / (2m)`,
  steps: [
    use(MomentumDefinition),
    solveFor("v"),
    substituteInto(KineticEnergyDefinition),
    simplify(),
  ],
})
```

A canonical derivation should be able to expose:

- concepts involved,
- assumptions,
- result,
- transformation sequence,
- explanations,
- canonical animation,
- examples,
- dependencies,
- backlinks,
- flashcard forms.

“Canonical” does **not** imply unique.

Different derivations may be canonical for different audiences or contexts.

Examples of derivation kinds:

- definition unfolding,
- conversion derivation,
- theorem derivation,
- specialization,
- equivalence derivation,
- model derivation,
- approximation derivation.

Canonical derivations are especially valuable because they turn a collection of facts into a connected conceptual graph.

---

# 17. Vignettes

The long-term library should contain **thousands of small semantic vignettes**.

A vignette may be:

- a canonical derivation,
- a standard transformation,
- a proof move,
- a relationship between quantities,
- an interpretation,
- a worked micro-example,
- a canonical animation,
- a counterexample,
- a misconception,
- a comparison.

These should be small, composable, parameterized, and reusable.

The goal is not a giant formal ontology.

The goal is a large corpus of trusted executable explanatory units.

This is especially useful for LLMs.

Instead of synthesizing every technical explanation from scratch, an LLM can:

```text
understand user intent
-> retrieve relevant vignettes
-> filter by semantic constraints
-> compose
-> parameterize
-> adapt explanation
-> render
```

The LLM supplies judgment and composition.

KP supplies trusted structure and deterministic execution.

---

# 18. Vignette Metadata

Each vignette should have a lightweight pedagogical contract.

Possible fields:

```ts
{
  teaches: [...],
  assumes: [...],
  applicableWhen: ...,
  difficulty: "intro",
  typicalIntent: [
    "explain",
    "derive",
    "contrast",
    "practice",
  ],
  misconceptionsAddressed: [...],
}
```

Do not require every possible field.

Publishing into a shared standard library should probably require only a small stable minimum:

- stable ID,
- clear purpose,
- semantic inputs,
- assumptions,
- result or goal,
- at least one minimal instance,
- provenance or justification.

Everything else can be optional and progressively enriched.

---

# 19. LLM Retrieval

Retrieval should not rely only on embeddings.

Support structured queries such as:

```ts
findVignettes({
  involves: ["kinetic-energy", "momentum"],
  kind: "canonical-derivation",
  difficulty: "<=intro",
})
```

or:

```ts
findVignettes({
  produces: "jacobian",
  uses: "chain-rule",
})
```

or:

```ts
findVignettes({
  misconception: "derivative-is-just-a-formula",
})
```

Use embeddings as one signal among others.

Semantic relations, types, contexts, assumptions, difficulty, and dependencies should participate in retrieval.

---

# 20. Units and Dimensions

When applicable, physical or measured quantities should carry semantic unit information.

Distinguish:

- quantity identity,
- dimension,
- unit.

Example:

```ts
Quantity({
  value: 12,
  dimension: Velocity,
  unit: MeterPerSecond,
})
```

This enables:

- dimensional consistency checks,
- unit propagation,
- conversion,
- validation,
- better popups,
- automatic reference information.

Unit conversion should be modeled as a transformation.

Example:

```math
10\ \mathrm{m/s} \rightarrow 36\ \mathrm{km/h}
```

The underlying quantity retains identity while representation changes.

Units should be compositional and optional.

Not every scalar is a measured quantity.

---

# 21. Views and Lenses

A lens is a presentation or interpretation over semantic content.

Examples:

- abstract,
- symbolic,
- minimal concrete,
- matrix,
- graph,
- table,
- popup,
- animation,
- reference row,
- author/debug view.

A lens should consume semantic structure.

It should not require semantic objects to contain view-specific behavior.

Prefer:

```ts
view(J, "matrix")
```

over:

```ts
J.renderAsMatrix()
```

Context-aware views should be possible:

```ts
view(x, "popup", { context })
```

---

# 22. Semantic Inspection

Do not make “hover to see meaning” the core interaction primitive.

Rendered fragments can belong to multiple semantic objects simultaneously.

Instead use semantic inspection.

Pipeline:

```text
pointer / keyboard target
-> rendered anchor
-> local semantic candidates
-> context-aware deterministic ranking
-> lightweight hover
-> pinned inspector on deliberate activation
```

Hover should remain light.

Click or keyboard activation can open a richer inspector.

The inspector may show overlapping alternatives such as:

```text
partial derivative
Jacobian entry
row
column
whole Jacobian
```

These are not always hierarchical.

Do not force a breadcrumb metaphor where meanings overlap.

---

# 23. Performance Architecture

The key rule:

> Pointer interaction should look up already-established meaning, not discover meaning.

Do not perform on hover:

- parsing,
- solver work,
- dependency loading,
- global graph queries,
- rewrite searches,
- semantic inference,
- heavy geometry recomputation.

Keep separate layers:

## Semantic content

Objects, relations, assumptions, provenance.

## Rendered bindings

Which visual anchors correspond to which semantic occurrences and roles.

## Interaction state

Hovered candidate, pinned selection, active inspector, animation position.

Use small lookup tables such as:

```ts
elementToAnchor: WeakMap<Element, AnchorId>
anchorToBindings: Map<AnchorId, readonly BindingId[]>
bindingToAnchors: Map<BindingId, readonly AnchorId[]>
```

Use delegated event handling at representation roots.

Do not attach large numbers of independent handlers if generic delegation is sufficient.

---

# 24. Geometry and Highlighting

Semantic membership and screen geometry have different lifetimes.

Cache membership aggressively.

Cache geometry conservatively.

A semantic region may contain multiple visual rectangles.

Do not assume every semantic object corresponds to one bounding box.

For highlighting:

- simple cases: style member anchors directly,
- complex grouped cases: measure anchors and draw an overlay,
- text ranges: consider browser highlighting primitives where appropriate,
- diagrams/canvas: renderer-specific spatial indexing may be appropriate.

Batch layout reads and writes.

Avoid layout thrashing.

Do not treat resize observation as a complete position-invalidation mechanism.

Scrolling and upstream content changes may move content without resizing it.

---

# 25. KaTeX Escape Hatch

Authors must always be able to fall back to raw KaTeX.

This should be a first-class design requirement.

Progressive ladder:

```text
raw KaTeX
-> tagged KaTeX
-> semantic islands in KaTeX
-> registered semantic object
-> richly executable semantic object
```

Example:

```ts
math`\int_0^\infty e^{-x^2}\,dx`
```

should always work.

Optional enrichment:

```ts
semantic("analysis.gaussian-integral",
  math`\int_0^\infty e^{-x^2}\,dx`
)
```

Unknown notation should remain opaque rather than forcing an ontology decision.

Dropping down to KaTeX is not failure.

The technical notation long tail is effectively infinite.

---

# 26. Partial Semantics

Expressions should not be all-or-nothing semantic.

Example:

```ts
math`
  ${semantic(x)}^2
  + \operatorname{weirdThing}(${semantic(y)})
`
```

KP may understand `x` and `y` while treating `weirdThing` as opaque.

This preserves useful behavior:

- identity,
- highlighting,
- dependencies,
- linking,

without requiring the author to formalize everything.

Semantic islands are important for adoption.

---

# 27. Extension Model

Authors should be able to define custom semantic objects locally.

They should not need to modify KP core.

Example:

```ts
const Elasticity = defineSemanticType({
  id: "economics.elasticity",
  parameters: ["quantity", "price"],
  tags: ["economics", "ratio", "local-response"],
})
```

Custom concepts should immediately inherit generic infrastructure where possible:

- identity,
- references,
- backlinks,
- search,
- serialization,
- default popup,
- ability to attach examples,
- ability to attach animations.

Extensions can begin local and later become shared packages.

Suggested progression:

```text
raw KaTeX
-> locally tagged expression
-> local semantic object
-> shared project component
-> canonical KP semantic package
```

---

# 28. Typed Strings

Typed strings are likely the best compromise between extensibility and TypeScript ergonomics.

Examples:

```ts
obj("calculus.jacobian", ...)
obj("proof.induction", ...)
obj("linear-algebra.gaussian-elimination", ...)
```

The registry should provide type checking and autocomplete.

Prefer an explicitly composed typed registry over uncontrolled global string namespaces where possible.

TypeScript should help check:

- registered IDs,
- parameter shapes,
- conventional compatibility.

Do not attempt to encode all mathematical validity into the TypeScript type system.

Use runtime validation too.

TypeScript types disappear at runtime and cannot validate imported or dynamic data.

---

# 29. Keep the Vocabulary Disciplined

A small API can still explode through uncontrolled strings.

Avoid near-duplicate relation names such as:

```text
has-canonical-animation
canonical-animation-of
animation-for
default-animation
preferred-animation
```

Prefer a disciplined core vocabulary.

Likewise for views.

The registry should make available vocabulary discoverable.

Schemas should drive autocomplete and documentation.

---

# 30. Semantic Graph vs Computation Graph

Do not conflate semantic relationships with executable dependencies.

These are different:

```text
Jacobian related to derivative
Entry belongs to column
Step invokes chain rule
Derived value reads parameter a
```

Only the last one directly describes recomputation.

Keep the semantic graph and computation graph separate.

Otherwise:

- backlinks can accidentally trigger computation,
- conceptual cycles can create reactive loops,
- relation changes can cause unnecessary recomputation.

Executable derivations should have explicit contracts for:

- inputs,
- outputs,
- assumptions,
- computation or solver reference.

---

# 31. Constraint Solving

The solver should be understood as an information-flow system.

Given:

```math
F=ma
```

and known values for `m` and `a`, the solver can infer `F`.

But the system should also know alternative solve directions:

```text
{m, a} -> F
{F, m} -> a
{F, a} -> m
```

This forms an AND/OR hypergraph.

Useful queries:

- what is known?
- what is unknown?
- what is underdetermined?
- what information would make this solvable?
- what depends on this assumption?
- what became stale after a parameter change?
- can this be solved symbolically?
- can this be solved numerically?

Do not collapse “solved” into “has a number.”

Prefer progressive solution knowledge:

```text
definition
-> characterization
-> additional constraints
-> symbolic solution
-> numerical approximation
```

with metadata for:

- assumptions,
- uniqueness,
- free variables,
- derivation,
- unresolved conditions.

---

# 32. Proof and Validity States

Do not represent semantic validity as a simple boolean.

Useful states include:

```text
proven
assumed
unknown
disproven
```

A transformation may require a condition such as differentiability or nonzero denominator.

If the system cannot establish it, that may be a warning rather than an error.

Policy can vary:

```text
strict mode:
  unknown -> error

authoring mode:
  unknown -> warning

presentation mode:
  unknown -> allow with annotation
```

KP should be rigorous enough to catch obvious breakage without pretending to be a theorem prover.

---

# 33. Compilation and Validation

KP should have a real validation / compile layer.

Possible failure classes:

## Type errors

Expected one semantic category, received an incompatible object.

## Structural errors

A template role was removed or renamed.

## Broken references

A vignette points to a missing semantic ID.

## Invalid transformations

A rewrite output references an unbound matcher variable.

## Failed assumptions

A transformation requires a condition that is known false.

## Unknown assumptions

A transformation requires something KP cannot establish.

Usually warning, not necessarily error.

## Presentation breakage

A canonical animation references an anchor or role that no longer exists.

## Stale derived artifacts

A flashcard or reference projection was generated against an outdated schema.

---

# 34. Errors vs Warnings

Errors should mean:

> KP cannot reliably construct the requested semantic artifact.

Warnings should mean:

> The artifact still works, but a semantic guarantee or enhancement is weakened.

Example error:

```text
ERROR KP1023

Expected role:
  jacobian.column

But template "calculus.jacobian" no longer exposes that role.

Referenced at:
  canonicalAnimation.step[3]
```

Example warning:

```text
WARNING KP2041

Could not prove requirement:
  denominator != 0

Transformation can render,
but validity is conditional.
```

Graceful fallback matters.

One optional semantic feature should not necessarily make an entire lesson unusable.

---

# 35. Incremental Compilation

Do not rebuild thousands of resources on every edit.

Shared semantic resources should expose dependencies.

On change:

```text
change resource
-> find reverse dependency closure
-> invalidate affected objects
-> revalidate
-> rebuild affected presentations/tests
```

Backlink infrastructure should help power this.

Use stable semantic IDs.

Human-readable labels should not be identity.

Refactoring tools should support migrations and renames.

---

# 36. Validation Phases

Useful separation:

## Phase 1: Static author validation

- IDs,
- schemas,
- typed strings,
- parameter shapes.

## Phase 2: Semantic validation

- bindings,
- units,
- assumptions,
- role existence,
- transformation correspondence,
- dependency consistency.

## Phase 3: Presentation validation

- selectors resolve,
- anchors exist,
- canonical animations instantiate,
- flashcards render,
- minimal examples render.

---

# 37. Vignettes as Tests

The vignette library should double as a test corpus.

Each vignette can support generated smoke tests:

- refs resolve,
- required roles exist,
- minimal instance constructs,
- canonical presentation renders,
- transformation sequence applies,
- declared output exists,
- semantic anchors resolve.

More important vignettes may add domain-specific tests.

This is particularly valuable because shared semantics will eventually affect many explanations.

---

# 38. Animation Architecture

Animation consumes semantic transformation correspondence.

Animation should not itself define semantic meaning.

Do not recompute mathematics on every frame.

A typical flow:

```text
semantic state A
-> validated transformation
-> semantic state B
-> correspondence map
-> prepare before/after layout
-> animate presentation
```

Prefer transforms and opacity where practical.

Do not blanket all elements with `will-change`.

During active transformations, fine-grained hover inspection may be deferred.

Pinned semantic selection should survive where possible.

Temporary animation copies need separate occurrence identities and cleanup.

---

# 39. Flashcards

Flashcards should be projections over existing semantic content, not a parallel content model.

Examples:

```ts
flashcard({
  front: transformation.input,
  back: transformation.output,
})
```

or:

```ts
flashcard({
  front: animateUntil(step - 1),
  prompt: "What happens next?",
  back: animate(step),
})
```

or:

```ts
flashcard({
  front: example.withMissingObject(x),
  back: example,
})
```

A single semantic vignette should be reusable as:

- reference row,
- popup,
- worked example,
- flashcard,
- exercise,
- canonical animation,
- search result.

---

# 40. Reference Tables

Objects and transformations should work naturally in reference tables.

Reference tables should be query-driven views over the semantic registry.

Example:

| Concept | Meaning | Canonical action | Example |
|---|---|---|---|
| Product rule | derivative of product | animation | `D(xe^x)` |
| Chain rule | derivative of composition | animation | `D(sin(x^2))` |
| Power rule | derivative of power | animation | `D(x^n)` |

The table should not duplicate the underlying content.

It should query semantic resources.

---

# 41. Canonical Animations

Objects, properties, methods, transformations, and derivations may all have canonical animations.

Canonical animations should be references attached to semantic resources.

They should not be eagerly imported with every dependency.

Example:

```ts
query(ChainRule, "canonical-animation")
```

or equivalent.

Lazy retrieval is important.

Using a transformation should not automatically import its entire explanatory dependency closure.

---

# 42. Dependency Loading

Separate:

## Immediate execution requirements

Needed to safely run a transformation.

## Semantic explanatory dependencies

Useful for inspection, reference, search, or teaching.

The latter can often be lazy references.

Suggested loading tiers:

| Tier | Examples | Policy |
|---|---|---|
| Immediate inspection | local label, role, short meaning | local |
| Expanded explanation | examples, backlinks, canonical animation | lazy |
| Expensive computation | solving, large searches | explicit / worker |

Do not ship the entire semantic library into every lesson bundle.

---

# 43. Async Correctness

Any asynchronous result should carry enough identity to prevent stale updates.

Include:

- originating object revision,
- context revision,
- request identity.

A solver response for old parameters must not overwrite new state.

A popup response for the previous selection must not populate the current inspector.

---

# 44. Data Model Guidance

Start with ordinary in-memory data structures:

- records,
- arrays,
- `Map`,
- `WeakMap`,
- stable IDs,
- explicit indexes.

Do not begin with a graph database.

The data is graph-shaped, but that does not imply a graph database is the right runtime.

Add more specialized storage only after profiling shows a real need.

---

# 45. Suggested Kernel

The exact API is not final, but the conceptual kernel should remain small.

Possible core primitives:

```text
Entity
Relation
Template
Matcher
Transformation
Presentation
Reference
Context
```

Even these may be implementation categories rather than public classes.

Higher-level constructs should mostly be compositions:

```text
RewriteRule
  = Matcher + Transformation

CanonicalAnimation
  = Transformation + Presentation

Example
  = Template instantiation + optional Transformation

ReferenceTable
  = Query + Presentation

Popup
  = Query + Presentation

Flashcard
  = Query + Presentation + reveal boundary

WorkedDerivation
  = TransformationSequence + Presentation

Jacobian
  = entities + relations + generated structure
```

The fact that many features can be composed from a small kernel is a positive architectural signal.

---

# 46. Authoring Layers

## Lesson author

Should mostly use:

```ts
obj(...)
math(...)
view(...)
apply(...)
```

plus domain-specific convenience constructors.

## Semantic library author

May use:

- schemas,
- roles,
- composition,
- templates,
- matchers,
- transformation definitions,
- default views.

## KP runtime implementer

May use:

- graph indexes,
- occurrence binding,
- geometry caches,
- validation internals,
- incremental dependency invalidation.

Do not expose runtime implementation concepts to ordinary authors unless necessary.

---

# 47. Suggested First Vertical Slice

Do not build the whole universe first.

Build three fixtures that stress the architecture.

## Fixture A: `2 x 2` Jacobian

Must support:

- abstract representation,
- symbol,
- minimal concrete instance,
- actual concrete instance,
- rows,
- columns,
- entries,
- overlapping semantic inspection,
- canonical popup,
- one contextual preference,
- raw KaTeX escape inside the same view.

Goal:

A standard Jacobian should require almost no manual per-entry annotation.

## Fixture B: rewrite rule with duplication

Example:

```math
a(b+c) \rightarrow ab+ac
```

Must support:

- pattern matching,
- variable binding,
- one-to-many correspondence,
- animation,
- provenance,
- reusable example,
- flashcard generation.

Goal:

Validate identity and transformation machinery.

## Fixture C: short proof by induction

Must support:

- proof context,
- proposition schema,
- base case,
- induction hypothesis,
- step target,
- assumptions,
- invocation backlinks,
- contextual role inspection.

Goal:

Ensure the architecture is not secretly optimized only for matrices and algebraic expressions.

---

# 48. Suggested Implementation Sequence

## Phase 1: Stable identity + registry

Implement:

- stable semantic IDs,
- object registry,
- references,
- simple relation index,
- reverse backlinks.

Avoid advanced inference.

## Phase 2: Occurrences + anchors + bindings

Implement:

- occurrence IDs,
- rendered anchor registration,
- many-to-many semantic bindings,
- local hit testing.

Build Jacobian fixture.

## Phase 3: Views and templates

Implement:

- abstract,
- symbolic,
- minimal concrete,
- concrete views,
- simple template expansion,
- default symbol provider.

## Phase 4: Transformations + correspondence

Implement:

- transformation records,
- input/output states,
- correspondence,
- simple sequence composition.

Build rewrite fixture.

## Phase 5: Match API

Implement:

- structural matcher,
- typed placeholders,
- explicit conditions,
- hygiene,
- bounded search.

Do not add broad theorem search yet.

## Phase 6: Context

Implement:

- nested context,
- roles,
- assumptions,
- goals,
- context-aware inspection ranking.

Build induction fixture.

## Phase 7: Validation

Implement:

- missing refs,
- missing roles,
- invalid bindings,
- unit checks where applicable,
- transformation precondition states,
- presentation anchor checks.

## Phase 8: Incremental invalidation

Add:

- dependency tracking,
- reverse invalidation,
- versioned snapshots,
- stale async protection.

## Phase 9: Canonical derivations + vignettes

Implement:

- named derivations,
- vignette schema,
- search metadata,
- minimal pedagogical metadata,
- generated smoke tests.

## Phase 10: LLM retrieval

Add:

- structured semantic queries,
- embedding retrieval as a supplementary signal,
- composition helpers.

---

# 49. Do Not Build Yet

Codex should explicitly avoid prematurely implementing:

- universal semantic query language,
- global theorem proving,
- whole-document spatial index,
- graph database,
- arbitrary symbolic algebra engine,
- giant inheritance hierarchy,
- deep TypeScript type-level theorem logic,
- fully automatic meaning inference,
- expensive hover-time ranking,
- eager dependency closure loading,
- complex plugin sandboxing,
- perfect animation of every overlapping semantic object,
- global ontology reconciliation.

Prefer a narrow, testable runtime.

---

# 50. Important Pitfalls

## 50.1 API explosion

A small set of generic verbs can still be overwhelmed by uncontrolled semantic strings.

Mitigation:

- disciplined registries,
- schema-driven autocomplete,
- small canonical relation vocabulary,
- package-level namespaces.

## 50.2 Ontology overreach

Do not try to encode the one true meaning of mathematical objects.

Mitigation:

- layered semantics,
- context,
- overlapping representations,
- defeasible interpretations.

## 50.3 Semantic graph = computation graph

This will create recomputation bugs and conceptual cycles.

Mitigation:

- separate relation graph from executable dependency graph.

## 50.4 Rendering structure mistaken for semantics

DOM nesting does not capture row/column overlap or conceptual roles.

Mitigation:

- bindings and anchor sets.

## 50.5 Hover-time inference

Will hurt performance and produce unstable UX.

Mitigation:

- precompute local candidate sets,
- deterministic ranking,
- rich inspection only on deliberate action.

## 50.6 Geometry invalidation bugs

Cached boxes can become stale after scroll, layout shifts, font changes, or animation.

Mitigation:

- separate semantic membership cache from geometry cache,
- conservative geometry invalidation.

## 50.7 Overly strict validation

Unknown assumptions are not always invalid.

Mitigation:

- `proven / assumed / unknown / disproven`,
- errors vs warnings.

## 50.8 KaTeX lock-in

Do not depend on undocumented internal KaTeX DOM structure.

Mitigation:

- narrow adapter,
- explicit semantic hooks,
- opaque fallback.

## 50.9 Variable capture in rewrite rules

Textual replacement can silently corrupt semantics.

Mitigation:

- hygienic binding and identity-aware substitution.

## 50.10 Stale async work

Old solver or lookup results may overwrite new state.

Mitigation:

- revisions and request identity.

---

# 51. Performance Success Criteria

Measure the real system, not only algorithms.

Useful metrics:

- pointer-to-highlight latency,
- work on repeated pointer movement,
- allocations during warm inspection,
- number of resources recomputed after one parameter change,
- retained memory after repeated mount/unmount,
- number of manual bindings required per example,
- render time for standard fixtures,
- bundle size by semantic package.

The authoring metric matters:

> If the semantic system does not materially reduce manual annotation, it has failed even if runtime performance is excellent.

---

# 52. Core Architectural Invariants

Codex should protect these aggressively.

1. **Stable semantic identity is independent of rendering.**
2. **Occurrence identity is distinct from semantic identity.**
3. **Semantic relations are not automatically reactive dependencies.**
4. **Transformations record correspondence explicitly.**
5. **Contextual roles are not permanent object properties.**
6. **Raw KaTeX always remains available.**
7. **Partial semantics are allowed.**
8. **Templates generate boilerplate rather than forcing authors to write it.**
9. **Views consume semantic objects; objects do not own every view.**
10. **Backlinks are derived automatically from relations.**
11. **Warnings distinguish unknown validity from known invalidity.**
12. **Hover never performs heavy semantic work.**
13. **Canonical resources are references, not eager dependency closures.**
14. **The public API remains substantially smaller than the semantic vocabulary.**
15. **Composition is preferred over inheritance.**

---

# 53. Working Mental Model

The simplest mental model is:

## Things

Examples:

- Jacobian,
- chain rule,
- variable,
- proof by induction,
- positive definiteness,
- kinetic energy.

## Connections

Examples:

- depends on,
- example of,
- used by,
- justified by,
- contains,
- corresponds to.

## Ways things change

Transformations.

## Ways things appear

Views / presentations.

## Factories for structure

Templates.

## Ways to recognize structure

Matchers.

Most higher-level features should reduce to combinations of these.

---

# 54. Long-Term Vision

The long-term target is a library of thousands of small semantic vignettes.

Examples:

- why matrix multiplication composes linear maps,
- derivative as local linear approximation,
- complete the square,
- quadratic formula from completing the square,
- determinant zero and noninvertibility,
- eigenvector invariance of span,
- gradient as steepest ascent,
- Jacobian column as local sensitivity to one input,
- kinetic energy in terms of momentum,
- work-energy theorem,
- OLS normal equations,
- Bayes rule as renormalized joint probability,
- omitted-variable bias decomposition,
- comparative advantage,
- tax wedge decomposition,
- induction hypothesis scope,
- common invalid algebraic moves,
- counterexamples and misconceptions.

Each vignette should be:

- small,
- typed,
- parameterizable,
- composable,
- referenceable,
- backlinkable,
- queryable,
- animatable,
- testable,
- reusable as a flashcard or exercise.

The LLM should retrieve and compose these rather than reinventing every explanation.

This is the deeper product direction:

> **KP becomes a standard library of executable explanatory moves.**

The semantic runtime should remain small enough that this library can grow without making the authoring API collapse under its own weight.

---

# 55. First Concrete Deliverable

Codex should begin by implementing the minimum architecture needed for the three vertical fixtures:

1. Jacobian
2. distributive rewrite
3. induction proof

A successful first deliverable should demonstrate:

- stable semantic IDs,
- typed registry lookup,
- object schemas,
- relations and backlinks,
- templates,
- rendered anchors,
- many-to-many bindings,
- overlapping inspection,
- context roles,
- transformations,
- correspondence,
- basic matching,
- KaTeX escape,
- error/warning diagnostics.

Do **not** optimize for completeness.

Optimize for proving that the architecture:

- removes author boilerplate,
- remains understandable,
- stays fast,
- supports extension,
- and does not require a giant API.

---

# 56. Summary for Codex

Build KP as:

> **a small headless semantic runtime, plus an extensible standard library of well-understood semantic objects, transformations, derivations, vignettes, and presentations.**

The runtime should know about identity, relations, context, templates, matching, transformations, bindings, and validation.

The standard library should know about Jacobians, proof methods, chain rule, Gaussian elimination, physical quantities, canonical derivations, and thousands of other reusable concepts.

The renderer should know how semantic occurrences map to visible anchors.

The author should usually see only a small, pleasant API.

The LLM should be able to query and compose the library.

KaTeX should always remain an escape hatch.

When in doubt, prefer:

- smaller kernel,
- richer library,
- explicit identity,
- explicit correspondence,
- lazy dependencies,
- context-aware semantics,
- progressive enhancement,
- clear diagnostics,
- measured performance,
- composition over inheritance.
