# 2. Adopt The Hermeneutic Cross-domain Tutorial Contract

Date: 2026-07-17
Status: accepted

## Decision

KP tutorials are thin, versioned orchestration modules over semantic objects,
animation assets, deterministic domain ports, renderer capabilities, and
gestalt styles. Guided explanation and free exploration are first-class views
of the same module and explicit state.

The characteristic KP pedagogical pattern is the **hermeneutic loop**. Its
typed runtime unit is an **interpretive cycle**:

```text
establish-whole -> isolate-part -> relate -> reintegrate
```

Interpretive cycles are explicit authoring intent. They identify the whole,
part, relationship, evidence views, and changed understanding; the compiler
realizes but does not invent that pedagogical relationship. Cycles are sparse,
semantically justified, and increasingly economical when repeated.

## Module And Progression

- A module has one canonical teaching spine plus optional branches that rejoin
  at explicit points.
- The atomic progression unit is a claim-and-evidence checkpoint.
- Claim and scene graphs are distinct but explicitly mapped.
- A checkpoint may contain deterministic internal beats, optional probes, and
  at most one principal interpretive cycle.
- The whole remains perceptually or structurally available while a part is
  inspected; returning visibly reintegrates the part into the whole.
- Stable representational neighborhoods normally contain two primary views and
  one lightweight context view.
- Scrolling may navigate checkpoints but never owns semantic time.

The tutorial module owns goals, prerequisites, claims, evidence, checkpoint and
branch structure, layouts, parameter bindings, reference states, narration,
probes, and tutorial-specific presentation intent. It references version-pinned
semantic assets, operations, motion recipes, deterministic ports, renderer
packs, and gestalt styles rather than copying or redefining them.

## Interaction And State

- Each checkpoint distinguishes an authored reference state from live
  exploratory state.
- Exploration pauses autoplay; a rejoin action animates back to the authored
  path without discarding exploration history.
- Parameters declare types, units, assumptions, defaults, reference values,
  and valid, boundary, and intentionally invalid regions.
- Parameterized claim templates retain logical identity and explicit validity
  predicates; prose is not regenerated merely to make every state appear valid.
- A visible frame is a pure, reproducible function of module, route,
  checkpoint, parameters, lens, deterministic seed, and sampled time.
- The module retains a portable semantic session log, while long-term learner
  modeling remains a separate capability.

Interaction reveals structure rather than gating progress. Optional epistemic
probes ask learners to predict, explain, compare, or identify invariants. No
points, streaks, artificial locks, or obligatory gestures belong in the core
tutorial contract.

## Claims, Rigor, And Epistemics

Every substantive claim carries provenance, authority, assumptions, model
scope, and proof status. Validity, provenance, and uncertainty are independent
channels. Tutorials may preserve parallel model-dependent or interpretive
branches without forcing false synthesis.

Proof-status values include intuition, example, heuristic, proof sketch, formal
argument, computation, and empirical evidence. Informal animations never
impersonate complete proofs. They may expose concise formal bridges and linked
prerequisite branches.

Each module declares one primary audience and rigor target. Optional intuitive,
formal, or computational lenses reuse the same claims only when substantively
supported; the LLM cannot invent a formal lens to fill a template.

Trusted status remains quietly inspectable. Provisional, invalid, contested,
lossy, uncertain, or assumption-sensitive states become visibly prominent
through non-color structural cues.

## Narration, Attention, And Presentation

- One semantic narration source projects into concise text, optional voice,
  captions, transcripts, accessibility descriptions, and exports.
- Narration references semantic entities and relationships, not coordinates or
  timestamps.
- Cross-view attention is a semantic, directional transmission event with
  renderer-specific realizations and immediate origin response.
- Transmission is brief, causally staged, and rapidly reintegrates the whole.
- Graph curves, bounds, points, strips, and regions are persistent semantic
  material that deforms or translates continuously rather than redraws by
  default.
- Coordinate frames remain stable within a claim; deliberate reframing is
  oriented, animated, settled, and independently controllable.
- Modules pin a reviewed default gestalt style while learners may select
  semantically compatible alternatives.

Accessibility preserves claims, evidence relationships, causal order, and
part-whole structure through alternate projections. Performance tiers may
reduce geometric or motion richness but never semantic or explanatory content.

## Authoring, Revision, And Promotion

LLMs may substantially restructure uploaded material, add intermediate
explanations, and choose examples, but every claim records whether it is
quoted, paraphrased, derived, supplied as background, or generated. Models
propose semantic objects, claims, storyboards, correspondence, approved
operations, and interaction intent; they do not emit DOM, pixels, arbitrary
keyframes, or self-certified truth.

Revision uses conversational structured patches with previewable semantic and
visual diffs, immutable history, attribution, locks, and direct structured
controls. Student prompts preferentially compose gold assets into focused
session branches instead of cloning entire tutorials.

The tutorial core remains small and versioned. Typed domain capability packs
contribute object and operation vocabularies, validators, deterministic ports,
view projections, controls, assumptions, units, exemplars, and promotion tests.

Promotion uses:

```text
draft -> reviewable -> gold -> promoted
```

and novelty uses:

```text
composition -> new-combination -> new-primitive
```

Generated modules may initially advance to reviewable, but gold and trusted
publication require versioned human sign-off plus automated semantic, motion,
interaction, accessibility, performance, loading, and export gates.

## FTC Reviewable Exemplar

The first gold candidate centers on FTC Part I:

1. establish `A(x) = integral from a to x of f(t) dt` as the whole;
2. increase `x` by a finite `Delta x`;
3. isolate the added strip;
4. relate its area to `f(x) Delta x` with visible error or bounding evidence;
5. shrink `Delta x` and visualize convergence;
6. divide by `Delta x` and introduce exact derivative notation only after the
   limiting relationship is established;
7. reintegrate graph and symbols as `A'(x) = f(x)`;
8. connect the local result to net change in a later scene.

The canonical argument uses a generic continuous function plus one concrete
exact-example lens. The graph leads spatially, the equation surface receives
and integrates transmitted meaning, and a quiet claim/branch rail preserves
context. Primary controls are `x`, guided-but-adjustable `Delta x`, playback,
scrub, rewind, rejoin, and part/whole inspection. Curated validated function
families replace arbitrary expression entry in v0.

The autonomous implementation boundary includes the versioned tutorial core,
claim and scene graphs, branching, reference/live state, interpretive cycles,
attention transmission, the reviewable FTC module, one optional probe, editor
and learner projections, accessibility, export, provenance, and focused
performance gates. It stops before gold promotion or cross-domain
generalization.

## Reason

KP's advantage is rapid interpretive integration between parts and wholes, not
a sequence of Brilliant-style gated micro-interactions. The contract preserves
that advantage while making tutorials deterministic, authorable, testable,
accessible, performant, and composable by governed LLMs.

## Consequences

- Tutorial implementation may proceed autonomously through a reviewable FTC
  exemplar after the active motion loop closes.
- Human review is required before gold promotion or reuse of new visual
  vocabulary across BFS, economics, physics, or other domains.
- Full learner modeling, gamification, arbitrary function entry, voice
  synthesis, and universal scene infrastructure remain deferred.

## Alternatives Considered

- Linear slides with isolated interactions: rejected because they weaken
  part-whole interpretation and cross-view continuity.
- A sandbox separate from the lesson: rejected because it duplicates models
  and separates exploration from explanation.
- A universal tutorial-specific runtime: rejected because existing animation
  assets and the shared clock already own semantic motion.
- Automatically generated formal rigor lenses: rejected because rigor requires
  real proof obligations and trusted evidence.

## Follow-ups

- Finish the active semantic-material-motion promotion and closeout.
- Implement the minimal novelty/maturity promotion model.
- Materialize an exemplar-first implementation contract for the tutorial core
  and reviewable FTC module.
- Stop for human review before gold promotion and domain generalization.

