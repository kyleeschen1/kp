# Momentum and energy: authoring evidence

## Accepted orientation repair

The original worksheet below records the first candidate. The user found the
demos clear but the opening puzzle premature. The revised learner task is to
understand how force, momentum and energy fit together, grounded in authentic
algebra and the user's single-variable calculus background. Accepted direction:
`../decisions/2026-09-13-algebra-grounded-relationship-orientation.md`.

The Article now introduces definitions and Newton's law under explicit fixed-mass
inertial-frame assumptions, then offers a compact linked relationship map.
Detailed substitution, product-rule and integral chains expose their reasons.
Equal-speed versus equal-momentum comparisons prevent an ambiguous mass inference;
direction loss is read directly from the scalar expression. The two unchanged
fixtures illustrate these results afterward. The same source and stable passage
IDs drive both editions. Native links are not yet the exact-state excursion
feature planned in r3; displayed deductions are not certified symbolic rewrites.

Focused checks test source-to-title propagation, passage link closure, algebra
before figures, compiled MathML and agreement with analytical fixture samples.
They do not prove the general physical law or establish learning effectiveness.

Canonical source: `examples/physics/momentum-energy.article.md`.
Candidate host: `/experiments/mechanics-relations/` (not live at r1).
Governed assets: `animation.physics.momentum-energy.straight` and
`animation.physics.momentum-energy.turning`, imported through versioned vignettes.
Physics authority: `domains/physics/momentum-energy.ts`; renderer is the bounded
native SVG projection, not a source of force, trajectory, or energy.

## Explanation-first worksheet and medium choice

The learner needs to decide why a force can turn motion without adding kinetic
energy. Prerequisites are vector direction/length and single-variable derivatives;
the Article introduces velocity, momentum, kinetic energy and the dot product's
relevant meaning. The motivating puzzle is a puck guided around a bend.

The explanatory hinge is information retained: momentum records direction and
speed; kinetic energy records speed alone. The dot-product power identity explains
why a perpendicular force changes the former without changing the latter. The
derivative calculation establishes the connection rather than requesting faith
in two unrelated formulas. Integral statements distinguish force accumulated over
time from work along actual motion. Fixed mass, an inertial frame, and net force
are explicit limits, not a general claim about all objects or all energy.

Prose carries motivation, definitions, reasoning and scope. Static start/end
figures already establish the counterexample. Local motion earns its place only
if it makes the continually turning momentum and continually perpendicular force
easier to track while energy stays fixed. No scrolling choreography is necessary
for the argument. Numerical labels use SI units; force and momentum arrow scales
are distinct because their units differ. All energy bars use the same 0–8 J scale.

The first visual checkpoint must judge whether that motion adds clarity and
whether the locally controlled figure interrupts the ordinary reading flow.
Automated physics checks do not establish learning effectiveness.

## Bounded capability and verification

The existing work-energy capability cannot supply time-resolved vector momentum
or circular motion. This candidate therefore adds two analytical particle
fixtures, not a physics solver or universal relation/renderer system. Unsupported
external parameters return a typed repair gap. Checked models own their source;
sampling requires physical seconds rather than an untyped presentation fraction.
Governed construction records immutable endpoints and identity correspondence.

`tests/momentum-energy.test.ts` checks endpoints, differential laws, mass variants,
malformed/aliased inputs, physical-time authority, deterministic seeking, governed
construction, Article reference closure, build-time math and static assets.
Finite-difference tolerance is 1e-8 with a 1e-5 second interval; these are fixture
checks, not proof of Newtonian mechanics. The displayed prose supplies the
analytical reasoning. Live check results and package status belong to Theseus.

Rollback boundary: the Article, new vignette/publication and host adapter can be
reverted independently of the physics model. No accepted exemplar is migrated.

## Verification cost repair

The repository-wide test TypeScript project exhausted Node's default 2 GB heap.
A diagnostic run with a temporary 4 GB allowance measured the complete consumer:
5,056 files, 780,912 TypeScript lines, 806,091 types, 1,514,291 instantiations,
2,260,550 KB reported memory and 51.28 seconds compiler time. It also exposed
one new test's unreachable failure branch, which was removed. That run failed;
it additionally could not write incremental metadata inside the narrow sandbox.

The bounded repair gives only the test compiler an explicit 3 GB heap through
`npm run typecheck:tests`, retaining every root and check. This is a measured
host-tool allowance, not a relaxation of inference or browser bundle budgets.
No claim is made that the new six tests caused the repository-wide footprint.
Splitting the test project may be worthwhile later; it is not necessary to
introduce a new checking framework into this explanation-delivery package.
