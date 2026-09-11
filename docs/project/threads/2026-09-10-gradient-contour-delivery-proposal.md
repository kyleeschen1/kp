# Gradient / contour intuition: delivery proposal

Status: approved by user with “go”; execution owned by run-contract.kp.gradient-contour-intuition-v1.
Mode: kp-delivery-loop interactive. The completed algebra run stays closed.

## Outcome

One editable, question-oriented Focus Card: “Which way is uphill, and why does
that direction cross the contours?” A reader can distinguish contour-following
from greatest local increase, predict the best unit direction, and recover the
smaller contour-tangent explanation independently. An author can change the
bounded field and point without engine edits after the primary is approved.

Begin with f(x,y)=x²+2y² at (1, 1/2). Its gradient (2,2) is not the radial
direction (1,1/2), avoiding the misleading circular-bowl shortcut. Compare unit
directions at the same point, not unequal displacements. Contour-following is
constant height; a straight tangent displacement has zero first-order change,
not necessarily zero finite change. Greatest increase means directional
derivative, not the highest endpoint for an arbitrary finite step. At zero
gradient, do not claim a unique greatest first-order direction.

## Existing authority and preservation

Reference host: /experiments/kinetic-figure/surface-contour/ on shared port 8000.
Reference artifact: score.calculus.surface-contour-focus-card.v1 and model.calculus.surface-contour.paraboloid.v1.
Model/score and cross-view entity correspondence:
src/tutorial/kinetic-figure-surface-contour/kinetic-figure-surface-contour-model.ts.
Rendering: its stage.ts owns semantic Graph3D scenes, WebGL projection and SVG
contour overlay through existing graph rendering owners. entry.ts hosts the shared
Focus Deck. src/math/expression.ts already supplies differentiation and compiled
gradients. The old exemplar is fixed to one paraboloid; it is not an existing
general-purpose gradient authoring framework.

Preserve the old route, scene rotation, level-set identity, theme, controls and
fallback behavior. Preserve tax, Bayes and algebra. The new card is opt-in on the
same server; rollback is its new source/host and bounded adapters, not a global
renderer or semantic rollback. No visible changes are made during this proposal.

## Packages and review dependency

Each row is one meaningful verified commit boundary, with implementation, tests
and evidence together. Theseus will own execution status after approval.

| ID | Beneficiary / intended change | Dependencies and risk | Verification |
| --- | --- | --- | --- |
| G1 | Learner: pin the question, native reference and first-order facts; author: select the smallest field/point source boundary. | First. Medium: prevent misleading finite-step claims. | Focused: existing surface-contour tests plus gradient, normalized-direction and zero-gradient cases. |
| G2 | Learner: one reversible exemplar comparing along-contour and across-contour motion, with a persistent point and coordinated height evidence. | G1. High visual risk. No broad reusable API promotion. | Standard: types, direct/reverse/interrupted seek, minimal phone/desktop and accessibility smoke through a stable visual npm command; preserve old exemplar. |
| G3 | User: review one working primary, with exact URL and specific pedagogical/visual questions. | G2. Required human gate before G4–G6. | Human: can the same point/contour be tracked; is uphill distinguished from tangent; are motion, readability and control clear? Record approved treatment or repair within this exemplar. |
| G4 | Author: apply a source-only variant with changed positive quadratic coefficients and an off-axis point; reject unsupported or nonfinite inputs. | G3 accepted. Medium: avoid a primary-specific solution. | Standard: derive notation, surface and gradient from one expression; real Apply, last-valid retention, source roundtrip, both callers through existing renderers. |
| G5 | Learner: recover one independent “Why is the tangent flat to first order?” explanation and return exactly; get a coherent reading and predict/reveal self-check. | G4. Medium: avoid equation-only assumptions. | Standard: stable references, exact return, source-revision coherence, accessible static evidence. Reuse existing projection owners; no animated export or general publication-platform expansion. |
| G6 | Both: verify and document delivered leverage, limits and costs. | G5. Medium integration risk. | Broad: full types/build, affected production budgets/closures, supported-browser cohort, full repository suite with clean exit required, Theseus validation. Record source-only versus engine work and visual acceptance; no learner-efficacy claim. |

G2 should show a contour-following move, contrast a tangent direction, then compare
unit directions using local height-change evidence. Introduce notation as a label
for observed structure rather than requiring a derivation before the visual.
Exact choreography is selected at G3, not canonized in advance. No new universal
attention or question schema is implied by this plan.

### Approved G3 attention repair

After the motivation/mechanism revision, the user reported that reading and
watching still compete on this unfamiliar topic, then approved the recommended
repair with “implement the rec”. Bound it to the diagonal-to-uphill comparison:
prepare a perceptual question at a stationary checkpoint, retain a short stable
cue during the user-started action, then hold evidence for interpretation.
Reuse the existing attention projector, semantic model, renderer and controls.
Preserve eight conceptual stops and unrestricted continuous inspection; do not
introduce four extra clicks per beat, a reading-time estimate, or catalogue-wide
attention enforcement. One reversible host/score treatment reaches G3 review
before promotion. This refines G3, not the package order or G4–G6 authority.

### Approved G3 attention-location repair

On 2026-09-11 the user reported that the clearer sequence still leaves them
searching between text and motion, and approved the next recommendation with
“implement rec”. Test one stable instruction area above the existing figure,
explicit before/watch/result language, and direct across/along annotations
established before the comparison moves. Keep prepared prose accessible and
stationary; make numerical evidence optional supporting detail rather than a
competing dashboard. The intended invariant is that readers can locate the
relevant evidence before it changes; comprehension still requires human review.

The gradient comparison, existing semantic IDs, attention projector, shared
clock/input and Graph3D/SVG owners remain canonical. The top narrative placement
applies consistently within this one card; new attention choreography remains
bounded to its diagonal-to-uphill comparison. Preserve all eight stops, direct
inspection, the original contour route and the prior WebGL program-lifetime
repair. Rollback is this local host/attention/overlay treatment plus its tests,
not any shared semantic or renderer change. No popups, narration, universal
attention schema or other-card promotion. G3 remains a human checkpoint before
G4–G6; this approval does not accept the earlier treatment or reorder the run.

### Approved G3 compact passage-to-stage handoff

The user accepted top placement as a major improvement to linear reading, then
approved bringing the passage closer to the stage with “implement the rec”.
Keep the boundary fixed, bottom-align the passage inside a tighter responsive
region, anchor the cue/action near its lower edge, and remove unnecessary stage
spacing. Reserve layout by viewport, never by the active paragraph or playhead.
Do not shrink fonts, clip required text, or move the camera/SVG geometry to make
the layout fit. Preserve native scrolling and selection with accessible overflow.

This is a gradient-only CSS/markup treatment, with browser assertions for the
handoff gap, fixed cue/action and stage/point positions through the comparison,
phone containment and existing input behavior. No new layout measurement loop,
semantic change, renderer seam or catalogue promotion is authorized. Rollback is
the local layout/markup and its tests. The top placement is accepted; remaining
spacing and attention judgment stays at G3 before G4–G6.

### Approved G3 shared focus-card typography

On 2026-09-11 the user approved the typography recommendation and explicitly
required automatic inheritance by future focus cards. Extend the existing
scaffold's presentation ownership: explanatory stage words share passage
typography, annotations use a small role-based screen-space scale, and native
KaTeX/code keep their own font and layout contracts. Use the gradient comparison
as the visual exemplar and a structurally different static scaffold caller to
verify inheritance, theme overrides and native math/code isolation. A shared
annotation helper must not accept arbitrary font/size overrides; renderer-local
placement remains separate from semantic authority and typography policy.

This explicitly permits the shared default/annotation seam before G3 acceptance,
not a catalogue-wide relayout or changes to existing mathematical motion. Keep
the current gradient model, attention, geometry, clock and controls. Required
checks include narrow-screen label readability/containment, stable playback
layout, user text enlargement, font inheritance and the existing exemplar
preservation checks. Rollback is the typography stylesheet/helper and gradient
annotation adapter, not the shared compositor. Exact aesthetic values remain
reviewable; G3 still gates G4–G6.

### Approved G3 explanation and endpoint-gesture repair

The user approved the discussion's recommendations with “I agree with all of
this. Implement”. Preserve the accepted compact top instruction area and shared
typography. In the same eight-stop primary, make equal horizontal length visible
from above, connect the across component to height on the local ramp, and explain
why the partial-derivative vector supplies the uphill direction. Do not imply
that component lengths add to one or confuse a directional derivative with a
finite step on the curved surface. Keep the existing math/attention/renderer
owners; rollback is the local explanation adapter and its tests.

Repair the shared input boundary: an owned horizontal wheel stream must remain
owned at either endpoint, including momentum. Preserve vertical scrolling, zoom,
controls and gestures outside the card. No page-wide history traps. The separately
reversible input repair needs event cancellation, immediate reversal and existing
multi-card input checks. Synthetic browser events cannot certify OS-level history
gestures; retain that explicit manual-check limitation. G3 still gates G4–G6.

### Approved G3 explanation-first reset

On 2026-09-11 the user reported that a conversational GPT explanation teaches
the concept more effectively and accepted the recommendation to establish the
explanation before further animation work: “i agree. implement”. The immediate
deliverable is a learner-facing draft and inferential storyboard, plus durable
authoring guidance. No live card or renderer changes are part of this pass.
The successful GPT response is missing; mark the draft provisional and compare
the actual reference when supplied rather than inventing its content.

The draft is not constrained to eight stops. The existing eight-stop card remains
unchanged until the explanatory structure is reviewed and translated. Preserve
accepted layout/type, native math, input repairs, the source model, renderer and
clock. The new editorial worksheet does not introduce a universal semantic type,
a prose-only rule or extra mandatory approval for ordinary supported variants.
Separate mathematical verification, presentation judgment and understanding.

Scope and preservation are in
`../decisions/2026-09-11-explanation-first-authoring.md`; the working draft and
storyboard are linked from the primary checkpoint packet. These artifacts carry
content, not a second execution plan. G3 stays the existing human checkpoint;
G4–G6 and the package order remain unchanged. Verify local references, existing
mathematical evidence and Theseus state; do not rerun browser/release matrices
for an unchanged runtime. Rollback is this editorial amendment and its guidance.

### Approved G3 translation of the explanation

The user approved the draft and storyboard with “approve. implement”. Translate
their reasoning through the existing primary, not a new renderer or clock.
The first-encounter sequence may exceed eight stops and reserve more reading
space on phones, preserving typography and the fixed top passage-stage handoff.
Static coordinate arithmetic is an explicit editorial choice; this does not
certify new algebraic or dot-product motion. Keep necessary bridges on the main
path, use named beat/evidence bindings for playback, and preserve reverse/direct
seek, native math, original reference and the shared endpoint-input repair.

Acceptance: readable motivation, introduced prerequisite meanings, gradient
before the maximum argument, projection before the guided turn, and contours
as a subsequent interpretation. Verify math, deterministic state, focused
preservation, types and the scoped exemplar; full release remains G6. Rollback
is this primary's story/score/host/adapter/layout and tests in one commit, not
the semantic model or shared infrastructure. G3 requires rendered human review
before G4–G6; draft approval alone does not complete it.

## Bounds and completion

Proposed active-work ceiling: six hours excluding human waiting, reserving the
last hour for verification/closeout. This is an uncertain ceiling, not a duration
target. Bound the first exemplar attempt to two hours before reassessing a missing
mechanism; report a concrete gap rather than starting a new infrastructure lane.
Stop sooner when done. If required release checks cannot finish within capacity,
leave the run resumable and report the uncompleted gates, never waive them.

Done: accepted primary, source-only second caller, one independently recoverable
sub-explanation, coherent reading/self-check, preserved reference and verified
release. No optional reserve work is needed for this interactive proposal.

Allowed: bounded model/adapters and durable repairs necessary for these callers,
existing owner reuse, and standing evidence-backed budget repairs. Stop for new
semantic families, a new renderer/clock, broader migration, unapproved aesthetic
promotion, safety/authority limits or scope expansion. No new server, agents,
external model calls, deployment or merge. Arbitrary fields, gradient descent,
Hessians, general proof automation, a universal authoring schema, and the later
cross-domain/calculus expansion remain deferred.

Approval starts G1–G2 and the G3 checkpoint; acceptance at G3 continues G4–G6
without routine reapproval. Create the matching Theseus target and outcome-sized
contract only after this proposal is approved.
