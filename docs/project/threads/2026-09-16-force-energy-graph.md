# Force–energy graph correspondence: bounded successor proposal

Status: approved; executable control is `run-contract.kp.force-energy-graph-v1`.
Queue: reader.l6 in `../reviews/2026-09-15-next-step-review.md`.

## Reader outcome

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
