# Cross-domain Tutorial Platform Next-step Review

Date: 2026-07-17  
Status: proposed; pending user approval  
Active thread: `threads/semantic-runtime.md`

## Recommendation

Finish the two remaining slices of the active semantic-material-motion loop,
freeze a small gold equation-motion baseline, and make the next flagship an
interactive Fundamental Theorem of Calculus tutorial. That vertical slice
should establish the cross-domain tutorial contract rather than becoming a
one-off calculus demo.

The program should then expand by one capability-opening exemplar per domain:

1. FTC for synchronized equations, graphs, shaded regions, and a variable
   bound;
2. BFS or Dijkstra for code, execution traces, networks, and queue/table state;
3. supply/demand with taxes and subsidies for deterministic parameter models,
   intersections, and changing economic regions;
4. the work-energy theorem for equations, units, force diagrams, and
   force-position graphs.

Each exemplar expands the allowed semantic and renderer vocabulary. LLMs may
compose already-promoted vocabulary without per-animation approval; novel
operations, renderer behavior, or gestalt styles still require exemplar review.

## Evidence From Current State

- Equation motion has a mature semantic/runtime/compiler path and now needs a
  bounded conformance lane rather than indefinite animation-by-animation
  polishing.
- Graph animations already share the runtime clock for tangents, accumulated
  area, vectors, projections, and comparison layouts.
- The current FTC asset is an equation-form comparison, so it is a useful seed
  but not yet the desired graph-and-symbol reasoning tutorial.
- `DiagramScene`, its SVG adapter, semantic correspondence, and LLM draft seam
  exist, but the renderer still uses basic source/target opacity and does not
  yet provide a mature node/edge motion vocabulary.
- SourceFile selectors, deterministic execution traces, programming cards, and
  frame exports exist. Stack, heap, queue, network, and data-structure state are
  the missing visual model.
- The runtime has synchronized layouts and a shared clock, but no first-class
  tutorial storyboard, interaction-state, claim/evidence, or deterministic
  parameter-model contract spanning all renderers.
- There is no promoted economics or physics domain model, so those should enter
  through deterministic ports with provenance rather than renderer-specific
  scripts.

## Candidate Ranking

Scores are 1–5; lower risk is better.

| Candidate | Authoring | Reliability/demo | Reuse | Slice size | Risk | Recommendation |
|---|---:|---:|---:|---:|---:|---|
| Continue equation-by-equation polishing | 2 | 4 | 3 | 3 | 1 | Keep as a bounded conformance lane |
| Build every renderer and domain abstraction first | 3 | 2 | 5 | 1 | 5 | Do not do |
| Cross-domain tutorial kernel through FTC | 5 | 5 | 5 | 3 | 2 | Do next |
| Build the economics lab directly | 5 | 4 | 4 | 2 | 4 | Do after the tutorial/model kernel |
| Open code/network/data structures through BFS | 4 | 4 | 5 | 3 | 3 | Do after FTC |
| Expand equation and graph primitives without a tutorial | 3 | 4 | 4 | 4 | 2 | Fold into the FTC slice |

## Approval Economy

Human review should attach to novelty, not content count.

### Level 0 — composition

An animation uses only promoted operations, correspondence relations, render
primitives, and a versioned gestalt style. Automated semantic, visual,
performance, accessibility, and settlement gates can promote it to
`reviewable` without individual approval.

### Level 1 — new combination or domain exemplar

An animation combines known primitives in a new tutorial pattern or introduces
a new domain mapping. Review these in cohorts using synchronized checkpoint
frames, short recordings, and a shared rubric.

### Level 2 — new primitive or visual language

An animation introduces a semantic operation, renderer behavior, interaction
type, or gestalt-style version. Perfect one canonical exemplar and approve it
before generalization.

Use four maturity labels throughout the catalog:

```text
draft -> reviewable -> gold exemplar -> promoted vocabulary
```

This means generated content made only from promoted vocabulary can scale,
while the small number of genuine visual-language decisions still receive
careful review.

## Platform Contract To Add

The durable tutorial artifact should compose existing animations rather than
replace them:

```text
source material or prompt
-> semantic model and claims
-> tutorial storyboard
-> synchronized view projections
-> semantic motion compiler
-> sampled frames
-> equation / graph / diagram / code / table renderers
```

The minimum cross-domain contract needs:

- learning goals, prerequisites, claims, and evidence refs;
- scenes with synchronized panel layouts and authored checkpoints;
- semantic objects and transformations reused from animation assets;
- correspondence across different views of the same entity;
- deterministic interaction parameters and derived state;
- narration, focus, prompts, and optional assessment hooks;
- provenance and correctness status for every derived view;
- renderer capability and lazy-loading manifests;
- export sampling from the same shared clock.

Interactive models should be functions of explicit state:

```text
parameters -> validated domain model -> derived semantic objects -> views
```

They should not be ad hoc event handlers that directly mutate SVG or DOM.

## Ordered Roadmap

### Milestone 0 — close and freeze

- Complete promotion-matrix and closeout slices 29–30.
- Choose a small gold cohort for equation motion.
- Treat remaining equation issues as cataloged conformance defects, not a reason
  to block new renderer domains.
- Add novelty levels and maturity labels to the editor/catalog workflow.

Exit condition: known-primitives content can reach `reviewable` through
automated gates, and new primitive work has an explicit exemplar checkpoint.

### Milestone 1 — tutorial and interaction kernel

- Define the tutorial storyboard, claim/evidence, checkpoint, and interaction
  parameter contracts.
- Reuse existing animation assets, layouts, timelines, capability manifests,
  and renderer-neutral frames.
- Add a cross-view identity/correspondence inspector.
- Keep curriculum graphs, learner memory, and full assessment generation out of
  scope.

Exit condition: one tutorial can synchronize at least two render surfaces and
one parameter without renderer-owned timing.

### Milestone 2 — FTC gold vertical slice

- Animate accumulated area from `a` to a movable `x`.
- Show the narrow added strip and connect its area to `f(x) dx`.
- Coordinate graph focus with incremental symbolic rearrangement into
  `d/dx ∫_a^x f(t)dt = f(x)`.
- Include the net-change form as a second scene, not merely a side-by-side
  equation replacement.
- Make the bound scrubbable and expose the correspondence between bounds,
  shaded region, accumulator value, derivative, and integrand.

Exit condition: the module is a gold exemplar for equation/graph reasoning and
proves the tutorial kernel, interaction model, export path, and LLM draft shape.

### Milestone 3 — code, networks, and data structures

- Extend `DiagramScene` with stable layout slots, node/edge persistence,
  traversal, insertion/removal, relinking, groups, and table/queue views.
- Use BFS or Dijkstra as the flagship: source-code range, active line, graph
  frontier, visited nodes, queue or priority queue, and distance table all share
  one trace.
- Make the execution trace a deterministic port into semantic objects rather
  than a hand-authored animation.

Exit condition: one trace can drive code, network, and data-structure views with
seek/rewind and stable identity.

### Milestone 4 — parametric economics lab

- Introduce a deterministic model port for curves, intersections, regions, and
  named quantities.
- Support supply/demand parameters, tax or subsidy wedges, equilibrium, consumer
  surplus, producer surplus, government revenue or cost, and deadweight loss.
- Preserve identities for curves, intercepts, equilibrium points, wedges, and
  regions as parameters change.
- Link shaded regions to symbolic quantities and explanatory claims.

Exit condition: parameter changes recompute valid semantic state and all views
update from that state on the shared runtime clock.

### Milestone 5 — physics derivation pack

- Start with the work-energy theorem because it exercises symbolic derivation,
  a force diagram, a force-position graph, an integral, and unit checks.
- Add vector and coordinate-frame correspondence before broader mechanics.
- Treat a units/dimensions checker as a deterministic correctness port, not a
  complete physics engine.

Exit condition: one derivation synchronizes equation, diagram, and graph views
with explicit assumptions and dimensionally valid steps.

### Milestone 6 — governed LLM and upload authoring

- Let LLMs propose semantic models, claims, storyboards, correspondences,
  operation refs, and interaction intent.
- Compile only approved vocabulary into renderer plans.
- Ask for human approval when a draft requires a novel primitive or unresolved
  semantic claim, not whenever it instantiates known content.
- Add source-material ingestion adapters for LaTeX steps, prose, code, and
  structured data after the corresponding deterministic ports exist.

Exit condition: prompts and uploaded material can produce reviewable modules
across at least three renderer combinations without emitting DOM, keyframes, or
unverified mathematics directly.

## Organization

Catalog every artifact along independent facets:

- domain: mathematics, physics, economics, computer science;
- surface: equation, graph, diagram/network, code, table, 3D;
- interaction: playback, scrub, parameter, edit, predict, assess;
- semantic capability: derive, compute, trace, compare, transform;
- maturity: draft, reviewable, gold, promoted;
- novelty: composition, new combination, new primitive;
- gestalt style and version;
- dependency/capability pack and performance tier.

The same operation or renderer primitive may serve many domains. Domain packs
should contain vocabulary, deterministic ports, fixtures, and tutorial modules,
not forked clocks or bespoke animation engines.

## What Not To Do

- Do not wait for every equation animation to be perfect before opening other
  renderer domains.
- Do not build a universal scene graph, CAS, physics engine, or economics solver
  before one vertical slice demands its minimum contract.
- Do not make tutorials a separate animation runtime.
- Do not let LLMs emit pixels, DOM, arbitrary keyframes, or claims that bypass
  domain validation.
- Do not require individual approval for every instantiation of already
  promoted visual vocabulary.

## Current Focus And Next Action

Current focus remains completion of the semantic-material-motion performance
loop. The recommended next action after closeout is to draft and grill the
cross-domain tutorial/interaction contract around the FTC gold exemplar, then
materialize an exemplar-first run contract.

## Stale-plan Notes

- The roadmap's broad “curriculum deferred” language remains correct for learner
  models and full course generation, but becomes too broad if this proposal is
  accepted: a minimal tutorial storyboard is now platform work, not curriculum
  expansion.
- Equation-specific phases remain useful as conformance and regression work but
  should no longer monopolize the active product lane after the current loop.
- Existing graph, DiagramScene, SourceFile, and FTC plans are seeds to compose,
  not separate systems to restart.
- No roadmap status was changed by this proposed review; update the active/next
  phases only after user approval.
