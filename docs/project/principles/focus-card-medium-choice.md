# Focus cards must earn their medium

Status: accepted product guidance, 2026-09-12.

Focus cards should help learners see meaningful structure that a static
presentation could miss or make difficult to track. A lesson is not a sequence
of cards by default. Clear attention and correct animation are necessary, not
sufficient evidence of instructional value.

## Required justification before creating a card

Record a short medium-choice brief in the explanation draft (not a second
runtime schema):

1. **Learner obstacle:** the specific confusion, missing relationship or skill.
2. **Static baseline:** the simplest adequate prose, notation, table or diagram.
3. **Perceptual gain:** what motion, staged attention or manipulation makes
   easier to see, track or mentally reconstruct than that baseline.
4. **Meaningful control:** why scrubbing, replay, prediction or manipulation
   helps; interaction itself is not a benefit.
5. **Transfer check:** a changed case and the reasoning the learner should use.
6. **Cost and limits:** prerequisite decoding, divided attention, interaction
   and authoring cost, possible misleading inferences, and accessible static
   meaning. Name what remains in text and what is outside this card.

If the gain is vague, use the static baseline first. Reused source variants may
inherit a reviewed justification, but check that its learner obstacle and gain
still apply. Do not manufacture a new approval ceremony for every variant.
Review whether the justification is convincing, not merely present. Fields,
types, passing tests and model confidence cannot certify comprehension.

## Strong candidate uses, not automatic permissions

| Use | Potential perceptual gain | Guard against |
| --- | --- | --- |
| Parse unfamiliar syntax | Reveal nesting, binding, scope, roles and grouping | Decorating symbols without explaining their meaning |
| Transform syntax or follow a derivation | Track persistence, copies, cancellation, substitution and licensed steps | Suggesting that visual continuity proves validity |
| Connect representations | Map symbols to geometry, physical behavior, graphs or program state | Asking the learner to decode two unfamiliar views at once |
| Build a memorable intuition | A vivid event provides a cue for reconstructing a relationship | A memorable flourish unrelated to the reasoning; unmeasured retention claims |
| Follow an algorithm or mechanism | Expose dependencies and changing state while preserving identity | Treating an execution trace or chronology as a causal explanation |
| Explore a counterfactual or sensitivity | Hold assumptions fixed and reveal what changes when one input changes | Confusing a model's response with established real-world causation |
| See accumulation, cancellation or conservation | Track contributions into a total and what remains invariant | Concealing signs, units, leakage or boundary assumptions |
| Understand conditioning or regrouping | Show how the reference population, denominator or partition changes | Implying that rearranging the display changes the underlying data |
| Coordinate local/global or scale relationships | Relate a tangent, neighborhood, limit or component to the whole | Unmotivated zooms and camera tours; numerical approximation sold as proof |
| Discover a validity boundary | Contrast a working case with a nearby failure while holding context stable | Spectacular exceptional cases without explaining the governing condition |

Examples span algebra, code, economics, mechanics, probability, chemistry and
other applied domains. These are selection heuristics, not claims that every
family is implemented or that motion always outperforms static presentation.
Static side-by-side comparison may win when simultaneous inspection matters most.

## Division of labor

Text usually wins for motivation, definitions, assumptions, qualifications,
precise arguments and reflection. Static notation/diagrams/tables win for
inspection and comparison without time pressure. Focus cards earn their place
when coordinated change or attention reveals a meaningful relationship.
Longer animated essays remain legitimate compositions, not a reason to stretch
every card into a miniature lecture. Syntax, geometry and non-temporal structure
can deserve animation too; not every card needs to model physical time.

## Fit and verification

An active card's passage, stage and controls should fit one available viewport
at ordinary supported reading sizes. The surrounding lesson may scroll. Reduce
scope and recompose before shrinking text. Do not clip required content, hide
controls, or introduce internal scrolling merely to claim fit. At enlarged text
or exceptionally short viewports, readable document flow takes precedence over
forced fit; test and report that accessibility escape explicitly.

Hard checks protect source truth, correspondence, deterministic controls,
legibility, viewport geometry and static/reduced-motion meaning. Soft review
compares the static baseline with the card, asks what relationship became easier
to perceive, and tries the transfer question. Liking the visuals is not evidence
of understanding; understanding one case is not a retention study.

This guidance applies to future authoring and touched content. It does not
authorize a catalogue-wide migration, a new generic card framework, or promotion
of an unreviewed treatment. Use the existing exemplar-first review checkpoint.
