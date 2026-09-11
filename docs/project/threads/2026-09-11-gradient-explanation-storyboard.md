# Gradient: explanation-first storyboard

Status: explanatory structure approved; primary translation awaiting rendered G3 review.
Learner draft: `2026-09-11-gradient-explanation-draft.md`.
Scope: G3 in `2026-09-10-gradient-contour-delivery-proposal.md`.
Workflow: `../authoring/explanation-first-worksheet.md`.

## Audience and source

The reader understands position, height, signed arithmetic and a small move.
Do not assume partial derivatives, vectors, projections, contours or dot products
are already explanatory tools. Introduce their needed meanings on the main path.
The general dot-product/projection identity is an explicitly identified remaining
bridge: if its verbal explanation is insufficient, develop a sketch or smaller
explanation before claiming the gradient argument is understood.

Source of mathematical truth stays
`../../../src/tutorial/gradient-contour/gradient-contour-model.ts`:
\(f=x^2+2y^2\), \(p=(1,1/2)\), height 1.5, gradient (2,2), maximum rate \(\sqrt8\).
No new field or source-only renderer variant is being smuggled into this draft.
The previous discussion's temperature example with slopes (3,1) was illustrative,
not a description of the existing figure. This candidate retains the actual
primary so that its mathematics and eventual visual evidence agree.

The successful GPT response is not available. Until it is supplied, the proposed
differences are hypotheses, not a line-by-line comparison or live-model trial.

## Questions and inferential bridges

These rows are explanatory units, not seven committed stops. One row may need
several passages, no animation, or a recoverable sub-explanation.

| Reader's question | What must already make sense | New inference and its reason | Candidate evidence and visual job | Wrong inference to prevent |
| --- | --- | --- | --- | --- |
| Why isn't my current height enough? | Position and height | Height says where you are; a rate of change helps choose a move | Brief hillside context; a static point is sufficient | Gradient is another height measurement |
| What are we measuring? | Small moves and signed rates, introduced here | Two coordinate slopes measure local response in independent directions | Label one coordinate move at a time, if needed; do not start a camera tour | Partial derivatives are already familiar |
| How do those rates help with other moves? | Meaning of each coordinate contribution | On the local linear approximation the contributions add; collecting slopes gives the gradient | Small worked calculation and, if useful, a local-ramp sketch | Adding two components means their lengths add; linear rule is exact on the curved surface |
| Why is the drawn arrow the best direction? | Local change rule and equal distance | Level component contributes nothing; the uphill projection is bounded by the fixed arrow length | The existing unit-direction/across/along/reach comparison has a precise job here; establish projection before moving | Longer steps are a fair comparison; “across adds rise” by itself proves a maximum |
| Why does this generalize, and what does length mean? | Coordinate contributions and projection | The dot product expresses both the change rule and signed projection; unit-direction maximum is gradient magnitude | Link formula to the already-understood comparison; no decorative equation animation | Special symmetric diagonal is the universal answer; gradient arrow is a commanded step |
| How can I read this on a contour map? | Gradient's local meaning; contour defined here | Constant height gives zero derivative along the tangent, hence perpendicularity | Reuse the preserved point/contour/tangent correspondence after its purpose is known | A finite straight tangent path stays on a curved contour |
| Can I use this in a changed case? | Sign and directional interpretation | Negative x slope and positive y slope imply northwest; magnitude controls exact angle | Optional prediction/teach-back, without simultaneous moving evidence | Remembering a northeast arrow equals understanding |

## Translation boundary

The current host remains `/experiments/kinetic-figure/gradient-contour/` on port
8000. Its existing surface-contour Graph3D/WebGL stage, gradient SVG adapter,
semantic model, attention projector, Focus Deck and timeline are preserved.
Existing semantic IDs include `gradient.origin`, `gradient.unit-direction`,
`gradient.local-rise`, `gradient.across-component`, `gradient.along-component`,
`gradient.equal-horizontal-reach` and `gradient.tangent`.

This storyboard does not establish a new supported animation for coordinate
contributions or general dot-product reasoning. Before implementation, resolve
those capabilities against the actual domain owners; unsupported lowering must
remain a typed repair gap. Prose/static evidence may be selected explicitly for
pedagogy, not silently substituted for a promised animation.

Keep the causal and explanatory connections when translating. The final formula
must not be introduced after it was already needed to understand a move. Do not
fit this draft back into eight slots by deleting its connecting sentences.
Preserving accepted layout/type does not force a first-encounter explanation and
a compact retrieval card to have identical length or packaging.

## Review and comparison

Review the learner draft first. Ask where a term or conclusion first stops
following, not whether each sentence sounds fluent. The two small checks at its
end diagnose transfer of sign and projection reasoning; they are not an exam or
evidence from an independent learner trial.

When the GPT reference arrives, compare its motivating question, assumed
knowledge, examples, connecting reasons, useful repetition and ordering. Do not
compare just word count or visual attractiveness. Preserve its original text as
provenance and revise the candidate where the reference supplies a better bridge.

After explanatory acceptance, translate the smallest representative passage
through the existing pipeline and use G3's visual checkpoint. Combine reviews
when practical; this does not create a recurring extra approval for every card.
Source-only G4 reuse and G5/G6 integration remain gated. The approved translation
uses 19 learner-paced passages in `gradient-contour-story.ts`, including static
native math for coordinate contributions and generalization. Named evidence
selections reuse the existing local ramp, projection turn and contour orbit;
there is no new coordinate-contribution or dot-product animation capability.
The model, canonical stage, overlay and clock remain authoritative. Required
bridges stay on the main path; only supplemental calculation and answer checks
are foldouts. No pedagogical-success claim is made.
