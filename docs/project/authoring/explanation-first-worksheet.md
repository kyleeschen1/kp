# Explanation-first authoring worksheet

Status: editorial workflow, not a runtime schema or certification.
Decision: `../decisions/2026-09-11-explanation-first-authoring.md`.

Use when creating a new conceptual explanation or repairing an unclear “why”.
For a supported source-only variant, reuse and check its accepted explanatory
baseline; do not manufacture a new review ceremony. Objective input, type or
renderer repairs do not need this worksheet unless the explanation also changes.

## 1. Establish the learner and the actual question

- What is the learner trying to do or understand? Why does the gap matter?
- What do we have evidence they already understand? What are only assumptions?
- What should become newly explainable or predictable afterward?
- What is outside this unit, and how can a missing prerequisite be recovered?
- Is this a first encounter, deepening of known notation, or a retrieval aid?
- What successful explanation, if any, is our reference? Preserve its prompt,
  audience and original wording; explicitly mark missing reference material.

## 2. Discover an explanation without a predetermined container

Draft a coherent explanation using whichever mix of prose, equations, dialogue
and sketches makes the idea accessible. Do not start with a fixed stop count,
paragraph budget, camera tour or motif inventory. Explain new terms before using
them as reasons. Include the bridges, counterexamples and comparisons that make
the result follow, not only its correct name and formula.

Keep this pass focused on the learner brief and verified subject matter. The
later implementation pass must still load the canonical authoring/renderer
contracts; separating the passes does not permit skipping repository authority.
Different passes do not require different agents or external model calls.

If conversation exposes confusion, identify the first missing connection. Ask
one useful question or try a different explanation before polishing its visual
expression. Do not infer mastery from silence or an attractive animation.

## 3. Map the reasoning and assign visual jobs

Accepted presentation principle (2026-09-16): put explanatory purpose and the
current instructional reading above the evidence they guide, including inline
inspections outside focus cards. Labels and numerical readouts may remain beside
their referents. Compare interaction with a complete static explanation; neither
synchronized values nor semantic highlighting alone establishes pedagogical gain.
This is an authoring default, not authorization for a catalogue-wide migration.

Before creating a focus card, complete the medium-choice brief in
`../principles/focus-card-medium-choice.md`: learner obstacle, static baseline,
perceptual gain, meaningful control, transfer check, and cost/limits. A visual job
must justify the card relative to a static presentation, not just describe its
animation. If that advantage is unclear, ship the static explanation first.

For each meaningful explanatory unit, record briefly:

| Question | Starting knowledge | New conclusion and why it follows | Evidence / visual job | Likely wrong inference |
| --- | --- | --- | --- | --- |
| What is being resolved? | Known versus introduced here | Include the connecting argument | What becomes easier to perceive, compare or manipulate? Text-only is valid. | What distinction must remain explicit? |

These are editorial units, not necessarily slides or separate interactions.
Name semantic entities and relationships before choosing paint. Do not author
screen coordinates, timing tables or DOM selectors into this outline. If a
visual requires more unfamiliar interpretation than it removes, simplify it or
teach that interpretation first. Preserve useful explanatory sentences even
when no motion accompanies them.

## 4. Review meaning before expensive translation

Use one or two low-pressure predictions or teach-back questions with expected
reasoning. Distinguish “looks clear”, “feels clear” and “can use the idea in a
changed case”. Repeated exposure to the same example is not an independent
learning experiment. LLM critique can find gaps but cannot stand in for a novice.

Use the existing human checkpoint when explanation quality is unresolved; do
not add mandatory extra check-ins to every delivery. Required audience bridges
stay on the main path. Optional support may branch, with the question and exact
return context preserved; a branch must not hide a prerequisite of the main
argument. Do not build a tutoring platform merely to test this workflow.

## 5. Translate and preserve the explanation

Route through `llm-generation-entrypoint.md` and the actual domain owner. Bind
the selected explanation to existing semantic objects, beats, correspondence,
attention and projection seams. Unsupported capabilities remain typed repair
gaps, never an excuse to substitute unrelated motion. No new universal contract
is justified just by completing this worksheet.

Compare the draft and rendered version: did any connecting reason disappear,
become optional, or arrive after it was needed? If a format cannot carry the
explanation, consider a larger unit, composition, or another projection. Do not
silently clip reasoning, shrink readable type, or add steps solely to fill a
layout. Existing accepted font/layout policies remain in force unless a change
is explicitly reviewed.

Types and tests protect facts, references, source coherence and deterministic
behavior. Presence of a “why” field does not prove that it explains anything.
Keep mathematical verification and pedagogical judgment separately reported.

### Bounded review and worked critique

Be strict about truth, references and preservation; explicit about explanatory
judgments; empirical about comprehension. Report each editorial finding as
**location → missing bridge → likely reader consequence → smallest repair**.
Do not assign a clarity score or treat a supplied prerequisite declaration as
proof that its meaning was taught. Harmless paraphrases and independent steps
may vary without changing the argument.

Gradient example, `general-projection`:

- Damaged: “The gradient wins because the dot product says so.” The formula is
  invoked as authority without explaining the comparison.
- Bridge: for fixed-length moves, the dot product is gradient length times the
  move's signed projection onto the gradient. Alignment maximizes that
  projection; perpendicular motion gives zero and opposite motion gives a
  negative contribution. This connects the earlier picture to unequal slopes.
- Consequence of omission: the reader may memorize northeast as the answer,
  or believe a longer diagonal move establishes a steeper direction.
- Smallest repair: restore the projection comparison at this location, keeping
  the equal-distance condition and local-rate qualification explicit. No new
  diagram or beat is necessary.

Distinct code example, shipping helper explanation:

- Damaged: “This proves every possible behavior is identical.”
- Missing bridge: the retained language evidence covers declared threshold
  cases and pinned programs; editorial stages are not separate verified programs.
- Consequence: readers may infer a universal equivalence proof from a few cases.
- Smallest repair: say which threshold cases were checked and preserve the
  source pins; do not claim coverage of arbitrary changed programs.

Run `npm run test:explanation-review` for the retained good, damaged and
paraphrased examples. Its gradient helper checks this story's declared path,
evidence bindings, required beats and native-math presence. It does not parse
the truth of prose or validate arbitrary HTML. Existing gradient sequence tests
own stationary evidence and mathematical behavior; existing browser/stage-fit
checks own readable layout. The code caller uses its existing language owner.
Both circular reasoning and the code overclaim intentionally pass structural
checking: the examples above record the editorial finding separately. No new
runtime contract or mandatory review step is introduced.

## Starting prompts for humans and LLMs

**Explanation pass:** “Given this learner's question, known background and
verified subject matter, develop an explanation that makes the central result
follow. Introduce unfamiliar terms, preserve motivation, and flag assumed
knowledge. Do not fit a card yet. Suggest a sketch only when you can say which
inference it helps. End with a small transfer question and expected reasoning.”

**Translation pass:** “Preserve the working explanation's inferential bridges.
Map its units to the canonical domain source and existing visual capabilities.
For each visual, state its teaching job and what supports interpreting it.
Report missing capabilities or editorial gaps; do not silently remove reasoning
to satisfy the projection.”

Current worked application:
`../threads/2026-09-11-gradient-explanation-storyboard.md`.
