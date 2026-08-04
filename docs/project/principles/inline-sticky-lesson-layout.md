# Inline Sticky Lesson Layout

Status: accepted discovery standard
Accepted: 2026-08-04
Revised: 2026-08-04

## Purpose

KP lessons may coordinate prose and animation through one reading axis. A
diagram begins as an ordinary embedded figure and pins in the upper viewport
while its scene is active. An invisible attention corridor of height `P` sits
beneath it. A stable cue paragraph approaches the lower edge of `P`, reaches a
brief full-opacity reading shelf, then fades as it crosses `P` while the
corresponding semantic motion unfolds.

This is a candidate learner-facing lesson grammar, not a catalogue, editor, or
laboratory layout and not yet a globally required lesson presentation.

## Vocabulary And Geometry

- **Stage:** the sticky animation surface in the upper viewport.
- **Padding `P`:** the transparent attention corridor immediately below the
  stage.
- **Focus line:** the lower edge of `P`.
- **Reading shelf:** a one-to-two-line-height plateau around the focus line on
  which the cue is fully opaque.
- **Cue:** one stable prose block that tells the learner what to inspect.
- **Runway:** source-order space after a cue that gives its semantic animation
  time to complete and hold before the next cue approaches.

The stage lifecycle is:

```text
embedded -> pinned -> released -> embedded
```

Each cue has the reversible lifecycle:

```text
waiting -> approaching -> reading -> receding -> occluded
```

The cue uses one leading-edge anchor. Far below the focus line it remains
quietly visible. It gains opacity through a bounded approach region, stays at
full opacity across the reading shelf, fades smoothly from one to zero while
crossing `P`, and is fully occluded at the stage edge. Reverse scrolling
reconstructs the same states without replaying pixels.

## Motion And Attention Contract

- A scene is one cue followed by one explicit runway.
- The animation segment begins at the focus line, retains authored holds, and
  may continue after the cue becomes occluded.
- The runway, not an enlarged paragraph or changing caption, supplies the
  remaining scroll distance.
- The next cue does not begin its approach until the preceding segment can
  settle.
- Consecutive animation blocks retain independent semantic progress and only
  one active sampler.
- Context or conclusion passages may use shorter hold runways while preserving
  the current settled animation frame.

One geometry sample projects an immutable scene state containing stage phase,
cue phase and opacity, active passage, active motion block, and local semantic
progress. Intersection events may assist lazy loading but do not own animation
or attention truth.

## Text And DOM Contract

- Canonical lesson content remains continuous structured prose.
- Every paragraph exists from initial publication in source order.
- Enhancement must not duplicate, reparent, rewrite, or replace prose.
- The prose column keeps one width, font size, indentation, padding, and line
  wrapping in every cue phase. Salience must never widen or dock the paragraph.
- Cue wording remains visually stable while its animation runs.
- Prose outside an active sticky scene stays fully opaque.
- Released or occluded prose leaves through normal page motion and the stage's
  opaque page-colored paint plane; it is not blurred or clipped.
- There are no internal prose scrollbars.

## Readable Fit Contract

“Always fits” means the lesson always chooses a valid readable presentation,
not that arbitrary content is compressed into one viewport.

Primary prose uses a rem-based fluid scale near:

```css
font-size: clamp(1.0625rem, 1.0125rem + 0.25vw, 1.1875rem);
line-height: 1.55;
```

Primary lesson prose must not shrink below approximately 17 CSS pixels at the
default browser text scale. Section headings begin at `h3` scale. Inline KaTeX
inherits the prose scale; long mathematics receives authored semantic breaks
rather than blanket scaling. Animated readouts use stable tabular geometry and
must not change line height.

Each scene projects one fit class:

1. `comfortable`: preferred stage, `P`, and a readable cue coexist;
2. `compact`: the stage contracts while the prose measure remains unchanged;
3. `reading`: sticky positioning, fading, and runways turn off and the complete
   diagram and prose return to ordinary flow.

The adaptation order is:

```text
remove excess spacing
-> contract the stage to its declared useful minimum
-> simplify optional chrome
-> return to reading flow
```

Do not shrink prose indefinitely, clip it, or introduce nested scrolling. Use
stable viewport units (`svh`) for stage, corridor, and runway budgets so mobile
browser chrome does not resize an active scene. Respect safe-area insets and
user font scaling.

## Visual Contract

- The prose column always retains the same readable measure. A graph or code
  stage may bleed wider around the same center without changing text width.
- The pinned stage is not elevated: no card shadow, lift transform, rounded
  container, or joined paragraph surface.
- Stage, diagram labels, and page use the same theme background. The stage
  remains opaque so fully receded prose cannot ghost through the animation.
- Cue opacity is the only default prose salience change. Active cues do not
  receive a widened background card or a second competing reading rail.
- Mathematical labels inside the diagram use the same theme roles and surface
  background as inline mathematical prose.

## Controls, Navigation, And Accessibility

- Fine-grained manual controls operate the same block-local normalized
  progress as scroll.
- Manual interaction temporarily owns progress; later scroll rebases from the
  visible state without jumping.
- Keyboard focus forces a fading cue fully visible so controls are never
  operated invisibly.
- Semantic URLs and TOC jumps restore scroll destination, active passage, and
  animation state atomically rather than replaying history.
- Reduced-motion presentation returns the stage and fully opaque cues to
  ordinary reading flow. Increased-contrast presentation keeps cues opaque.
- Static and no-JavaScript publication remains meaningful, searchable,
  selectable, printable, and correctly ordered.
- Large text, short viewports, landscape phones, unsupported sticky geometry,
  or cues that exceed the lower viewport use `reading` mode rather than a
  compromised simulation.

## Promotion Boundary

The canonical discovery caller is the approved economics demand-shift lesson,
available experimentally through `?layout=inline-sticky`. Its exact domain
model, semantic frames, graph renderer, prose, checkpoints, controls, URLs, and
review capture remain unchanged. The approved split presentation remains the
default and the query-selected presentation is one reversible rollback unit.

Human review of the economics attention-corridor proof precedes any shared
lesson-shell promotion. A structurally different second caller must then prove
the same stage, cue, runway, fit, and accessibility boundaries before this can
become KP's default lesson grammar.
