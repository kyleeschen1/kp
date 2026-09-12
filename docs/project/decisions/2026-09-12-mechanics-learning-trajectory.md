# Mechanics: questions before isolated invariants

Status: accepted by the user, “i like this traectory. record it and then go”.

Begin with **How do we describe motion?**, closely connected to **What does a
motion graph show?** Changing the origin is a supporting micro-intuition, not
the opening lesson's whole purpose. A convenient integration test is not enough
reason to make something a standalone learning unit.

The learner assumes no remembered mechanics but has strong single-variable
calculus. Recurring physical situations motivate representations, predictions,
assumptions and limits. Lessons may contain prose, calculations, sketches and
short animations; this is not a commitment to one animation per lesson.

## Accepted initial trajectory

| Lesson | Driving question | Mathematical connection |
| --- | --- | --- |
| 1. Describing motion | What must we record to tell someone how an object moved? | Point model, coordinates, units, time, signed change; position versus displacement versus distance |
| 2. Reading motion graphs | How can a graph tell us whether something is moving? | Graph versus physical path; value versus slope; secants and velocity |
| 3. Acceleration | What changes when motion changes? | Derivative of velocity; direction versus magnitude; negative acceleration need not mean slowing |
| 4. Reconstructing motion | Can changes in velocity determine the trip? | Accumulation, integration, initial conditions and differential equations |
| 5. Force | Does motion require a continuing force? | Inertial frames, mass, net force and acceleration; law versus definition |
| 6. Building equations | Which forces belong in the model? | System boundaries, free-body diagrams, components and constraints |
| 7. Projectiles | Why can one throw become two simpler problems? | Parametric motion, independent components sharing time; uniform gravity/no drag assumptions |
| 8. Circular motion | How can speed stay constant while velocity changes? | Vector differences, derivatives and curvature |
| 9. Work and kinetic energy | Can we find speed without solving the whole journey? | Dot product, line integral, derivation of work–energy |
| 10. Potential energy | When can a force field become a landscape? | Conservative forces, gradient and directional derivative; force is not velocity |
| 11. Momentum | What remains predictable in an interaction? | External impulse, conservation, system boundaries and centre of mass |
| 12. Pendulum synthesis | How can several descriptions explain the same motion? | Constraints, energy, nonlinear ODE, small-angle linearization and phase space |

This is a revisable learning map, not twelve approved implementation packages.
The prior M00–M12 curriculum remains useful subject coverage, but this sequence
owns the opening pedagogical order. Old IDs are provenance, not forced lesson sizes.

Coordinate relabelling (passive change) must not be conflated with moving a
physical experiment (active translation symmetry). Keep unit and axis orientation
fixed when claiming displacement coordinates are unchanged by moving the origin.
Earn later symmetry/conservation connections rather than attaching the name early.

Mathematics remains independently reusable. Projection can recur in force, work
and least squares; accumulation in motion, impulse and probability; linearization
in pendula, multivariable functions and optimization. Reuse relationships and
checked meaning, not merely the same picture with different nouns.

Implementation approval starts the bounded opening delivery described in
`../threads/2026-09-12-mechanics-motion-delivery-proposal.md`. It does not authorize
all twelve lessons, a general course platform, or skipping visual review.
