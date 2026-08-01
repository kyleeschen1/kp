# Dimensional-Continuity Graph And Diagram Language

Date: 2026-08-01
Status: accepted

## Decision

KP graphs use one visual language across two- and three-dimensional views.
A two-dimensional graph should look like an orthographic or top-down pose of
the same technical scene that could rotate into three dimensions. This is
**dimensional continuity**: the palette, hierarchy, material cues, typography,
and object identity persist while projection and legitimate depth cues change.

The rule standardizes appearance and authoring contracts, not renderer
technology. SVG remains the default for quantitative 2D graphs. WebGL is a
capability loaded only when real depth, rotation, or object count justifies it.
Camera rotation and geometric flattening are distinct operations and must not
be hidden inside one ambiguous transition.

## Mathematical Typography

All mathematical text is authored as exact LaTeX and rendered with KaTeX by
default. This includes:

- axis variables and units;
- tick values;
- equations, curve names, and point labels;
- parameters, intervals, coordinates, and quantities; and
- mathematical annotations inside diagrams.

Prose remains semantic HTML. Exact semantic values remain authoritative;
KaTeX is a presentation renderer, not a source of mathematical truth. A graph
must not downgrade mathematical labels to ad hoc SVG text merely because they
appear inside a viewport.

## Visual Roles

The canonical graph vocabulary is restrained and role-based:

- warm, quiet plot planes and backgrounds;
- dark structural axes;
- quiet blue construction grids;
- teal stable or unchanged geometry;
- restrained rust active or changing quantities;
- dark ink for focal results;
- historical or reference state shown with the same semantic hue at lower
  opacity and, when useful, a dash treatment.

Data outranks guides, and guides outrank the grid. Grids use sparse major
intervals and never become the dominant texture. Line widths and label sizes
remain stable in screen space as projection changes. Direct labels such as
`D_0` and `D_1` are preferred over a legend or an unlabeled ghost curve.

Depth cues fade as the view becomes flat. A 2D pose does not retain fake
shadows, haze, or perspective residue. Orthographic projection is the default
for quantitative comparison; perspective is reserved for lessons where
spatial structure is itself meaningful.

## Quantitative And Motion Integrity

Graphs and graph-like diagrams must:

- expose enough ticks, scale, and units to support the intended reading;
- choose aspect ratio deliberately rather than stretching to arbitrary host
  dimensions;
- avoid connecting discontinuities or visually interpolating undefined state;
- use named camera poses such as oblique, `xy`, `xz`, and `yz` rather than
  unexplained angle constants;
- keep camera movement separate from data movement unless their simultaneity
  is the lesson;
- include camera and projection state in exact seek and rewind;
- move existing KaTeX label nodes instead of re-typesetting them every frame;
  and
- use reduced-motion jumps or restrained crossfades instead of compulsory
  camera travel.

Label placement is collision-aware and based on measured KaTeX bounds. Color
is always redundant with direct labels, line shape, dash, position, or another
non-color cue. Each dynamic view supplies a current accessible description,
and responsive modes reduce optional density before shrinking essential labels
below legibility.

Diagrams inherit the palette, typography, line hierarchy, identity, and depth
treatment. They do not acquire axes, camera semantics, or quantitative-grid
rules when those concepts do not belong to the subject.

## Generated-Graph Conformance

Prompt wording alone cannot guarantee this language. Future generated graphs
must pass through a versioned, typed presentation profile whose eventual
minimum contract includes:

- a graph-language profile reference and renderer capability policy;
- semantic visual roles rather than arbitrary colors or CSS;
- exact label values with LaTeX provenance and accessible text;
- projection, named pose, and distinct flattening state;
- scale, unit, tick-density, and responsive-density intent; and
- a dynamic nonvisual description.

The compiler resolves roles to renderer-owned tokens. Validators reject or
quarantine generated artifacts with raw mathematical display strings,
unresolved roles, arbitrary presentation overrides, inaccessible color-only
distinctions, or unsupported capability requests. Conformance fixtures test
the typed contract, and catalogue health reports nonconformance rather than
silently repairing it in a renderer.

This contract is formalized now, but its reusable code shape is not guessed in
advance. The revised economics exemplar is the canonical first caller. The
constant-force physics exemplar is the structurally different second caller.
Only after both pass human review may KP promote their shared profile fields,
tokens, compiler rules, and regression checks. Existing diagnostic graphs may
remain explicit compatibility evidence until migrated or retired.

## Current Exemplar Checkpoint

The current supply-and-demand implementation preserves valid exact semantics,
runtime, seek/rewind, accessibility, and native SVG ownership, but its visual
treatment is not approved. Its raw SVG `P`, `Q`, `S`, `D`, and equilibrium
labels, dense flat grid, and graph-specific hard-coded styling do not satisfy
this decision.

Revision preserves the exact economics model, semantic identities, shared
clock, parameter contract, catalogue shell, review capture, and one paint
owner. The smallest rollback unit is the economics presenter, its local visual
styles, and focused visual/conformance evidence. Physics and shared motif/API
extraction remain behind the revised human checkpoint.

## Performance Invariants

- Metadata and the catalogue shell load without graph, KaTeX, code, or WebGL
  runtimes unless the selected artifact needs them.
- SVG is the lightweight 2D baseline; Three.js is never requested merely
  because a route can display a 3D graph.
- Stage dimensions or aspect ratio are known before capability code, fonts, or
  content settle, so loading does not move surrounding chrome.
- KaTeX output and measured label geometry are cached outside the animation
  frame loop; frame work updates transforms, opacity, and renderer state.
- Optional code highlighting is capability-loaded for visible code only;
  compile-time token spans are preferred for static examples.
- Promotion requires route-specific transfer, layout-shift, responsiveness,
  interaction-latency, long-task, and frame-timing evidence.

## Links

- `docs/project/threads/animation-library-promotion.md`
- `docs/project/reviews/2026-08-01-visualization-generation-and-web-performance-next-step-review.md`
- `docs/project/reviews/2026-08-01-catalogue-curation-cross-domain-promotion-long-loop-proposal.md`
- `docs/project/decisions/2026-07-31-kp-exemplar-first-visual-verification-cadence.md`
