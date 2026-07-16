# Phase-Ordered Choreography And Gestalt Styles

Date: 2026-07-16
Status: accepted design; implementation proposed

## Purpose

KP already preserves semantic identity, compiles canonical operations, plans
stable layouts and paths, samples deterministic motion, and exposes accessible
playback. The remaining defect is perceptual ordering: an animation can pass
numeric continuity budgets while failing to orient attention, move persistent
content first, communicate the semantic act, settle cleanly, or release focus.

This design adds:

1. a universal phase-ordered choreography plan;
2. explicit semantic and representational motion vocabulary;
3. configurable, versioned gestalt styles;
4. organic token choreography as the preferred new-animation realization;
5. enforceable perceptual and style conformance;
6. presentation-only 2.5D focus experiments.

## Normative Vocabulary

### Choreography envelope

The universal transition lifecycle:

```text
orient → reflow → act → settle → release
```

Every phase exists in the compiled plan. A phase with no work is an explicit
no-op with a reason.

### Semantic continuant

One semantic entity preserving identity across source and target states.
Continuants may change role or representation while retaining identity.

### Semantic object constancy

The perceptual preservation of a continuant across movement, seek, rewind, and
renderer handoff.

### Representational lineage

A causal relation between distinct notational structures, such as a fractional
exponent becoming radical notation, without falsely claiming semantic identity.

### Salience graph

The transferable, optionally branching flow of viewer attention across source,
transit, and result entities.

### Semantic traversal plan

The ordered or ranked traversal of operation participants. Explicit semantic
index, dependency, proof, or execution order outranks visual reading order.

### Motion field

A group-level realization constraint defining dominant path direction,
curvature family, reconciliation region, branch symmetry, cohesion, and depth
plane.

### Organic token choreography

Coordinated group motion whose tokens or fragments retain bounded independent
paths, stagger, deformation, and deterministic micro-motion.

### Gestalt style

A versioned, declarative realization profile that changes motion character
without changing semantic choreography.

### Perceptual material continuity

Traceable causal flow between source and target representation without
requiring literal one-to-one pixel conservation.

## Architecture

```text
semantic derivation
  + canonical operation bindings
  + identity and lineage
  + representational lineage
  + salience graph
  + traversal plan
  + layout snapshots
        ↓
KpChoreographyPlan
        ↓
pinned KpGestaltStyle + overrides
        ↓
renderer capability resolution
        ↓
deterministic concrete motion realization
        ↓
shared player / seek / rewind / export
```

Semantic choreography is immutable under style substitution. Styles realize a
valid plan but cannot change identity, lineage, causal dependencies, traversal,
pedagogical compression, disclosure, or exact endpoints.

## Choreography Envelope

### Orient

- Focus the smallest causal semantic group.
- Accommodation movers are not focused by default.
- Focus may be skipped only when the causal group is already perceptually
  dominant.
- Meaningful movement begins only after focus crosses a normalized readiness
  threshold.
- Orientation and early reflow may overlap after readiness.

### Reflow

- Semantic continuants move continuously toward target geometry.
- Persistent opacity remains effectively full.
- Destination and transit space are reserved before reflow.
- Accommodation motion is restrained and subordinate.
- Reflow completes before the act by default.
- Causal overlap requires an explicit motif dependency and conformance evidence.

### Act

- Operation-specific causal subgraphs govern movement, appearance, elimination,
  copying, merging, folding, enclosure, and replacement.
- There is no universal vanish/move/appear sequence.
- Every introduced visual element has one primary cause:
  semantic introduction, lineage introduction, representational succession,
  structural realization, pedagogical annotation, or disclosure.
- Opacity is secondary and cannot replace causal motion.

### Settle

- Continuants reach exact target geometry.
- Introduced entities reach native target opacity and scale.
- Eliminated entities and temporary clones/fragments leave.
- Structural ownership is exact.
- Residual motion, deformation, and temporary transforms become zero.
- The target holds at a stable recognition checkpoint.
- Settled mathematical states are visually still.

### Release

- Focus, elevation, shadow, annotations, and context treatment return to
  neutral.
- Release begins only after recognition.
- Multi-step derivations fully release by default.
- Compound sequences may use an explicit attention bridge after recognition.

## Identity, Lineage, And Attention

Canonical operation binding and explicit correspondence are the only authority
for continuant identity. Glyph equality, LaTeX equality, and screen geometry may
propose import bindings but cannot silently decide identity.

A salience graph may transfer focus:

```text
source → travelling entity → target
```

It may branch only when semantic lineage branches. Branches carry bounded
weights and reunify perceptually at a result or group.

At every handoff, the arriving focus target crosses readiness before the prior
target releases. At least one explanatory entity remains salient.

## Semantic Traversal

Traversal ranks may derive from:

- explicit indices;
- execution order;
- proof dependencies;
- addend or term order;
- matrix row/column pairing;
- occurrence order;
- declared symmetry.

Adjacent ranks use threshold-gated cascading overlap. Usually one rank is
primary while one adjacent rank enters or exits.

Long traversals may establish a pattern, compress the middle explicitly, and
show the final contribution. Pedagogical compression remains outside gestalt
styles.

## Organic Token Choreography

### Motion hierarchy

```text
semantic group
  → semantic or structural tokens
    → optional visual fragments
```

Fragments are exceptional and primarily support representational succession.
Semantic inspection continues to reference underlying entities, not temporary
fragments.

### Cohesion

Each independently moving group declares:

- anchor tokens;
- maximum separation from its motion field;
- bounded stagger span;
- token-order preservation unless semantic reorder is declared;
- crossing constraints;
- minimum visible material;
- convergence, branch, or reconciliation regions;
- exact target regrouping.

### Paths

- Continuant reflow uses restrained shortest-curvature paths.
- Meaningful transformative motion prefers diagonals and arcs.
- Representational successors strongly prefer opposite-corner reconciliation.
- Opposite-corner, direct, above, below, left, and right candidates remain
  collision-scored.
- Canonical motifs may require a path family.
- A group shares one coherent motion field; tokens vary within it.
- Motion fields derive from scene geometry, reading context, semantic
  traversal, obstacles, and style preferences.

### Stagger

Motifs declare a propagation rule:

- causal;
- far-to-near;
- near-to-far;
- reading order;
- radial;
- branch order;
- symmetric;
- semantic traversal rank.

Stable IDs add only minor deterministic variation.

### Micro-motion

- Derived from identity, lineage edge, branch index, motif, and motion field.
- Directly sampleable from normalized progress.
- Zero at stable endpoints.
- Bounded relative to the main path.
- Partially correlated within a group.
- Reproducible under seek, rewind, export, and regeneration.

Semantic continuants may retain subtle identity-persistent motion signatures.
Lineage descendants inherit the source signature with branch-specific
variation.

### Deformation

- Whole-group scale cannot be the primary transition mechanism.
- Tiny focus scale is allowed.
- Atomic semantic tokens may use subtle directional squash-and-stretch.
- Copies may compress slightly at departure and relax at arrival.
- Representational successors and visual fragments may deform more strongly.
- Native typography is exact at checkpoints and endpoints.

### Opacity

- Continuants remain effectively opaque.
- Copies visibly originate from a source.
- Eliminations fade only after their cause is legible.
- Representational cross-opacity requires a shared seed, path, or bundle.
- Generated conforming transitions never whole-layer cross-fade.

## Gestalt Style Contract

### First styles

- `kp.organic-subtle@1.0.0`: preferred default for new generated animations.
- `kp.restrained-editorial@1.0.0`: calmer alternative.
- `kp.focus.elevated-experimental@0.x`: optional focus override.

Flat focus remains the initial default.

### Declarative channels

A style may configure bounded:

- path-family weights and curvature;
- diagonal and opposite-corner preference;
- propagation and stagger strength;
- micro-motion functions and amplitude;
- deformation ceilings;
- cohesion strength;
- acceleration character;
- focus profile;
- depth and shadow profile;
- context dimming;
- pacing and recognition dwell;
- opacity restraint;
- renderer-specific optional realizations;
- accessibility projections.

Styles cannot change:

- operation identity or roles;
- identity, semantic lineage, or representational lineage;
- envelope dependency order;
- semantic traversal;
- pedagogical compression;
- correctness or disclosure policy;
- exact layout endpoints.

### Resolution

```text
trusted primitive defaults
→ one pinned base gestalt style
→ canonical operation and motif constraints
→ project channel overrides
→ animation channel overrides
→ motif channel overrides
→ viewer compatible substitution
→ accessibility projection
```

Canonical motif requirements override style preferences. Irreconcilable
required capabilities produce typed incompatibility gaps.

### Versioning and packages

Published style versions are immutable and exactly pinned. Packages contain:

- namespaced ID and version;
- base dependency;
- channel declarations;
- renderer capabilities;
- required trusted primitives;
- accessibility projections;
- conformance fixtures and results;
- source provenance;
- integrity hash.

Animations store the pinned style, overrides, choreography/compiler versions,
capability assumptions, and resolved fingerprint. Baked frames remain export or
cache artifacts with provenance.

### Renderer capabilities

Styles are renderer-neutral. Renderers declare supported realizations and
fallbacks. Capabilities are `required` or `optional`.

Missing required capabilities produce typed gaps. Optional fallback is reported
in diagnostics.

### Runtime substitution

Viewers may select another compatible style locally. Switching styles pauses
and resamples the same semantic progress without remounting or interpolating
between style realizations.

## Focus, Depth, And Shadow

Depth communicates only current attentional foreground. It cannot communicate
correctness, confidence, hierarchy, permanence, or provenance.

Focus applies to the smallest complete semantic group. Individual glyph
elevation is allowed only when one glyph is the full entity.

The initial CSS 2.5D profile:

```text
orient: lift in z and establish shared shadow
reflow/act: hold elevation while x/y motion follows the unchanged plan
settle: hold at recognition checkpoint
release: return z, scale, and shadow exactly to neutral
```

Initial experimental bounds, not contract constants:

- z elevation approximately 8–14 CSS pixels;
- scale approximately 1.01–1.025;
- broad low-opacity group shadow;
- no rotation;
- no layout participation.

Fragmenting groups retain one shared shadow field rather than per-fragment
shadows. Foreground movers avoid occlusion through path planning. Significant
contact requires motif semantics.

Flat and elevated focus comparisons use identical semantic plans, x/y paths,
progress, endpoints, and direction. Reduced motion removes z travel while
retaining causal checkpoints and focus meaning.

## Accessibility

Every publishable style resolves:

- full motion;
- reduced motion;
- static checkpoints;
- narrated sequencing;
- high-contrast focus;
- no-depth/no-shadow projection;
- keyboard seek and traversal;
- rewind.

Reduced motion preserves orient/reflow/act/settle/release and salience/traversal
while removing arcs, opposite-corner travel, jostle, deformation, and z travel.
Restrained position changes remain only where object constancy requires them.

Narration follows envelope phases, salience transfer, and traversal. It cannot
lead the visual cause or lag after focus has moved.

## Regeneration And Editing

Semantic edits apply at stable checkpoints. KP compiles the revision and resumes
from a compatible checkpoint or explicitly restarts the operation.

Presentation-only style changes resample immediately at the current progress.

Authors select profiles and bounded constraints. Raw geometry, per-token delays,
control points, z values, shadow kernels, and keyframes are an advanced
non-regenerable override until reconciled.

LLMs may author:

- operations and role bindings;
- continuants and lineage;
- representational lineage;
- causal groups;
- salience graph;
- traversal order;
- pedagogical pauses and disclosure;
- high-level focus preference.

KP owns all concrete motion realization.

## Conformance

### Universal static laws

- mandatory envelope phases with explicit no-op reasons;
- total entity lifecycle and introduction-cause classification;
- operation-authoritative identity;
- focus-before-meaningful-motion;
- reservation-before-reflow;
- reflow-before-act by default;
- declared causal overlap only;
- cause-before-elimination;
- settle-before-release;
- exact target and zero residual transform;
- mirrored rewind dependencies;
- no raw generated geometry;
- disclosure separate from choreography.

### Sampled laws

- normalized focus readiness;
- salience handoff continuity;
- continuant opacity and identity continuity;
- position, velocity, acceleration, and boundary continuity;
- exact endpoints;
- no collisions or material occlusion;
- cohesion and crossing bounds;
- deterministic stagger and micro-motion;
- zero endpoint jostle/deformation;
- no whole-group scale transition;
- perceptual material continuity;
- flat/elevated x/y path equivalence;
- static checkpoint stillness;
- seek and rewind equivalence.

### Gestalt-style laws

`organic-subtle` additionally requires:

- meaningful curvature or diagonal displacement when geometry permits;
- bounded multi-token phase differences;
- nonuniform token realization without cohesion failure;
- shared reconciliation for representational succession;
- transit micro-motion with zero endpoint displacement;
- bounded semantic-level deformation;
- exact calm settlement.

### Human review

Promotion requires automated conformance and human perceptual review at normal
speed, slow motion, direct seek, and rewind.

Shared rubric:

- causal legibility;
- semantic object constancy;
- attention continuity;
- organic coherence;
- typographic integrity;
- pacing and dwell;
- visual restraint;
- rewind comprehension;
- reduced-motion equivalence.

Canonical examples also compare against approved dashboard exemplars.

## First Proof Cohort

1. Function wrapping.
2. Fractional exponent to radical.
3. Linear rearrangement.
4. Three-term dot product.

Distribution and substitution remain regression cases.

## Enforcement Rollout

- Canonical cohort: strict immediately.
- New generated animations: strict immediately.
- Existing catalog: warnings first, then family-by-family promotion.
- Legacy exceptions: typed and justified.
- Whole-layer fading: diagnosed, nonpromotable fallback.

## Stop Conditions

- Stop if the design requires a second playback clock.
- Stop if focus changes measured x/y layout.
- Stop if a universal envelope erases operation-specific causality.
- Stop if organic realization becomes nondeterministic under seek or rewind.
- Stop if styles can change semantic or pedagogical content.
- Stop if 3D focus requires unsafe KaTeX internals or materially degrades
  legibility.
- Stop if generated content must author raw geometry or keyframes.
