# Force–energy graph correspondence: bounded successor proposal

Status: approved; executable control is `run-contract.kp.force-energy-graph-v1`.
Queue: reader.l6 in `../reviews/2026-09-15-next-step-review.md`.

## Reader outcome

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
static release is now 1.0.1 with a checked updated import pin; no archived immutable
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
