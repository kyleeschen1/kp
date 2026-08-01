# Constant-Force Work-Energy Exemplar Model Contract

Date: 2026-08-01
Status: frozen for exemplar implementation

## Canonical Reference

The bounded reference is one object moving right on a frictionless horizontal
surface under a constant rightward net force:

- initial kinetic energy $K_0=4\,\mathrm{J}$;
- constant horizontal net force $F_x=3\,\mathrm{N}$;
- displacement from $x_0=0\,\mathrm{m}$ to $x_1=4\,\mathrm{m}$;
- exact rectangular graph area and work
  $W_{\mathrm{net}}=(3\,\mathrm{N})(4\,\mathrm{m})=12\,\mathrm{J}$; and
- exact work-energy result
  $\Delta K=12\,\mathrm{J}$ and $K_1=16\,\mathrm{J}$.

The force is the net horizontal force, parallel to displacement. Vertical
forces cancel and friction is absent. The bounded model owns those assumptions,
units, quantities, and laws; the runtime and presenters only sample it.

## Synchronized Story

One shared state drives three views:

1. a restrained object-and-arrow diagram keeps the object and rightward net
   force identities stable while the object traverses the displacement;
2. an $F_x$-versus-$x$ graph keeps the constant-force segment fixed while the
   rectangular work area grows from $0$ to $12\,\mathrm{J}$; and
3. inline KaTeX connects
   $W_{\mathrm{net}}=\int_{x_0}^{x_1}F_x\,dx$,
   $W_{\mathrm{net}}=F_x\Delta x$, and
   $W_{\mathrm{net}}=\Delta K=K_1-K_0$.

The diagram, graph area, equations, kinetic-energy values, narrative, and
nonvisual description must identify the same current displacement and work.
The final frame makes the unit identity
$\mathrm{N}\!\cdot\!\mathrm{m}=\mathrm{J}$ explicit.

## Observable Acceptance

- Position $x$ is horizontal and horizontal net force $F_x$ is vertical on the
  graph, with explicit meters and newtons.
- The force arrow and constant-force graph segment do not change identity as
  the object and work boundary move.
- The shaded rectangle encodes accumulated work, not a decorative region or
  kinetic energy itself.
- Initial kinetic energy remains $4\,\mathrm{J}$; work, $\Delta K$, and final
  kinetic energy settle exactly at $12\,\mathrm{J}$, $12\,\mathrm{J}$, and
  $16\,\mathrm{J}$.
- One physics-only force control permits integer values from
  $1\,\mathrm{N}$ through $5\,\mathrm{N}$, defaults to $3\,\mathrm{N}$, and
  remains behind the existing `Parameters` disclosure. The default stage still
  exposes only Play/Pause and the scrubber.
- Static ticks remain integral. Continuously moving displacement, work, and
  kinetic-energy readouts reserve two-decimal dimensions with trailing zeros;
  rounded intermediate displays use approximation notation while exact
  semantic and accessible values remain authoritative.
- Direct seek, rewind, parameter restoration, accessibility, exclusive paint
  ownership, a centered no-scroll catalogue layout, and a stable catalogue
  capture pass before human review.

## Presentation Boundary

The physics presenter uses a local
`kp.graph.dimensional-continuity.physics.v1` treatment derived from the
accepted graph-and-diagram language: warm orthographic plane, sparse quiet-blue
construction grid, dark structural axes, stable teal structure, restrained
rust active work/force emphasis, direct KaTeX labels, and no fake depth residue.
The diagram inherits the same palette, line hierarchy, typography, and object
identity without acquiring graph-only axes or grid rules.

This local name is checkpoint vocabulary, not a promoted shared profile. No
profile type, token API, renderer abstraction, or motif implementation may be
extracted until the approved economics and physics callers have both passed
human review and demonstrate the same invariant.

## Preservation Boundary

The object, net-force vector, displacement interval, constant-force segment,
work area, kinetic-energy-change role, work-energy equality, force parameter,
and narrative claim lineage survive every frame. Existing runtime clocks,
equation/graph/diagram renderers, the approved economics exemplar, catalogue
shell, review history, accessibility contracts, and authoring APIs remain
unchanged.

## Scope And Rollback

This is one exact authored model, not a mechanics engine, vector simulator,
generic units package, universal parameter schema, scene graph, second diagram
runtime, or graph-specific clock. It does not add gravity, friction, variable
force, acceleration, momentum, or a speed solver.

The independently reversible rollback unit is the physics domain contract and
model, its presenter and asset registration, focused tests, and catalogue
evidence. No existing caller must change semantics to host it.

## Source

- `domains/physics/constant-force-work-energy.ts`
- `docs/project/reviews/2026-08-01-catalogue-curation-cross-domain-promotion-long-loop-proposal.md`
- `docs/project/decisions/2026-08-01-kp-dimensional-continuity-graph-and-diagram-language.md`
- `docs/project/decisions/2026-07-30-kp-persistent-workspace-composition-sequence.md`
