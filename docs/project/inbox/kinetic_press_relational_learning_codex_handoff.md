# Kinetic Press: Relational Learning and the Persistent-Stage Reader

## Philosophy, product direction, interaction specification, and Codex handoff

**Date:** September 13, 2026  
**Audience:** Codex and the Kinetic Press project owner  
**Status:** Consolidated direction with explicit distinctions between accepted decisions, working hypotheses, and implementation suggestions  
**Purpose:** Preserve the reasoning behind the new direction and make it actionable without prescribing an architecture that ignores the existing codebase.

> **Product thesis:** Kinetic Press helps learners turn separately understood concepts into a usable web of relationships.
>
> **Interaction thesis:** One coherent reading surface, one persistent mathematical stage, and a small number of reversible ways to inspect what is on it.
>
> **Implementation thesis:** Extend the working system. Do not restart it merely because the conceptual framing has improved.

---

## 0. Read this before implementing

This document is not a request to implement every capability it describes. It contains a durable product philosophy, an accepted UI direction, a proposed first vertical slice, and a longer-term opportunity space. Keep those layers separate.

The owner has explicitly accepted the preceding UI proposal **except for the Computer Modern Mono typography recommendation**. That recommendation is rejected. **Do not adopt New Computer Modern Mono Book, Computer Modern Mono, or a universal monospace identity on the authority of an older handoff. No replacement font has been selected.** Preserve working mathematical typography; ordinary code typography is a separate practical matter.

Codex should inspect the current repository and determine the smallest coherent integration path. Existing lesson, scene, beat, scrub, parser, renderer, and authoring mechanisms may already solve substantial parts of this problem. Historical documents are evidence of prior intentions, not proof that particular systems are presently implemented.

### 0.1 Authority and status

| Label | Meaning |
|---|---|
| **Accepted direction** | The owner has endorsed the philosophy or UI behavior. Preserve the intent unless explicitly revisited. |
| **Specification elaboration** | A concrete interpretation of the accepted direction, included to make it testable. Codex may choose an equivalent implementation and should flag meaningful tradeoffs. |
| **Working hypothesis** | A proposition about learning, adoption, or product value that needs testing. Do not present it as established evidence. |
| **Candidate implementation** | A possible way to realize the behavior, not a mandated type hierarchy, library, API, or repository structure. |
| **Deferred possibility** | Worth preserving as context, but not authorization to expand the first build. |

**Precedence:** current explicit owner decisions → accepted direction in this handoff → observed repository constraints for implementation choices → older handoffs and experiments. Repository facts determine what exists; they do not silently override the new product decisions. When a genuine conflict requires a tradeoff, explain it rather than pretending it does not exist.

### 0.2 The shortest actionable brief

Build a small relationship-centered learning experience inside the existing reader. Good prose introduces a precise confusion. A persistent stage lets the learner inspect one relationship, compare it with a nearby relationship, briefly unfold a difficult step, return exactly, visit an authored overview, and reconstruct one missing move. Reuse the same semantic material across those encounters.

The first candidate is the relationship between force, momentum change, work, and kinetic-energy change. It is a test of the medium, not a commitment to building an entire mechanics course.

### 0.3 Decisions that must not get lost

| Decision | Practical consequence |
|---|---|
| Relationships and transformations are first-class teaching objects. | They need stable identity and reusable references, not merely transient animation events. |
| Prose carries motivation, context, argument, and synthesis. | Do not convert the lesson into a succession of oversized cards or YAML paragraphs. |
| Motion must earn its attention cost. | Use it for a specific cognitive operation, not because an equation or definition appeared. |
| The default is one reading surface with one persistent stage. | No permanent competing explanation/diagram panes, graph sidebar, or minimap. |
| Scroll controls reading position; local controls inspect the current material. | Do not make the wheel simultaneously drive the argument, physical simulation, and derivation. |
| Context must be easy to reach, not always visible. | Use a temporary authored overview with an exact return path. |
| Reuse animations backward and forward in the curriculum. | Preview, explanation, comparison, reconstruction, and later return should share underlying material. |
| Comparison is a primary interaction. | Align shared structure and expose the discriminating operation and its consequences. |
| Reconstruction is part of the experience. | Watching faster is not sufficient evidence of fluency. |
| Semantic identity, salience, and presence remain separate. | Quiet an object without implying that it ceased to exist. |
| Rich visual expression remains available. | Do not reinterpret clarity as mandatory monochrome austerity. |
| Computer Modern Mono is rejected. | Do not carry forward the old companion-font decision or select a replacement without review. |
| Integration should be incremental. | Inspect and reuse the codebase; avoid a new general-purpose platform as the first step. |

---

## Navigation

- [1. Why the direction changed](#1-why-the-direction-changed)
- [2. The new educational philosophy](#2-the-new-educational-philosophy)
- [3. Potential product focus](#3-potential-product-focus)
- [4. The learning primitives](#4-the-learning-primitives)
- [5. The reader and stage](#5-the-reader-and-stage)
- [6. Attention, geometry, and scrolling](#6-attention-geometry-and-scrolling)
- [7. Controls and the three kinds of time](#7-controls-and-the-three-kinds-of-time)
- [8. The four stage compositions](#8-the-four-stage-compositions)
- [9. Expansion, detours, and exact return](#9-expansion-detours-and-exact-return)
- [10. Hermeneutic overviews and recurring previews](#10-hermeneutic-overviews-and-recurring-previews)
- [11. Reconstruction and relational fluency](#11-reconstruction-and-relational-fluency)
- [12. Visual language, typography, and accessibility](#12-visual-language-typography-and-accessibility)
- [13. The first vertical slice](#13-the-first-vertical-slice)
- [14. Mechanics content and mathematical guardrails](#14-mechanics-content-and-mathematical-guardrails)
- [15. Semantic and state-model guidance](#15-semantic-and-state-model-guidance)
- [16. Authoring and AI-assisted production](#16-authoring-and-ai-assisted-production)
- [17. Incremental implementation approach](#17-incremental-implementation-approach)
- [18. Acceptance criteria and failure tests](#18-acceptance-criteria-and-failure-tests)
- [19. Learning and product validation](#19-learning-and-product-validation)
- [20. Non-goals, warnings, and open decisions](#20-non-goals-warnings-and-open-decisions)
- [21. Longer-term opportunities](#21-longer-term-opportunities)
- [22. Historical handoffs and explicit supersessions](#22-historical-handoffs-and-explicit-supersessions)
- [23. Codex starting instruction](#23-codex-starting-instruction)

---

## 1. Why the direction changed

The owner is learning classical mechanics and its surrounding mathematics while using Kinetic Press to build explanations. This is deliberate dogfooding: the project should address real moments of confusion, not only produce material that looks educational from an author's perspective.

Two observations drove the change.

First, generated KP tutorials often had less lucid explanations than the conversations from which the ideas emerged. The useful lesson is not a general claim about the capabilities of particular AI products. It is that **pedagogical composition and implementation are different tasks**. A valid artifact that conforms to a lesson schema can still have poor motivation, weak sequencing, or no clear account of the learner's actual confusion.

Second, many focus cards added little. That does not establish that KP lacks value. It suggests that asking every paragraph to justify an animation is the wrong design constraint. Many paragraphs should remain paragraphs.

The productive question is:

> What operation is the learner being asked to perform mentally, and would an inspectable representation make that operation meaningfully easier to understand or use?

The strongest example in this discussion was a confusion the owner retained even after AP physics: knowing momentum and kinetic-energy formulas without an intuitive understanding of their relationship. An aligned comparison of force accumulated over time and force acting through displacement produced an immediate insight.

**Important evidentiary distinction:** that initial insight happened through a short textual and symbolic comparison. It supports the explanatory idea. It does not yet prove that animation improves on an excellent static explanation. KP's next task is to establish what persistence, inspection, comparison, reconstruction, and reuse add.

The direction therefore shifts from **more animated explanations** toward **a medium for developing relational intuition**.

---

## 2. The new educational philosophy

### 2.1 Teach the relationships, not only the named concepts

A learner can know the definitions of velocity, acceleration, force, momentum, work, and kinetic energy while remaining unable to move productively among them. KP targets that gap.

The working educational thesis is that an important part of technical mastery consists of being able to recognize, select, apply, compare, and reconstruct meaningful relationships. This is not a claim that all expertise reduces to a graph or that relationships replace factual knowledge, judgment, motivation, practice, or domain experience.

The learning goal is closer to:

> I can tell which connection matters here, explain why it is valid, use it under the right conditions, and notice when it fails.

It is not merely:

> I recognize the formula when it is displayed.

### 2.2 Make the arrows first-class

A transformation should be something that can be named, inspected, revisited, compared, and used inside a larger explanation.

```text
Before:
    Two expressions happen to animate into one another during a beat.

Direction:
    A named relationship or operation has a meaning, scope, and explanation.
    The animation is one way of presenting it.
```

For example, “differentiate momentum with respect to time” is not just a movement of symbols. It has required inputs, assumptions, a result, physical meaning, and neighboring operations with which it may be confused.

A relationship can have several presentations without becoming several unrelated content items. Its compact form, expanded derivation, aligned comparison, and retrieval prompt can all refer to the same authored relationship.

### 2.3 A kinetic grammar for thought

The aspiration is a reusable vocabulary of meaningful operations: substitute a definition, accumulate contributions, take a rate of change, decompose an object, change representation, expose an invariant, or compare two alternative operations.

A consistent presentation can help a familiar move remain recognizable across different examples. However, visual similarity must not falsely assert mathematical equivalence. A shared visual motif is an invitation to examine a common structure, not proof that two domains obey identical laws.

The goal is not for learners to mentally replay a literal animation forever. The desired result is usable understanding after the interface is gone. Some learners may internalize a spatial gesture; others may acquire a symbolic, verbal, or procedural chunk. Do not prescribe one phenomenology of understanding.

### 2.4 Nominalization and abstraction

The discussion used category-theoretic and Hegelian analogies to describe an important design intuition: a process can become a stable object of further reasoning.

An expanded path:

```text
A → B → C → D
```

can be named and treated as a larger step:

```text
A ── named process ──→ D
```

The detail remains recoverable. Today's process can become tomorrow's usable unit.

These are **design inspirations**, not a demand to implement category theory or a claim that every educational relation is literally a morphism in one chosen category. Do not collapse all arrows into one mathematical type. Do not make the learner learn this philosophical vocabulary to use KP.

### 2.5 Distinction through controlled contrast

Many confusions concern two nearby relationships rather than two wholly unrelated objects. The powerful pattern is:

```text
                 Shared starting material
                      /           \
                 Operation A   Operation B
                     |             |
                  Result A      Result B
```

Align the common structure. Expose the point of divergence. Propagate the consequences. Ask which difference mattered.

This is the “kinetic diff” idea: not merely highlighting changed text, but explaining how a change in operation, input, or assumption changes what follows.

“Find the smallest discriminating change” is a heuristic, not a requirement that all differences have a single clean cause. Some comparisons require several changes or depend on important background conditions. Never invent a simpler contrast than the mathematics supports.

### 2.6 Understand objects through their behavior

KP should often reveal an object by probing it rather than only displaying a definition. Change one input, apply one operation, or remove one assumption; then inspect what changes and what remains fixed.

For momentum and kinetic energy, reversing velocity is a revealing probe. For an estimator, perturbing an outlier can reveal sensitivity. For a program, a proposed refactor can reveal what behavior it preserves or changes.

A probe is not automatically a causal experiment, and an example is not automatically a proof. Label the scope honestly.

### 2.7 Hermeneutic reading as an authored loop

Here, “hermeneutic” names the recurring movement:

```text
whole → local detail → relationship → revised understanding of the whole
```

An old concept can become richer after later material, even without changing its familiar definition. A chapter should not merely be completed and abandoned. The same overview or animation can return under a new question.

This is why the owner's animated table-of-contents idea is central rather than ornamental. At the start, a scene previews something not yet understood. After a chapter, the same scene incorporates the newly learned relationship into the book's larger argument. Later, it can be reopened with more of its structure intelligible.

### 2.8 Additional deficits this same medium can address

The accepted UI can also support derivational history, aligned counterfactuals, representation switching, hidden assumptions, invariants, local confusion repair, alternative solution routes, and variable explanatory depth. These are related opportunities, not separate products to build immediately.

The unifying principle is:

> Preserve enough structure that the learner can inspect how the current result arose, what else could have followed, what remained true, and how this part connects to the larger subject.

---

## 3. Potential product focus

### 3.1 The first candidate: reusable understanding repairs

**Working product hypothesis:** begin with short experiences for people who know the ingredients but cannot use their relationships confidently.

An understanding repair starts with a recognizable difficulty, not an abstract feature:

> I know the momentum and kinetic-energy formulas, but I do not understand what distinguishes them or when one is useful rather than the other.

Other candidate difficulties include confusing a vector with its coordinates, conditioning with marginalization, or a code change with a behavior-preserving refactor. These are later examples, not commitments to additional domains in the first build.

Each repair should identify the presumed background, the exact confusion, the revealing comparison or transformation, and an unaided task that would show the distinction is now usable.

A repair is not necessarily a remediation product for weak students. An advanced learner entering an adjacent field can have precisely this kind of local gap.

### 3.2 How small repairs and larger books fit together

There is no conflict between a small repair and the owner's animated-book vision.

```text
Reusable relationships and scenes
    → one focused understanding repair
    → a small connected cluster of repairs
    → an authored chapter or tutorial
    → a book with recurring overviews and structured returns
```

Start with the smallest encounter that can reveal value. Preserve enough identity and context that it can later participate in a larger work. Do not turn every small item into a context-free flashcard.

### 3.3 Initial audience and use context

The initial candidate audience is technically curious learners who have previously encountered the material but feel their understanding is fragmented. The owner is one useful test subject, not a representative sample of all learners.

Tutors and instructors are potential early collaborators because they can observe recurring confusions and reuse a repair with multiple learners. This is a recruitment and observation hypothesis, not evidence of demand.

The initial experience should complement a book, class, conversation, or existing course. It should not require adopting a complete KP curriculum before one useful distinction becomes available.

### 3.4 Positioning without unsupported exclusivity

An internal positioning line is:

> Build relational intuition: make important connections inspectable, comparable, reconstructible, and reusable.

Do not claim that existing educational products ignore relationships or that this is an uncontested market. The opportunity is a distinctive, coherent treatment of these needs, not proof of an empty category.

The project must separately establish educational value, actual repeated use, authoring economics, and financial sustainability. As a nonprofit, KP may serve learners, educators, and funders who are different groups. Success with one does not answer all the others.

### 3.5 The role of AI

AI-assisted authoring is an important production mechanism. A future tutor may invoke an authored comparison or a local explanation. Neither is the essential learner-facing identity of the first product.

The durable design question is what representational operations a good teacher or AI can use. Do not lead the prototype with a blank chatbot or require live generation for basic navigation, restoration, or correctness.

---

## 4. The learning primitives

These are pedagogical operations. They do not require a one-to-one mapping to component classes or visible modes.

| Primitive | Learner question | Useful presentation | Important boundary |
|---|---|---|---|
| Inspect a relationship | How does this connect to that? | One relation with a legible operation and relevant inputs. | An unlabeled line is not an explanation. |
| Expand a process | Why does this step follow? | Recover the intermediate steps behind a named chunk. | Expansion must not lose the originating question. |
| Compress a process | Can I use this as one step now? | A compact relation with an accessible expansion. | Hidden detail is not evidence of mastery. |
| Compare operations | Where do these differ? | Shared source, aligned fork, downstream consequences. | Align semantically, not merely by animation percentage. |
| Compare inputs | What does the same operation do to these cases? | Controlled changes under a fixed operation. | State what was held fixed. |
| Compare paths | Are these routes equivalent? | Two authored paths with their premises visible. | Matching one example does not prove universal equivalence. |
| Probe an object | What happens when this changes? | A parameter or transformation and its consequences. | Restrict values to valid assumptions or show their failure. |
| Preserve identity | Which object is still the same? | Stable anchors or explicit correspondences through a change. | Do not imply sameness where there is only derivation or dependence. |
| Reveal an invariant | What stayed true? | Stable reference structure while other properties change. | Invariance is relative to a specified transformation. |
| Change representation | How are these views connected? | Coordinated views of one object, with representation changes labeled. | A change of coordinates is not automatically a change of the object. |
| Contextualize | Why am I learning this here? | A designed overview with the current relation located. | The internal graph need not be the displayed overview. |
| Reconstruct | Can I produce the connection myself? | A missing step, prediction, or changed scenario. | Do not confuse familiarity or rapid playback with independent use. |
| Revisit | What can I see in this now? | The same scene under a new question or surrounding context. | Return should deepen or test, not merely repeat. |

### 4.1 The test for adding a focus interval

Before adding a visual intervention, answer:

1. What is difficult to track, distinguish, simulate, or reconstruct mentally?
2. What should remain stable while the learner notices the relevant change?
3. What can this presentation add beyond excellent prose and a clear static diagram?

A legitimate answer can be modest: preserving a symbol's identity through a substitution, exposing a geometric difference, or letting the learner control the rate of a derivation. Every interval does not need to produce a dramatic revelation.

But “the paragraph looks bare,” “we have an equation,” and “this would animate nicely” are not sufficient reasons.

### 4.2 Use one primary instructional question at a time

An interval may contain several visual objects, especially during comparison, but they should participate in one attentional task. Two aligned equations can be one task. A paragraph, a moving graph, a chat reply, and a progress dashboard usually are not.

---
## 5. The reader and stage

### 5.1 Default experience: a book that opens into an instrument

**Accepted direction:** retain a readable, prose-led lesson with a persistent mathematical stage. Do not replace the reader with a knowledge-graph application.

The basic rhythm is:

```text
Prose establishes the question and context.
    ↓
A short question directs attention.
    ↓
The stage gets a clear inspection interval.
    ↓
Prose resumes and interprets what was noticed.
```

Most of the time the lesson should feel like good technical writing. During a useful visual intervention, the page gives the learner a clear place to inspect the mathematics. On returning to prose, the mathematical state remains recoverable and recognizable.

A focus interval need not have a visible card border. “Focus card,” “FocusWidget,” “FocusBlock,” and “stage encounter” have appeared in earlier conversations. They describe related ideas, not a mandate to rename existing types or wrap all content in boxes.

### 5.2 Default screen composition

```text
KINETIC PRESS       Mechanics · Work and momentum       Overview


                 What does the same force change?


                   [one coherent mathematical scene]


                 Previous    ─────●────────    Next
                           Derivation step

                    Show why · Compare with energy


                 [the next paragraph enters below]
```

This is a schematic, not a pixel-perfect design. Final placement should fit the existing reader and work with real paragraphs, equations, and window sizes.

The stage can contain an equation, a geometric object, a simulation, or a carefully aligned comparison. It should not be surrounded by a permanent apparatus of panes, inspectors, chat boxes, graphs, and status indicators.

### 5.3 Persistence does not require simultaneous visibility

This is a foundational rule.

A relationship can persist in the system while its overview, explanation, or comparison is temporarily not on screen. The interface should make the larger context easy to reach, not require the learner to process it continuously.

**Do not introduce a permanent conceptual minimap, faint background graph, or fisheye neighborhood merely to prove the graph exists.** Those were earlier possibilities; the accepted direction is a temporary, authored overview.

Likewise, “one persistent stage” is a perceptual and interaction contract. It does not require a single DOM element for the entire book, keeping every renderer mounted forever, or forbidding virtualization. State continuity and recognizable identity matter more than a particular mounting strategy.

### 5.4 Guided by default, inspectable by choice

The author should supply a good route. The learner should not have to choose a graph traversal before getting an explanation.

Local exploration should enrich that route. It should be clear what is being inspected and how to resume. A self-learner can go deeper without abandoning the authored argument; a prepared reader can continue without opening every relationship.

Do not hard-gate normal reading on completing interactions. Do not use a forced quiz to unlock the next paragraph.

---

## 6. Attention, geometry, and scrolling

### 6.1 Natural-height prose

**Accepted direction:** ordinary paragraphs remain ordinary paragraphs. Their height follows their content. Do not truncate, shrink, or constrain them to a fixed slide-shaped box.

The historical natural-height prototype used a central stage around 25–75% of the viewport and claims settling against a lower baseline. Preserve the idea of deliberate handoff, not the literal measurements. The exact 50% entry threshold, 75% lock point, stage dimensions, and scroll territories were experiments.

Large vertical territories can help expose an interaction while prototyping. They are not a production requirement. Do not require multiple screenfuls of scrolling to read a few sentences just to support choreography.

### 6.2 Attention ownership

The interface should make it evident whether the reader is currently being asked to read or inspect.

| Situation | Expected behavior |
|---|---|
| Prose owns attention. | Required text is fully legible. The stage holds a stable, subordinate state. No independent essential motion competes with reading. |
| The question hands attention to the stage. | The relevant scene becomes salient. The question remains short. Local controls are available. |
| The learner inspects or compares. | The visual task is coherent; long narrative prose does not compete with the active transformation. |
| The next prose passage takes over. | The scene holds or pauses. Controls recede without disappearing from an actively focused interaction. |
| The learner returns. | The relevant state is restored or explicitly reset, not silently replaced by an unrelated frame. |

“Attention ownership” is not input captivity. It should not mean preventing the reader from scrolling, selecting text, navigating elsewhere, or leaving a task unfinished.

### 6.3 No scroll snapping or scroll hijacking

Free scrolling is an accepted requirement. Do not snap readers to cards or intercept ordinary wheel/touch navigation to force completion of an animation.

Entering a focus interval may establish a meaningful checkpoint or trigger a short correspondence cue. It should not start an essential one-time performance the learner must catch before it vanishes.

A learner should be able to arrive via ordinary scrolling, a direct section link, browser find, a return action, or keyboard navigation without needing the complete preceding scroll history.

### 6.4 Separate instructional placement from visual progression

The default contract is:

> Scrolling moves through the argument. A labeled local control moves through the currently inspected transformation or event.

Do not let small accidental page movements reset a local scrubber. Do not require exact pointer placement to stop physical time while reading an equation.

**Specification elaboration:** leaving an active visual interval should pause its motion and preserve useful local state. Returning during the same session should restore that state unless the author or learner has explicitly requested a new encounter with a defined start. Make replay/reset intentional.

### 6.5 Overlap and translucent surfaces

Slight translucency may convey that the formal scene persists behind the reading surface. It is optional polish, not an essential mechanism.

No required label should be hidden behind prose. No foreground diagram line should cross a sentence the learner is expected to read. The shared spatial region must produce alternating access, not two superimposed reading tasks.

If responsive layout makes the layered arrangement unreliable, use a simpler in-flow stage. Clarity wins over preserving the desktop choreography.

### 6.6 Stable layout while studying

Avoid gratuitous reflow when a control, hint, or short label appears. Reserve appropriate room or expand deliberately. Do not move an equation away from the pointer as the learner tries to inspect it.

Window resizing, text enlargement, font loading, and theme changes should not discard the selected relationship, local progress, or return target. Exact pixels may change; semantic position should survive.

---

## 7. Controls and the three kinds of time

### 7.1 Keep these dimensions conceptually separate

| Dimension | What changes | Example |
|---|---|---|
| **Reading position** | Where the learner is in the authored argument. | The paragraph before or after the work-energy explanation. |
| **Reasoning progression** | Which step of an explanation or derivation is being inspected. | Substitute a definition, apply a law, simplify. |
| **Physical time** | The state of a modeled event. | The puck moves around part of a circle. |
| **Parameter exploration** | A condition or input of the example. | Change initial speed or rotate the force direction. |
| **Encounter history** | What context the learner brings to a reused scene. | Preview first, explanation later, reconstruction on return. |

The discussion referred to physical time, reasoning sequence, and learning sequence as three kinds of time. Reading position and parameter controls are listed separately here to clarify implementation boundaries.

These do not need five visible sliders. They need unambiguous meaning in the controls that do appear.

### 7.2 Label the control's meaning

Use labels such as **Derivation step**, **Time t**, or **Force direction**. A bare unlabeled timeline is insufficient when the scene can mean several things.

A single physical control may be reused across compositions, but a change in meaning must be visible. Do not silently turn a time slider into a proof slider.

Discrete reasoning steps should have meaningful Previous/Next checkpoints. Scrubbing can show correspondence between those checkpoints, but intermediate visual interpolation must not appear to assert a sequence of mathematically valid intermediate equations when it is only a transition effect.

### 7.3 Reversal is not inversion

Previous, rewind, and scrub backward are operations on the presentation history. They do not establish that a mathematical function is invertible or that missing information has been recovered.

For example, the history can show how kinetic energy was calculated from a velocity vector. Reversing that history can restore the previously supplied vector, but kinetic energy alone does not determine a unique velocity vector.

Use labels such as **Replay backward**, **Show earlier step**, or **Reconstruct the derivation** when that is what happens. Reserve mathematical inverse notation for a genuine, correctly scoped inverse.

### 7.4 Reversible presentation and interruptible motion

Meaningful states and cues should be recoverable by stepping, scrubbing, or jumping directly. A transient highlight should not be the only access to required information.

**Specification elaboration:** test interrupted transitions, rapid reversals, direct seeks, and leaving the page mid-animation. A rendering transition should not commit a hidden future action after the learner has navigated away.

When physical playback is used, pause/replay should be obvious. Returning from a detour should not unexpectedly restart movement. A paused state is generally the safest restoration default, with the prior position preserved.

### 7.5 Exploration must not silently rewrite the authored lesson

If the learner changes an example's parameters, make the exploratory state identifiable and offer a clear reset. The subsequent prose may assume a particular baseline; do not silently leave the scene in a contradictory state.

Codex may implement scoped exploration state, explicit reset boundaries, or an equivalent mechanism. The requirement is that changes have an intelligible scope and do not leak unpredictably into unrelated encounters.

---

## 8. The four stage compositions

These are presentations of shared content, not four mandatory permanent tabs.

### 8.1 Inspect

One relationship or transformation is foregrounded. Its inputs, meaning, and current question are clear. Relevant symbols or diagram parts persist across the operation.

Short labels and anchored cues may accompany it. Long motivational or discursive prose belongs in the reading surface, not a permanently attached side panel.

A useful local action is specific: **Why can mass move outside the derivative?** is often better than an unexplained information icon.

### 8.2 Compare

Comparison is a core capability, not a secondary gallery feature.

The default is a temporary arrangement of the current scene, entered through a purposeful link such as **Compare with kinetic-energy change**.

```text
                    THE SAME PHYSICAL EPISODE
                              |
                  +-----------+-----------+
                  |                       |
          Momentum change         Kinetic-energy change

          [one accumulation]      [the other accumulation]

                  +-----------+-----------+
                              |
                    One meaningful shared control
```

The common source or context remains shared. Distinct branches retain their own inputs, output types, units, and conditions. Shared structure is quiet; the discriminating operation receives attention; its consequences are then revealed.

Side-by-side layout is appropriate here because comparison is the single task. This does not contradict the rule against competing panes. Do not add an unrelated third narrative pane.

#### Semantic alignment

Synchronize by a meaningful common coordinate: physical time, a named derivation milestone, or an authored pair of corresponding steps. Equal percentages of two animations are not necessarily corresponding mathematical moments.

Two compared processes may require unequal numbers of steps. One branch may hold while the other expands. State that clearly. Do not force false symmetry merely to maintain pleasing motion.

A comparison can ultimately show that one requested output is underdetermined or that an operation is invalid under the current assumptions. That is a successful instructional result, not a renderer failure.

#### Narrow-screen comparison

Stack or alternate the branches in a stable location rather than shrinking both below legibility. Preserve shared labels and alignment. Use one meaningful control unless the lesson genuinely requires independently exploring the branches.

### 8.3 Contextualize

The stage temporarily becomes a designed overview of the subject or current cluster. It shows the current relationship's role, relevant backward links, and a manageable forward question.

This is an authored explanatory view, not a dump of every relation in the data model. Stable layout matters more than automatically optimizing node placement.

The overview should have an obvious return to the exact local origin. During an authored chapter transition, it can instead connect naturally to the next passage; make that distinction explicit.

### 8.4 Reconstruct

The same scene is reused with some support withheld. A result may be hidden, a step left to predict, or a valid operation left to select.

The setting, entities, and visual vocabulary stay familiar. The task changes. The learner should not feel transported into an unrelated quiz system.

Keep reveal, inspect, and return available. Feedback should target the relationship or assumption at issue, not infer a broad deficiency from one wrong answer.

---

## 9. Expansion, detours, and exact return

### 9.1 Short expansion versus a real detour

A brief definition or explanation can unfold in place. A larger prerequisite explanation should become a temporary detour with a visible purpose and explicit return.

```text
Explaining: why constant mass matters

[the local explanation and transformation]

Return to momentum change · step 3
```

Do not build an infinitely growing accordion of nested equations and prose. When the expansion becomes its own sustained reading task, give it a coherent temporary surface.

### 9.2 Exact return is a product requirement

A return should restore the relevant originating context, not the top of the chapter.

**Specification elaboration:** the restorable context may include the lesson and prose anchor, focused relationship, stage composition, local checkpoint or progress, chosen example and parameter values, selected or expanded objects, reconstruction state, and keyboard focus. The exact storage format is up to Codex.

Use semantic anchors rather than relying exclusively on a raw scroll offset. After reflow, the important promise is the same place in the argument and the same meaningful scene state.

Support a small stack of nested detours where necessary. Returning from “Show why” opened inside Compare should return to that comparison, not merely to the default Inspect scene.

Returning restores presentation context; it does not undo a submitted answer or erase an intentional note. Keep durable learner events separate from ephemeral view state.

### 9.3 Distinguish temporary visits from relocating the reading thread

Opening an overview to inspect context is a temporary visit. Choosing a different chapter from that overview is a navigation decision. Do not treat both actions as the same kind of Back.

Codex should use the application's existing routing/history mechanisms where suitable. Avoid adding a browser history entry for every scrub frame. Browser Back, local Return, and Previous step must not become three indistinguishable controls with surprising effects.

### 9.4 Discoverability without a field of traps

Interactive expressions need a restrained, discoverable affordance. Important actions must also work on touch and keyboard.

Hover can preview a correspondence. It should not unexpectedly launch a lesson, replace the current explanation, or start essential motion.

Not every symbol needs to be clickable. Author the high-value questions first. A correct noninteractive symbol is preferable to an impressive-looking link that opens an irrelevant or generic explanation.

### 9.5 Do not infer confusion too aggressively

An explicit “Show why” request is useful evidence. So is a deliberately captured prediction. Slow reading, repeated scrubbing, or opening an overview may mean interest rather than failure.

The first build should not automatically redirect the learner based on uncertain diagnoses. Let a wrong answer offer a focused hint, comparison, or replay without making remediation compulsory.

---

## 10. Hermeneutic overviews and recurring previews

### 10.1 The owner's animated-book vision

At the start of a linear algebra book, an animated overview previews the chapters to come. At the end of each chapter, the material is briefly integrated into the same whole: how it connects backward and what question it enables next.

This is not a conventional list of headings with animated thumbnails. It is a recurring representation of the book's conceptual argument.

For example, an opening scene might preview vectors, a linear map acting on them, a matrix as a coordinate representation, and later ways of analyzing that map. Subsequent chapters revisit that same scene with more of it understandable.

### 10.2 Reuse the representation; change the task

| Encounter | Question or task | What should remain stable |
|---|---|---|
| Opening preview | What kinds of structure will we learn to notice? | The main objects, layout, and core event. |
| Local explanation | Why does this relationship hold? | Relevant object identities and correspondence with the overview. |
| Chapter synthesis | What part of the overview can you now explain? | The overview's recognizable composition. |
| Forward preview | What unresolved behavior does this suggest? | A familiar object with one newly salient question. |
| Later return | How does newer knowledge change what you see here? | The original scene or an explicitly related version. |
| Reconstruction | Can you supply the relationship without the earlier support? | The semantic target, even when labels or steps are withheld. |

Reusing the same animation does not require replaying every frame on every encounter. Allow appropriate segment reuse, paused states, and explicit replay. Avoid converting recognition into forced repetition.

### 10.3 Preserve landmarks

Do not casually rearrange the entire overview when a chapter is completed. Let the learner keep recognizable locations and correspondences. A new connection can be added or foregrounded without rebuilding the whole scene.

The overview should remain understandable in reduced motion. A static before/after explanation of a new connection is acceptable when animated movement is not appropriate.

### 10.4 Preview without premature instruction

An “in the next episode” preview should often leave one question behind. A familiar event exhibits an unexplained feature, and the next chapter investigates it.

Do not display a dense graph of unfamiliar formulas and describe the resulting confusion as productive anticipation. The preview needs a graspable question, not merely withheld definitions.

### 10.5 A concept can deepen without being replaced

The same concept may acquire new relationships over time. The UI should not imply that an earlier, correctly scoped understanding was worthless merely because a richer one becomes available.

Nor should the system pretend that all learning is monotonic graph growth. Some earlier assumptions or simplified models need revision. Authored overviews may mark a changed scope or replacement relation rather than only adding edges.

### 10.6 Exposure is not mastery

The overview may distinguish introduced from not-yet-introduced material. It must not label a relation mastered solely because the reader reached a section or watched an animation.

Any future mastery display should be based on an explicit, limited interpretation of learner evidence. For the first slice, a simple “introduced” or “practiced” status is safer than a confidence-colored graph of purported understanding.

---

## 11. Reconstruction and relational fluency

### 11.1 What blitzing is meant to achieve

The goal is not to maximize playback speed. It is to make useful relationships available with less effort and less scaffolding.

A possible progression is:

```text
See the complete explanation.
    → Predict a next step.
    → Reconstruct a missing operation.
    → Select a useful relationship for a goal.
    → Use it in a changed situation.
    → Reopen the detail when necessary.
```

Some operations should become quick. Others should remain deliberative. Do not impose speed on explanations of assumptions, proof search, or difficult conceptual judgments merely because the renderer can move rapidly.

### 11.2 Progressive omission rather than passive replay alone

The first encounter can show the full route. Later, omit one meaningful move. Later still, show only a starting state and goal.

A useful task asks which operation is valid or useful, not merely which animation the learner remembers seeing next. Vary examples and selected representations enough to expose dependence on superficial cues.

Practice should preserve context. A tiny target can live inside a meaningful physical event or derivation. Atomic retrieval does not require an isolated symbol with no reason to care about it.

### 11.3 Feedback should distinguish kinds of correctness

Do not reject a valid alternative solution solely because it differs from the authored route. An efficient or preferred route is not necessarily the only lawful route.

This matters even in simple algebra: dividing both sides of an equation before removing an additive term may be less convenient, but it can be completely valid. A teaching system must not label a legal move incorrect merely to enforce its choreography.

For the first slice, author a narrow set of tasks whose answers can be checked reliably. Free-form explanation can use a rubric or self-comparison without pretending to have a complete automated proof checker.

### 11.4 Keep the escape hatch visible

Offer a reveal, hint, replay, or return. Do not turn uncertainty into a navigation penalty. A learner who requests the full explanation should not have to fail repeatedly to obtain it.

A future review system can reuse relationships and scenes, but building a scheduler, mastery engine, or Anki integration is not required for the first local reconstruction interaction.

---

## 12. Visual language, typography, and accessibility

### 12.1 Scholarly and responsive, not a dashboard

The reader can be visually restrained while the mathematical scene is expressive. Rich diagrams, color, geometry, and motion remain available when they improve the explanation.

Do not equate one attentional task with one hue, one object, or a ban on sophisticated visuals. The criterion is coherent instructional salience.

### 12.2 Identity, salience, and presence

Preserve the earlier salience system's separation:

| Channel | Meaning | Common mistake |
|---|---|---|
| Identity/correspondence | Which object or linked representation is this? | Reassigning colors or anchors so the learner loses track of entities. |
| Salience | What should receive attention now? | Making everything bright, or fading required information until unreadable. |
| Presence | Is an object present, entering, leaving, or shown as a historical trace? | Making an object appear to cease to exist merely because it is no longer the focus. |

Use renderer-appropriate styling. A graph line, small fraction bar, text label, and solid 3D object should not all use an identical opacity rule.

Where the repository already supports semantic salience states and renderer-specific responses, reuse them. This document does not require rebuilding an entire theme compiler to produce the first example.

### 12.3 Preserve mathematical meaning while changing salience

Do not use changes of length, orientation, dimensionality, or coordinate scale as attention effects when they could be read as changes to the mathematical object. For example, a vector should not appear to gain magnitude just because it becomes the focus.

Likewise, do not use bold indiscriminately where bold distinguishes vectors from scalars. Use enclosure, labels, emphasis around the object, or other channels when necessary.

Distinct mathematical entities may be connected without being identical. Velocity and momentum should not be represented as the same semantic object merely because one is a scaled version of the other. Preserve lineage and correspondence accurately.

### 12.4 Typography: explicit override

**Rejected:** the earlier recommendation to use New Computer Modern Mono Book / Computer Modern Mono as KP's preferred companion or broad interface font.

**Not decided:** a replacement prose font, interface font, or general typographic identity.

Codex should not install, distribute, or adopt that font based on the August handoff. Do not interpret the rejection as a request to override KaTeX's internal mathematical fonts. Preserve functioning math rendering and evaluate ordinary reading typography separately.

A practical monospace face may still be appropriate for code; that does not establish monospace as KP's overall identity. Do not bundle font files into this handoff.

### 12.5 Light and dark themes

Both themes should preserve the same attentional hierarchy. They need not share identical numerical styling. Test small equations, labels, fractions, thin lines, and contextual objects in both.

Do not carry low-contrast prototype values into required instructional content without checking legibility. Quiet context can remain readable. Ghosted or hidden material must not be the only source of a required premise.

### 12.6 Responsive fallback is part of the design

On a short viewport, narrow device, or enlarged text setting, prefer readable prose and an in-flow focus widget over a rigid fixed-stage composition.

Comparison may stack or alternate. Controls should remain reachable. Required mathematics must not be clipped behind a fixed header or below an inaccessible baseline.

The desktop layout should not be the only version in which a learner can finish the reasoning.

### 12.7 Accessibility and motion

Core actions need keyboard and touch access, visible focus, understandable labels, and sensible focus restoration. Do not rely on hover or color alone for essential meaning.

Reduced motion must preserve the relationship through explicit states, correspondences, labels, and step controls. It is not sufficient to remove the only explanatory cue and leave the learner with unrelated endpoints.

A scene should have an accessible textual or structured mathematical account of the current meaningful state. Do not announce every interpolation frame to assistive technology. Keep DOM reading order coherent even when the visual stage is sticky or layered.

Ordinary reading affordances—text selection, useful equation copying, search, direct section navigation, and browser history—should continue to work. Choreography must not make the book harder to read.

---
## 13. The first vertical slice

### 13.1 Scope

**Proposed first slice:** one complete excursion through a force–momentum–energy understanding repair. The goal is not a full mechanics module and not a separate prototype for every interaction.

Working learner question:

> I know momentum and kinetic energy as formulas. How do they relate to the same motion, and what makes them different?

Presumed background can be stated briefly: basic vectors, velocity, and a first encounter with differentiation and accumulation. Offer one narrow explanation for a missing prerequisite; do not use this repair as an excuse to author an entire calculus introduction.

The first implementation may use authored examples and manual correspondences. A complete symbolic algebra system, arbitrary physics solver, global relation registry, and adaptive scheduler are unnecessary.

### 13.2 End-to-end learner journey

| Encounter | What the learner experiences | What this tests |
|---|---|---|
| **Opening context** | A short prose question and a restrained preview of one motion viewed through two relationships. | Motivation without overwhelming prerequisites. |
| **Inspect momentum change** | A shared event, a changing momentum vector, and a legible accumulation over time. | Persistent objects and semantic stepping/scrubbing. |
| **Compare with energy** | The stage becomes an aligned comparison of momentum change and kinetic-energy change for the same event. | The kinetic diff without a permanent split UI. |
| **Show why** | One difficult step expands into a short derivation. | Local explanatory depth without losing the question. |
| **Return to comparison** | The precise comparison state, example, and meaningful progress return. | Restoration rather than navigation to a section heading. |
| **Probe the distinction** | A changed physical example exposes a difference in the two outputs. | Independent use rather than repeated formula recognition. |
| **Visit overview** | The relationship appears in the small mechanics picture. | Whole–part movement with stable landmarks. |
| **Return to reading** | The originating prose and scene resume. | Temporary exploration that does not destroy the authored thread. |
| **Reconstruct** | A result or operation is withheld; the learner predicts or selects it. | Active reconstruction using the same scene. |
| **Synthesis and preview** | The original overview returns with a new question now understandable or newly motivated. | Reuse and hermeneutic integration. |

Several encounters may be very brief. Do not turn each table row into a full-screen slide, route, or subsystem. The table describes a coherent use case.

### 13.3 What must work before broadening

The learner should be able to complete the main reading path without opening optional controls. They should also be able to take a detour, compare, inspect the overview, and return without being disoriented.

One source relationship and its scene should support at least a detailed encounter, a comparison, and a reconstruction or overview reuse. That is a minimum test of semantic reuse, not a requirement for automatic generation of all presentations.

The physics must remain correct in every demonstrated state. A beautiful interface around an invalid relationship is not a successful prototype.

### 13.4 What can stay intentionally simple

Use one or two deterministic physical examples, one authored overview, one short derivation, and a few well-scoped prediction tasks. Reuse the existing renderer that makes them easiest to express.

A new question can be implemented with curated content. It does not need a live AI query. An overview can be a normal KP scene. A comparison can be an explicitly authored alignment. An expansion can point to a short existing lesson fragment.

Do not confuse a small implementation with a weak concept. The point is to test the core experience before automating its production.

---

## 14. Mechanics content and mathematical guardrails

This section supplies a consistent example and corrects conversational shorthand that should not become executable semantics. The mathematical relationships below are stated for a **constant-mass Newtonian particle in a chosen inertial frame**. The derivations are part of the example, not claims that the UI has been validated experimentally.

### 14.1 Shared source: one physical episode, not an insufficient input

Use a physical episode with mass, position, velocity, time interval, and net force. Let

$$
\mathbf v(t)=\frac{d\mathbf r}{dt},
\qquad
\mathbf p(t)=m\mathbf v(t),
\qquad
K(t)=\frac12m\|\mathbf v(t)\|^2.
$$

Newton's second law gives

$$
\mathbf F_{\mathrm{net}}(t)=\frac{d\mathbf p}{dt}=m\frac{d\mathbf v}{dt}.
$$

The two comparisons are

$$
\Delta\mathbf p
=\int_{t_0}^{t_1}\mathbf F_{\mathrm{net}}(t)\,dt
$$

and

$$
\Delta K
=\int_{t_0}^{t_1}\mathbf F_{\mathrm{net}}(t)\cdot\mathbf v(t)\,dt
=\int_{\gamma}\mathbf F_{\mathrm{net}}\cdot d\mathbf r
=W_{\mathrm{net}}.
$$

The first accumulates vector impulse. The second accumulates net work along the actual path. They ask different questions of the same event.

A useful short description is “over time versus along displacement,” but the visual must retain the dot product and the role of motion. Do not encode `force history → work` as though force history alone supplies the trajectory. Initial conditions and mass or an independently supplied trajectory may be needed.

### 14.2 A safe work-energy derivation

For constant mass,

$$
\frac{dK}{dt}
=\frac{d}{dt}\left(\frac12m\,\mathbf v\cdot\mathbf v\right)
=m\,\mathbf v\cdot\frac{d\mathbf v}{dt}
=\mathbf F_{\mathrm{net}}\cdot\mathbf v.
$$

Integrating from the initial to the final time gives the work-energy relation above.

This route is particularly useful for the first implementation because it avoids presenting differentials as symbols that can always be cancelled mechanically. A later one-dimensional change-of-variables derivation can be shown, but the chain rule, bounds, and assumptions must remain recoverable.

Work in this example is a transfer accumulated over an event, not an independent state variable like position. Power is its rate along the event:

$$
P_{\mathrm{net}}(t)=\mathbf F_{\mathrm{net}}(t)\cdot\mathbf v(t)=\frac{dK}{dt}.
$$

Do not replace net work with work by a single selected force unless the lesson accounts for the others. Do not equate net work with every possible change in total energy of an extended or thermodynamic system.

### 14.3 Two concrete fixtures

These values are optional deterministic fixtures, not prescribed UI copy. They let Codex test numerical consistency without building a general solver.

**Fixture A: straight-line acceleration from rest.**

Use mass 1 kg, net force `(2, 0)` N, initial position `(0, 0)` m, initial velocity `(0, 0)` m/s, and times from 0 to 2 s.

At time `t`, with numerical time measured in seconds:

```text
position:       (t², 0) metres
velocity:       (2t, 0) metres/second
momentum:       (2t, 0) kilogram metres/second
kinetic energy: 2t² joules
```

At the endpoint, momentum change is `(4, 0)` kg m/s, displacement is `(4, 0)` m, and both net work and kinetic-energy change are 8 J. The same episode supports two distinct accumulations.

**Fixture B: a quarter-turn of uniform circular motion.**

Use mass 1 kg, radius 1 m, angular speed 1 rad/s, and times from 0 to `π/2` s. The coordinate axes and inertial frame remain fixed.

```text
position:       ( cos(t),  sin(t)) metres
velocity:       (-sin(t),  cos(t)) metres/second
net force:      (-cos(t), -sin(t)) newtons
```

The initial momentum is `(0, 1)` kg m/s and the final momentum is `(-1, 0)` kg m/s, so the momentum change is `(-1, -1)` kg m/s. Kinetic energy remains 0.5 J throughout. Net power is zero at every instant because force and velocity are perpendicular, so net work is zero.

This demonstrates a change in momentum with no change in kinetic energy. Use a **partial orbit**, not a full revolution, when asking about net momentum change between endpoints: a full revolution returns the momentum vector to its starting value even though it changed during the motion.

### 14.4 A prediction that goes beyond replay

Before revealing the second fixture's outputs, ask:

> The puck's speed stays constant while its direction changes. Which of these changes: momentum, kinetic energy, both, or neither?

The answer is momentum. Follow with a short explanation anchored in the vector change and the perpendicular force, not merely a green correctness indicator.

A further question can ask whether the same impulse always produces the same kinetic-energy increase. For a fixed mass and initial momentum,

$$
\mathbf p_f=\mathbf p_i+\mathbf J,
\qquad
\Delta K
=\frac{\mathbf p_i\cdot\mathbf J}{m}
+\frac{\|\mathbf J\|^2}{2m}.
$$

Thus impulse alone does not determine energy change without the other relevant conditions. Conversely, with equal mass and equal initial momentum, equal impulse does give equal kinetic-energy change. Do not teach the negation of a simplistic claim as another simplistic absolute.

This follow-up is optional for the first slice. It is useful as a later transfer task.

### 14.5 Additional correctness requirements

| Tempting shorthand | Required correction |
|---|---|
| Integrating acceleration gives velocity. | It gives velocity change over a specified interval; recovering velocity requires an initial value. Position requires another integration and its own initial value. |
| Work is force times distance. | Retain direction, dot product, path, and force variation where relevant. The constant parallel-force formula is a special case. |
| Energy and momentum are interchangeable measures. | Preserve vector versus scalar behavior, units, frame, and distinct conditions of use. |
| Work is kinetic energy. | Net work equals a change in kinetic energy under the stated particle model. |
| An energy scalar is unchanged by every transformation. | Invariance is operation-specific. Reversing velocity preserves kinetic energy; changing inertial frame need not. |
| Running the formula backward recovers velocity from energy. | Magnitude may be recoverable under stated assumptions; direction is not determined by kinetic energy alone. |
| For a variable-mass body, simply set net force equal to the product-rule derivative of its instantaneous mass times velocity. | Open systems require momentum-flow accounting. Do not introduce rocket or mass-exchange physics by naively dropping the constant-mass assumption. |
| Squashing a derivation into one arrow makes every step reversible. | Playback is reversible; the mathematical operation may not be. |
| An equation morph is a physical causal sequence. | A rewrite explains a relationship. It does not depict one symbol physically causing another quantity to exist. |

The first slice need not teach all these caveats to the learner at once. They must constrain its content and implementation. Put important local assumptions at the relevant step; keep less immediate scope notes accessible without making the scene an assumption dashboard.

---

## 15. Semantic and state-model guidance

### 15.1 Start with the repository, not a new ontology

**Candidate implementation:** add a thin semantic layer that lets multiple encounters refer to a stable relationship and shared scene. If suitable entities already exist, extend or reference them instead.

The desired distinctions are conceptual, not a required list of new TypeScript interfaces:

| Thing | Responsibility |
|---|---|
| **Subject object or state** | The mathematical, physical, or computational thing being represented. |
| **Relationship or operation** | What connects inputs and outputs, with its meaning and scope. |
| **Representation/scene** | A way of rendering or inspecting that material. |
| **Encounter** | A particular use in the lesson: preview, inspect, compare, reconstruct, or return. |
| **Presentation state** | Current progress, salience, layout, selections, and local exploratory parameters. |
| **Return context** | Enough information to restore the prior encounter coherently. |
| **Learner evidence** | A submitted prediction, answer, explanation, or explicit report—not inferred mastery from playback. |

A relationship need not be an executable function. Some relationships are laws, assertions, constraints, or explanatory correspondences. A first-class authored record with stable references can be sufficient.

### 15.2 Meaningful operation kinds

Preserve the difference between:

- expanding a definition or performing an equality-preserving rewrite;
- deriving a consequence from premises;
- applying a mathematical operator that produces a different object;
- changing a representation while preserving the represented object;
- advancing a physical or computational process;
- changing an assumption or parameter;
- changing the explanatory presentation without changing the subject matter.

This distinction helps prevent false identity, false reversibility, and accidental confusion between physical time and reasoning progression. It does not require a universal formal classification before the first example works.

### 15.3 A small relationship record, conceptually

```text
Relationship: momentum change from net force

Stable reference:
    mechanics.net-impulse-momentum

Meaning:
    Integrating net force over the interval gives momentum change.

Required context:
    Force history, interval, fixed inertial frame, applicable particle model.

Statement:
    Δp = integral F_net dt

Explanation:
    Existing scene/step references and prose anchors.

Comparison:
    Existing work-energy scene, with authored alignment metadata.

Reconstruction:
    One approved prediction task.

Overview:
    A landmark or relation in the authored mechanics overview.
```

These names are illustrative identifiers, not known repository paths or prescribed APIs. Do not create fields that have no use in the implemented slice simply because they appear in a conceptual sketch.

### 15.4 Inputs and assumptions are part of semantics

Many useful relations have multiple inputs. Do not force them into a unary `source → target` abstraction that hides needed information.

An authored fork can share one physical episode while each branch extracts different aspects. A comparison may need an alignment and shared-context record rather than a single common scalar input.

Likewise, a composition is valid only when outputs, inputs, and assumptions fit. Being visually connectable is not sufficient. Manual, explicitly authored compositions are acceptable until repeated examples justify stronger machinery.

### 15.5 Preserve identity at the right level

Distinguish a semantic entity from an individual rendered occurrence. The same velocity may appear in prose, an equation, and a diagram; an equation may also contain repeated occurrences of the same symbol.

Manual anchors for important occurrences are acceptable. Avoid guessing identity solely from identical text, index order, or color. If an automatic match is ambiguous, ask the author for a correspondence or use a simpler transition.

Moving from velocity to momentum is a derived relationship between different quantities. Moving from a vector to its coordinate representation is a change of view under a basis. Moving a label to avoid overlap is only a presentation change. The data should not quietly treat all three as “same object moved.”

### 15.6 Separate canonical content from encounters

A reused scene should not silently inherit a previous exercise's hidden labels or a previous learner exploration's parameter values unless that inheritance is intended.

A practical direction is canonical content plus an encounter-specific view: selected segment, attention target, question, disclosure level, and initial example state. Preserve enough version or provenance information that changed content does not make an old prompt refer to an unrelated step.

This is not a demand for full event sourcing or a versioned knowledge database. It is a warning against copying entire lessons for each mode and against sharing mutable view state indiscriminately.

### 15.7 Deterministic reconstruction of presentation state

The useful behavioral contract is that a meaningful scene state can be recovered without replaying every earlier animation side effect. Scrub-to-position, direct section navigation, reset, and return should converge on coherent states.

Codex should reuse the existing state/timeline model where it already supplies this behavior. Do not introduce a new animation runtime just to rename its semantics.

If a visual interpolation is interrupted, preserve visual continuity while keeping semantic checkpoints valid. Renderers may interpolate differently; instructional events should still have an intelligible common progression.

### 15.8 Validation before sophistication

High-value checks include unresolved relation or scene references, ambiguous anchors, invalid example parameters, missing return targets, mislabeled control domains, and comparisons with no authored alignment.

A relation can have no interesting invariant; do not invent one to satisfy a mandatory field. A physical evolution may change its principal quantity. The metadata should say what changes and what remains applicable, rather than asserting “value preserved” everywhere.

Semantic validation does not prove the mathematics. Type checking can reject missing inputs while still accepting a wrongly authored law. Keep domain review distinct from schema validation.

---

## 16. Authoring and AI-assisted production

### 16.1 Separate the jobs

The preferred workflow is:

```text
Real confusion or a carefully chosen learning need
    → explanatory argument in prose
    → identification of representational bottlenecks
    → authored semantic relationships and comparisons
    → scene/interaction storyboard
    → implementation in KP
    → mathematical and pedagogical review
    → learner observation and revision
```

Do not make “generate a tutorial about momentum” the primary production contract. It encourages topic coverage, formula lists, and schema compliance instead of an explanation with a reason to exist.

### 16.2 Preserve strong prose

Good prose establishes the problem, distinguishes nearby ideas, explains why a move matters, and integrates the result. Keep those functions outside the stage when they do not require simultaneous visual reference.

A scene should answer a question prepared by the prose. The following paragraph should interpret or extend the observation, not merely repeat all the labels.

Implementation should not degrade approved prose to fit card geometry. If correctness or interaction design requires a change, identify the reason and revise the passage deliberately rather than mechanically fragmenting it.

### 16.3 A repair authoring brief

An author should be able to supply the following in ordinary language before dealing with low-level animation details:

| Item | What it captures |
|---|---|
| Learner state | What the reader plausibly knows already. |
| Specific confusion | The relationship or distinction that remains unavailable. |
| Explanatory move | The comparison, transformation, or probe expected to help. |
| Shared context | The episode, equation, object, or dataset held fixed. |
| Decisive difference | The change in operation, assumption, or representation. |
| Scope | Required inputs, assumptions, exceptions, and what is not being taught. |
| Observable task | What the learner should be able to predict, reconstruct, or use. |
| Return and preview | How the repair reconnects to a larger argument. |

The production format should remain compatible with the real authoring pipeline. The historical Markdown-plus-embedded-structure approach is relevant, but this handoff does not freeze a new block syntax or require `.kp.md`, `::focus`, a new DSL, or a GUI migration.

### 16.4 Reuse should be intentional rather than indiscriminate

A preview, detailed explanation, and reconstruction may share a scene while requiring different questions, visible annotations, pacing, and selected ranges.

Do not automatically publish a new exercise for every equation or every animation. Review prompts should be selected because their target is valuable to internalize and because the answer can be interpreted responsibly.

A changed prompt is not automatically a new memory target. Conversely, a familiar-looking scene can support a genuinely different question after later learning. Keep this distinction editorially explicit.

### 16.5 Curated content first, generation later

For the first slice, prefer a small set of reviewed explanations, examples, and prediction tasks. An AI can help draft them, but should not silently modify valid mathematical relationships at runtime.

A later generative system should operate through allowed actions and reviewed semantic references. It should preserve provenance and make uncertainty visible. The first implementation does not need this system.

### 16.6 Dogfooding notes should capture the delta in understanding

When the owner encounters a useful confusion, preserve what was known, what was conflated, what explanation helped, and what remained difficult to do unaided. Then record the representational move and whether it appears reusable.

The log is not merely a backlog of animation ideas. It is evidence about which operations deserve a place in KP's instructional vocabulary.

---
## 17. Incremental implementation approach

### 17.1 First inspect what actually exists

Codex should locate the real lesson data, beat/state machinery, parser, renderer integration, scrub/rewind controls, current layout experiments, validation, and tests. Historical descriptions must be verified against the repository.

Produce a short integration map: existing capability, relevant code, missing behavior, and the smallest proposed change. Use the project's established conventions and current dependency choices unless there is a specific reason not to.

Do not spend the first implementation pass building a parallel conceptual architecture or rewriting types merely to match this document's vocabulary.

### 17.2 Recommended sequence within the first slice

| Increment | Implement or reuse | Exit condition |
|---|---|---|
| **A. Correct static fixture** | The prose, equations, and deterministic shared event, in the existing lesson environment. | The explanation and numerical example are coherent before animation polish. |
| **B. Reader/stage handoff** | Natural prose, a stable stage, a short focus question, meaningful local controls. | The learner can freely read, inspect, and continue without overlap or scroll trapping. |
| **C. One kinetic comparison** | Two explicitly aligned views of the same event. | The decisive difference is intelligible and the shared control has a clear meaning. |
| **D. One expansion and exact return** | A short authored explanation reached from the comparison. | Returning restores the same comparison and local state. |
| **E. Overview reuse** | One authored overview scene linked to the current material. | Temporary visits return precisely; the chapter-level return reuses recognizable material. |
| **F. Reconstruction** | One reliable prediction or omitted-step task using the same scene. | The learner can answer, reveal, inspect, and resume without a new quiz application. |
| **G. Hardening and observation** | Responsive fallback, reduced motion, keyboard behavior, interrupted transitions, and initial learner sessions. | The complete excursion works without the author narrating around its failures. |

These increments are a proposed order, not mandatory branches, commits, or new packages. Merge or reorder them when the codebase makes that sensible. Keep each change small enough to review and test.

### 17.3 Reuse the existing primitives

Potential implementation seams include a relation reference on an existing beat, a scene encounter with disclosure settings, an authored comparison alignment, and a return-context record. Any of those may already have equivalents.

Prefer a small fixture and a compatibility extension to a universal schema. Existing lessons should keep working. Existing authoring and parser behavior should not be discarded because the new philosophy is broader.

If the repository has already evolved beyond the historical Markdown/JSON pipeline, preserve the current working path rather than rolling it backward to match an old document.

### 17.4 Keep first-class semantics lightweight

“First-class” initially means addressable, inspectable, and reusable. It does not require automatic theorem composition, a graph database, a generalized morphism interpreter, or semantic understanding of arbitrary LaTeX.

The system can know that a comparison, derivation, and prompt refer to the same reviewed relation without being able to derive new physics independently.

### 17.5 Use direct authored alignment before automatic diffs

A kinetic diff should be correct before it is automatic. For the first example, the author can explicitly identify the shared episode, corresponding milestones, diverging operation, and revealed consequences.

Do not make a difficult general animation-matching or expression-diffing algorithm a prerequisite for testing whether the comparison teaches anything.

### 17.6 Report implementation scope honestly

Codex's completion report should distinguish implemented behavior, tested behavior, content review performed, known limitations, and deferred capabilities. A screenshot or animation demo is not evidence that exact return, keyboard interaction, or mathematical edge cases work.

Preserve a clear note about which experimental layout choices remain tunable. The owner should be able to reject a threshold or spacing value without reopening the whole design philosophy.

---

## 18. Acceptance criteria and failure tests

These are tests to implement or perform for the completed slice. They are not a claim that the current repository already passes them.

### 18.1 Reader and attention

| ID | Scenario | Expected result |
|---|---|---|
| R1 | Read a long paragraph preceding the stage. | It remains natural-height and legible. No essential independent animation competes with it. |
| R2 | Scroll past the focus interval without interacting. | Reading continues normally; no snap, compulsory playback, or quiz gate blocks progress. |
| R3 | Enter via a section link instead of scrolling from the top. | The intended mathematical state and question are coherent. |
| R4 | Scroll slightly while inspecting. | Local progress is not unexpectedly reset or reassigned to a different control meaning. |
| R5 | Resize the window or enlarge text. | No required prose or mathematics is clipped or inaccessible; semantic position survives. |
| R6 | Read on a short or narrow viewport. | A simpler in-flow composition is available where needed. |
| R7 | Switch themes during a paused scene. | The state remains intact and the same instructional hierarchy is legible. |

### 18.2 Comparison, expansion, and return

| ID | Scenario | Expected result |
|---|---|---|
| N1 | Open Compare from a partially inspected scene. | The shared example is retained and the two branches are meaningfully aligned. |
| N2 | Scrub a comparison whose branches have different explanatory lengths. | Alignment follows authored semantics; a held branch is not disguised as an equal-length process. |
| N3 | Open Show why from inside Compare, then return. | The same comparison, example, meaningful progress, and selected context return. |
| N4 | Open Overview temporarily, then return. | The original reading anchor and stage state are restored, not the top of the chapter. |
| N5 | Navigate to another chapter from Overview. | This is treated as deliberate relocation, distinct from a temporary overview visit. |
| N6 | Use Previous step, local Return, and browser Back. | Each acts at an understandable level; scrub frames have not polluted navigation history. |
| N7 | Interrupt or reverse an animation repeatedly. | No stale callbacks, unexplained jumps, duplicated cues, or impossible semantic states remain. |
| N8 | Change example parameters, leave, and re-enter. | Exploration state is scoped and the relation to the authored baseline is explicit. |

### 18.3 Reuse and reconstruction

| ID | Scenario | Expected result |
|---|---|---|
| L1 | Preview, explain, and revisit the same relation. | Stable identities and recognizable scene structure are reused rather than three disconnected assets. |
| L2 | Complete or reveal a reconstruction task. | Feedback and return remain local; the reader is not trapped in remediation. |
| L3 | Give a valid alternative reasoning step. | It is not called mathematically wrong solely because it differs from the authored route. |
| L4 | Watch or scroll past the lesson without answering. | The system does not silently claim mastery. |
| L5 | Return from a detour after submitting an answer. | View restoration does not erase the submitted answer or duplicate the event. |
| L6 | Open the same scene in a different encounter. | Hidden exercise labels and exploratory parameters do not leak unintentionally. |

### 18.4 Domain correctness

For the first mechanics slice, verify the straight-line and quarter-circle endpoints in Section 14. Verify the displayed units and the distinction between vector impulse and scalar work. At the quarter-circle's intermediate states, force must remain perpendicular to velocity and power must remain zero.

Where sample accumulation is numerical, show or test a reasonable tolerance. Do not assert exact mathematical equality merely because rounded labels match. Analytic values can be used for these simple fixtures.

Test that the derivation never depends on an unannounced change of mass, reference frame, or path. Verify that a backward presentation does not advertise a nonexistent inverse.

### 18.5 Accessibility

The complete excursion must be possible with keyboard and touch. Focus must remain visible and return sensibly after detours. Reduced motion must retain meaningful steps and correspondences. Required distinctions must survive without color. Accessible reading order must remain coherent even when the visual stage is layered or fixed.

Do not leave a reused SVG or canvas scene globally hidden from assistive technology merely because a visual-only prototype used that shortcut.

### 18.6 Regression and authoring checks

Existing lessons should still load. Existing supported syntax should retain its meaning. Invalid references should fail with an error that identifies the authored relation or encounter and the missing target.

At least one example should be reused in multiple encounters without duplicating its entire underlying definition. At least one direct seek should produce the same meaningful state as stepping there normally.

---

## 19. Learning and product validation

### 19.1 Separate the claims being tested

| Claim | Evidence to seek | What does not establish it |
|---|---|---|
| The explanatory comparison is useful. | The learner can explain a previously confused distinction. | A visually impressive implementation by itself. |
| KP adds value beyond excellent exposition. | Better reconstruction, application, inspection, or retention than a strong static alternative. | Comparing KP only with a deliberately poor textbook excerpt. |
| The interface is usable. | Learners complete detours and comparisons without author assistance. | The author successfully operating their own demo. |
| Reuse provides production leverage. | Multiple useful encounters draw on the same reviewed material with limited extra authoring. | Copying a finished animation into several disconnected lessons. |
| A product need exists. | Learners return at another relevant difficulty; tutors actually reuse material. | General enthusiasm or stated willingness alone. |
| The approach can be sustained. | Measured authoring cost and a plausible support model. | Assuming educational value automatically creates distribution or funding. |

### 19.2 A strong comparison condition

A useful evaluation baseline is excellent prose, clear aligned static diagrams, and the same substantive practice questions. That helps separate the quality of the explanatory insight from the value added by animation and stateful interaction.

Early sessions should be small and observational. They can reveal missing labels, confused controls, and whether the intended comparison is noticed. They should not be described as evidence of a reliable population-level learning effect.

Later comparisons should avoid teaching the exact same target to the same learner twice and crediting the second interface for the benefit of prior exposure. Use different learners or appropriately designed matched material when testing the medium.

### 19.3 What to ask after the screen is gone

Ask for an explanation in the learner's own words, a reconstruction of the relevant relationship, and a changed scenario. For the mechanics repair, the constant-speed changing-direction case is more revealing than merely asking for the two familiar formulas again.

A delayed encounter is useful because immediate recognition is not the whole goal. The core question is:

> What can the learner now do without the representation that they could not reliably do before?

Also inspect misuse. Does the learner now overgeneralize the same-source comparison, omit the needed motion information, or assume every relationship can be reversed? A seductive new misconception is a failure even if confidence rises.

### 19.4 Keep dogfooding informative

The owner's “aha” moments are privileged clues for choosing content. They are not sufficient market or learning evidence. Test with other learners whose prerequisites and ways of interpreting the scene differ.

Do not remove the original prose explanation just because the author now finds the animation obvious. Familiarity acquired while building the scene can hide what a first-time reader needs.

### 19.5 Minimal instrumentation, not a dashboard project

If instrumentation is useful, begin with scoped events such as opening a comparison, requesting an expansion, returning successfully, revealing a prompt, and submitting a prediction. Time spent or repeated scrubbing should not be labeled confusion or mastery automatically.

Avoid collecting personal information or sending detailed learner activity to new services as an incidental implementation step. Local observation or explicit, consented research can be sufficient for early work. Analytics should answer a specific question rather than create another product surface.

### 19.6 Measure authoring effort

Track how much work goes into the first repair, the next encounter of the same relation, and a second repair using similar primitives. Identify which parts are reusable, which require expert editorial judgment, and which are still expensive custom animation work.

A useful library of tested distinctions may become an important asset. It is not yet evidence that content creation scales or that the rendering API is a durable competitive barrier.

---

## 20. Non-goals, warnings, and open decisions

### 20.1 Do not build these as prerequisites to the first slice

Do not start with a universal knowledge-graph editor, general-purpose relation database, automatic theorem prover, complete symbolic algebra engine, adaptive curriculum scheduler, learner-model dashboard, full visual authoring application, live AI tutor, or a new animation runtime.

Likewise, do not build a complete mechanics course, mass-generate thousands of cards, or add points, badges, streaks, classroom management, and LMS features to make KP resemble a familiar educational product category.

These exclusions are about priority, not permanent prohibitions. Repeated evidence can justify later capability.

### 20.2 High-risk misinterpretations

| Drift | Why it undermines the direction | Correction |
|---|---|---|
| “Relationships are central, so display the whole graph continuously.” | Recreates split attention and navigation burden. | Keep the graph behind the scenes and author temporary overviews. |
| “One stage means no side-by-side visual material.” | Prevents the core aligned-comparison task. | Side-by-side branches are appropriate when they form one comparison. |
| “Persistent means every object remains visible and mounted.” | Confuses state continuity with screen occupancy or implementation lifetime. | Preserve identity and restorable state; manage visibility and resources sensibly. |
| “Every relationship needs an animation.” | Repeats the original card-inflation problem. | Choose the representation that earns its cost; static can be best. |
| “A dense graph is the definition of mastery.” | Omits correct scope, selection, application, and judgment. | Evaluate what the learner can do with the relationships. |
| “Faster replay compiles understanding.” | May only produce familiarity with the display. | Use prediction, reconstruction, changed examples, and delayed checks. |
| “Every arrow is a reversible morphism.” | Erases mathematical type and information-loss distinctions. | Keep operation kinds, prerequisites, and inversion semantics explicit. |
| “Matching endpoints proves paths are equivalent.” | A demonstration on one input is not a general proof. | Label example scope and provide reasoning for general claims. |
| “An invariant badge must appear everywhere.” | Encourages invented preservation claims and UI clutter. | Show the relevant invariant when there is one; otherwise state the actual change. |
| “A one-line product claim establishes a market niche.” | Conflates design coherence with demand and distribution. | Test repeated use and production economics independently. |
| “A richer philosophy requires a rewrite.” | Discards useful machinery before validating the learning experience. | Integrate incrementally with the existing system. |
| “The old monospace decision still applies.” | Contradicts the owner's explicit rejection. | Typography remains open; do not revive the rejected recommendation. |

### 20.3 Do not let philosophy become interface vocabulary

The owner finds category theory, nominalization, and hermeneutic reading illuminating. Most learners do not need those terms on the screen.

Prefer **Show why**, **Compare with…**, **Overview**, **Try it**, and **Return to…** over abstract product terminology. The sophistication should be in the behavior and content, not a new vocabulary the learner must first master.

### 20.4 Do not overclaim the limitations of traditional media

Static diagrams, prose, exercises, conversation, and existing interactive learning systems can teach relationships well. KP's thesis concerns a particular combination of persistent structure, guided comparison, variable detail, and reuse.

Test when that combination helps. Do not justify a complicated interface by asserting that a page cannot teach a relationship.

### 20.5 Open decisions

| Decision | Current status | How to resolve it |
|---|---|---|
| Prose and interface typography | Open; Computer Modern Mono rejected. | Evaluate real reading passages and mathematical adjacency; choose separately from the implementation architecture. |
| Exact stage geometry and handoff thresholds | Tunable. | Test long text, short windows, narrow screens, and enlarged text. |
| Fixed/sticky versus in-flow stage implementation | Codebase-dependent. | Preserve the user-facing continuity and robust fallback. |
| Default entry/re-entry playback behavior | Preserve explicit, self-paced inspection; precise details need testing. | Avoid missed one-time motion and surprising autoplay. |
| Comparison layout on narrow screens | Stack or alternate as appropriate. | Test legibility and alignment with actual content. |
| Extent of nested detours | Support the tested excursion first. | Avoid both losing origin and building an arbitrary browsing engine. |
| Authoring syntax and normalized data shape | Codex should fit existing conventions. | Prove one fixture before introducing a broad syntax migration. |
| Free-form answer checking | Not required initially. | Prefer reliable curated tasks; assess richer checking separately. |
| Cross-session state persistence | Useful but not necessary for the first local excursion. | Add when it solves an observed problem; avoid incidental account infrastructure. |
| Naming and marketing | Provisional. | Use learner-recognizable needs and evidence from actual use. |

---

## 21. Longer-term opportunities

These are directions to preserve, not a second implementation backlog disguised as requirements.

### 21.1 A book of recurring, deepening scenes

The owner's linear algebra vision is a coherent longer-term form: a book whose table of contents is an authored conceptual animation, whose chapters develop local questions, and whose recurring overviews integrate the parts back into the whole.

A vector or linear map can remain recognizable while later chapters reveal more about it. The same scene is revisited through coordinate representations, invariants, special directions, and decompositions.

Be mathematically precise when extending this. A basis change is not the same as changing the underlying map. An eigenvector with a negative eigenvalue reverses orientation while preserving its one-dimensional subspace; a zero eigenvalue maps it to zero. Real SVD factors are orthogonal transformations and may include reflections, not only rotations. These details should inform the scenes rather than be hidden by an attractive generic motion vocabulary.

### 21.2 A library of comparative understanding repairs

| Domain | Candidate friction | Reusable UI move |
|---|---|---|
| Linear algebra | Confusing an object with its coordinate representation. | Hold the object fixed while representations change; compare with actually transforming it. |
| Probability | Confusing conditioning with marginalization. | Apply two operations to one joint distribution; use a discrete positive-probability example first. |
| Statistics | Knowing several estimators without understanding sensitivity. | Feed the same data to different summaries and perturb one observation. |
| Programming | Confusing textual change with semantic change. | Compare transformations while tracking explicitly stated preserved behavior and effects. |
| SQL/data reasoning | Confusing similar query operations or rewrite rules. | Trace the same rows through operations, preserving null, duplicate, and join semantics. |
| Proofs and algebra | Seeing a finished result without understanding permissible moves. | Expand proof state, compare routes, and expose the premises each step uses. |
| Economics | Memorizing diagram shifts without understanding the model response. | Change one model assumption and inspect the equilibrium consequences and constraints. |

Cross-domain reuse should follow successful examples. Do not force different domains into one interaction template at the cost of correctness.

### 21.3 Variable-resolution explanations

A future learner can collapse familiar moves and expand unfamiliar ones. The author supplies recoverable structure; the learner or a carefully validated model controls its disclosure.

This can address heterogeneous prerequisites without creating an entirely separate course for every background. It should begin with explicit learner choices, not a confident automatic model inferred from scrolling behavior.

### 21.4 Context-linked review

Relationships, comparisons, and confusions can seed review prompts. A prompt should retain a path back to its original explanation and larger context.

The same animation may serve preview, teaching, and review, but each encounter has a distinct task. Scheduling and grading should not require duplicating the semantic content or automatically declaring exposure to be mastery.

### 21.5 A representational layer for teachers and AI

A teacher or AI might eventually select a known relationship, invoke a vetted comparison, unfold a derivation, ask a prediction, or return the learner to the larger picture.

The first-class operations create an interface for showing and practicing, not merely generating text. This possibility motivates reusable semantics, but does not establish immunity to competition or require a live agent in the initial reader.

---

## 22. Historical handoffs and explicit supersessions

### 22.1 Source and provenance note

This handoff consolidates the current conversation, the owner's explicit acceptance of the UI proposal except typography, and the following historical project files. The files were consulted as prior design context. They are **not assumed to be present at these names in Codex's repository**, and their modification dates are not evidence that their implementation plans were completed.

The document contains a product specification and worked mathematical examples. It is not a fresh market survey or a research literature review. Statements about learning effects, product demand, and authoring leverage are hypotheses or proposed evaluation criteria unless explicitly described as observations from the owner's experience.

| Reference | Historical file | Date shown in archive metadata | Relevant material |
|---|---|---|---|
| H1 | `kinetic_press_codex_handoff.md` | August 14, 2026 | One semantic/attentional surface; persistent objects; explicit state; reference continuity; anti-goals and incremental development. |
| H2 | `kinetic_press_visual_salience_handoff.md` | August 6, 2026 | Semantic salience; distinct identity, salience, and presence; renderer-specific behavior; light/dark themes; accessibility. Its typography decision is superseded. |
| H3 | `kp_attention_natural_height_claims_v9.html` | September 3, 2026 | A persistent central stage, natural-height claims, and separate reading/visual territories. Geometry and large scroll territories are prototype choices, not mandatory requirements. |
| H4 | `kp_focuswidget_algebra_migration_plan.md` | May 3, 2026 | Prose plus focused symbolic widgets; reuse of scrub/rewind and parser; local cues; minimal migration. Its original algebra-first scope is historical. |
| H5 | `kp_authoring_migration_plan.md` | May 3, 2026 | Whole–part–relationship–revised-whole loop; semantic transitions; shared overview/guided/review material; gradual migration rather than replacement. |

### 22.2 What this document supersedes

**Typography.** The older New Computer Modern Mono Book companion-font recommendation is explicitly rejected. No replacement is specified here.

**Permanent graph UI.** Earlier brainstorming about always-visible neighborhoods, fisheye views, or minimaps does not control this build. The accepted direction is a temporary, authored overview with an exact return.

**Separate mode applications.** Earlier mode taxonomies can inform the internal model, but the learner should not need to switch among unrelated lesson, graph, and quiz products. Inspect, Compare, Contextualize, and Reconstruct are coherent arrangements of shared material.

**Universal prototype geometry.** The natural-height prototype's viewport thresholds, fixed positioning, colors, large scroll territories, and accessibility shortcuts are not production requirements. Preserve its attentional lesson, not its incidental CSS.

**Original implementation sequences.** May's algebra migration and August's eigenvector-first build plans are historical. The current candidate is a mechanics understanding repair. Reuse their infrastructure guidance where applicable without treating their old task lists as new authorization.

**Broad MVP ambitions.** Global registries, automatic review generation, adaptive remediation, and AI tutoring remain deferred. A local overview, one manual expansion, and one reconstruction task are now part of the proposed excursion; that does not reopen every broader subsystem previously deferred.

**Overgeneralized mathematical arrows.** Conversational shorthand such as force-to-work without motion input, unqualified bidirectional relationships, or informal differential cancellation must be corrected in authored content. Section 14 supplies the narrower mechanics scope.

### 22.3 What remains continuous with the earlier work

The project still centers on attention choreography, persistent formal objects, lawful and inspectable transformations, excellent prose, reversible presentation, and reuse. The new framing gives those capabilities a clearer purpose: supporting relational intuition and structured whole–part return.

This is an evolution in emphasis, not a repudiation of the existing work.

---

## 23. Codex starting instruction

The following can be used as the initial instruction alongside this document:

> Read this handoff as product and interaction guidance, not a mandate for a new architecture. Inspect the existing KP codebase and identify the smallest integration path for one mechanics understanding repair with prose, a persistent stage, an aligned comparison, a short Show why detour with exact return, a reusable overview, and one reconstruction prompt.
>
> Preserve working lesson, parser, renderer, and scrub/rewind infrastructure. Do not assume historical handoffs describe current implementation. Do not adopt Computer Modern Mono or choose a new overall font identity. Do not add a permanent graph/minimap, scroll snapping, forced quizzes, a new general-purpose animation runtime, or a universal ontology.
>
> First provide a concise codebase integration map and scoped implementation sequence. Then implement the agreed scope incrementally using repository conventions. Keep the mathematical assumptions in Section 14 intact and use the acceptance scenarios to guide tests. Distinguish implemented, tested, and deferred behavior in the completion report. Flag genuine product tradeoffs; choose ordinary implementation details yourself.

### Final design test

At any moment, the learner should be able to answer:

> What am I being asked to notice? What does this control change? Why is this relationship relevant? How do I get back?

At the end, the product should help answer a harder question:

> What relationship can I now independently recognize, reconstruct, or use?

**Keep the relational depth in the material. Make that depth easy to enter, easy to inspect, and easy to leave.**
