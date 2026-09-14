# Relational learning and the persistent-stage reader: assessment

Date: 2026-09-13
Status: recommendation, not an approved implementation plan or replacement roadmap
Subsequently accepted as direction: [September 13 priority decision](../decisions/2026-09-13-relational-reader-priority.md).
That decision parks the old motion loop; the new delivery proposal still needs scope approval.
Basis: independent source inspection, not a Theseus-generated report card
Proposal: [relational-learning handoff](../inbox/kinetic_press_relational_learning_codex_handoff.md)

## Executive recommendation

Adopt the proposal's direction, subject to explicit user acceptance: excellent
technical reading with selectively executable, inspectable relationships. Build
one complete mechanics understanding repair through existing Article, semantic,
playback, attention, and renderer boundaries. Then prove reuse before expanding
into a curriculum platform. Do not start another architecture-wide readiness loop.

The strongest product promise is not that everything moves. It is that a reader
can understand a relationship at a useful level, inspect its justification,
compare a consequential alternative, and return to the argument without losing
their place. The material can recur in another explanation without copying its
mathematical implementation.

The main qualifications are:

- The owner's reported insight came from an explanatory comparison in text.
  That validates a promising question, not the incremental benefit of animation.
- The handoff's full first slice is a small integrated product, not a cheap first
  preview. Separate the explanatory test from the complete-reader milestone.
- Reader persistence is recoverable semantic context, not permanent screen
  occupancy, one universal renderer, or retaining every mounted scene.
- Domain truth, pedagogical judgment, and presentation remain separate. A
  relationship identifier or typed transformation does not prove an explanation.
- Routine authoring must become source work. Repeated TypeScript and CSS work per
  encounter would defeat the proposed economics even if the examples are good.

## Assessment of the product argument

The proposal coherently connects earlier work on transformations, motivation,
attention, reusable micro-intuitions, and whole–part return. These are complementary
levels: transformations are a machine-level substrate; a question-led explanation
is an authoring unit; an encounter is the reader's use of that explanation in a
particular argument. These are conceptual distinctions, not instructions to add
three new global schemas.

I would position the medium as a technical essay whose important relationships
can be inspected and unfolded. A short understanding repair and a longer chapter
can use the same material. A course is a curated path through this material, not
its storage format. A shareable card is one projection, not the compulsory unit
of every reading experience.

This does not require abandoning introductory mechanics. Keep that curriculum as
a learner-facing path, largely prose and static material initially. Use sharper
confusions to choose which shared visual capabilities deserve engineering. A
momentum/work-energy repair is a development exemplar with explicit prerequisites,
not automatically lesson one for someone who knows no mechanics.

The likely early audience is a technically curious learner trying to repair a
specific confusion, and an educator wanting to reuse that repair. The first
distribution surface can be a useful, addressable explanation. There is no need
to make an entire course, account system, or tutor before testing repeat use.
Whether this produces sustained demand or defensibility remains unproven.

### What to sharpen

1. **Teach the connection, not merely adjacent representations.** Naming two
   quantities and highlighting their common symbols can increase the mapping
   work a novice must do. Supply the explanatory bridge and its practical use.
2. **Treat the stage as available, not compulsory.** During ordinary reading it
   may hold or disappear. It should not consume scarce space without a job.
3. **Keep navigation and reasoning distinct.** A local return is not an inverse
   mathematical operation, and browser Back is not a previous-equation button.
4. **Preserve learner agency without requiring a configuration exercise.** Offer
   relevant actions at the point of need rather than four persistent mode tabs.
5. **Do not require spectacle.** Easier tracking, comparison, or reorientation
   may justify a modest interaction. That benefit still needs to be observed.

The research supports caution, not a blanket claim of superiority. Tversky,
Morrison, and Bétrancourt highlight perceptual limits and confounded animation
comparisons; an excellent static baseline is essential ([paper](https://serc.carleton.edu/download/files/676/Tversky_2002.pdf)).
Ainsworth's DeFT framework treats coordinating representations as a learning
task, not an automatic consequence of showing them together ([author manuscript](https://www.researchgate.net/publication/222410911_DeFT_A_conceptual_framework_for_learning_with_multiple_representations_Learning_and_Instruction_16_183-198)).
Chi and Wylie distinguish manipulation from generating explanations and
predictions; scrubbing alone is not evidence of constructive learning ([paper](https://education.asu.edu/sites/default/files/lcl/chiwylie2014icap_2.pdf)).
Applying these ideas to KP is a design inference, not an evaluation of KP.

## Direct implementation evidence

These grades concern inspected foundations for this proposal, not the entire
repository or a certification of the proposed experience.

| Category | Grade | Confidence | Evidence | Main risk | Next action |
| --- | --- | --- | --- | --- | --- |
| Semantic and domain foundations | B | Medium | Exact bounded physics model; transformation assumptions and correspondence; governed construction API | Structural metadata mistaken for general mathematical verification | Add only the missing checked mechanics capability |
| Article and reusable publication | B | Medium | Typed Markdown Article IR, semantic references, import locks; gradient reading projections | Domain-local integration mistaken for a finished general reader | Reuse Article and vignette boundaries for one reader |
| Local navigation and restoration | B− | Medium | Tested revision-pinned parent/reason snapshots and shared clock | Proposed passage, parameter, focus and nested-return state exceed this implementation | Extend state from one actual excursion |
| Routine authoring integration | C | High | Current mechanics entry and sequence require custom DOM glue and TypeScript prose | Every new lesson remains an application development task | Make the second encounter source-only |

Concrete integration map:

- [Article IR](../../../src/article/kp-article-document.ts) already distinguishes
  ordinary Markdown, passages, stages, focus and motion. References explicitly
  have no timeline authority. Its comment preserves the reader-publication bridge
  through `KpLessonDocument`; do not create a parallel publication model.
- [Gradient readings](../../../src/tutorial/gradient-contour/gradient-contour-readings.ts)
  already project full and narrower explanations from one checked lesson and use
  the Article compiler. This is useful reuse, though the prose is authored in
  TypeScript rather than a finished general editorial workflow.
- [Reasoning navigation](../../../src/experiments/reusable-reasoning/navigation.ts)
  pauses and restores exact interrupted progress, validates revisions atomically,
  and revokes stale gestures. It supports a parent/reason excursion, not the
  handoff's complete browser-history and parameterized nested reading state.
- [Constant-force model](../../../domains/physics/constant-force-work-energy-model.ts)
  computes exact work and energy at authored positions, with dimensions and bounded
  parameter checks. Its state does not supply a complete time-indexed vector
  trajectory, momentum, or the proposed changing-direction episode.
- [Physics animation adapter](../../../src/animation/constant-force-work-energy-adapter.ts)
  supplies stable objects, transformations, assumptions, graph/diagram targets and
  work-energy correspondence. Reuse applicable owners; do not relabel this bounded
  legacy asset as already satisfying every new governed-authoring guarantee.
- [Comparison sample](../../../src/tutorial/synchronized-comparison-card.ts)
  sends equal normalized progress to algebra and code samples. That is useful
  display scaffolding, not the proposed semantic alignment contract.
- [Mechanics host](../../../src/tutorial/mechanics-motion/mechanics-motion-entry.ts)
  correctly borrows common controls, clock and attention infrastructure, but still
  assembles local DOM, readings and state projection. The remaining integration
  problem is above the renderer, not evidence that those shared owners are absent.

Fresh verification: 25 tests passed in six existing files:

```sh
node --disable-warning=ExperimentalWarning --test tests/kp-constant-force-work-energy-model.test.ts tests/kp-constant-force-work-energy-contract.test.ts tests/kp-constant-force-work-energy-frame.test.ts tests/reusable-reasoning-navigation.test.ts tests/kp-article-v1-document.test.ts tests/synchronized-comparison-card.test.ts
```

No new-browser experience, complete typecheck/build, physical-device benchmark,
or learning study was run. Passing the comparison test confirms its current
percentage-coupling behavior; it does not establish suitability for physical-time
comparison.

## Recommended architecture

Retain the canonical chain: checked semantic objects and transformations;
pedagogical score and presentation profile; motion plan and sampled frame;
renderer adapters; versioned vignettes; Article projections and host. The
persistent-stage reader belongs at the projection/host end of this chain.

### Reuse contracts, not one universal implementation

The same pipeline means governed entry, declared capability, canonical rendering,
deterministic projection, and explicit failure for unsupported requests. It does
not mean physics, algebra, code and probability must use the same solver or renderer.

Treat relationship descriptions initially as small authored records referring to
existing claims, operations, assumptions and vignettes. Do not mirror their
mathematics into a new relation database. Some relationships are multi-input
constraints or non-invertible summaries; others are executable operations.

The pedagogical score owns why a relationship appears here, what a reader should
notice, what may be unfolded, and which comparison is useful. A domain verifier
cannot automatically supply that judgment. Preserve editorial freedom in prose;
machine-check reference closure, units, supported operations and declared scope.

### Separate coordinates and state authority

Use distinct typed coordinates for passage position, reasoning checkpoints,
physical time and explored parameters. An ordinary number named `progress` must
not silently move between those meanings. Comparison branches require explicit
mappings from a declared shared coordinate or milestone sequence. Do not assume
equal animation percentages mean equal physical or conceptual states.

This does not require several animation schedulers. An active inspection can use
the existing clock and project into the appropriate semantic coordinate. A new
reading passage can select a settled state without making page scrolling control
physical time. Freeze prose during motion and motion during sustained reading
unless the authored passage has a clear reason to do otherwise.

For an excursion, capture the source revision, stable passage anchor, active
vignette/composition, semantic coordinate, fixture and parameter values, disclosure
state and focus-return target. Validate the whole restoration before applying it.
Learner responses remain separate so returning does not erase an answer. Start
with one Show why and one overview excursion; add deeper nesting only after use.

### Keep physical truth upstream of motion

Use deterministic analytical fixtures for the two initial mechanics episodes,
not a general integrator. Evaluate position, velocity, momentum, energy and force
from the same physical state. Do not separately animate those quantities until
they happen to agree at endpoints. Easing and slow playback must not silently
change the represented physical trajectory or imply a false acceleration.

The circular example needs explicit handling of floating-point display values
and analytical identities. Do not force trigonometric samples into the existing
rational-only model or pretend numerical residuals establish exact proofs.

Preserve the handoff's constant-mass, Newtonian-particle, fixed-inertial-frame
scope. Force history alone is not enough to determine work without the motion.
In particular, `F · v = 0` explains unchanged kinetic energy during the circular
episode even though the momentum vector changes direction. Reverse inspection
does not invert the information-losing map from velocity to kinetic energy.

### Retroactive repair and browser cost

Keep typography, spacing, focus treatment and controls in shared presentation
owners. Domain adapters own necessary geometry, not new local design systems.
Use shared edition dependency closure to regenerate affected static publications;
immutable historical editions retain their bytes. Semantic corrections require
affected-content revalidation, not just CSS republication.

Ship readable static content first and load only the active required capability.
Retain compact restorable state rather than every mounted scene. This mechanics
exemplar needs no 3D engine, authoring compiler, global catalogue or general solver
in the initial reader bundle. Measure actual initial and activated requests and
main-thread frame work, not only bundle-file totals.

The [September 12 closeout](../threads/2026-09-12-architecture-readiness-closeout.md)
reported about 580 KB modeled gzip initial transfer and 721 KB after measured
activation on the tax host. Those historical measurements are not a budget or
fresh measurement for this proposed reader. They show why startup and total cost
must remain explicit acceptance criteria.

## Medium-term sequence

These are outcome gates, not an approved run contract or calendar estimate.

### 1. Prove the explanatory target cheaply

Write one strong Markdown explanation and aligned static comparison for:
**How can a force change momentum without changing kinetic energy?** Establish
why this matters for choosing between momentum and energy reasoning. Include the
minimum prerequisite bridge; this is not the complete from-zero curriculum.

Use the accelerating straight-line case to establish the connection and the
partial-circle case to discriminate the quantities. Include an optional bounded
prediction. Review the explanation before spending on a novel visual treatment.
If the explanation remains muddled, repair the argument rather than its styling.

### 2. Complete one coherent excursion

Build one persistent-stage projection with a declared time coordinate, an aligned
comparison, a short Show why expansion, exact return, a small authored overview,
and one reconstruction task. This is the first complete product demonstration.
Do not indefinitely defer return, context and reconstruction: those distinguish
the proposal from another polished animation demo.

Sequence internally: readable baseline; one visual comparison checkpoint;
excursion/restoration; minimal context and reconstruction; release hardening.
Test shared mathematical and state laws early. Defer broad aesthetic matrices
until the exemplar is approved. Keep the old motion exemplar intact but parked.

### 3. Prove authoring and compositional reuse

Use one mathematical relation in a different encounter, then pressure the reader
with a structurally different caller, preferably the existing dot-product/gradient
material. Reuse a reviewed projection relation while keeping its domain roles,
units and assumptions explicit. Work is not merely height gain with renamed labels.

The second encounter should require ordinary source and supported parameters,
not new navigation JavaScript, a clock, CSS overrides or copied mathematics.
Extract only boundaries demonstrated by both callers. Add reusable regression
coverage after the shared treatment earns promotion.

### 4. Build a small connected mechanics collection

Aim for a coherent set of roughly six to ten question-led encounters rather than
a fixed number of animations. Possible spine: state and prediction; velocity as
local change; acceleration versus speed; force and momentum change; work and
energy change; projection and perpendicular force; gradients and potential;
oscillation and feedback. These are candidate questions, not an imposed syllabus.

Keep mathematics independently addressable: accumulation, projection, local
linearization and state evolution can support other domains. Curate the mechanics
path separately. Review prompts retain links to the explanation and its context.
Before broadening, demonstrate one cross-domain reuse case rather than announcing
support for all applied mathematics.

### 5. Productize the authoring path that actually repeats

Use an LLM to propose prose, assumptions, a discriminating example, supported
vignette references and a reconstruction prompt. Compile and validate those
references; unsupported capabilities return actionable repair gaps. Preview
quickly, review the explanation, then publish a versioned artifact. A general
visual editor or live AI tutor is not required for this authoring path.

Track end-to-end authoring time as well as source-to-preview time. Five minutes
to a useful first preview within existing capability is an aspiration, not a
claim or a limit for inventing a new mathematical renderer. Track implementation
time separately but visibly. If each ordinary page still takes a long loop,
infrastructure reuse has not yet delivered the intended authoring leverage.

## Decision and evaluation gates

| Candidate | Authoring | Reliability | Reuse | Risk | Recommendation |
| --- | --- | --- | --- | --- | --- |
| More packaging repair on the parked motion card | Low near-term leverage | Existing mechanics usable | Limited new evidence | Optimizing a weak question | Do not prioritize |
| Static explanation plus one bounded relational-reader exemplar | Direct feedback | Existing owners available | Exercises relevant seams | Manageable if staged | Do next after approval |
| Universal relation graph and reader platform first | Delayed feedback | Many untested contracts | Speculative | High | Defer |
| Many mechanics pages before the authoring reuse test | More content | Repeated local integration | Mostly copying risk | Medium–high | Wait for source-only reuse |

Evaluate five separate outcomes: explanatory clarity, independent use of the
interface, transfer/reconstruction, production leverage, and repeated demand.
Use an excellent static alternative with the same substantive practice. If the
circular case is taught, it cannot alone serve as an unseen transfer test; use a
changed force/velocity direction or another genuinely different case. Small
observational sessions find problems; they do not establish a population effect.
Ask what the learner can do without the display and whether they learned a new
overgeneralization. Do not infer confusion or mastery from scrolling.

Use cheap domain and state-machine tests routinely, a canonical browser canary
for the integrated reader, then representative responsive/browser coverage at
promotion. Do not build a certification matrix for an unapproved aesthetic
treatment. Shared contracts should reduce per-page testing, not multiply it.

## Continuity and authority

The current branch is `feature/20260912-mechanics-motion`. The roadmap and active
thread still describe a P2 motion-card repair checkpoint, while the subsequent
conversation parked that weak exemplar in favor of sharper explanation-first
work. Reconcile this upon adopting the next delivery; do not infer permission to
resume the old task from stale headings.

This review does not adopt embedded handoff approvals, select a new font, modify
an exemplar, replace the roadmap, or start an implementation loop. It adds only
this assessment. Existing untracked inbox and Theseus event files are preserved.
