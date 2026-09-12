# Classical mechanics from zero: a question-led learning map

Status: initial curriculum outline, approved to start; not an implemented course.
Learner: assume no remembered mechanics. Retain strong single-variable calculus;
introduce physical meanings, units, vectors and diagrams without assuming them.
No deadlines, grades or required pace. External materials remain welcome.
Direction: `../decisions/2026-09-11-applied-mathematics-mechanics-priority.md`.

## Learning contract

The purpose is sharper intuition for applied mathematics and modelling. We ask
what is represented, what is assumed, what follows mathematically, what can be
observed, and where the model fails. Mathematics is both integrated here and
independently recoverable; applications link to concepts, not copied private
versions of them. No new concept ontology or runtime is implied by this map.

Each investigation can use conversation, ordinary reading, sketches, calculations,
experiments and KP. Select an animation only for a specific explanatory job.
Preserve the first point of confusion and the explanation that repaired it.
Fresh predictions and later reconstruction inform learning without becoming exams.

## Initial route

| ID | Physical question | Meanings established here | Mathematical connection | A possible independent prediction |
| --- | --- | --- | --- | --- |
| M00 | What makes a mathematical model useful? | System, environment, observable, idealisation, assumption and prediction; units and dimensions | Variables, functions, dimensional consistency, scaling | Which neglected effect could change this prediction? |
| M01 | How can we describe where something is? | Reference object, origin, axis, position, displacement versus distance; clock and elapsed time | Signed coordinates, vectors introduced geometrically | Does changing the origin change a displacement? |
| M02 | What does a motion graph actually say? | Trajectory versus position-time graph; average versus instantaneous velocity; speed versus velocity | Derivative as local rate, integral as accumulated displacement | Can a negative velocity coexist with increasing speed? |
| M03 | What changes when velocity changes? | Acceleration, including change of direction; no force prerequisite | Vector-valued functions and derivatives | Can speed remain constant while acceleration is nonzero? |
| M04 | What do forces explain? | Inertial frame, mass, net force, Newton's laws; interaction pairs act on different bodies | Vector sums, second-order differential equation, initial conditions | Can a moving body have zero net force? |
| M05 | How do we turn a situation into equations? | Choose a system; construct a free-body diagram; weight, normal force, tension; explicit friction assumptions | Components, constraints and coupled equations | Is the normal force always equal to weight? |
| M06 | What can simple trajectories teach us about approximation? | Projectile model, uniform gravity and neglected drag; circular motion and radial acceleration | Parametric motion, scaling and numerical approximation | Which projectile predictions change if drag matters? |
| M07 | How can motion be explained without solving its whole path? | Work, kinetic energy, power; conservative force and potential introduced together | Dot product, line integral, gradient; signs and units | Why can a force change direction without doing work? |
| M08 | What survives interactions between bodies? | Momentum, impulse, system boundary; conservation and external effects | Integrating rates, centre of mass, balances | When is momentum conserved for the chosen system? |
| M09 | What does a pendulum reveal when we look again? | Constraint forces, energy exchange, turning points and small-angle limits | Nonlinear ODE, linearisation, phase portrait | Why does the small-angle model fail for large swings? |
| M10 | What changes when an object can rotate? | Rigid-body idealisation, torque, moment of inertia, angular momentum | Cross product, distributed sums/integrals | Why does mass farther from the axis matter more? |
| M11 | How can we understand a family of motions? | Equilibrium, stability, oscillation, damping and driving | Differential equations, local approximation, state space | Does zero velocity imply equilibrium? |
| M12 | How can the same system be described more economically? | Degrees of freedom, generalised coordinates; later Lagrangian/Hamiltonian viewpoints | Constraints, partial derivatives, variational reasoning | Which variables describe independent motion? |

The route is revisable, not a demand to build thirteen animations. M00–M05 form
the initial learning spine; circular acceleration is an early visual candidate
only after position, velocity and acceleration have meaning. A pendulum can
appear informally earlier and return at M09 with its mathematical model.

## Independently reusable mathematics map

| Mathematical unit candidate | Mechanics callers | Independence boundary |
| --- | --- | --- |
| Signed change and rate | M01–M03 | Define quantities and coordinate choices, not presumed physical laws |
| Vectors, projections and dot product | M01, M04–M07 | Geometric meaning before force/work interpretation |
| State, derivative and initial-value model | M04, M09, M11 | A mathematical evolution rule does not establish empirical validity |
| Gradient and directional change | M07 | Existing gradient material remains standalone; force needs the additional conservative-potential relationship |
| Local approximation and linearisation | M06, M09, M11 | State the point/regime and error or limitation; do not imply global equivalence |
| Accumulation and integration over regions | M07, M08, M10 | Distinguish density, measure, units and total |
| Linear systems and characteristic modes | Later coupled oscillators | Candidate bridge to data science/graphs; distinct operators retain distinct meaning |

Connections should explicitly state correspondence, assumptions and limits.
For example, force from potential and gradient descent share a negative-gradient
relationship but inertial dynamics does not generally follow a descent path.
Probability/statistics and optimisation remain part of the long-term backbone;
do not insert them into mechanics merely to cover all five subjects immediately.

## First investigation brief: M00–M01

Begin with an object moving along a tabletop. Ask what we would record to describe
its motion. Choose a reference mark, a signed axis, a length unit and timestamps.
Distinguish the actual object from its point-particle representation. A table of
position versus time is evidence, not yet a force law. Compare two observers
choosing different origins; identify what changed in the descriptions and what
did not. Then distinguish net displacement from total distance along the path.

Known mathematics: ordinary arithmetic, functions and calculus. Newly introduced
physics: operational measurement, reference choice and modelling assumptions.
No mechanics animation is implemented by this outline. A static sketch and
small measurement table may be sufficient for the first encounter.

Optional prompts: return an object to its start; compare distance and displacement.
Change the coordinate origin without moving it; explain why its coordinate
changes. Ask which features of a real object a point model cannot predict.
These are invitations to explain, not graded milestones.

## Authoring and repair requirements

Keep shared mathematical truth separate from context-specific motivation. Use
existing canonical renderers, playback and focus-card scaffold; no copied card
styles. General changes must reach live consumers through shared ownership, and
static artifacts through explicit regeneration. Preserve immutable editions.
Architectural assessment and targeted cleanup precede new mechanics runtime
implementation; the current gradient loop is completed first.

Implementation status belongs to Theseus once a bounded mechanics delivery is
approved, not a duplicate task table here. This document owns the learning map.
