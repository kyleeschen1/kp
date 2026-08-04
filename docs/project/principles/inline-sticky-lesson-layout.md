# Inline Sticky Lesson Layout

Status: accepted discovery standard
Accepted: 2026-08-04
Revised: 2026-08-04

## Purpose

KP lessons may coordinate prose and animation through one reading axis on a
continuous canvas. A diagram begins as an ordinary embedded figure and pins in
the upper viewport while its scene is active. The following stable prose cue
approaches on the same page plane. When its top edge reaches the stage's lower
edge, it remains fully readable for `5vh`, fades over the following `10vh`, and
only then yields attention to essential animation.

This is a candidate learner-facing lesson grammar, not a catalogue, editor, or
laboratory layout and not yet a globally required presentation.

## Vocabulary And Geometry

- **Stage:** the sticky animation region in the upper viewport. It is geometry,
  not a visible card.
- **Graph bleed:** a diagram may extend wider than the prose while remaining on
  the same center and page plane.
- **Handoff threshold:** the invisible stage-bottom line used for projection.
- **Hold region:** the first `5vh` above the threshold after a cue top crosses.
- **Fade region:** the following `10vh`, ending `15vh` above the threshold.
- **Cue:** one stable prose block that tells the learner what to inspect.
- **Continuous canvas:** page, cue, stage, and diagram share one visual ground;
  no row or card surface separates their explanatory roles.
- **Runway:** source-order space after a cue that gives its semantic animation
  time to complete and hold before the next cue arrives.

The stage lifecycle is:

```text
embedded -> pinned -> released -> embedded
```

Each cue has the reversible lifecycle:

```text
below -> approach -> hold -> fade -> occluded
```

The cue's untransformed top edge is its stage anchor. It stays fully opaque
before crossing and while it travels the next `5vh`. Across the following
`10vh`, one smooth eased envelope takes opacity from one to zero. There is no
cue transform, elevation, scale, depth, shadow, or stacking switch. Reverse
scrolling reconstructs the same states from geometry without replaying pixels.

## Motion And Attention Contract

- A scene is one cue followed by one explicit runway.
- Crossing the invisible threshold begins the `5vh` hold, not semantic motion.
- The block-local semantic motion corridor begins after the following `10vh`
  fade, once cue opacity reaches zero. Motion retains authored entry holds and
  may continue through the following runway.
- The runway, not an enlarged paragraph or changing caption, supplies the
  remaining scroll distance.
- The next cue remains fully opaque below the stage and does not enter the
  handoff until the preceding segment can settle.
- Every cue cycle in the exemplar uses the same opacity envelope; asset-local
  semantic choreography remains independently authored.
- Consecutive animation blocks retain independent semantic progress and only
  one active sampler.
- Context or conclusion passages may use shorter hold runways while preserving
  the current settled animation frame.

One geometry sample projects immutable stage phase, cue phase, cue opacity,
active passage, active motion block, and local semantic progress. Intersection
events may assist lazy loading but do not own animation or attention truth.

## Text And DOM Contract

- Canonical lesson content remains continuous structured prose.
- Every paragraph exists from initial publication in source order.
- Enhancement must not duplicate, reparent, rewrite, or replace prose.
- The prose column keeps one width, font size, indentation, padding, and line
  wrapping in every cue phase. Opacity changes paint, never layout measure.
- Cue wording remains visually stable while its animation runs.
- Prose below the stage stays fully opaque until its own threshold crossing.
- Released prose leaves through normal page motion. It is not blurred or
  clipped, and there are no internal prose scrollbars.

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

1. `comfortable`: the preferred stage and one complete readable cue coexist;
2. `compact`: the stage contracts while the prose measure remains unchanged;
3. `reading`: sticky positioning, cue fading, and runways turn off and the
   complete diagram and prose return to ordinary flow.

The adaptation order is:

```text
remove excess spacing
-> contract the stage to its declared useful minimum
-> simplify optional chrome
-> return to reading flow
```

Do not shrink prose indefinitely, clip it, or introduce nested scrolling. Use
stable viewport units (`svh`) for stage and runway budgets so mobile browser
chrome does not resize an active scene. Respect safe-area insets and user font
scaling.

## Visual Contract

- The prose always retains one readable measure. A graph or code stage may
  bleed wider around the same center without changing text width.
- Page, cue, stage, player, and diagram plot plane form one continuous ground.
- The stage and cue have no card fill, border, radius, rule, shadow, lift,
  perspective, or scale. Do not substitute visible rows or columns.
- The fading cue remains above the diagram while visible, but its only animated
  presentation property is opacity.
- Block-local controls read as a quiet inline divider, not another card:
  actions have no border, radius, lift, or shadow.
- Stage, prose, diagram labels, controls, and mathematical foregrounds use
  explicit theme roles. KaTeX keeps renderer-owned font metrics.

## Controls, Navigation, And Accessibility

- Fine-grained manual controls operate the same block-local normalized
  progress as scroll.
- Manual interaction temporarily owns progress; later scroll rebases from the
  visible state without jumping.
- Keyboard focus forces a fading cue fully visible so controls are never
  operated invisibly.
- Semantic URLs and TOC jumps restore scroll destination, active passage, and
  animation state atomically rather than replaying history.
- Document-level CSS Scroll Snap does not own cue punctuation or lesson state.
  Revisit only as a separate browser-tested presentation experiment.
- Reduced-motion presentation returns the stage and fully opaque cues to
  ordinary reading flow. Increased-contrast presentation keeps cues opaque.
- Static and no-JavaScript publication remains meaningful, searchable,
  selectable, printable, and correctly ordered.
- Large text, short viewports, landscape phones, unsupported sticky geometry,
  or cues that cannot coexist below the useful stage use `reading` mode rather
  than a compromised simulation.

## Promotion Boundary

The canonical discovery caller is the approved economics demand-shift lesson,
available experimentally through `?layout=inline-sticky`. Its exact domain
model, semantic frames, graph renderer, prose, checkpoints, controls, URLs, and
review capture remain unchanged. The approved split presentation remains the
default and the query-selected presentation is one reversible rollback unit.

Human review of the economics continuous-canvas proof precedes any shared
lesson-shell promotion. A structurally different second caller must then prove
the same stage, cue, runway, fit, and accessibility boundaries before this can
become KP's default lesson grammar.
