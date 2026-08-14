# 2026-08-14: Reusable Mental Machinery And Attentional Beats

Date: 2026-08-14
Status: accepted product direction

## Decision

Adopt this as KP's primary learner-facing thesis:

> **Kinetic Press turns explanations into reusable mental machinery.**

KP is a semantic medium for acquiring, manipulating, retaining, and reusing
ways of seeing. Animation, interactive publication, tutoring, and retrieval
are capabilities of that medium; none is the product definition by itself.

Organize the learner experience primarily through **attentional beats** rather
than a permanent text/animation allocation. An attentional beat combines a
meaningful semantic state with a decision about what should own attention now:
prose, an object, a transformation, a comparison, a prediction, a learner
action, or a settled inference. Beats may be presented as slides, continuous
recomposition, ordinary reading, or another projection, but authors do not
make desktop geometry the semantic contract.

At most moments, one target should dominate. Text, notation, diagrams, code,
motion, and interaction take turns. Side-by-side presentation remains valid
when simultaneous comparison is itself the pedagogical act; “text always
lives beside animation” is no longer a candidate default.

Semantic identity must persist across representations. A conceptual object
may appear as prose, a KaTeX term, a diagram element, a code token, a learner
selection, a retrieval prompt, or a later reminder while remaining the same
addressable object. Attention transfers between those representations rather
than asking the learner to perform the correspondence alone.

The desired lifecycle is:

```text
encounter -> understand -> manipulate -> retrieve -> vary
-> derive -> compress -> reuse
```

The LLM supplies ephemeral pedagogical intelligence over this shared semantic
world: diagnosis, analogy, examples, counterexamples, and a choice of whether
to explain or ask. KP supplies persistent cognitive structure: semantic
objects, states, transitions, representations, learner actions, correctness,
and later retrieval. Conversation refers to semantic objects and transitions,
not pixels.

The immediate product proof is one hard-coded, excellent three-to-five-minute
conceptual experience in which the learner never has to decide where to look.
Use eigenvectors as the leading candidate because one persistent vector can
move from geometry into `Av = lambda v`, support prediction and manipulation,
and expand into an invariant one-dimensional subspace. This is a prototype
candidate, not authorization to implement a generic vector, matrix, scene, or
beat framework.

## Reason

The normal-matrix Proof Memory exemplar validates important infrastructure:
searchable static truth, semantic addresses, deterministic direct state,
native KaTeX settlement, prompt re-entry, accessibility, and bounded loading.
Its human checkpoint does not validate the learner experience. The learner
still has to choose between Article and stage, the motion is hidden inside
narrow scrub intervals, and the interface does not make read, watch, predict,
and inspect ownership self-evident.

This is not primarily a spacing or two-column defect. A layout can reduce eye
travel without answering who owns attention or how an idea crosses prose,
symbol, diagram, action, and memory. Treating the explanation as a sequence of
semantic attention decisions attacks the medium problem directly while
preserving KP's strongest architecture.

The framing also clarifies differentiation. KP is not competing with video on
polish, text on completeness, SRS on scheduling, or chat on conversational
breadth. Its distinctive claim is that a conceptual click becomes an
inspectable, manipulable, addressable, and later recoverable object.

## Consequences

- The verified semantic-to-interactive compiler remains core architecture but
  becomes supporting machinery rather than the learner-facing product thesis.
- **Attentional beat** is canonical product vocabulary. It is not yet a new
  shared runtime interface; use existing semantic objects, attention intents,
  checkpoints, motion beats, and deterministic playheads until an exemplar
  demonstrates a hard gap.
- The pedagogical score should eventually select attentional ownership and
  representation handoffs, while the renderer and projection decide geometry.
- Complete Article text remains static, searchable, addressable truth. An
  active experience is a temporal projection of that truth, not a transcript
  replacement or hidden second source.
- Direct links resolve beat and semantic-object endpoints immediately. They do
  not replay prior motion to reconstruct state.
- Retrieval prompts, “this clicked” capture, delayed return, and learner-model
  summaries remain future projections of the same semantic world. Do not build
  a scheduler, dashboard, or transcript archive for the first proof.
- Preserve the normal-matrix route as architecture and product-learning
  evidence. Do not execute its post-checkpoint hardening as if the attentional
  treatment had been approved.
- Pause the three-caller default-layout selection. First test whether one
  attentional surface can make a single difficult concept compelling.
- Hard-code the prototype aggressively. General authoring, plugin systems,
  curricula, dashboards, and unconstrained LLM scene mutation remain deferred.

## Alternatives Considered

- Continue polishing permanent split or stacked layouts. Rejected as the
  primary response because both still ask the learner to coordinate separate
  streams when text and motion demand simultaneous interpretation.
- Treat KP as an animation library. Rejected because bespoke animation volume
  does not preserve conceptual identity, retrieval, or reuse.
- Treat KP as an interactive textbook or widget collection. Rejected because
  pages and isolated manipulation surfaces do not by themselves preserve a
  way of seeing across contexts.
- Treat KP as a chatbot with visuals. Rejected because conversational insight
  remains ephemeral unless it crystallizes into persistent semantic structure.
- Treat Proof Memory or SRS as the whole product. Rejected because retrieval is
  one stage of a broader learning-object lifecycle and should often reappear as
  continuity rather than obligation management.
- Generalize the authoring platform before another prototype. Rejected because
  the medium's attentional grammar is still the largest product unknown.

## Follow-Ups

1. Write a bounded eigenvector attentional-surface prototype specification
   with roughly six to nine beats and one prediction/manipulation moment.
2. Define observable beat-level acceptance: one dominant target, perceptible
   semantic motion, explicit ownership transfer, stable identity, direct seek,
   static searchable truth, phone viability, and no learner confusion about
   where to look.
3. Reuse the existing semantic scene, salience intent, cross-view attention,
   deterministic clock, native renderer, and URL seams before adding types.
4. Stop at one reversible human checkpoint before authoring extraction or a
   second concept.
5. If approved, test delayed reconstruction with one compressed kinetic cue;
   do not build a production scheduling system.
