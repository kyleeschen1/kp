# Kinetic Press Handoff: Domain Literacy, Semantic Rewrites, and Kinetic Notation

Status: directional product handoff and exploratory implementation material

Authority note: the domain-literacy focus in this document is accepted, but
the current KP implementation and canonical project architecture override its
API sketches, package suggestions, work ordering, and migration implications.
Use `project/roadmap.md`, the active thread, canonical principles and authoring
contracts, and accepted decisions for execution authority. This document does
not pause or subordinate Graph2D, Graph3D, code, diagram, publication, or other
accepted cross-domain work. See
`project/decisions/2026-08-26-domain-literacy-emphasis-with-architecture-continuity.md`.

## Purpose

This document captures the current product and technical direction for Kinetic Press (KP) after a design conversation centered on symbolic animation, rule application, domain literacy, and AI-assisted formal reasoning.

It is intended for Codex and future implementation work. It should update the working model of KP itself, not merely specify one feature.

The central shift is:

> **Kinetic Press is not primarily an animation system for explaining math. It is a system for accelerating domain-specific literacy by making expert ways of seeing formal representations explicit, interactive, and eventually transparent.**

The immediate implementation wedge is a reusable visual and semantic grammar for:

> **pattern match → bind → instantiate → rewrite → reduce**

with closely related primitives for semantic folding, abstraction, provenance, and attention control.

---

# 1. Product North Star

KP should help users cross the gap between:

> “I basically understand this idea”

and

> “I can actually read, manipulate, inspect, and think fluently in this domain.”

This applies to:

- mathematics
- physics
- programming languages
- logic
- linguistics
- formal methods
- notation-heavy sciences
- poetry and meter
- legal and technical conventions
- any field where experts perceive structure that novices initially experience as opaque syntax

KP's specialization is **domain-specific literacy**.

The user should become faster at seeing:

- what kind of object they are looking at
- which parts play which roles
- what is fixed structure vs. a variable slot
- which transformations are licensed
- what can be temporarily ignored
- which conventions are compressing information
- where a term came from
- how multiple representations correspond
- how the authentic notation of the field encodes deeper meaning

The desired outcome is not dependence on animation.

> **KP succeeds when the learner can close KP and read the real artifact differently.**

---

# 2. Why This Matters in an AI-Heavy Future

Do **not** build KP around the assumption that humans will always need to manually execute long symbolic procedures.

AI, CAS systems, proof assistants, and formal tools will increasingly automate routine symbolic production.

The more durable human skill is likely to become:

> **representation fluency**

including the ability to:

1. acquire unfamiliar formal languages quickly
2. recognize patterns and transformations
3. inspect AI-generated work
4. understand what assumptions or rules license a step
5. move between abstraction levels
6. unfold suspicious or important details
7. communicate precisely using shared compressed notation
8. design or adopt better representations

AI may paradoxically increase the ROI of domain literacy.

As formal output becomes cheaper to produce, the bottleneck shifts toward:

- inspection
- verification
- navigation
- communication
- semantic compression
- choosing the right level of detail

KP can help increase **semantic bandwidth**: how much meaningful formal structure a human can reliably perceive and manipulate per unit of attention.

---

# 3. The Deep Design Thesis: Transparent Formal Tooling

A useful phenomenological model is that good tools become transparent in skilled use.

Experts do not consciously decode every layer of notation. Many layers become "ready-to-hand" and recede from attention.

For example, an expert may see:

```text
F^μ_ν u^ν
```

while transparently operating through many hidden layers:

- glyph recognition
- superscript/subscript conventions
- free vs. contracted indices
- Einstein summation
- tensor roles
- coordinate representation
- linear maps
- basis dependence
- physical interpretation
- current theorem or transformation

KP can deliberately accelerate this process.

The pedagogical cycle is:

```text
opaque representation
        ↓
make hidden structure explicit
        ↓
manipulate / inspect consciously
        ↓
recompress
        ↓
new transparency
```

A strong KP animation is therefore **self-erasing pedagogy**.

It temporarily makes structure conspicuous so the learner can later stop noticing the machinery.

---

# 4. KP's Distinctive Medium: Kinetic Notation

Traditional mathematical visualization has been especially strong at geometric and semantic visualization:

- graphs
- areas
- surfaces
- vectors
- trajectories
- spatial deformation
- physical analogy

KP should specialize in another space:

> **the structured space of expressions and the lawful transformations between them**

Static notation is extremely efficient at representing a formal state.

Animation can be extremely efficient at representing **relations between formal states**.

KP should build a reusable visual grammar for symbolic acts such as:

- pattern matching
- binding
- substitution
- distribution
- collection/factoring
- cancellation
- reassociation
- commutation
- abstraction
- expansion
- normalization
- duplication
- elimination
- contravariant reversal
- scope changes
- provenance
- folding and unfolding

The goal is not to replace abstraction with a concrete picture.

The goal is often:

> **Look harder at the abstraction itself; temporarily give it motion so its structure becomes perceptible.**

This can become a distinctive niche relative to systems focused primarily on conceptual explanation, practice sequencing, or tutoring.

---

# 5. Core Primitive: Rule Application

The immediate foundational primitive should be a semantic and visual **Rule Application** pipeline.

Canonical form:

```text
match
  ↓
bind
  ↓
instantiate
  ↓
rewrite
  ↓
reduce
```

Not every rule needs every stage.

The semantic structure is approximately:

```text
Pattern P
   |
match against source X
   |
Bindings σ
   |
instantiate replacement R
   |
σ(R)
   |
optional evaluation / normalization
   |
result Y
```

Mathematically:

```text
P ⇒ R
σ(P) = X
therefore X rewrites to σ(R)
```

The important point is that **matching and rewriting are distinct**.

Matching should probably be a lower-level primitive that can exist independently of rewriting.

That allows KP to use matching for:

- classification
- parsing
- recognizing a matrix or syntax shape
- identifying proof structures
- teaching grammatical roles
- analogy
- diagnostics

---

# 6. Canonical Example: Power Rule

Source:

```text
d/dx x^5
```

Pattern:

```text
d/dx x^n
```

Binding:

```text
n ↦ 5
```

Replacement template:

```text
n x^(n - 1)
```

Instantiation:

```text
5 x^(5 - 1)
```

Reduction:

```text
5 x^4
```

The learner should experience these as different cognitive acts.

Especially important:

- `n ↦ 5` is **rule instantiation**
- `5 - 1 ↦ 4` is **ordinary computation**

Those should not look visually identical.

---

# 7. Attention Choreography for Rule Application

The governing rule:

> **At any instant, there should be one dominant question for the eye to answer.**

For a standard rule application, those questions are:

1. What object am I looking at?
2. What structure does it match?
3. What fills the variable slots?
4. What does the rule produce?
5. What remains to compute?

Avoid persistent side-by-side layouts where the learner must repeatedly look between expression, rule, and explanation.

The pattern should generally **project onto the expression**.

Recommended sequence:

## 7.1 Establish the source

Show only the concrete expression.

Example:

```text
d/dx x^5
```

The source owns the focal region.

## 7.2 Overlay the pattern in the same spatial location

Bring in:

```text
d/dx x^n
```

as a scaffold aligned directly over the source.

Fixed structure should align and then visually recede.

The slot `n` should remain salient over the captured `5`.

The important perceptual event is:

```text
n ↔ 5
```

not:

```text
look at rule on left
then expression on right
then back to rule
```

## 7.3 Make binding a first-class event

Briefly isolate:

```text
n ↦ 5
```

or communicate it spatially.

Do not rely only on color.

Use redundant encodings such as:

- enclosure
- shared motion
- slot labels
- temporary connectors
- synchronized behavior

## 7.4 Reveal the replacement template

Show the abstract output first:

```text
n x^(n - 1)
```

Then propagate the binding.

Both occurrences of `n` should visibly respond to the same captured value.

## 7.5 Rewrite

Morph the active source into the instantiated result:

```text
d/dx x^5
    ↓
5 x^(5 - 1)
```

This should feel like a licensed structural transformation, not the same kind of motion as slot filling.

## 7.6 Remove scaffolding

Once the binding has done its job, remove:

- slot boxes
- pattern overlays
- correspondence lines
- temporary labels

Pedagogical signaling becomes clutter as soon as its message has landed.

## 7.7 Reduce locally

Now shift attention only to:

```text
5 - 1
```

and contract locally:

```text
5 - 1 → 4
```

The visual treatment for local evaluation should differ from rewrite or substitution.

---

# 8. Motion Should Carry Semantic Meaning

KP should develop a stable visual vocabulary.

Possible mapping:

| Semantic event | Motion / visual grammar |
|---|---|
| Structural correspondence | spatial alignment |
| Slot binding | object settles into slot |
| Reused binding | synchronized propagation / short duplication |
| Rewrite | structural morph / recomposition |
| Local evaluation | contraction / collapse |
| Removal of irrelevant structure | fade / deemphasize |
| Semantic folding | enclosure + compression |
| Unfolding | expansion from same persistent boundary |
| Reassociation | grouping boundary shifts while tokens persist |
| Cancellation | inverse structures converge and disappear |
| Distribution | one source relationship branches across substructures |
| Collection/factoring | multiple related structures converge |
| Failure to match | smallest mismatching structural region becomes salient |

Motion should become notation.

Authors should not invent arbitrary attractive movements for every rule.

---

# 9. Semantic Folding and Attention Operators

KP needs first-class operations that change what the learner attends to without necessarily changing the underlying mathematical object.

This is distinct from semantic rewrite.

Example:

```text
(x^2 + 1)
```

may temporarily be rendered as:

```text
u
```

while the underlying semantic object remains unchanged.

This is **semantic folding**.

General choreography:

```text
recognize subtree
      ↓
abstract / fold
      ↓
reason at higher level
      ↓
transform
      ↓
restore detail when needed
```

Useful attentional operations include:

## Fold / abstract

Treat a complex structure as one unit.

```text
x^2 + 3x + 2  ⇝  A
```

## Ghost / deemphasize

Keep something visible but temporarily low-salience.

## Hide temporarily

Remove something irrelevant to the current local argument, while preserving recoverability.

## Perceptually factor

Make repeated structures visibly correspond before an actual algebraic factoring rewrite.

## Pin

Hold a structure fixed while others transform.

## Explode / unfold

Restore internal structure when it becomes relevant again.

These operations amount to an **attention algebra**.

A major KP principle should be:

> **Information can remain available without remaining salient.**

---

# 10. Semantic State vs. View State

This distinction is essential.

A rewrite changes semantic state:

```text
S0 → S1
```

A fold may change only view state:

```text
V_expanded(S0) → V_folded(S0)
```

Do not conflate them.

Recommended architecture:

```text
semantic state
    |
    +-- full view
    +-- folded view
    +-- pattern-role view
    +-- provenance view
    +-- evaluation-focused view
```

This separation enables:

- reversible folding
- alternate pedagogical views
- reduced-motion views
- static rendering
- expert compressed views
- student-expanded views

without mutating the underlying formal object.

---

# 11. Immutable Semantics, Mutable Perception

The semantic model should strongly prefer immutable states.

A rewrite:

```text
S0 --rule--> S1
```

should produce a new semantic state.

Former states remain available for:

- rewind
- replay
- branching
- provenance
- comparison
- proof history
- audit
- alternative derivations

But the **visual default should usually be an in-place morph**, not a side-by-side copy.

This gives:

> **persistent semantic history, ephemeral visual diff**

or more compactly:

> **immutable semantics, mutable perception**

Do not model the meaning of animation as literal mutation of persistent symbol objects.

Instead, define correspondence/provenance relations between immutable states.

Important: correspondence is not always one-to-one.

Examples:

Distribution:

```text
source a
   ├──> result a₁
   └──> result a₂
```

Collection:

```text
source x₁
source x₂
   \   /
   result x
```

Evaluation:

```text
5, -, 1
   ↓
   4
```

The renderer interprets these relationships visually.

---

# 12. Three Visual History Modes

The semantic rewrite history should support several visual presentations.

## Morph

Default.

Use when the learner should experience one evolving formal object.

```text
A ⇝ B
```

## Trail

Use when derivation history itself matters.

```text
A
↓
B
↓
C
```

## Compare

Use when before/after contrast is the learning objective.

```text
A     B
```

Do not leave every prior state visible by default.

History should remain available but not permanently consume attention.

---

# 13. Failed and Ambiguous Matches

These are pedagogically important.

## Failed match

Do not simply flash the whole expression red.

Overlay the pattern normally and make the **smallest structural region where unification fails** salient.

This teaches why a rule does not apply.

## Ambiguous match

If several valid structural matches or rules are possible, KP can expose candidate interpretations.

This matters for:

- algebraic strategy
- integration
- proof tactics
- parsing
- compiler rewrites
- natural language

This moves KP from teaching execution toward teaching **rule selection and strategy**.

---

# 14. The Same Grammar Across Domains

The visual grammar should be domain-independent while semantics remain domain-specific.

## Calculus

```text
D(x^5)
pattern: D(x^n)
bind: n ↦ 5
template: n x^(n-1)
instantiate: 5x^(5-1)
reduce: 5x^4
```

## Programming: beta reduction

```text
(λx. x + 1) 3
pattern: (λx. E) V
bind:
  E ↦ x + 1
  V ↦ 3
template:
  E[x := V]
instantiate:
  (x + 1)[x := 3]
substitute:
  3 + 1
reduce:
  4
```

This adds scope and capture-avoidance as visible semantic structure.

## Programming: structural pattern match

```text
length [a,b,c]
pattern:
  length (_:xs)
bind:
  xs ↦ [b,c]
rewrite:
  1 + length [b,c]
```

Repeated application lets the learner literally watch structural recursion.

## Logic: modus ponens

```text
P
P → Q
------
Q
```

Given concrete premises:

```text
A
A → B
```

bindings:

```text
P ↦ A
Q ↦ B
```

conclusion template instantiates to:

```text
B
```

No arithmetic occurs, but the same grammar explains why the inference is licensed.

## Linguistics

Phrase structure:

```text
NP → Det N
```

Concrete phrase:

```text
the dog
```

bind roles:

```text
the ↦ Det
dog ↦ N
```

collapse into:

```text
NP
```

## Poetry

The same broad literacy system can reveal and then remove:

- meter
- stress pattern
- rhetorical structure
- syntactic grouping
- repeated motifs
- parallelism

The authentic poem remains the destination.

---

# 15. KP as a Domain-Literacy System

KP should increasingly think in terms of reusable **literacy operators** rather than math-only animations.

Candidate operators:

- match
- bind
- rewrite
- substitute
- reduce
- fold
- unfold
- align
- reveal convention
- suppress detail
- track identity
- compare
- re-segment
- show provenance
- change representation
- generalize
- instantiate

These are cognitive acts that recur across formal domains.

KP's deeper mission:

> **Externalize expert perceptual operations until the learner internalizes them.**

---

# 16. Reversible Compression

This is a major product idea.

Static notation historically trades off:

```text
compactness ↔ accessibility
```

KP can partially dissolve that tradeoff.

A representation can remain highly compressed while supporting:

- unfold-on-demand definitions
- provenance
- role annotation
- semantic folding
- visible binding
- alternate representation
- pattern overlays
- executable rewrites

This enables:

> **expert-density notation with recoverable meaning**

A key design principle:

> **Maximize compression without sacrificing recoverability of meaning.**

This may become especially important as humans interact with increasingly capable AI systems.

---

# 17. Future: Human and Machine Projections Over a Shared Semantic Substrate

KP should not assume the human-visible notation is also the ideal machine representation.

Long-term architecture can be thought of as:

```text
                 semantic object graph
                  /                \
                 /                  \
        human projection       machine projection
        notation/animation     typed structured data
```

Both projections should refer to the same semantic identities.

The same metadata that tells the renderer:

> animate this `5` into these two locations

can tell an LLM:

> these two result nodes derive from the same metavariable binding

Potential semantic metadata:

- AST/object structure
- types
- roles
- scope
- bindings
- pattern matches
- constraints
- rewrite identity
- provenance
- cross-representation identity
- current fold/view state

This can improve:

- LLM explanations
- formal reasoning
- reliable “where did this come from?” queries
- generated exercises
- proof auditing
- student-step analysis
- CAS/proof assistant integration

The animation layer should be one consumer of the semantic substrate, not the substrate itself.

---

# 18. TypeScript Recommendation

Keep TypeScript as KP's primary implementation language.

Do **not** spend current effort changing languages.

TypeScript is well suited to:

- browser-native rendering
- DOM
- KaTeX
- CodeMirror / ProseMirror
- WebGL
- Svelte/SvelteKit
- interaction
- animation
- authoring tools
- discriminated unions for semantic ASTs

The harder problems are currently conceptual and architectural, not CPU performance.

Rust/WASM may become useful later for:

- very large structural matching
- constraint solving
- shared semantic engines
- performance-sensitive analysis
- native/browser portability

But this should be driven by actual need.

Steal functional-programming ideas without migrating to Haskell.

Preferred style:

```text
immutable trees
pure transformations
explicit provenance
typed data
serializable semantic objects
```

Avoid making mutable DOM/UI objects the semantic source of truth.

---

# 19. Recommended Package Boundaries

A possible architecture:

```text
@kp/semantic
    expressions
    domains
    identity
    bindings
    patterns
    rewrite rules
    provenance
    history

@kp/pedagogy
    match
    fold
    reveal
    compare
    focus
    reduce
    progressive compression
    attention sequencing

@kp/render
    layout
    correspondence animation
    symbol kinematics
    DOM/SVG/WebGL
    salience
    reduced motion

@kp/author
    DSL
    parser
    editor
    GUI
    overrides / escape hatches
```

Strong dependency rule:

> `@kp/semantic` knows nothing about DOM, CSS, timing, or animation.

---

# 20. Serializable Semantic Core

The semantic layer should strongly prefer plain structured data.

Example:

```ts
type Expr =
  | { type: "Symbol"; name: string }
  | { type: "Integer"; value: number }
  | { type: "Power"; base: Expr; exponent: Expr }
  | { type: "Multiply"; factors: Expr[] }
  | { type: "Derivative"; variable: Expr; body: Expr }
  | { type: "Meta"; name: string };
```

Prefer explicit serializable data over opaque class hierarchies.

Benefits:

- persistence
- diffing
- LLM input/output
- validation
- server rendering
- cross-language bridges
- CAS adapters
- Lean/proof assistant adapters
- rewrite histories
- deterministic replay

The semantic representation may eventually become more important than any particular renderer.

---

# 21. Rewrite API as Authoring Compression

Right now KP can produce beautiful animations, but they require large amounts of bespoke TypeScript.

The authoring model should move from:

> manually specify animation choreography

toward:

> specify semantic change; let KP synthesize a good default animation

Conceptual authoring:

```ts
rule({
  pattern: D(pow(x, n)),
  rewrite: mul(n, pow(x, sub(n, 1)))
});
```

Apply:

```ts
apply(powerRule, D(pow(x, 5)));
```

KP derives:

- bindings
- correspondence
- provenance
- introduced nodes
- removed nodes
- duplicated nodes
- layout change
- default choreography

This is the desired compression.

---

# 22. Three Authoring Levels

## Level 1: semantic declaration

This should handle the majority of normal content.

```ts
rewrite(expr, using(powerRule));
```

KP selects default choreography.

## Level 2: semantic declaration + pedagogical hints

Example:

```ts
rewrite(expr, using(powerRule), {
  showMatch: true,
  pauseOnBindings: true,
  emphasize: ["n"],
  reduceAfter: true
});
```

Hints should specify **pedagogical intent**, not pixels.

## Level 3: imperative escape hatch

Keep existing low-level animation capabilities for bespoke cases.

```ts
transition.custom(...)
```

The current beautiful TypeScript animation system should become the renderer/escape hatch, not the default authoring burden.

---

# 23. Do Not Overdesign a Universal DSL Yet

Do not immediately invent a grand universal animation language.

Start with repeatedly needed semantic operations:

- match
- bind
- rewrite
- substitute
- evaluate
- simplify
- fold
- unfold
- rearrange
- introduce
- eliminate
- highlight
- compare

Let repeated use reveal the deeper algebra.

Development loop:

```text
build beautiful thing manually
        ↓
notice repeated semantic structure
        ↓
promote structure into declarative primitive
        ↓
delete bespoke choreography
```

---

# 24. Progressive Fluency

The same underlying semantic transformation should support multiple levels of explanatory detail.

Beginner mode:

```text
match
↓
bind
↓
instantiate
↓
rewrite
↓
reduce
```

Familiar mode:

```text
match/bind
↓
rewrite
↓
reduce
```

Expert mode:

```text
rewrite
```

This is important because an animation that is excellent on repetition 1 becomes tedious on repetition 30.

The semantic trace remains constant while visual exposition compresses.

This is particularly valuable for:

- spaced repetition
- assessment
- expert reading
- review
- adaptive teaching

---

# 25. Learning Modes Reusing the Same Semantic Object

A single `RuleApplication` can become several activities.

## Watch

KP executes everything.

## Predict the match

Ask what the metavariable binds to.

## Predict the template

Given bindings, ask the learner to instantiate the output.

## Choose the rule

Present several candidate schemas.

## Diagnose failure

Ask why a rule does not match.

## Complete the transformation

Pause partway through.

## Teach it back

Ask the learner to annotate which source objects play which roles.

## Compressed review

Run the semantic transformation at expert speed.

This is one reason semantic authoring can scale much better than bespoke animations.

---

# 26. Product Positioning

Avoid positioning KP as:

- “better animated Khan Academy”
- “3Blue1Brown but interactive”
- “AI-generated math videos”
- “a generic animation engine”

A more distinctive direction is:

> **KP teaches people how to see through formalism rather than around it.**

Potential internal formulations:

> **KP accelerates domain literacy by making expert ways of seeing explicit.**

> **KP animates the operational life of formal representations.**

> **KP helps learners acquire the perceptual machinery needed to read a field fluently.**

> **KP makes compressed formal knowledge traversable.**

> **KP is an interface for learning, inspecting, and manipulating dense symbolic systems.**

Do not overcommit to any one tagline yet. These are conceptual anchors.

---

# 27. Long-Term Opportunity: New Representational Systems

Interactive semantic notation creates design dimensions unavailable to static notation.

A representation no longer needs to be only:

```text
meaning → marks
```

It can become a **control surface over a semantic system**.

Design questions include:

- what is visible by default?
- what can be unfolded?
- what remains addressable while hidden?
- what transformations are native?
- what equivalences are cheap to see?
- what does motion mean?
- how is provenance queried?
- what can be compressed safely?

This may eventually support not only teaching existing notation, but helping experts design new representations.

A researcher might:

1. identify a repeated complex structure
2. define it as a semantic object
3. define lawful transformations
4. give it compact notation
5. use KP to make it explorable and teachable

This is a distant north star, not an immediate product requirement.

---

# 28. Near-Term Implementation Priority

The immediate goal is not “build all of this.”

The next project should be:

> **Perfect one canonical semantic rewrite animation and turn it into a reusable primitive.**

Recommended initial target:

## Power Rule Prototype

Implement:

```text
d/dx x^5
```

using a reusable rule:

```text
d/dx x^n  ⇒  n x^(n - 1)
```

Required semantic stages:

1. source state
2. pattern
3. match correspondence
4. binding `n ↦ 5`
5. replacement template
6. instantiated result
7. reduction step
8. final result

Required visual stages:

1. focus source
2. overlay pattern
3. fixed structure recedes
4. slot becomes salient
5. binding occurs
6. replacement template appears
7. binding propagates to repeated occurrences
8. source morphs into instantiated result
9. scaffold disappears
10. local arithmetic contracts
11. clean final state

This prototype should be built **as a reusable renderer**, not as a one-off sequence.

---

# 29. Prototype Data Model Sketch

This is only a starting point, not a required exact API.

```ts
type NodeId = string;

type MetaName = string;

type Binding = {
  meta: MetaName;
  sourceNodeId: NodeId;
};

type Correspondence =
  | {
      kind: "preserve";
      from: NodeId;
      to: NodeId;
    }
  | {
      kind: "duplicate";
      from: NodeId;
      to: NodeId[];
    }
  | {
      kind: "merge";
      from: NodeId[];
      to: NodeId;
    }
  | {
      kind: "remove";
      from: NodeId;
    }
  | {
      kind: "introduce";
      to: NodeId;
    };

type RewriteTrace = {
  before: Expr;
  after: Expr;
  ruleId: string;
  bindings: Binding[];
  correspondence: Correspondence[];
  provenance: ProvenanceRecord[];
};
```

Important questions to explore during implementation:

- What should have persistent node identity?
- When should identity come from semantic equality vs. explicit provenance?
- How should one-to-many and many-to-one correspondence be represented?
- How much correspondence can be inferred automatically from the rule?
- How should domain-specific matchers plug into a domain-independent visual trace?
- How should view-only folds coexist with semantic rewrite history?

---

# 30. Rendering Contract

The semantic layer should emit enough information for the renderer to know:

- source nodes
- destination nodes
- bindings
- correspondence
- introduced structure
- removed structure
- duplicated structure
- merged structure
- semantic event type
- optional pedagogical hints

The renderer decides:

- physical trajectory
- layout interpolation
- opacity
- timing
- staging
- camera/focus
- mobile adaptation
- reduced motion

This preserves the central architecture:

```text
AUTHOR INTENT
     ↓
SEMANTIC TRANSITION
     ↓
PEDAGOGICAL TRACE
     ↓
VISUAL REALIZATION
```

---

# 31. Non-Goals for the First Implementation

Do not attempt yet to:

- design every domain
- implement a full CAS
- formally verify every rewrite
- support arbitrary Lean terms
- invent a universal rewrite language
- solve automatic choreography for every expression
- build the final GUI authoring environment
- migrate out of TypeScript
- make the entire existing KP renderer declarative at once

The prototype needs to establish that:

1. semantic authoring can be dramatically shorter than bespoke choreography
2. generated animation can retain KP's visual quality
3. binding/provenance can drive attention intelligently
4. the abstraction generalizes beyond one derivative example

---

# 32. Suggested Follow-Up Examples After Power Rule

Once the first primitive works, test it on structurally different cases.

Recommended sequence:

## A. Distributivity

```text
a(b + c) → ab + ac
```

Tests one-to-many provenance and branching.

## B. Factoring

```text
ab + ac → a(b + c)
```

Tests many-to-one collection.

## C. Reassociation

```text
(ab)c → a(bc)
```

Tests tree structure changes with token order preserved.

## D. Beta reduction

```text
(λx. x + 1) 3 → 3 + 1 → 4
```

Tests scope, binding, and substitution.

## E. Modus ponens

```text
P
P → Q
-----
Q
```

Tests that the grammar works outside arithmetic rewriting.

## F. Semantic fold / chain rule

```text
d/dx sin(x^2 + 1)
```

Temporarily fold:

```text
u := x^2 + 1
```

Then reason about outer and inner structure.

This sequence will reveal whether the abstraction is genuinely domain-general.

---

# 33. Codex Working Instructions for KP

When working on KP product, pedagogy, interaction design, or conceptual architecture:

## Do not prematurely converge to implementation

The current codebase is evidence, not a constraint on the product ontology.

Before proposing an API, identify:

- the cognitive act
- the semantic invariant
- the pedagogical purpose
- the information that must persist
- what is merely rendering detail

## Prefer semantic declarations over visual choreography

If a behavior can be derived from:

- identity
- structure
- binding
- provenance
- semantic event type

then derive it.

Do not force authors to specify positions, fades, or trajectories unless the default renderer cannot express the intended pedagogy.

## Preserve authentic notation

KP should usually return learners to the real notation of the field.

Do not permanently replace difficult notation with simplified representations.

Use:

- temporary expansion
- temporary abstraction
- reversible annotation
- progressive compression

## Optimize for attention choreography

At each moment ask:

> What single semantic question should dominate attention right now?

Avoid simultaneous salience across:

- rule
- target
- explanation
- annotations
- multiple historical copies

unless explicit comparison is the lesson.

## Maintain the distinction between semantics and view

Do not encode view-only folding as a semantic rewrite.

Do not make DOM state the semantic source of truth.

## Prefer immutable history

Semantic transformations should produce new states with explicit history and provenance.

Visuals may morph continuously.

## Make provenance first-class

The system should be able to answer:

- where did this term come from?
- which source structure produced this result?
- which binding supplied this value?
- what rule introduced this node?

## Keep the semantic core serializable

Favor plain data structures that can later be consumed by:

- LLMs
- CAS systems
- proof assistants
- servers
- other renderers

## Keep TypeScript

Do not introduce Rust/Haskell/another language unless a concrete technical requirement justifies it.

---

# 34. Short Codex Context Update

If a compact description is needed for a Codex project instruction file, use this:

> Kinetic Press is a semantic interface for acquiring domain-specific literacy. KP temporarily exposes expert ways of seeing authentic formal representations so learners can inspect, manipulate, and eventually read those representations without scaffolding. This is a product emphasis across equation, code, Graph2D, Graph3D, diagram, prose, and other domain-owned media; it is not a math-only scope or an architectural reset.
>
> Preserve KP's current authority chain and implementation: verified source → canonical semantic trace → pedagogical score and presentation profile → deterministic motion plan and sampled frame → renderer adapter. Authors and models may select verified operations and declare semantic roles, bindings, correspondence, provenance, and pedagogical intent. They may not invent mathematical truth, renderer geometry, timing, or fallback choreography; unsupported requests return typed repair gaps.
>
> Treat `match → bind → instantiate → rewrite → reduce` as a candidate Rule Application semantic grammar, not one mandatory visual effect. Optimize for one dominant semantic event at a time, keep semantic change distinct from view-only folding and salience, and preserve history and provenance while usually presenting one evolving object. Prove any shared treatment through one reversible exemplar, human review, and a structurally different caller. TypeScript remains the implementation language. The roadmap and Theseus—not this paragraph—own current task order.

---

# 35. Original Implementation Prompt

The following prompt records the implementation hypothesis that accompanied
this handoff. It is not the current task queue. KP has since implemented the
bounded integration Rule Application exemplar and stopped at its governed
human checkpoint; the roadmap and active thread override this section.

Codex should inspect the current KP codebase and produce an implementation proposal for a reusable `RuleApplication` / semantic rewrite primitive.

The proposal should answer:

1. Which existing KP rendering/animation systems can be reused?
2. Where should the semantic rewrite model live?
3. How should node identity, bindings, correspondence, and provenance be represented?
4. How should the renderer consume a rewrite trace?
5. Which current bespoke power-rule-like animation code can be simplified or replaced?
6. How can the API preserve an imperative escape hatch?
7. What is the smallest end-to-end prototype that demonstrates:
   - pattern overlay
   - binding
   - repeated binding propagation
   - semantic morph
   - local reduction
   - rewind
8. Which pieces should deliberately remain hard-coded for the first prototype rather than overgeneralized?

Codex should **not** begin by designing a universal DSL.

First produce the smallest architecture that can make one beautiful rule application dramatically easier to author while preserving KP's current visual quality.

---

# Final North Star

The deepest current formulation of KP is:

> **Kinetic Press should make the normally invisible machinery of formal fluency perceptible, manipulable, and eventually transparent.**

A learner begins by needing to see every layer.

An expert compresses most layers and unfolds only what matters.

KP should support that entire path.

Long-term, this same semantic substrate may become useful not only for education, but for human-AI collaboration around dense formal knowledge: learning it, inspecting it, communicating it, verifying it, and eventually designing better representations for thinking itself.
