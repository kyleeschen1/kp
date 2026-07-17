# Semantic Material Motion And Performance

Date: 2026-07-17  
Status: accepted  
Domain: `kp.animation`

## Outcome

Kinetic Press animations should behave as materially continuous explanations of
semantic operations, not as cross-fades between rendered equations. Authors and
LLMs describe mathematical or programmatic meaning; a governed compiler chooses
the canonical operation, grouping, junction, pacing, motion motif, and rendering
quality. The result must remain understandable, reversible, extensible, and
performant on low-end devices.

This decision extends the accepted governed semantic animation grammar and the
phase-ordered choreography/Gestalt-style design. It does not replace their
orient, reflow, act, settle, and release envelope.

## Semantic And Choreographic Contracts

### Semantic continuants

Use **semantic continuant** for an entity that persists through a transformation
even while its visual token moves or changes representation. Continuants preserve
identity, ownership, and lineage; they are not inferred from glyph equality.

Each compiled operation may also emit optional semantic witnesses. Presentation
decides whether to show them. Additive cancellation can therefore derive `0`, and
multiplicative cancellation can derive `1`, without fixtures authoring visual
tokens or renderers inventing mathematics.

### Authors state meaning; the compiler owns motion

Authors and LLMs may specify:

- operation and operand roles;
- continuant lineage and material ownership;
- explanation depth and salience;
- epistemic status, including intentionally invalid or incorrect states.

They do not select raw keyframes, DOM behavior, pixel paths, or arbitrary motion
primitives. The compiler selects relation class, Gestalt grouping, junction
policy, duration, motif, and quality tier. Fine-grained fragment motion is an
explicit pedagogical expansion; group-level motion is the default.

### Rigid symbols, pliable transitions

Glyphs remain typographically rigid during focus, reflow, travel, and settlement.
Organic deformation is allowed only at a meaningful junction, and native KaTeX
must become exact as soon as the target representation is recognizable. Avoid
whole-expression `transform: scale(...)` changes. Tokens should retain
independence through small jostle, semantic-order staggering, diagonal movement,
and arcs. The default organic style should feel alive and protozoan-like without
making mathematical typography rubbery.

### Readiness and ownership

Synthesized targets are readiness-gated: a target seed begins only after every
required input reaches the semantic junction. Sources retire only after the
target is recognizable. Operators such as the minus sign in `7 - 4` act as causal
catalysts rather than material contributors.

Copying and joining have explicit ownership modes:

- **Fission/fusion** replaces the origin with all descendants, or all origins
  with the fused result. Distribution and factoring use this mode.
- **Persistent-source copying** keeps the source visible while derived copies
  travel elsewhere. Substitution and reference examples may use this mode.

Fission and fusion use one shared birth or fusion event, with micro-staggered
departures or arrivals in semantic order. Dot-product and matrix traversal order
may determine the stagger.

### Canonical material motions

1. **Representation morph / material junction**: one measured source bundle
   reorganizes into one target bundle at an operation-specific semantic anchor.
   The existing fractional-exponent-to-radical flashcard is the normative
   conformance exemplar. Granular annotations control internal fold order but do
   not force fragment-level choreography.
2. **Successor synthesis**: inputs converge at a junction, the result becomes
   recognizable there, and the inputs retire. `7 - 4 -> 3` is the initial
   exemplar.
3. **Witnessed annihilation**: inverse terms meet symmetrically, compress, show
   an operation-derived `0` or `1` in the actual algebraic slot, absorb the
   witness, and only then compact survivors. The default uses an inward
   focus/shadow pulse rather than explosions, particles, or strike-throughs.
4. **Fission/fusion**: an origin is wholly replaced by descendants or origins are
   wholly replaced by their join. Partial source thinning is not the default.

Junction placement is an operation-specific semantic policy refined by measured
geometry. It is not chosen solely by shortest screen distance.

### Pacing

Semantic pacing owns ordering, hard minima, and pattern-compression authority.
Gestalt styles may tune tempo, micro-stagger, easing, dwell, and organic variation
within those bounds.

Use full per-step timing for up to five serial semantic actions. Beyond five,
never silently accelerate. Either keep the animation intentionally long or use
explicit pattern compression: show the first two actions fully, mark a middle
sweep as a repeated pattern, and show the final action fully. Multi-step matrix
work therefore receives proportionally more time.

### Reverse and incorrect states

Every canonical operation defines explicit reverse choreography and reverse
interpretation. Mechanical time reversal is insufficient: reverse cancellation
means introducing a neutral element as an inverse pair; reverse distribution is
fusion/factoring.

Correctness is an independent semantic channel. Incorrect states may use the same
smooth motion grammar but may not settle as if valid. A broken invariant remains
visible through a cue, explanation, or comparison branch. Student-proposed steps
default to a provisional branch from the last trusted state; validation either
commits the branch or marks/retracts it. Uploaded material may explicitly request
historical replay of an incorrect derivation.

## Extensibility Contract

Canonical operations live in an expandable registry. Each registration declares:

- role, lineage, and ownership schema;
- validity laws and optional witnesses;
- reverse interpretation;
- allowed choreography families and grouping levels;
- pacing and static cost model;
- representative semantic, visual, reverse, and performance fixtures.

Extensions compose approved primitives by default. A new renderer or primitive
requires separate semantic, visual, accessibility, and performance conformance
before it becomes available to LLM generation.

## Performance And Accessibility Contracts

Performance work is part of the material-motion implementation rather than a
later cleanup. Shared operations must grow code by operation family, not by
authored example. Animation catalogs and domain capabilities should be loaded as
data or lazy family packs rather than eagerly bundled and reconstructed.

Motion accessibility and render quality are independent controls:

- accessibility: system, full motion, reduced motion, static, or narrated;
- quality: auto, full, balanced, or efficient.

Auto is the default quality choice and users may persist an override. Resolve the
quality tier before playback and freeze it for the entire animation. Low-end
adaptation preserves semantic motion, ordering, witnesses, and duration while it
may reduce shadows, texture subdivision, micro-jostle, particles, and 3D depth.
It must not remove explanatory steps.

The compiler estimates cost from token count, simultaneous moving groups,
fragment subdivision, shadows, and 3D layers. It can choose group-level motion,
lower surface richness, reject an excessive plan, or request explicit
pedagogical compression before rendering. Runtime measurements validate that
estimate.

Promotion gates exercise low-, medium-, and high-complexity fixtures for each
canonical motif and applicable Gestalt style. They check frame budgets, bounded
token/fragment counts, no repeated layout measurement during active motion, no
unexpected WebGL download, stable continuity, and quality-tier parity.

Initial working budgets:

- initial JavaScript target below 250 KB compressed;
- no playback long task above 50 ms;
- p95 animation frame below 33 ms under 6x CPU throttling;
- Three.js and high-fidelity renderers absent from initial transfer unless a
  visible requested surface needs them.

## Baseline Evidence

The 2026-07-17 production build measured:

- main JavaScript: 1,531.62 KB minified / 360.39 KB compressed;
- Three.js WebGL chunk: 525.57 KB minified / 132.20 KB compressed;
- total initial resource transfer: about 561 KB, including about 56 KB of KaTeX
  fonts;
- normal local hydration: about 0.8 seconds with the matrix animation near 60
  frames per second;
- 6x CPU plus slow-network hydration: about 3.4 seconds, matrix animation about
  49 frames per second, p95 frame about 34 ms, and a maximum hitch about 67 ms.

Three.js is syntactically split but currently requested immediately because graph
hydration runs unconditionally. The editor also constructs the full catalog in
multiple paths and updates diagnostics, Gestalt inspection, and DOM text on every
frame. These are implementation targets, not inherent costs of semantic motion.

