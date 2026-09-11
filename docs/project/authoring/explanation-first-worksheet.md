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
