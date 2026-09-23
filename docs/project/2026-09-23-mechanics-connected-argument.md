# A force that changes motion without changing energy

User direction: replace the proposed additional fraction argument with one short,
meaningful mechanics argument using existing equation machinery. Approved in
conversation on September 23. This records the concrete bounded implementation;
it does not reopen completed or deferred loops.

Reader outcome: explain why a sideways net force changes momentum but gives zero
instantaneous kinetic-energy change, and distinguish that from braking. Assumed
background: vectors have magnitude and direction; elementary derivatives and
the product rule. Introduce the dot product's relevant meaning in the main text.
No novice comprehension evidence is available; human review selects whether the
argument and its inspections are useful.

Canonical artifact: `examples/physics/force-without-work.article.md`.
Host: `/experiments/mechanics-relations/force-without-work/`.
Projection: existing `compileMomentumEnergyPublication` and
`renderMomentumEnergyReader`; renderer: native KaTeX through the existing energy
and power derivation sessions. Semantic authority: unchanged physics-owned
momentum-energy and force-energy derivations, with the version-pinned momentum
concept. Article prose is editorial, not proof. The full mechanics reference
page remains the accepted control.

## Explanation and visual jobs

| Question | Bridge | Existing interactive job | Wrong inference to guard |
| --- | --- | --- | --- |
| What does energy retain from momentum? | Substitute velocity, scale the norm, cancel mass to get squared magnitude | Energy rail and its smaller steps keep the substituted quotient and surviving factors identifiable | Energy determines momentum direction |
| Which part of force changes energy? | Differentiate the magnitude expression; use the product rule and Newton's law | Power rail exposes the two equal derivative contributions and cancellation | Any nonzero force must add energy |
| What follows for a sideways push? | Dot product uses the force component along velocity; perpendicular means zero instantaneous power | Read the result, inspect its origin only when needed, then answer a changed-case prediction | A force perpendicular now stays perpendicular, or negative power means negative energy |

Observable acceptance: complete static argument with assumptions before use;
two existing rails; parent/child exact return; source-matching math; ordinary
links between the argument and prerequisites; no new buttons, diagrams or visual
treatments. Explanatory purpose precedes each rail. A short written answer
supports a prediction; it is not a scored assessment or learner-effectiveness test.

## Delivery and gate

1. `exemplar`: author the short Article, add its explicit host entry through the
   existing publication plugin, preserve provenance, run focused semantic/source
   and Chromium interactive/no-JS checks plus affected types/build. Standard risk:
   content drift, broken links, shared-host regression. Commit one reversible
   exemplar package, then stop at **HUMAN_CHECKPOINT** for explanation usefulness.
2. `review`: after acceptance, record the judgment and finalize this bounded
   experiment; only small requested editorial corrections are in scope. A new
   motif, independent argument or cross-family promotion needs new scope.

Preserve semantics, renderer, clock, fonts, rails, disclosure state and existing
hosts. Smallest rollback unit: new Article and its host/plugin registration plus
tests. No curriculum checkmarks. Track content work separately from engine work.
Keep this linked experiment on the existing relational-reader feature branch so
its accepted dependencies are retained; no merge or restart from older `dev`.

Ceiling: approximately two active hours, uncertain; reserve the last 20 minutes
for verification and handoff. Stop earlier for the exemplar review, completion,
user pause, or genuine scope/authority blockers. Do not build a generic publication
API, new solver, universal inference path, dashboard, graph or animation framework.
The previous fraction recommendation is superseded; fractions remain regression
fixtures. Broader recommendations and triggers remain in the September 22 plan.
