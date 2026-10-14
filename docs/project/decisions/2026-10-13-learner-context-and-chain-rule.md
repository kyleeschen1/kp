# 1. Explanations need a learner context

Date: 2026-10-13
Status: accepted product/design emphasis; concrete teaching sequence and adaptive
interface below remain proposals, not implementation authority or proven outcomes.

## Decision

The user asked to preserve the chain-rule research and added: “we need to
understand what context the student is coming into this with -- there is no
universally good explanation.” Treat the usefulness of an explanation as
dependent on the learner's prior knowledge, current question, notation fluency,
purpose and immediate reading context. Do not equate source-controlled correct
mathematics, visual polish or successful tests with pedagogical value.

KP could offer different explanatory paths through the same mathematical
relationships. This is a product hypothesis to test through small examples,
not permission for a universal learner model, adaptive platform or new renderer.

## Reason and observed failure

The user found the first change-propagation card busy and was unsure what it
was trying to teach. It simultaneously exposed values, local derivatives,
finite changes, predictions and residuals before establishing a clear question.
Its successful source-only function variation demonstrates an authoring
capability, not a successful chain-rule lesson. The card is not accepted for
pedagogical promotion. Preserve its mathematical machinery and verification;
using it as a later inspection view is a proposal, not a confirmed destination.

Three distinct possible purposes had been conflated: introducing the chain rule,
explaining a known symbolic procedure, and investigating approximation error.
The presentation must identify which learner question it addresses.

## Research findings and sources

- [3Blue1Brown's illustrated lesson](https://www.3blue1brown.com/lessons/chain-rule-and-product-rule/)
  uses the same sin(x²) example with three number lines. It establishes function
  composition, follows a small change, names the intermediate quantity, and
  substitutes its change into the next step. Our inference: the identity and
  sequence of the intermediate object matter more than merely having number
  lines. The published adaptation was examined; no learner comparison of our
  card against the video was performed.
- [Math Insight](https://www.mathinsight.org/chain_rule_idea) connects function
  machines, linear slopes and local tangent slopes. Multiplying constant scales
  explains multiplication, but hides why the outer derivative's evaluation point
  matters. That requires a nonlinear follow-up. Always evaluate the outer
  derivative at the inner function's value, not its derivative.
- [Active Calculus](https://activecalculus.org/single/sec-2-5-chain.html) first
  distinguishes compositions from sums, products and quotients, then uses linear
  compositions to motivate the product of derivatives. Our inference: check
  whether the learner recognizes composition before teaching its derivative.
- [BetterExplained](https://betterexplained.com/articles/derivatives-product-power-chain/)
  follows a perturbation through a sequence of processes. Each local derivative
  has a job: scale the change arriving at that operation. Useful intuition does
  not license conflating actual finite changes with differentials.
- [OpenStax](https://openstax.org/books/calculus-volume-1/pages/3-6-the-chain-rule)
  supplies a clear theorem and application procedure. Our recommendation is to
  connect that symbolic procedure to an established meaning for each factor.
- [Siyepu, 2015](https://link.springer.com/article/10.1186/s40594-015-0029-5)
  reports qualitative findings from 30 engineering students, including confusion
  between compositions and products when choosing differentiation rules.
- [Park and Lee, 2016](https://www.ejmste.com/download/how-can-students-generalize-the-chain-rule-the-roles-of-abduction-in-mathematical-modeling-4604.pdf)
  examines a modeling lesson with 20 eleventh-grade students. Contextual meanings,
  diagrams and interpretation of relationships supported development of the rule.
  Neither study establishes a universally best animation or demonstrates KP's
  learning effectiveness. The recommendations here are a design synthesis.

## Proposed chain-rule sequence, conditional on learner context

For a learner who understands derivatives as local sensitivity but does not
understand composition of sensitivities:

1. Predict the result of two constant scalings: triple a change, then double it.
   This isolates why the factors multiply without error readouts or new notation.
2. Introduce one nonlinear stage: u = 3x + 1, y = u². At x = 1 the intermediate
   value is 4; the local scales are 3 and 8, giving overall sensitivity 24.
   The 4 received by the second function must visibly determine its local scale.
3. Establish locality: squaring only approximately scales nearby finite changes
   by 8 at u = 4. Use a brief local view, rather than simultaneous dashboards.
4. Connect the same intermediate change across Δu ≈ f′(x)Δx and
   Δy ≈ g′(u)Δu. Substitute, then use the limiting ratio to establish the exact
   derivative identity. Reserve Δ for finite changes; distinguish differentials.
   Cancelling du symbols alone is not an explanation or a general proof.
5. Transfer to sin(x²), where both sensitivities vary. Ask for predictions about
   signs or zero sensitivity before revealing the result. Approximation error is
   a subsequent optional inquiry, not mandatory first-screen content.

This is one entry path, not a new canonical curriculum. Someone already fluent
in the rule may need only an evaluation-point explanation, a local proof, a
notation translation, or a connection to Jacobians and backpropagation.

## Consequences and proposed opportunities

- Separate mathematical authority from the explanation selected for this
  learner. Truth, assumptions, referents and valid operations remain stable;
  entry point, granularity, representation and narration may vary.
- Context is more specific than “beginner” or “advanced.” A student can manipulate
  derivatives accurately while misunderstanding composition, or understand local
  sensitivity while struggling with notation. A single interaction is weak
  evidence of a durable ability and must remain correctable.
- Candidate learner controls should express questions: “Why multiply?”, “Why
  evaluate here?”, “What is u?”, “Show the proof”, or “Connect this to matrices.”
  These are hypotheses for local branching, not approved UI or a fixed menu.
- Let a prerequisite unfold at the point of confusion and return to the same
  mathematical object and argument position. Do not require restarting an
  entire lesson, and do not put every available representation on screen.
- Prefer a good authored default, explicit optional routes and modest prediction
  prompts before automatic diagnosis. A reader can supply context; any later
  inferred context should carry uncertainty and be easy to override.
- For authors, a proposed explanation record could name assumed knowledge,
  question, intended conceptual change and observable transfer check. Do not
  promote this proposal into mandatory schema before real callers establish it.
- Rich semantic metadata may support valid branching and continuity without
  shipping every path or all pedagogy to the browser. Actual delivery costs and
  implementation feasibility still require measurement.

## Alternatives considered

A single maximally complete explanation reproduces the current overload.
Separate hard-coded lessons for every learner context risk duplication and
inconsistent mathematics. Unconstrained on-demand LLM explanations risk invented
meaning and motion. A bounded family of paths over shared semantic referents is
promising, but its authoring burden and teaching value are not yet demonstrated.

## Follow-ups and preservation

Next discussion: choose one learner starting context and one understanding to
change; contrast it with a second context to expose what should actually vary.
A useful eventual check is whether learners explain why sensitivities multiply
and where each is evaluated, then transfer that understanding to a new example.

The existing authoring plan and Theseus contract retain their review gates.
Do not resume publication/generalization as though the busy card was accepted.
Do not implement learner tracking, personalization infrastructure or a new
choreography merely because this direction has been recorded.
