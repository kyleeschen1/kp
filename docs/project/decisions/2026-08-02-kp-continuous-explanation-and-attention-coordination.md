# Continuous explanation and attention coordination

Status: accepted
Date: 2026-08-02

## Context

KP has a capable animation catalogue and several strong semantic assets, but
its explanatory text remains the weakest product layer. Small atomic captions
are easy to coordinate with motion but destroy the contextual advantage of
prose. Long prose preserves an argument but can overwhelm the learner when it
competes with an active animation. The project therefore needs an attention
model, not merely more embedded interactive components.

The canonical discovery exemplar is the approved economics supply-demand
equilibrium animation. The second caller is the generated solve-x lesson. This
work precedes another domain expansion and does not reopen the tabled linear
algebra frontier.

The editorial cadence takes inspiration from Better Explained's pattern of
starting with the organizing question or intuition, placing a visual at the
conceptual bottleneck, interpreting it immediately, and using notation as
compression and verification. KP will not copy the site's voice, layout, or
analogy choices. The result must remain KP-native, exact, calm, and
semantically inspectable.

## Decision

### Preserve continuous prose

The canonical lesson source is continuous, structured Markdown. The complete
claim and reasoning chain remains readable without playing motion. Attention
cues annotate that prose; they do not replace it with a sequence of clipped
captions. Context, questions, interpretations, and synthesis may hold the
stage still rather than controlling motion.

The argument spine remains visible. Supporting definitions, derivations,
alternate examples, edge cases, proof detail, historical context, and full
transcripts may collapse when useful. Collapsing must never hide a premise or
conclusion required to understand the main argument.

Mathematical text uses inline KaTeX by default. Lesson section headings begin
at the visual scale of `h3`; the reader surface does not add a large
“Animation Studio” title.

### Coordinate attention without simultaneous demands

Passage selection prepares a relevant static semantic checkpoint. At a causal
bottleneck, the prose places one annotated scrub-bar block on its own line,
immediately before the motion it introduces. The block names what will move and
what will remain invariant, then exposes Rewind, Previous, Play/Pause, Next,
and continuous semantic progress.

The economics integrated-review exemplar treats crossing that visible block as
a directional handoff. Crossing downward plays the authored timeline; crossing
upward rewinds the same timeline. This is not continuous scroll scrubbing:
scrolling never directly assigns curve positions, and each direction runs on
the ordinary animation clock. Reversing direction mirrors the clock at the
current frame, so the curves do not jump. Any learner use of the controls,
keyboard commands, or a bespoke parameter claims the timeline and suppresses
later automatic crossings. Reduced-motion preference suppresses automatic
playback and rewind while retaining the complete manual control block.

Making the boundary visible preserves the core rule: do not surprise the
learner with causally important motion while they are absorbing unfamiliar
prose. The control is a custom web component with shadow-DOM presentation and
composed DOM events, not a Svelte component. Svelte binds the current exemplar
to the runtime but does not own the control contract. This remains one-caller
discovery evidence pending integrated review, not yet a stable shared reader
default.

The coordination is soft and bidirectional:

- selecting or scrolling into a passage prepares its pre-motion static stage
  state and gives that passage a subtle positive emphasis;
- crossing the visible scrub boundary may play downward or rewind upward on
  the authored clock, without scroll seeking;
- crossing a semantic checkpoint updates the emphasized prose;
- continuous motion between checkpoints leaves the prose emphasis stable;
- no coordination action auto-scrolls the page;
- a prose phrase may preview or pin its semantic object in the stage;
- selecting a semantic object may identify the relevant prose without moving
  the viewport.

Active prose uses a restrained left rule or light tint. Surrounding prose is
not dimmed, blurred, or made harder to read. Scroll selection uses a stable
reading band with hysteresis so adjacent passages do not flicker between
states.

### Give the learner fine-grained semantic control

The block-level prose control contains Rewind, Previous semantic checkpoint,
Play/Pause, Next semantic checkpoint, and a continuously draggable scrubber
with semantic marks. The persistent stage does not duplicate that strip.
Keyboard equivalents and optional uninterrupted play-through are required.
Checkpoint controls move between meaningful states, not arbitrary fixed time
increments; the scrubber remains available for fine-grained inspection and
reversible seeking.

An animation may expose bespoke parameters after the guided explanation, but
they remain secondary machinery. The economics exemplar first uses one fixed
demand change, then opens a labeled exploration mode with a conspicuous
“Return to lesson example” action.

### Use one persistent stage per conceptual section

On wide screens, a lesson uses one persistent stage pinned beside the prose
for a conceptual section rather than many inline players. On phones, the stage
becomes a compact dock occupying roughly one third of the viewport, with
temporary expansion when requested. The dock must not change height as labels,
equations, or controls change.

The first implementation will be a bounded internal Svelte 5 lesson surface.
Svelte may own host composition, but the prose scrub bar is a custom element
whose UI state and actions travel through attributes and DOM events. Markdown,
semantic assets, runtime frames, clocks, attention decisions, controls, and
renderer ports remain usable without Svelte. This discovery exemplar does not
authorize a SvelteKit migration, a public site, an authoring editor, or a
catalogue-wide reader rollout.

### Keep generation downstream of verified explanation

The first exemplar is hand-authored. An LLM may later propose review-time
wording from verified claims, approved vocabulary, learner state, available
visual arguments, and an accepted explanation spine. It may not invent the
canonical claims, generate learner-visible prose at runtime, or sit in the
playback loop. The internal editor, public editor, and M5 editorial candidate
workflow remain later priorities.

## Canonical economics lesson

The exemplar asks: “Why does an increase in demand raise both equilibrium price
and equilibrium quantity when supply remains fixed?” It assumes the learner can
read axes and has seen supply, demand, and equilibrium, but may confuse a curve
shifting with movement along a curve.

The same persistent graph supports four prose sections:

1. What equilibrium means.
2. What changes when demand increases.
3. How the market-clearing point changes.
4. What the model does and does not say.

The graph leads the causal argument. Equations remain visually quiet until
they verify the exact result. A restrained concrete market comes first, then
the text generalizes. Before the demand shift, the lesson offers a non-gating
prediction pause. It closes with the non-gating synthesis question: “Supply
did not shift. Why did equilibrium quantity still rise?” and a revealable
model explanation.

The target length is roughly 800–1,200 prose words, governed by structural
editing rather than hard cue-level word caps. The voice is a calm explanatory
essay with occasional direct attention prompts, not a stream of commands or a
chatty tutor.

## Accessibility

Structured prose and concise checkpoint announcements are the default
nonvisual explanation. Full narration is optional. Static, reduced-motion,
keyboard, and screen-reader projections must preserve the same causal argument,
semantic checkpoint order, and synthesis—not merely expose playback controls.

## Promotion gates

The work has two mandatory human checkpoints:

1. Editorial: review the complete prose, claim accuracy, semantic references,
   and attention storyboard before implementation.
2. Integrated: review the economics lesson's actual reading cadence, motion,
   focus treatment, controls, wide layout, and phone dock.

Only after the economics exemplar passes both checkpoints may generated solve-x
act as the structurally different second caller. A shared passage schema,
reader shell, authoring vocabulary, or catalogue-wide rollout requires that
second caller to demonstrate the boundary. The smallest rollback unit during
discovery is the economics lesson surface and its local annotations; the exact
economics model, approved graph, existing catalogue, and current reader remain
unchanged.

## Acceptance criteria

- The prose is coherent if the learner never presses Play.
- The cadence preserves context and uses the visual where it resolves a real
  conceptual bottleneck.
- The learner is never expected to absorb new prose and essential motion at
  the same moment.
- Every active passage has an evident visual target or intentionally holds the
  stage.
- Previous, Play/Pause, Next, scrubber, keyboard, seek, and rewind preserve
  semantic correspondence.
- The scrub boundary identifies both the moving object and retained invariant
  before directional scroll playback can begin.
- Manual interaction always takes ownership, reduced-motion disables automatic
  playback/rewind, and reversing scroll direction never snaps the animation.
- The lesson explicitly repairs the shift-versus-movement misconception.
- The phone composition remains usable without stage-size jitter.
- Static, reduced-motion, keyboard, and screen-reader use preserve the causal
  explanation.
- No generic rollout occurs before the solve-x second caller.

## Consequences

The immediate work is editorial rather than infrastructural. The current
Markdown parser's atomic beat captions, the catalogue's default player, and the
existing five economics claim IDs are useful evidence but are not yet the
approved continuous-prose attention system. Their gaps will be specified at
the editorial checkpoint, then implemented only after human approval.

The matrix visual checkpoint remains preserved and tabled. Public Web,
SvelteKit adoption, Internal Editor, Public Editor, and live LLM generation do
not move forward as a side effect of this decision.

## References

- [Better Explained: Linear Algebra Guide](https://betterexplained.com/articles/linear-algebra-guide/)
- [Better Explained: A Visual, Intuitive Guide to Imaginary Numbers](https://betterexplained.com/articles/a-visual-intuitive-guide-to-imaginary-numbers/)
- [Better Explained: Calculus—Building Intuition for the Derivative](https://betterexplained.com/articles/calculus-building-intuition-for-the-derivative/)
- `docs/project/reviews/2026-08-02-economics-demand-shift-lesson-draft.md`
- `docs/project/reviews/2026-08-02-economics-text-animation-editorial-checkpoint.md`
