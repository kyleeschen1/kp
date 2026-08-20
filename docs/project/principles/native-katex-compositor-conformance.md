# Native KaTeX Compositor Conformance

Status: approved working principle
Date: 2026-08-19

This document names the test vocabulary for Native KaTeX paint continuity. It
does not define animation aesthetics or create production authoring concepts.

## Terms

### Semantic object

The durable mathematical identity supplied by verified semantic evidence. A
semantic object may have native-source, material, and native-target paint
representations. Text equality, DOM order, and geometry do not establish this
identity.

### Shape class

A test-only category for the visible-paint structure being carried. Shape
classes describe structural behavior—atomic glyph, rule, script, vertical
list, delimiter, accent, or multirow compound—not a particular LaTeX string.
Representative LaTeX fixtures instantiate a shape class; they do not define
the class.

### Paint class

The measurement strategy required by visible paint. The initial classes are:

- `atomic-text`: direct glyph ink and an inline baseline;
- `rule`: visible border/rule geometry;
- `subtree`: the union of visible descendant text and rules;
- `vector-paint`: path or SVG paint when a supported Native KaTeX shape emits
  it.

Paint class selects measurement, not choreography.

### Context mutation

A change in surrounding layout while the carried semantic object remains the
same. Examples include shorter, longer, or taller siblings; display/text/script
math styles; changed grouping; and a different enclosing compound. Context
mutation is distinct from changing the carrier itself.

### Ownership topology

The correspondence shape between source and target paint owners: one-to-one,
one-to-many, many-to-one, introduction, elimination, or a compound owner over
multiple leaves. Topology is established by verified correspondence and
endpoint ownership, never by matching glyphs opportunistically.

### Lifecycle action

The runtime operation applied to a compiled transition: forward sampling,
direct seek, reverse sampling, interruption, remount, font invalidation,
viewport resize, DPR change, theme change, or reduced-motion selection.

### Ownership seam

The progress boundary where exclusive visual ownership changes between native
source, material scene, and native target while semantic identity persists.
The seam is an interval boundary, not a new animation phase or a second clock.

### Planned geometry

Renderer-owned rectangles, baselines, paths, and transforms computed before
paint. `rect` and `expectedPaintRect` are planned geometry. Planned geometry can
be internally correct while a computed-style clone paints elsewhere.

### Realized paint

The visible ink produced by the browser after DOM insertion, inherited and
computed styles, transforms, font realization, and layout. Realized paint is
measured from the actual current owner with the existing atomic-text or subtree
paint metric. Owner layout boxes and screenshot pixels are not substitutes.

### Seam trace

An ordered, immutable test record that correlates one semantic object across
native source, material, and native target samples. Every sample names its
owner side, progress, lifecycle action, coordinate space, realized paint
rectangle, baseline when applicable, scale, opacity, and endpoint revision.

### Supported transition

A feature combination for which the suite can identify semantic ownership,
select the correct paint metric, produce a complete seam trace, and apply named
continuity laws. A transition is unsupported if any of those requirements is
missing. Unsupported transitions fail before animation; they never fall back
to layout boxes or inferred identity.

## Coordinate spaces

The suite recognizes three coordinate spaces and requires explicit conversion:

1. `viewport-css-px`: browser `getBoundingClientRect` output after transforms;
2. `stage-layout-px`: viewport geometry normalized by the settled stage scale,
   which is the existing compositor planning space;
3. `owner-local-px`: clone-internal paint inset relative to its material owner.

Continuity comparisons must occur in one named space. The default diagnostic
space is `stage-layout-px`; raw viewport measurements and owner-local insets are
retained so a failed conversion can be distinguished from failed paint.

## Laws versus aesthetics

The suite may certify:

- exclusive paint ownership;
- semantic correspondence and topology completeness;
- finite, continuous realized ink position, size, baseline, and scale at a
  seam;
- deterministic geometry for equivalent lifecycle states;
- correct invalidation when font or viewport revisions change;
- native target settlement and production exclusion.

The suite may not certify motion taste, pace, emphasis, salience, easing style,
or whether a transformation is pedagogically legible. Those remain exemplar-
first human decisions.

## Execution budgets

The executable source is
`tests/support/native-katex-compositor-conformance-budget.ts`.

- A fast canary may select at most 24 scenarios.
- A promotion suite may select at most 96 scenarios.
- A supported-browser release cohort may select at most 12 scenarios per
  engine.
- Each transition receives at most five semantic samples: native source,
  source/material seam, material midpoint, material/target seam, and native
  target.
- A profile uses one page, one worker, one reusable browser, and one reusable
  server.
- Routine runs create no screenshots and perform no unseeded fuzzing.
- Failures emit structured diagnostics. Screenshots exist only in an explicit
  human-review mode.

Advisory ceilings are 5 seconds for planner/unit work, 30 seconds for the
Chromium canary, 2 minutes for promotion, and 5 minutes for the supported-
browser release cohort. Scenario, sample, page, worker, screenshot, and fuzz
counts are hard limits; wall time is advisory because host load varies.
