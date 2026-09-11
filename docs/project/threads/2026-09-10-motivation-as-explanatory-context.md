# Motivation as explanatory context

Status: accepted by user with “Excellent. record and implement”; implement the
editorial principle and bounded gradient exemplar repair. Shared enforcement remains proposed,
not a new mandatory schema, runtime capability or catalogue migration.

## Authority and relationship to existing direction

The user identified a general principle after reviewing the gradient card:
motivation (why ask, introduce or use something) helps frame and contextualize
what it is, especially at first encounter. The user's philosophical lens was
roughly “use is meaning.” This refines the accepted question-oriented direction
in `../decisions/2026-09-10-question-oriented-focus-cards.md`; it does not replace
semantic authority or approve universal enforcement.

The primary gradient card was described as clear but insufficiently explanatory
and motivated. That feedback is not acceptance of its pedagogical treatment.
The current proposal and Theseus contract retain their human-review gate.
This document records accepted direction and a proposed shared formalization, not execution
progress or a second loop plan. The user subsequently authorized the primary
motivation/mechanism repair; this is not approval of its resulting visuals.

## Principle

Before asking a learner to assimilate a new object, operation or representation,
establish or recover the question, difficulty, possibility or distinction that
makes it worth understanding. Resolve that same need in the explanation.

Motivation is explanatory context, not promotional copy. It should help the
reader determine what matters, what is being compared, what counts as success,
and what the introduced concept enables. A question-shaped title is insufficient.
The completion criterion is not merely “the result was visible,” but “the reason
for needing it and the connection that makes it work were inspectable.” This is
an editorial/review criterion, not proof of learning efficacy.

Separate three obligations:

- Motivation: why ask this question or introduce this concept here?
- Specification: what precisely is the object, operation or claim?
- Explanation/justification: why does it work or why is the claim true?

None substitutes for another. A numerical meter can demonstrate a relationship
without explaining its mechanism; an appealing application cannot justify a
false theorem. Motivation helps select a useful route into a concept, not define
its entire mathematical meaning or exhaust its possible uses.

## Guardrails

- Motivation may be practical, mathematical, conceptual, aesthetic or exploratory:
  resolving a contradiction, recognizing a pattern, finding an invariant, unifying
  cases or reducing unnecessary work can be enough. No compulsory hillside story,
  career pitch, historical origin story or external application.
- Do not fabricate a difficulty, withhold an answer merely for suspense, or make
  prediction a mandatory quiz gate. A meaningful contrast may motivate silently.
- Do not describe an example as the unique reason a concept exists. Preserve its
  formal definition, assumptions, transfer and alternative interpretations.
- Motivation is reader-relative. An expert lookup may need one orienting phrase;
  a first encounter may need an experienced contrast. Do not restart the entire
  motivation at every algebraic micro-step or every revisit.
- Context can be inherited, but a standalone extraction must restore enough of
  it to remain intelligible. Avoid both contextless fragments and compulsory
  preambles that make micro-intuitions no longer micro.
- The relevant metric, constraints and scale are part of the question. In the
  gradient example, “same effort” is too vague: compare unit horizontal Euclidean
  directions and instantaneous height change at a regular point. Do not conflate
  this with surface walking distance, physiological effort or finite-step gains.

## Proposed lightweight authoring brief

Extend the existing editorial brief, rather than introduce a parallel semantic
source or runtime layer:

1. Reader context: what can the reader already interpret, and what do they want
   to decide, explain, recognize or do?
2. Motivating gap: what remains unresolved; why do existing facts not settle it?
3. Governing question and success criterion: the precise comparison or capability,
   including assumptions necessary to avoid an ambiguous or false objective.
4. Explanatory bridge: the relationship or mechanism that resolves the gap, and
   the semantic evidence/beat(s) through which the reader can inspect it.
5. Payoff and boundary: return to the initial need; state what is now possible
   and where the claim or analogy stops applying.
6. Transfer/retrieval: a changed case, distinction or recoverable cue that connects
   this explanation to later use. Not necessarily an interactive exercise.

These are authoring/review obligations, not six mandatory screens or a fixed
temporal order. Some can be jointly satisfied by one visual comparison. Multiple
motivations may introduce the same semantic explanation without duplicating its
mathematical kernel or animation authority.

## Proposed enforcement boundaries

Start with a brief and human rubric on the current exemplar. After acceptance,
pressure-test a structurally different existing caller before proposing a shared
contract. Do not implement a universal motivation ontology or mass migration now.

If promotion becomes justified, prefer a tagged local-vs-inherited framing
reference, using existing stable source/semantic/beat references. Avoid optional
fields that allow both no framing and contradictory framing authorities:

    framing = local(editorialBrief)
            | inherited(parentExplanationRef, framingRef)

An inherited reference must resolve against the selected source revision. A
standalone projection must materialize sufficient framing or return a located
repair; it cannot silently drop the necessary context. This is a proposed
authoring/projection constraint, not a new renderer input.

What software can check: framing variant is present; references resolve; the
source revision is coherent; required fields are nonempty at the external-data
boundary; declared evidence points to actual material; extraction preserves the
required context. Domain-owned math checks separately validate the claims.

What software cannot establish from those fields: whether the need is authentic
for the intended reader, the explanation is illuminating, the framing is concise,
or comprehension transfers. LLM critique can flag risks, not certify motivation.
Do not label a structurally valid brief “pedagogically verified.”

Human review asks: before naming the concept, can the reader say what is unresolved?
Does the selected representation help answer that question? Is there an inspectable
reason, not only a displayed result? Does the payoff actually resolve the opening?
Would changing the example preserve the relevant way of seeing?

## First application: gradient card

Motivating gap: from this point, which direction gives the greatest local height
increase for the same horizontal distance? A contour map records heights, but
does not yet tell a novice how to use them to choose that direction.

Proposed bridge: preserve surface-to-map identity; following a contour changes
position without height; locally a regular level curve has a tangent with zero
first-order change. On the local tangent plane, a direction's along-contour
component contributes no first-order rise. Under a fixed Euclidean length, the
greatest rise occurs when the direction points entirely along the uphill normal.
Introduce the gradient as the representation of this local change, with length
equal to the greatest rate. This geometry is intuition with stated assumptions,
not a substitute for a general proof or an animation of a finite-step optimum.

Next action is a bounded revision of the primary's motivation and mechanism for
human review, not source-only generalization yet. The local ramp/decomposition
treatment is a proposal; follow the canonical authoring and visual-salience entry
points before implementation. Existing model, controls and renderer authority
remain preserved. No additional Theseus loop is activated by this principle.
