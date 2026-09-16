# Force–energy graph correspondence: bounded successor proposal

Status: proposed after the accepted calculus checkpoint; not yet an executable run.
Queue: reader.l6 in `../reviews/2026-09-15-next-step-review.md`.

## Reader outcome

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
second-caller evidence. Theseus will own execution status once scope is approved.
