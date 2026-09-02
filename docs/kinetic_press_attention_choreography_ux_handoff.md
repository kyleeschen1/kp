# Kinetic Press Attention Choreography UX Handoff

Status: proposed UX work plan; ready for review  
Date: 2026-08-13  
Audience: product design, curriculum design, learner research, visual design,
and implementation agents  
Scope: learner and author experience, not code architecture  

## Canonical Repository And Authority

This handoff belongs to the canonical Kinetic Press repository: the `kp`
checkout containing `theseus.config.json`, `AGENTS.md`, and the active project
roadmap.

The sibling `kinetic-press` checkout is not the canonical project workspace.
It contains useful historical attention-choreography experiments, but new KP
plans and implementation work must target this repository unless an explicit
migration or archaeology task says otherwise.

This document is a proposed plan. It does not supersede
`docs/project/roadmap.md`, reactivate the paused explanation-attention thread,
or authorize a broad implementation. The roadmap currently owns priority; an
explicit decision is required before this plan becomes active work.

## Purpose

Kinetic Press already has strong semantic animations, stable native renderers,
continuous Article prose, direct semantic seeking, and multiple learner
projections. The remaining UX problem is coordination:

- a learner may still read while an essential transformation is occurring;
- motion may start before the learner has found the relevant object;
- the learner may not know when the visual event has settled;
- returning from stage to prose may require an unprompted visual search;
- a missed transient event may require reverse-engineering scroll position;
- text and animation may each be good while their cadence is unclear.

The goal is to make prose and animation behave as one coordinated argument.
The learner should spend attention understanding the subject, not deciding how
to operate the explanation.

## Desired Outcome

At every meaningful point in a motion passage, the combined experience should
answer three implicit questions:

1. **Where should I look?**
2. **What relationship or change am I looking for?**
3. **How will I know that this moment has finished?**

The answer should emerge from stable prose, semantic salience, stage state,
and available controls. KP should not need to repeatedly issue literal commands
such as “look right” or “now return to the text.”

## Product Hypothesis

If KP makes the transfer of attention among narrative, stage, and reflection
legible, learners will spend less effort coordinating the interface and more
effort constructing the conceptual relationship.

Compared with an uncoordinated presentation, successful choreography should
help more learners:

- locate the relevant object before it changes;
- witness the critical transformation on the first pass;
- explain both what changed and what remained invariant;
- understand the causal, procedural, or logical relation depicted by motion;
- recover locally from distraction or a missed event;
- traverse the article without surprise motion, snapback, or attention traps.

## Current Evidence Boundary

The canonical repository contains substantial design and engineering evidence:

- continuous prose was retained because atomic caption streams lose argument
  and context;
- prose before a motion boundary prepares the event, while prose after it
  interprets a settled state;
- visible prose remains stable while motion plays;
- a motion block has semantic checkpoints, direct seeking, local progress,
  and recovery controls;
- a bounded scroll corridor may control one local semantic timeline;
- explicit manual control can take ownership without jumping;
- reduced motion uses meaningful endpoint seeking rather than decorative
  interpolation;
- the economics demand-shift tutorial has exercised persistent-stage,
  split, inline-sticky, attention-stage, and phone-dock treatments;
- the public TypeScript and fraction-composition projections have passed human
  visual checkpoints and are frozen as code and symbolic exemplars.

This is not yet the same as learner evidence that one attention choreography
causes better comprehension. Human visual approval, internal iteration, and
correct deterministic behavior establish a strong design substrate. They do
not establish where learners actually look, what they miss, or whether a cue
improves understanding. This plan therefore begins with observation and one
reversible exemplar rather than a universal rule.

## Relationship To Canonical KP Vocabulary

The prior conversation used **attention episode** for a complete conceptual
cycle. That idea remains useful as a design lens, but it should not become a
new KP architecture primitive without evidence.

Use the repository's canonical terms:

- **motion passage**: the compound content unit containing a stage and related
  narrative;
- **narrative track**: the ordered text associated with the stage;
- **passage**: one authored textual unit;
- **prose passage**: ordinary explanatory reading;
- **cue passage**: short text telling the learner what to inspect, anticipate,
  or retain;
- **motion cue**: a cue passage that owns a bounded semantic animation interval;
- **motion block**: the framework-neutral animation timeline;
- **motion beat**: a meaningful checkpoint or phase within that timeline;
- **scroll corridor**: document distance mapped to semantic progress;
- **stage**: the visual display instance;
- **projection**: the replaceable stacked, split, deck, embed, static, or other
  presentation of the same Article and vignette authority.

Within UX discussion, this handoff uses **attention arc** to mean the learner's
complete attentional journey through part of a motion passage. It is an analysis
label, not a proposed authored type.

## Diagnostic Vocabulary

These terms are useful for critique and learner research. They do not prescribe
new runtime types.

| Term | Working definition |
| --- | --- |
| **Attention floor** | The surface currently permitted to introduce important novelty: narrative, stage, or reflection. |
| **Attentional handoff** | The perceptible transfer of the attention floor between surfaces. |
| **Handoff debt** | Work imposed on the learner when the attention floor changes without a legible transfer. |
| **Novelty collision** | New explanatory content and meaningful visual change arriving simultaneously. |
| **Indexical bridge** | A short cue tied to a visible semantic object, such as “Follow the intersection.” |
| **Motion window** | The bounded interval in which the stage owns attention and prose remains stable. |
| **Settling frame** | The persistent state against which the learner can inspect and interpret the result. |
| **Semantic tether** | A stable identity relation across prose and stage, expressed through semantic refs and renderer-appropriate salience. |
| **Eye-switch budget** | The number of necessary transfers between narrative and stage for one conceptual claim. |
| **Recovery loop** | Replay, scrub, checkpoint navigation, history, comparison, or another local path for reconstructing a missed event. |
| **Attentional ping-pong** | Repeated cross-surface switching that does not perform a distinct pedagogical job. |

## Canonical Attention Arc

The default learner journey is:

> **Orient → Locate → Anticipate → Hand off → Transform → Settle → Interpret → Check**

These are semantic phases, not eight mandatory passages or screens. A small
change may compress several phases. A static comparison may omit transformation.
A continuous system may make direct manipulation the transformation. The
invariant is that the learner should not have to infer the attention transfer or
process two sources of important novelty simultaneously.

| Phase | Learner question | Attention floor | Narrative behavior | Stage behavior | Completion signal |
| --- | --- | --- | --- | --- | --- |
| **Orient** | What question or claim am I considering? | Narrative | States the purpose and necessary context. | Holds a stable relevant state. | The learner knows why the stage matters. |
| **Locate** | Which object or relationship matters? | Narrative moving toward stage | Uses a concrete semantic reference or indexical bridge. | Makes the target findable without changing it. | The target is visually located. |
| **Anticipate** | What should I expect or predict? | Narrative or reflection | Names the expected dimension of change without explaining the result. | Remains still. | The learner has a hypothesis or watch criterion. |
| **Hand off** | Is it time to watch or manipulate? | Transition | Remains spatially stable; a cue passage or motion boundary becomes evident. | Target and necessary context are prepared. | The next action is obvious and motion has not yet surprised the learner. |
| **Transform** | What happens? | Stage | Introduces no new paragraph or changing instruction. | One bounded semantic event plays or responds to control. | Motion reaches a named checkpoint. |
| **Settle** | What is the resulting state? | Stage | Remains quiet long enough for inspection. | Stable endpoint, trace, comparison, or event history persists. | The evidence can be inspected without replay. |
| **Interpret** | What did the event demonstrate? | Narrative | Names change, invariant, cause, procedure, or rule. | Holds the exact relevant state. | Prose and stage express the same claim. |
| **Check** | Did I understand rather than merely look? | Reflection | Requests prediction, explanation, comparison, or transfer. | Supports the prompt without adding unrelated novelty. | A response or reveal closes the arc. |

### Compression Rules

- Orient and Locate may be one prose passage when the target is obvious.
- Locate and Anticipate may be one sentence: “Follow the intersection as demand
  shifts.”
- Anticipate may be omitted when prediction would be trivial or burdensome.
- Hand off may be the visible entrance into a motion cue rather than a separate
  control surface.
- Transform and Settle may feel continuous, but the endpoint must remain stable.
- Interpret and Check may combine when a short prompt names the result and asks
  for its implication.
- A simple focus-only passage may use `Orient → Locate → Interpret` with no
  motion block.

## Core UX Principles

### 1. Preserve continuous explanation

The complete reasoning chain remains readable as Article prose. Attention
annotations coordinate that prose with a stage; they do not replace the
argument with a rail of atomic captions.

The lesson should remain coherent if the learner does not play animation. The
static projection may be less vivid, but it must preserve claims, premises,
conclusions, and meaningful states.

### 2. One novelty owner at a time

Only the current attention floor introduces important new information. Other
surfaces may preserve context, identity, and orientation, but they do not
compete.

### 3. Locate before motion

The semantic target and necessary context must be visible before they change.
A highlight that arrives after motion begins is too late for a novice who does
not yet know what matters.

### 4. Stable prose during motion

Playback never rewrites the learner-facing paragraph, rotates through captions,
or advances to new explanation. Scroll may select which passage is emphasized;
the semantic playhead may change stage-local salience; neither should make
prose itself another animated surface.

### 5. Motion must earn its transience

Use motion when temporal change, causation, procedure, transformation, or
identity over time is itself instructional. Prefer stable representations for
definition, careful comparison, dense relationships, and rereading.

### 6. Every important motion ends in evidence

The result persists. When the teaching question needs it, retain a historical
trace, before/after mode, execution history, or other renderer-appropriate
evidence. “Ghost” is a trace role, not a universal low-opacity style.

### 7. Guidance is legible rather than coercive

Do not use page snapping, surprise autoplay, input interception, or layout
movement to force cadence. The accepted bounded scroll corridor may map one
local passage to one semantic timeline, but it must remain reversible,
deterministic, and free of snapback.

### 8. Recovery belongs to the primary experience

Distraction is normal. Rewind, previous/next checkpoint, play/pause, scrub,
direct semantic links, and stable endpoints are primary affordances, not an
advanced mode.

### 9. Salience communicates relations, not decoration

Cueing should help the learner select, organize, or connect information. Merely
capturing the eye is insufficient. Every focus treatment should correspond to
an instructional intent such as notice, compare, transmit, predict, question,
or retain.

### 10. One exemplar before promotion

Exact emphasis, timing, bridge copy, stage composition, and optical treatment
remain local to one canonical exemplar until human review. A structurally
different second caller is required before extracting a shared pattern.

## Interaction Contract

### Scroll

Canonical KP does not need an absolute rule that scroll only navigates. The
accepted motion-passage model allows a bounded scroll corridor to seek one local
semantic timeline.

The UX requirements are:

- only the active local motion block responds;
- stopping scroll stops motion;
- reversing scroll reverses the same deterministic path without jumping;
- authored hold intervals provide time to locate, inspect, and settle;
- the corridor does not change prose wording;
- rapid traversal lands in a stable reconstructible state;
- no snap behavior moves the learner against their input;
- reduced motion is manual-only;
- a deliberate manual action can take ownership without a discontinuity;
- later deliberate scroll can resume from the visible state without snapping.

The first UX comparison should not assume that scroll or explicit play is
universally superior. It should compare whether each makes the handoff and
settlement legible for the canonical graph claim.

### Play, Pause, And Checkpoint Navigation

Controls operate on conceptual states, not arbitrary fixed time increments.

- `Previous` and `Next` move among named semantic checkpoints.
- `Play/Pause` runs or stops the local motion block.
- `Rewind` restores the local entry state rather than resetting unrelated
  lesson content.
- The scrubber supports fine inspection and direct recovery.
- A progress rail is read-only and must not look draggable.
- Disabled controls remain understandable in the static/no-JavaScript state.
- Controls do not auto-scroll the document.

### Direct Links And Return Visits

A semantic link to a section, block, checkpoint, or Article reference must
reconstruct the complete visible state immediately. The learner should not
watch preceding animations replay at high speed to reach the target.

Back, Forward, TOC navigation, interruption, and return visits should land on
the same deterministic checkpoint projection.

### Reverse Navigation

When the learner scrolls or navigates backward:

- preserve semantic identity and meaningful prior settled states;
- avoid surprise replay after the learner has stopped;
- restore the correct narrative emphasis and stage state together;
- retain learner answers when product policy permits;
- expose replay as a deliberate action.

### Rapid Traversal

If the learner skips across multiple passages, do not queue every missed
animation. Resolve the selected semantic destination and display its stable
state. The learner can deliberately replay the local event.

## Attentional Handoff Design

An effective handoff should normally combine two or three quiet signals:

1. a cue passage names the target, expected change, and retained context;
2. the target is already semantically salient before movement;
3. a visible motion boundary or locally strengthened stage state marks the
   shift;
4. the relevant progress or transport affordance becomes available.

Avoid:

- flashing the whole page;
- moving prose to a different location;
- changing a viewing instruction during motion;
- beginning motion in the instant the target first appears;
- hiding context required to understand the relationship;
- using color or opacity as the only carrier of meaning;
- placing a decorative connector across prose and stage merely to dramatize the
  transfer;
- allowing active keyboard focus and story salience to become indistinguishable.

### Indexical Bridge Rules

A bridge should:

- name a visible semantic object or relation;
- identify the dimension of change or invariant to watch;
- remain spatially and verbally stable through the motion window;
- avoid explaining the final result before it occurs;
- avoid left/right language that fails in another projection;
- remain concise enough to recall while looking at the stage.

Good graph example:

> Hold supply fixed. Follow the demand curve and their intersection.

Good symbolic example:

> Follow the denominator as it distributes across the product.

Good code example:

> Watch the repeated threshold become one named rule.

Weak examples:

- “An important transformation now occurs.”
- “As you can see, this proves the principle described above.”
- a paragraph that must be read during motion;
- a cue that identifies an object but not the relationship that matters.

## Settling And Recovery Design

The settling frame is the evidence surface for interpretation. It is not merely
the final animation frame.

For each important motion block, choose the recovery representation that fits
the teaching question:

- stable final state;
- historical trace;
- aligned before/after states;
- checkpoint list;
- event or execution history;
- reversible scrubber;
- replay;
- static step sequence;
- textual state description.

Examples:

- A graph shift may preserve the prior curve and equilibrium as historical
  traces while keeping unchanged supply legible.
- A symbolic transformation may use native settled KaTeX plus semantic
  correspondence to the prior expression.
- A code refactor may retain complete searchable source and a collapsed
  checkpoint transcript.

The representation should support the learner's actual interpretive task. Do
not apply one generic ghost treatment across SVG, KaTeX, and code.

## Narrative And Copy Contract

### Orienting Prose Passage

- State one question, tension, or claim.
- Supply only the context required for the coming passage.
- Do not narrate every frame in advance.

### Cue Passage

- Name the primary target.
- Name necessary context or the invariant.
- Indicate the relation or dimension of change to inspect.
- Use semantic refs rather than spatial directions when possible.

### During The Motion Window

- Keep learner-facing prose stable.
- Introduce no new paragraph.
- Use controls and progress without rotating instructional copy.
- Let stage-local salience change only in service of the active intent.

### Interpretation Passage

- Name what changed.
- Name what stayed stable when it matters.
- Connect the event to the causal, procedural, or logical claim.
- Refer to a state that is still visible or directly recoverable.

### Check Or Reflection

Prefer prompts that require the learner to use the relation:

- predict the next checkpoint;
- identify the changed object and retained context;
- explain a causal direction;
- reconstruct the prior state;
- distinguish a tempting misconception;
- transfer the pattern to a nearby case.

Avoid checks that merely ask whether the learner watched or remembers a label.

## Projection Requirements

The choreography is semantic; its presentation varies by projection.

### Split Projection

- Narrative and stage may remain visible together.
- The active passage is readable without making surrounding required prose
  illegible.
- The stage remains geometrically stable across attention phases.
- The target wins through scene-level salience rather than a layout jump.
- The eye-switch path between cue and target is short and predictable.
- A cue does not require the learner to scan the full width repeatedly.

### Stacked Projection

- Narrative order remains coherent in ordinary document flow.
- A stage may pin through a bounded station lifecycle, but entry and release are
  apparent.
- The stage does not occlude required prose or trap page scroll.
- Interpretation follows a settled state rather than appearing while the stage
  is still changing.

### Attention-Stage Or Deck Projection

- Stage, passage, progress, and transport follow an intentional reading order.
- Larger text wraps into ordinary flow instead of shrinking the stage.
- One-screen composition is preferred but not required at the cost of
  readability.
- This remains a presentation comparison, not a universal layout.

### Phone Projection

- Treat the phone as one alternating attention surface, not compressed dual
  columns.
- Keep the stage dock stable in size when used.
- Bring the cue and relevant target into one understandable viewport sequence.
- Use a compare toggle or checkpoint history instead of dense side-by-side
  states when necessary.
- Ensure browser chrome, short viewports, zoom, and one-handed use do not hide
  controls or interpretation.
- Do not use the wide-screen page wash as a default phone treatment.

### Static And No-JavaScript Projection

- Preserve the complete Article.
- Render the initial meaningful stage state.
- Expose semantic navigation and state descriptions.
- Show before/after or static steps for essential transformations.
- Do not present dead controls as if they are operable.

## Accessibility And Preferences

### Reduced Motion

- Use direct semantic checkpoint changes or short non-instructional dissolves.
- Preserve the same orient, locate, settle, interpret, and check sequence.
- Provide before/after, static steps, or meaningful state descriptions.
- Do not automatically advance motion from scroll.

### Keyboard

- All play, pause, rewind, step, compare, and scrub controls are reachable in a
  logical order.
- Focus does not jump when the attention phase changes.
- Story salience never obscures the focus indicator.
- Shortcuts are discoverable and do not hijack browser navigation.

### Screen Reader

- Present the passage goal before transport controls.
- Announce named semantic checkpoints rather than continuous frame noise.
- Describe what changed and what remained invariant.
- Keep contextual information in the accessibility tree even when visually
  attenuated.
- Avoid relying on left/right or color-only references.

### High Contrast And Color Vision

- Pair color and opacity with outline, label, position, shape, or trace role.
- Required context remains readable.
- Identity, salience, presence, and historical role remain distinguishable.

### Timing And Control

- Critical instructional events remain recoverable.
- No comprehension task depends on reacting before information disappears.
- Pausing leaves a meaningful and stable frame.

### Narration

Narration may be tested as an optional projection for selected passages. It is
not the default remedy for visual competition: speech is also transient and
introduces its own pacing and access constraints.

## Content-Specific Attention Profiles

These profiles share the attention arc without requiring identical controls or
visual treatments.

### Graph Or Causal-System Profile

Use for economics, physics, biological systems, and other models where one
change propagates through relationships.

Sequence:

> Establish baseline → identify changed relation and fixed context → predict →
> transform → trace consequence → settle → interpret

Required properties:

- baseline remains reconstructible;
- cause, fixed context, and consequence are visually distinct;
- downstream effects are disclosed in an intelligible order;
- interpretation relates the affected quantities explicitly.

### Symbolic-Transformation Profile

Use for algebra, equation manipulation, expression rewriting, and derivation.

Sequence:

> Establish expression → locate semantic object → predict operation → transform
> → settle native notation → name change and invariant → check next operation

Required properties:

- identity does not depend on glyph equality;
- settled native KaTeX remains the typography and accessibility owner;
- correspondence and lineage survive direct seek and rewind;
- before/after inspection is available when movement alone is ambiguous.

### Program-Transformation Profile

Use for refactoring, evaluation, execution order, and program state.

Sequence:

> State program question → locate source range or event → predict → transform or
> advance one event → settle native source/history → explain change → check

Required properties:

- complete searchable source remains available;
- source native, transient overlay, and target native ownership are distinct;
- event or transformation history can be recovered;
- the semantic fact comes from the interpreter, trace, or authored
  transformation rather than visual timing.

### Static Comparison Profile

Use when comparison, not motion, carries the idea.

Sequence:

> Frame comparison → link corresponding entities → inspect before/after/both →
> interpret relation → check

Required properties:

- aligned views or deterministic toggles;
- linked semantic focus;
- no decorative animation requirement;
- comparison does not rely on visual memory.

### Continuous-Relationship Profile

Use for parameters, functions, geometric deformation, and other relationships
where continuous variation is itself the concept.

Sequence:

> Identify variable → predict → manipulate → observe coupled response → pause at
> semantic landmarks → generalize

Required properties:

- deliberate direct control or a clearly bounded scrubber;
- meaningful checkpoints and hold regions;
- readable values during manipulation;
- no dependence on a precise hidden scroll position.

## Canonical Exemplar For Discovery

Use the economics demand-shift explanation as the first exemplar because it is:

- the next graph caller in the current Public Web v0 pressure sequence;
- backed by a canonical Article and versioned vignette;
- rendered by the retained SVG session;
- already rich in attention and layout experiments;
- structurally different from the approved code and symbolic public routes;
- capable of testing a changed relation, fixed context, moving intersection,
  historical trace, and post-motion interpretation.

### Exemplar Authority

- **Canonical Article:** `content/lessons/economics-demand-shift.kp.md`
- **Canonical vignette:** `vignette.economics.demand-shift@1`
- **Current discovery host:** `/tutorials/economics/demand-shift/`
- **Renderer authority:** the retained economics SVG session
- **Semantic authority:** the existing demand-shift model, checkpoints, and
  motion blocks
- **Current public-product task:** a bounded economics graph projection that
  preserves the approved code and symbolic exemplars

Before any visible implementation, audit and preserve the user's current
uncommitted economics Article and generated-publication edits. Do not use this
UX plan as permission to overwrite them.

## Exemplar Storyboard

The discovery pass should focus on one claim first:

> When demand increases while supply remains fixed, the equilibrium moves to a
> higher price and quantity.

### Attention Arc A: Demand Shifts

| Phase | Narrative experience | Stage experience | Learner evidence sought |
| --- | --- | --- | --- |
| Orient | Establish the initial market and the question. | Show `D₀`, supply, and `E₀` in a stable baseline. | Learner can identify the starting equilibrium. |
| Locate | Name demand as changing and supply as fixed. | Focus the demand curve while retaining readable supply and `E₀`. | Learner locates both changed relation and invariant context. |
| Anticipate | Ask where a new intersection might form. | Hold all geometry still. | Learner predicts direction or at least watches the intersection. |
| Hand off | Use a stable cue passage and visible motion boundary. | Prepare demand, supply, and intersection salience before motion. | Learner is looking at the relevant graph region before change. |
| Transform | Advance the demand-shift motion block. | Move demand through the canonical deterministic timeline; supply remains fixed. | Learner witnesses the curve shift and intersection handoff. |
| Settle | Introduce no new prose during the final motion. | Hold `D₁` and `E₁`; retain `D₀`/`E₀` as appropriate historical evidence. | Learner can inspect before and after without immediate replay. |
| Interpret | Explain higher equilibrium price and quantity. | Keep the settled comparison and fixed supply visible. | Learner explains the result from the graph. |
| Check | Ask why quantity rose even though supply did not shift. | Support the answer with the settled state or replay. | Learner distinguishes a curve shift from movement along supply. |

### Attention Arc B: Movement Along Supply

This should remain a distinct motion block rather than being folded into the
first transformation.

| Phase | Narrative experience | Stage experience | Learner evidence sought |
| --- | --- | --- | --- |
| Orient | Reframe the misconception: supply did not shift. | Begin from the exact settled state of Arc A. | Learner knows the new question. |
| Locate | Point to the unchanged supply curve and `E₀ → E₁`. | Make supply and the equilibrium path primary; keep demand as necessary context. | Learner locates the path on supply. |
| Anticipate | Ask what “movement along supply” means here. | Hold the stage. | Learner forms a relation to inspect. |
| Transform | Trace the equilibrium movement. | Reveal the path and price/quantity consequences in authored order. | Learner follows the same supply curve rather than seeing a second shift. |
| Settle | Preserve the traced relation. | Hold both equilibrium states and the unchanged curve. | Learner can compare quantities and prices. |
| Interpret | State the distinction between shift and movement along. | Keep evidence stable. | Learner expresses the distinction correctly. |
| Check | Offer a nearby scenario or ask which curve shifted. | Use a stable comparison rather than new motion. | Learner transfers the distinction. |

## Prototype Variants

Prototype only the uncertain UX seam. Do not redesign graph semantics,
typography, navigation, or the Article at the same time.

### Variant A: Current Bounded Scroll Corridor

- Scroll controls local semantic progress while the motion cue owns the
  reading band.
- Authored hold regions provide locate and settle time.
- Manual controls remain available for takeover and recovery.

Question: does the learner naturally shift to the stage before meaningful
motion and return to interpretation after settlement?

### Variant B: Explicit Manual Handoff

- Scroll reaches the prepared pre-motion checkpoint.
- A named conceptual action starts the transformation.
- Scroll continues to the interpretation after the settled state is available.

Question: does explicit initiation clarify the handoff enough to justify an
extra action?

### Variant C: Compressed Cue And Corridor

- A concise cue passage and semantic target preparation replace longer
  pre-motion explanation.
- The bounded corridor retains deterministic scroll control.
- Interpretation remains ordinary prose after settlement.

Question: can the experience reduce eye switching without flattening the
argument into captions?

These are comparison variants, not three product modes to retain. Select or
discard them through one exemplar checkpoint.

## Authoring Worksheet

Before designing motion, the author should answer:

1. **Learner goal:** What should the learner be able to explain or do?
2. **Prior state:** What must already be understood and visible?
3. **Conceptual delta:** What one important relation changes?
4. **Invariant:** What remains stable, and must the learner notice it?
5. **Primary target:** Which semantic entity or relation must be found first?
6. **Necessary context:** What must remain legible but secondary?
7. **Instructional intent:** Notice, compare, transmit, predict, question,
   retain, or another approved intent?
8. **Indexical bridge:** What short cue connects narrative to the target?
9. **Motion value:** Why is temporal representation better than static states?
10. **Entry checkpoint:** What is true and visible before motion?
11. **Settling checkpoint:** What evidence remains after motion?
12. **Interpretation:** What sentence names the change and invariant?
13. **Check:** How will the learner demonstrate the relationship?
14. **Recovery:** How can the event be reconstructed locally?
15. **Projection pressure:** What changes on phone, static, reduced-motion, and
    screen-reader paths?

If the author cannot explain why motion is necessary or what the settling frame
must show, begin with a static comparison.

## Authoring Sequence

1. Write the learner goal, delta, invariant, and misconception.
2. Choose the content-specific attention profile.
3. Sketch entry, important intermediate, and settled states as static frames.
4. Write the interpretation and check.
5. Write the cue passage and indexical bridge.
6. Define target, supporting context, presence, and historical trace roles.
7. Add only the motion required to connect the semantic states.
8. Choose scroll and manual-control behavior.
9. Define recovery and direct-seek behavior.
10. Review split, phone, static, keyboard, reduced-motion, and screen-reader
    sequences.
11. Observe learners before promoting the pattern.

This order prevents motion or layout from becoming the source of pedagogical
truth.

## UX Critique Rubric

### Meaning

- Is one conceptual claim being taught?
- Does the stage show evidence for that claim?
- Are change, invariant, and necessary context explicit?

### Handoff

- Is the target visible before it moves?
- Does the learner know what relation to watch?
- Does the motion boundary arrive before the motion?
- Is any new prose competing during the motion window?

### Settlement

- Does motion end at a meaningful semantic checkpoint?
- Can the learner inspect the result without immediate replay?
- Does interpretation refer to the exact state on screen?

### Control

- Can the learner pause, reverse, seek, and recover without a jump?
- Does scroll behavior follow rather than fight user input?
- Does manual takeover remain continuous with the visible state?

### Salience

- Does the intended target actually dominate the complete scene?
- Does required context remain legible?
- Are identity, salience, presence, and trace role kept distinct?
- Would the relation remain understandable without color or motion?

### Cadence

- Does every eye switch perform a pedagogical job?
- Are there unnecessary text-stage-text oscillations?
- Are hold intervals long enough for location and interpretation?
- Can phases be compressed without losing legibility?

### Projection And Access

- Does the same semantic sequence survive split, stacked, phone, and static
  projections?
- Do direct links, reverse navigation, and interruption reconstruct the state?
- Are keyboard focus and screen-reader order coherent?

## Learner Research Plan

### Research Questions

1. Do learners know which surface owns attention at each phase?
2. Do they locate the target before meaningful motion begins?
3. Do they witness the critical transformation on the first pass?
4. Can they explain change, invariant, and causal relation?
5. Can they recover locally after an interruption?
6. Does scroll-controlled motion feel continuous with reading or compete with
   it?
7. Does explicit initiation clarify the handoff or create click fatigue?
8. Which phases can be compressed safely?

### Baseline Observation

Observe the current canonical demand-shift experience before polishing a new
variant. With consent, record screen and interaction behavior. Avoid coaching
the learner on where to look.

Record:

- whether the learner is reading when motion begins;
- whether the intended target was located beforehand;
- pauses or reversals around the motion boundary;
- scrub, replay, checkpoint, or TOC use;
- the learner's account of what changed;
- the learner's account of what remained fixed;
- whether they confuse a curve shift with movement along a curve;
- moments when the next action or completion state is unclear.

A first round of three to five learners is appropriate for discovering major
coordination failures. It is not enough for strong comparative claims.

### Prototype Comparison

Compare the current corridor with at most one challenger at a time. Preserve
the same claim, semantic states, graph, and interpretation so the uncertain
variable is the handoff/control treatment.

After a silent first pass, ask the learner to:

1. explain what happened;
2. identify the changed relation and invariant context;
3. predict or explain the next causal consequence;
4. reconstruct the event using available recovery controls;
5. identify any moment when they did not know where to look.

Think-aloud may be used in a separate pass, but it changes reading and attention
behavior and should not be the only evidence.

### Observation Record

| Field | Description |
| --- | --- |
| Route and motion passage | Exact learner experience tested. |
| Projection and variant | Split, stacked, phone, baseline, or prototype. |
| Intended handoff | What the design expected the learner to do. |
| Observed behavior | What the learner actually did, without interpretation. |
| Learning response | Explanation, prediction, comparison, or answer. |
| Suspected cause | Explicitly marked design inference. |
| Severity | Missed learning event, recoverable friction, or cosmetic issue. |
| Confidence | Low, medium, or high based on repetition and evidence. |
| Proposed revision | Smallest uncertain UX change worth testing. |

### Primary Measures

Prioritize:

- first-pass explanation accuracy;
- correct identification of change and invariant;
- missed critical transformations;
- unprompted reverse navigation caused by confusion;
- successful recovery;
- prediction or transfer performance.

Treat as diagnostic rather than inherently good or bad:

- replay count;
- dwell time;
- total completion time;
- interaction count;
- scroll reversals that are deliberate inspection rather than confusion.

Do not substitute smoothness, visual engagement, or time-on-page for learning.

## Phased UX Work Plan

### Phase 0: Activate And Bound The Work

Goal: ensure this plan becomes active through project authority rather than
silently competing with the convergence roadmap.

Activities:

- make an explicit roadmap or plan-choice decision to activate the work;
- name the canonical demand-shift exemplar and exact claim;
- audit and preserve uncommitted economics Article/publication changes;
- name observable acceptance criteria;
- name the preservation boundary and smallest rollback unit;
- decide whether the initial work is part of the public graph projection or a
  separate internal discovery route.

Artifacts:

- activation decision;
- bounded exemplar statement;
- preservation and rollback note;
- list of hypotheses that remain unvalidated.

Exit gate:

- one independently reversible UX experiment is authorized, and no broad
  generalization is implied.

### Phase 1: Baseline Attention Audit

Goal: replace generic dissatisfaction with observed coordination failures.

Activities:

- capture the current wide, phone, reduced-motion, and keyboard sequences;
- map narrative passages, motion cues, checkpoints, and stage states onto the
  canonical attention arc;
- identify novelty collisions, handoff debt, weak settlement, and recovery
  gaps;
- run the first three to five learner observations when possible;
- distinguish observed behavior from design inference.

Artifacts:

- phase map;
- annotated walkthroughs or recordings;
- observation table;
- ranked UX failures;
- completed authoring worksheet.

Exit gate:

- each proposed change names the learner behavior it is intended to alter.

### Phase 2: Static Storyboard And Copy

Goal: solve the attention sequence before tuning motion or layout.

Activities:

- storyboard entry, target-prepared, key intermediate, and settled states;
- draft orienting, cue, interpretation, and check passages;
- identify target, necessary context, and historical trace roles;
- review whether motion is necessary for each part;
- define wide, phone, static, reduced-motion, and screen-reader order.

Artifacts:

- static storyboard;
- cue and interpretation copy deck;
- semantic salience intent sheet;
- recovery-state specification;
- projection sequence diagrams.

Exit gate:

- reviewers can explain the intended attention arc from static states alone.

### Phase 3: Low-Fidelity Interaction Comparison

Goal: compare handoff/control models without investing in animation polish.

Activities:

- retain the current bounded corridor as baseline;
- create one challenger, preferably explicit manual handoff;
- keep graph, prose claim, semantic checkpoints, and settled evidence fixed;
- test target preparation, handoff legibility, settlement, and return to prose;
- include phone, keyboard, and reduced-motion behavior immediately.

Artifacts:

- two comparable low-fidelity variants;
- decision matrix;
- learner observation notes;
- selected or revised interaction hypothesis.

Exit gate:

- one variant has a clear learner-facing advantage or both are rejected with a
  named next hypothesis.

### Phase 4: Canonical Graph Exemplar

Goal: produce one polished, independently reversible graph motion passage.

Activities:

- apply the selected choreography to Attention Arc A only;
- preserve semantic model, Article, vignette, SVG authority, deterministic
  timeline, direct links, and static truth;
- tune exact cue copy, hold intervals, salience transitions, trace treatment,
  and stage/narrative balance;
- verify direct seek, reverse, interruption, and endpoint stability;
- stop at the human visual checkpoint.

Artifacts:

- one canonical graph exemplar;
- focused UX acceptance report;
- internal tuning record;
- explicit rejected alternatives;
- smallest rollback unit.

Exit gate:

- human approval of attention ownership, handoff timing, context legibility,
  settlement, phone behavior, and optical treatment.

### Phase 5: Learner Validation Of The Exemplar

Goal: determine whether the approved choreography helps understanding rather
than merely looking good.

Activities:

- run a second small learner round on the polished exemplar;
- compare first-pass explanations with the baseline observations;
- inspect change/invariant recognition, missed motion, recovery, and
  misconception repair;
- revise one uncertain treatment at a time;
- decide whether to keep, modify, or reject the pattern.

Artifacts:

- learner findings report;
- retained and rejected UX decisions;
- updated critique rubric;
- promotion recommendation.

Exit gate:

- observed evidence justifies pressure with one structurally different caller.

### Phase 6: Cross-Domain Pressure

Goal: learn what is genuinely shared without flattening domain-specific
pedagogy.

Use one frozen exemplar as the second caller:

- fraction composition for symbolic identity and native KaTeX settlement; or
- TypeScript free shipping for source continuity and code transformation.

Activities:

- preserve the approved route's composition and semantics;
- apply only the candidate attention principles that the second caller needs;
- compare cue form, settlement, recovery, control, and eye-switch cost;
- identify shared UX laws versus graph-specific choices;
- stop for human review before extracting a general pattern.

Artifacts:

- second-caller comparison;
- shared-versus-local decision table;
- revised profile descriptions;
- promotion or stop recommendation.

Exit gate:

- the pattern survives a structurally different caller without introducing
  domain leakage or a second semantic/playback authority.

### Phase 7: Authoring Pattern And Controlled Rollout

Goal: turn proven lessons into a repeatable authoring and critique practice.

Activities:

- publish a concise worksheet and exemplars for validated profiles;
- ask a second human or LLM-assisted authoring session to design a motion
  passage from the guidance;
- observe authoring friction and repair quality;
- identify which UX invariants are suitable for future linting and which
  require human judgment;
- prioritize only passages with observed novelty collisions or missed events;
- migrate one passage at a time.

Artifacts:

- validated pattern cards;
- authoring worksheet;
- UX review rubric;
- author trial report;
- migration inventory ranked by learner risk.

Exit gate:

- a new author can produce a reviewable motion passage without inventing the
  attention model from scratch, and rollout evidence supports further cost.

## Acceptance Gates

### Exemplar Gate

Do not proceed beyond the graph discovery exemplar unless:

- the target is visible and located before meaningful motion;
- prose introduces no competing novelty during the motion window;
- necessary context remains legible;
- the endpoint is stable and directly inspectable;
- interpretation refers to the visible state;
- reverse, interruption, and direct seeking reconstruct the same semantics;
- the handoff does not create a new “what do I do?” problem;
- phone, keyboard, reduced-motion, and static paths preserve the claim;
- the user approves the actual choreography and visual hierarchy.

### Pattern Gate

Do not call the result a reusable KP pattern unless:

- learner observation supports the intended coordination benefit;
- a structurally different caller demonstrates the same high-level law;
- domain-specific cue, trace, and renderer behavior can remain local;
- authors can use the worksheet without implementation expertise;
- the pattern does not depend on forced scroll behavior or changing prose;
- direct seek, replay, and return visits remain deterministic.

### Rollout Gate

Do not begin broad migration unless:

- at least graph and one other profile have approved exemplars;
- the pattern has a documented recovery path;
- accessibility has no critical blocker;
- authoring cost is justified by observed learner benefit;
- migration can proceed one independently reversible motion passage at a time;
- roadmap priority explicitly authorizes rollout.

## Risks And Mitigations

| Risk | Consequence | Mitigation |
| --- | --- | --- |
| Attention arc becomes a ritual | Lessons become slow and theatrical. | Treat phases as a diagnostic grammar; compress aggressively when the handoff stays legible. |
| Click fatigue | Learners mechanically advance. | Require explicit action only where it clarifies an important discrete event; compare with the accepted corridor. |
| Scroll corridor becomes hidden input | Learners move the page while trying to watch the stage. | Use visible boundaries, authored holds, deterministic recovery, and a manual-control comparator. |
| Cue captures eyes but not understanding | Learners look correctly yet miss the relation. | Cue the relation and require interpretation/prediction, not target selection alone. |
| Context is attenuated too aggressively | The focal object loses causal meaning. | Resolve target and necessary context together; never use blackout as focus. |
| Historical traces become visual noise | Settlement is harder to inspect. | Choose trace treatment by teaching question and renderer; test before/after alternatives. |
| Desktop choreography fails on phone | Reading order and controls become incoherent. | Prototype the phone attention sequence in low fidelity, not after polish. |
| Author burden becomes excessive | Good passages are too slow to produce. | Validate a worksheet and second-author trial before migration. |
| Premature architecture | A proposed UX term becomes a competing source model. | Use canonical motion-passage vocabulary and keep the attention arc as analysis until second-caller evidence. |
| Smoothness is mistaken for learning | A pleasing interface ships without comprehension benefit. | Prioritize explanation, change/invariant recognition, prediction, and recovery measures. |

## Human Decisions Required

The following decisions require explicit review rather than automatic
implementation:

1. Whether this work should activate during the current Public Web graph caller
   or remain parked until product-projection selection finishes.
2. Which exact demand-shift projection is the canonical UX discovery surface.
3. Whether the first challenger uses explicit manual handoff or a compressed
   corridor.
4. The cue copy and amount of pre-motion prediction.
5. The exact historical-trace treatment for `D₀` and `E₀`.
6. Whether the settled state feels sufficiently inspectable before prose
   regains emphasis.
7. Which frozen exemplar becomes the second caller.
8. Whether learner evidence justifies authoring-system or lint investment.

## Explicit Deferrals

- No new `AttentionEpisode` source or runtime type.
- No universal lesson layout.
- No catalogue-wide attention rollout.
- No repository-wide terminology rename.
- No replacement of Article v1 or vignette authority.
- No second clock, scheduler, paint owner, or lesson-local semantic store.
- No broad responsive/browser certification before the exemplar is selected.
- No live LLM wording during playback.
- No curriculum-scale migration.
- No rewriting of the frozen code or symbolic public exemplars during graph
  discovery.

## Immediate Handoff Checklist

- [ ] Decide whether to activate this plan in the current roadmap.
- [ ] Preserve and audit uncommitted economics Article/publication changes.
- [ ] Name the exact graph projection and claim under review.
- [ ] Complete the authoring worksheet for Attention Arc A.
- [ ] Capture current wide, phone, reduced-motion, and keyboard behavior.
- [ ] Record the target, necessary context, historical trace, and settling state.
- [ ] Observe three to five learners if available.
- [ ] Rank observed failures separately from inferred causes.
- [ ] Storyboard static entry, prepared-target, and settled states.
- [ ] Compare the current corridor with one low-fidelity challenger.
- [ ] Select one reversible exemplar and stop at human review.

## Recommended First Deliverable

Do not begin with a shared component or a new authoring abstraction. Produce a
four-part review packet for the demand-shift motion passage:

1. an annotated capture of the current attention sequence;
2. a completed authoring worksheet;
3. static entry, target-prepared, and settled storyboards; and
4. one low-fidelity challenger to the current scroll-corridor handoff.

That packet makes the first implementation responsive to an observed learner
coordination problem. It also preserves the strongest thing KP has already
built: verified semantic meaning that can be projected through more than one
learner experience without changing its truth.
