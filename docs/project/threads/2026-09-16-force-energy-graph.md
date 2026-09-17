# Force–energy graph correspondence: bounded successor proposal

Status: approved; executable control is `run-contract.kp.force-energy-graph-v1`.
Queue: reader.l6 in `../reviews/2026-09-15-next-step-review.md`.

## Reader outcome

Font-resize repair: the user reported that both extremes still failed and asked
for resizing robustness. A browser reproduction at unchanged reader width found
the equation handle about 59.6px away from its intended row interpolation after
enlarging text. The reader had invalidated native geometry only on width changes.
It now observes stationary equation ink, equation slots and prose layout, rebuilds
native scenes when their metrics or loaded fonts change, and remeasures row
positions after prose reflow. Rebuilding retains the semantic position. Geometry
changes retire an active grip and its edge scrolling; the next drag uses fresh
measurements. The graph likewise cancels its grip when text reflows its track.
Observers and queued work are disposed with their reader. Moving compositor
paint is excluded, so ordinary cross-step dragging does not rebuild scenes.

Regression coverage changes root font size through 24px, 16px and 28px while
holding reader width fixed; resizes expanded equations during a captured drag;
resizes long graph prose during edge scrolling; and reaches both equation ends
with one uninterrupted drag at 24px. Tests also preserve native scene reuse
across normal expanded-step crossings. An initial post-repair assertion compared
a floating-point pointer position to the literal string `0.4`; it now compares
the actual pre-resize position. Architecture verification found the DOM helper
name `require` was being read as a module import; renaming it `binding` removes
the ambiguity without weakening the checker. This is a geometry/lifecycle repair
within the existing exemplar, not a new visual treatment or code rollout.
Final verification: 14 focused Chromium/Firefox cases pass, as do the expanded
cross-step preservation check, final graph smoke, full types, architecture gates,
two edge-scroll unit laws and production build (existing global chunk warnings).
This does not claim real-device touch or full cross-browser certification.

Upper-padding follow-up: the user requested more room above equations. The
equation caller reserves an additional 48px above its opening bound, giving at
least 96px top clearance with the shared margin. The bottom remains unchanged.
The endpoint browser regression now checks the derivation's top reaches 96px
while progress stays at zero; the focused rerun passes.

Endpoint clipping repair: user reported clipped equations and graph explanations
at drag extremes. The violated invariant was bounding page travel by handle
centers rather than readable content. Both callers now supply measured content
bounds to the shared edge-scroll controller. It may scroll past the handle's
endpoint to expose the complete first/last content with 48px viewport clearance;
semantic progress remains clamped. Unit checks cover this separation, and browser
checks verify both equation endpoints and the expanded graph's final explanation.
Release/cancel behavior is preserved. The initial new equation check timed out
waiting for normal End playback; reduced-motion setup isolates endpoint exposure
and the focused rerun passes. This corrects clipping within the existing treatment.

Latest acceptance and approved extension: the user likes the text-coordinated
graph. Extend it to long text with bounded sticky evidence, and add edge
scrolling during active graph **and equation** drags. Ordinary scrolling must
leave inspection progress unchanged. This explicitly extends the existing
contract to the shared equation-reader gesture; code motion is preserved.

The graph's three optional deeper explanations pressure cumulative height while
preserving the accepted brief clauses. On desktop its figure sticks 1rem from
the viewport top only when it fits; the containing move bounds its travel.
Phone remains stacked/provisional. Expanding text ends a current drag rather
than remapping it through a layout change.

`src/reader/runtime/inspection-edge-scroll.ts` extends an owned gesture, never
owns semantic progress. Both callers resample their existing document-relative
mapping after scroll. A quadratic edge-speed ramp caps at 540 CSS px/s; these
are provisional gesture aesthetics. Bounds stop scrolling at the first/last
handle position. Release, cancel, capture loss, blur, hidden page, navigation,
and disposal stop work; graph closure and equation reconstruction also cancel.
There is no background sampling outside an active edge drag.

Discovery repairs: an initial RAF timestamp can predate pointerdown; reschedule
that zero-time sample and retain fractional pixels so gentle speeds do not
stall. The browser chose the moving native thumb as a scroll anchor, producing
scroll/progress feedback; exclude the moving gutter from anchoring. Captured
pointer input has one document-relative owner, while the native range retains
keyboard and accessibility behavior. Tests reproduce long-track stationary
edge holds, reverse, release/cancel, endpoint stopping, and ordinary-scroll
independence. Equation handles retain pixel coupling while the page moves.

Verification: six focused unit tests, full typecheck, architecture gates and
final build pass. Initial gesture tests exposed the above repairs; later six-test
browser run passed five with one stale no-JS summary selector failure after
adding nested details. Scoped selector repaired; final three-test edge/no-JS
rerun passes. Existing graph reading, numeric stability and expanded equation
cross-boundary tests passed in that broader run. Screenshot inspected; no claim
of real-device touch or full cross-browser certification. Measured JS/CSS gzip:
44,420 initial / 160,956 activated, each +1,285; HTML 45,711 gzip, +872.

Review on desktop: open `#momentum-move`, expand the three deeper explanations,
drag downward and hold near the viewport bottom, then reverse near the top.
Check the graph stays nearby and leaves at the move boundary. Repeat with the
equation lens at `#energy-from-momentum`. Rollback unit: shared edge-scroll
controller, its two reader integrations, graph sticky/depth projection and tests.
Stop for gesture/sticky review; no shared visual motif or code rollout.

## Prior accepted text-coordination exemplar

Current approved experiment: **text coordination**, after acceptance of the
momentum-space storyboard. The user clarified that KP is a text-, salience-,
relationship- and move-oriented tool for thought, not principally a clearer
physics book or a Brilliant-style manipulation exercise. The latest request
authorizes trying an inference attached to prose. The graph is the first
reversible exemplar; code is a diagnosed pressure caller, not a rollout.

The local `#momentum-move` passage retains three argument clauses: direction
changes; magnitude stays fixed; therefore energy stays fixed. A margin handle
advances one deterministic attention projection: orientation, physical turn,
inspection of the preserved magnitude, then its energy consequence. All text
remains readable, with a compact graph nearby and return to the same reading
location. Ordinary document scrolling does not advance the move. Native details
retain the argument without JavaScript; print shows the full settled reading.

Canonical source: `examples/physics/momentum-energy.article.md`; host:
`/experiments/mechanics-relations/`; native SVG and KaTeX; physics authority:
`domains/physics/momentum-energy.ts`. The existing attention projector,
cross-view transmission and reader timeline clock own narrative progression.
No replacement salience store or solver. Physical time advances only in act.

Code diagnosis: `src/tutorial/code-reasoning/centroid-inspection.ts` updates a
single narration element with `textContent` from the current beat. Its accepted
token motion is beautiful to the user, but the narration reports rather than
retains the argument. Preserve that motion and test text coordination here
before proposing a code adaptation. The general thinking-tool ambition remains
unproven by this single graph treatment.

Checkpoint: does attention follow an intelligible inference through permanent
text and evidence, or still feel like synchronized highlighting? Inspect phone
proximity, forward/reverse, and return. Rollback unit: the local momentum-move
source passage, four projection/reader/style modules and focused tests. Preserve
accepted storyboard, physics, algebra, code and stable readouts. No promotion.
Review: `http://localhost:8000/experiments/mechanics-relations/#momentum-move`.

Discovery evidence: six focused semantic/static/readout tests pass; three
Chromium discovery/preservation tests pass, followed by a final focused rerun
covering native pointer input, keyboard, forward/reverse, stable prose geometry,
print restoration and return. No-JS inspection retains all three clauses.
Full typecheck and final production build pass (existing chunk warnings).
Visual inspection found and repaired circle-focus CSS specificity; a realized
stroke assertion protects the attention handoff. Phone stacks the graph below
the argument: readable, but joint attention remains provisional.

`npm run measure:mechanics-relations-closure` measures 43,135 initial and 159,671
activated JS/CSS gzip bytes; HTML 44,839 gzip bytes. Those are current totals,
not isolated marginal costs. Four new local modules; no new dependency or idle
sampling loop. No learning-effect or cross-medium generalization claim.

## Accepted static storyboard and earlier hypotheses

Latest approved pivot (2026-09-16): the user found the correspondence interfaces
unhelpful and approved the recommended momentum-space **still-frame storyboard**
before further interaction. This supersedes the selection-interface hypothesis
below. The new local passage is `#momentum-space` in the canonical momentum-energy
Article, hosted at `/experiments/mechanics-relations/`, with native SVG/KaTeX
and samples from `domains/physics/momentum-energy.ts` as authority.

Teaching job: make energy depend visibly on distance from zero momentum; compare
outward growth with turning on an equal-energy circle. Prerequisites are vector
length and the previously derived fixed-mass energy formula. Explicitly introduce
momentum space rather than assuming readers recognize a change of coordinates.
Force is the momentum tip's instantaneous velocity, not a finite tangent step.
The inward-force prediction checks transfer of the geometry to negative power.

Observable checkpoint: can the reader explain constant energy during turning
from the circles before relying on the dot-product formula? Explanation stays
above each sketch, native text stays readable, plots stay compact, and values
retain fixed precision. This candidate has no new controls or runtime animation;
the distinctive value of a future KP inspection remains an unproven hypothesis.
Inspiration: 3Blue1Brown's geometric dot-product and power-rule explanations,
not a claim to reproduce a specific Sanderson design.

Rollback unit: the momentum-space Article passages, local static projection/CSS,
and focused tests. Preserve earlier interfaces as closed comparison material,
accepted calculus/code, existing physics fixtures and readout safeguards. No
shared abstraction, second caller, arbitrary-force model or promotion is approved.
Review: `http://localhost:8000/experiments/mechanics-relations/#momentum-space`.

## Earlier correspondence candidate (provenance)

Latest approved refinement: the compact treatment is acceptable, but the user
does not yet see pedagogical value or a distinctive KP contribution. Do not
equate the passing simulation checks with a successful learning experience.
Build one local, recoverable inspection at the power identity, compared with a
complete static explanation. Instructional text goes above the evidence it
guides; labels/readouts remain adjacent to their referents. This principle is
not restricted to focus cards and does not authorize a catalogue migration.

Learner question: why does only force along velocity affect kinetic energy?
Assumed background: the already-derived power identity and vector direction.
Introduce the signed component along motion, connect it to the dot product,
then to the sign/rate of energy change. Static baseline: parallel/perpendicular
checked samples plus the complete argument. Meaningful inspection: select a
term in that relationship and recover its geometric/numerical meaning in both
cases without leaving the argument. Motion is not compulsory and is not the
learning claim. Transfer: explain why force opposite velocity gives negative
power; this is a prose question, not a new supported force fixture.

Use existing physical samples, SVG projection, native KaTeX, semantic focus and
cross-view correspondence owners. Preserve accepted algebra/code and the compact
stable-readout safeguards. The reversible unit is this local Article passage,
its static/interactive projection and focused checks. Existing time simulations
remain supporting evidence, not the centerpiece. Stop for one comparison review:
does selection make a connection easier to understand than the static reading?
No new solver, animated algebra motif, clock, renderer or shared API is licensed.
Use focused semantic, static, direct-selection/reversal and keyboard smoke checks
before review; retain existing numeric-layout regression. Final size envelopes,
second-caller pressure and a broader certification matrix follow acceptance.

Medium choice: the learner has just inspected the calculus but may still confuse
momentum change with energy change. Static perpendicular/parallel sketches plus
the power identity are the baseline. Scrubbing earns its place by showing that
perpendicularity persists while both vectors rotate: the particle moves and its
momentum changes, yet its energy does not. The straight fixture contrasts that
invariant with increasing power. No new card format is introduced. Prose supplies
the meaning of force's component along velocity and the special rest case; the
graph does not prove the law. Transfer question: at an instant when force is
opposite velocity, does kinetic energy increase or decrease? The dot product is
negative, so it decreases; this is a prose check, not a newly supported fixture.
Costs include decoding separate vector scales and the nearby numerical reading;
human review must judge whether that connection reduces rather than adds effort.

Make the newly derived relation `dK/dt = v · F` inspectable in the existing
straight-push and circular-turn fixtures. The point is not another widget:
show why force can change momentum without changing kinetic energy. Keep the
static argument sufficient; motion links the vector geometry to the relation.

Canonical Article: `examples/physics/momentum-energy.article.md` on
`/experiments/mechanics-relations/`, shared port 8000. Physics-owned checked
momentum/energy fixtures remain semantic authority. Reuse
`src/tutorial/mechanics-relations/momentum-energy-stage.ts` and its existing
Graph2D runtime lifecycle; native KaTeX remains the separate equation renderer.

## One package: graph.correspondence

First inspect the existing source/frame and stage owners. Extend the existing
graph presentation only as needed to associate velocity, force, their dot
product and energy change at the same physical instant. Use the circular turn
as the representative: vectors change direction while the dot product and
energy rate remain zero. Contrast with the already supported straight push,
including zero instantaneous power at its initial rest state despite nonzero
force. Display units and assumptions; avoid suggesting every force has zero work
merely because it is perpendicular at one instant.

Keep a stable coordinate frame and one local reversible physical-time inspection
per existing fixture, with persistent prose and symbolic context. Do not duplicate
large graphs as equation endpoints or introduce a second timeline. Prefer existing
source/frame bindings over new framework abstractions. Stop at one combined visual
checkpoint before promotion or a new repertoire expansion.

Acceptance: values and arrows come from the same checked physical sample;
reversal/seek restores that sample; static/no-JS/print explains the distinction;
ordinary scrolling does not advance time; unchanged calculus, scalar and code
exemplars retain their controls and accepted motion. The user judges whether the
correspondence clarifies the dot product, not merely whether the controls work.

## Bounds and evidence

Proposed ceiling: two active hours with 30 minutes reserved for verification and
closeout. One reversible exemplar commit plus evidence. Retain the documented
experiment branch. Focused physics laws and authoring checks, affected types and
one scoped canonical browser smoke first; existing reader preservation before
handoff. Reuse `npm run visual:mechanics-relations`. Report source-only reuse versus
engine intervention honestly. No paid services, agents, merge/push or deployment.

Preserve all physical assumptions and existing motion owners. No arbitrary force
solver, new graph renderer, new algebra motif, global attention store, potential
energy/curriculum expansion, phone promotion or catalogue rollout. Stop on a
missing semantic owner, repeated failed repairs, visual checkpoint, or ceiling;
do not substitute an unlicensed animation. Promotion needs its own approved
second-caller evidence. Theseus owns execution status.

## Review packet

### Current comparison: static meaning versus term inspection

Open <http://localhost:8000/experiments/mechanics-relations/#power-correspondence>.
The same disclosure is linked immediately after the power identity in the
calculus passage. First read **Read together**, then choose **Inspect connections**
and select the speed, signed-force-component and energy-rate terms. Compare the
parallel and perpendicular samples. Explanatory text is above the sketches;
numeric substitutions remain adjacent. **Return to the argument** restores focus
and reading position to the source link when entered from it.

The samples are fixed checked physical instants. This interaction adds semantic
selection, not time motion: the existing reader-focus service and cross-view
correspondence map resolve native KaTeX, source prose and SVG/numeric evidence
together. An energy amount bar is deliberately absent from this rate inspection.
No physical equations, solver, compositor, animation clock or runtime store was
added. The original time simulations remain available as supporting examples;
their explanatory text now precedes their figures too.

This requires bounded reader-projection work, not source-only authoring: one
local semantic map, publication adapter, focus adapter and stylesheet (223 lines
total) plus the Article passage. The original compact plots now have accepted
local size ceilings in the existing browser regression. The new comparison's
size, outlines and selected-reading arrangement are still provisional.
Focused evidence: 38 unit tests, eight Chromium discovery/preservation checks,
and a final three-check rerun covering print restoration and the accepted size
envelope. Full types/build and final statuses are recorded on the contract.
Measured initial JS/CSS is 41,559 gzip bytes (+3,040), activated total 158,095
(+3,040), and HTML 41,735 (+2,665) relative to the compact-readout commit.
These are transferred asset measurements, not CPU/learning measurements; fonts,
images and HTTP overhead are excluded. No perpetual animation or layout sampling
is added. The full aesthetic/browser promotion matrix remains deferred.

Judge whether selecting an unfamiliar term makes the relationship easier to
recover than the static reading, and whether the extra controls earn their space.
Use the opposing-force transfer question to check the sign reasoning. This is
an experiment, not a claim that highlighting improves learning. The reusable
readout safeguards are retained; new selection styling remains unpromoted.

### Approved checkpoint refinement: stable, compact figures

The user approved fixed-precision, bounded numeric slots and stationary labels,
units, explanations and controls during playback. Implement this in the existing
physics presentation boundary, shared by initial HTML and live paint. Reserve
signs and digit growth, normalize rounded negative zero, reject nonfinite or
out-of-range values, and exercise both fixtures plus formatting edge cases.
CSS must size explanation slots from their actual supported variants at the
current width; viewport/text-size changes may reflow, time changes must not.

Reduce plot slack without reducing inherited typography or control targets.
The compact candidate requires human review before its size becomes an accepted
regression envelope. Browser checks enforce stationary surroundings, no clipping,
and native endpoints now; a different numerical caller and shared API promotion
remain outside this refinement. The rollback unit is figure presentation and
its focused tests, preserving Article semantics, physics, clocks and equation
motion. Continue on the documented experiment branch. The existing contract
owns the reopened graph.correspondence slice and visual gate. Verification:
focused numeric/physics tests, full types and the scoped Chromium review command;
no full aesthetic certification matrix before approval.

The implementation follows [stable simulation readouts](../principles/stable-simulation-readouts.md).
The candidate caps plot width at 24rem (previously 30rem) and crops fixed vertical
bounds to each complete fixture, including mass-dependent turning arrow extents.
At 16px root size the desktop plots are approximately 384 × 101px (straight)
and 384 × 165px (unit-mass turn), previously 480 × 286px. These dimensions are
computed from CSS/SVG bounds, not accepted perceptual minima. Explanations use
overlapping CSS grid cells so actual text wrapping reserves space without runtime
measurement. Unknown readout IDs, invalid values and range overflow fail at the
presentation boundary. No new renderer, clock or dependency is added.

Review the same two figures: scrub across rest and back, watch stationary labels,
units, buttons and following prose, then judge whether the smaller arrows and
right-angle marker remain clear. Two decimals are retained throughout. At rest,
the projected force component reads “—” because velocity has no direction; the
explanation and zero power remain explicit. The final size envelope and shared
promotion remain pending human review and a different caller respectively.

Refinement verification: 44 focused tests pass, full repository types pass, and
the final production build passes with its existing global chunk warnings.
The new numeric/geometry suite covers supported masses, fixed precision,
rounded digit growth and negative zero. Initial failures included expected
import-pin drift, an incorrect lock export corrected before final verification,
a stopped server, and a test parsing CSS `px` widths with `Number` instead of
`parseFloat`. A server restart during the earlier full browser run interrupted
static image loading; retain that failed run and require a clean rerun.
The SVG callback also needed an actual `SVGSVGElement` guard for type safety.
Theseus records the final browser result. Measured production JS/CSS closure is
38,519 gzip bytes initially and 155,055 activated (both +581); HTML is 39,070
gzip bytes (+340). Fonts, images, HTTP and runtime CPU are excluded. The added
runtime work is bounded numeric-leaf formatting/paint and explanation visibility;
CSS owns wrapping and reservation, with no per-frame geometry measurement.

Open <http://localhost:8000/experiments/mechanics-relations/> and inspect the
**Inspect a straight push** and **Inspect a turn** figures near the end. In the
turn, scrub while following the right-angle marker: the arrow directions change,
but the force component along motion and instantaneous power remain zero. In the
straight push, compare the changing speed-times-force reading with kinetic energy.
Reset to rest to inspect the explicitly directionless zero-velocity case.

Judge whether the persistent relation and nearby numerical reading clarify why
turning momentum need not change energy, and whether the additional text competes
with the figure. Desktop is the main checkpoint; narrow-layout preservation is
checked without promoting the phone experience. The same explanation and marker
exist in static output; this is not an interaction-only argument.

This required bounded engine intervention: a physics-owned rest/moving projection,
marker geometry and power labels in the existing Graph2D adapter, and shared
initial/live wording. No new renderer, clock, global salience store, dependency or
solver. The original source still owns physical facts. The internal fixture's
static release was 1.0.1 (the compact refinement uses 1.0.2); no archived immutable
edition was rewritten. Existing calculus and scalar animation code is untouched.

Verification found a genuine input-boundary defect: native range serialization
can round the irrational turn duration above its exact maximum. Clamp normalized
slider input before seeking the clock; do not weaken physical-time validation.
The browser regression now reaches the exact final state, rewinds to the held
sample, and verifies scrolling does not advance time. Earlier smoke failures also
included a stale dev-server compiler, missing lazy activation in the new test,
and an overprecise string comparison of a serialized floating-point value.
Final results live on the run contract; initial failures are not erased.

Resume: `theseus work context run-contract.kp.force-energy-graph-v1 --mode brief`.
Stop at the visual checkpoint; neither successful tests nor the accepted calculus
loop authorize catalogue promotion or another repertoire loop.
