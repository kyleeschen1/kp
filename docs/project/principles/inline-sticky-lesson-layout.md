# Inline Sticky Lesson Layout

Status: accepted discovery standard
Accepted: 2026-08-04
Revised: 2026-08-04

## Purpose

KP lessons may coordinate prose and animation through one reading axis. A
diagram begins as an ordinary embedded figure and pins in the upper viewport
while its scene is active. The following cue gathers into a raised reading
shelf as it approaches, peaks when its center reaches the stage's lower edge,
then descends through the stage. It crosses behind at the midpoint and is
absent by 75% of the stage traversal. Only then does essential animation begin,
transferring attention without changing the cue's content.

This is a candidate learner-facing lesson grammar, not a catalogue, editor, or
laboratory layout and not yet a globally required lesson presentation.

## Vocabulary And Geometry

- **Stage:** the sticky animation surface in the upper viewport.
- **Approach region:** the visible path from the cue's viewport entry to the
  stage bottom.
- **Handoff region:** the first 75% of the stage measured upward from its
  bottom edge.
- **Cue:** one stable prose block that tells the learner what to inspect.
- **Cue plane:** a square translucent warm surface plus an opacity-controlled
  focus wash and pre-rendered shadow layer.
- **Elevation arc:** scale, positive depth, and shadow rise from viewport entry
  to the stage bottom, then settle back to the stage plane at its midpoint.
- **Stage plane:** a fairly opaque, unelevated animation surface that makes the
  cue's midpoint stacking change perceptible.
- **Runway:** source-order space after a cue that gives its semantic animation
  time to complete and hold before the next cue arrives.

The stage lifecycle is:

```text
embedded -> pinned -> released -> embedded
```

Each cue has the reversible lifecycle:

```text
below -> approach -> handoff(front) -> handoff(behind) -> occluded
```

The cue's vertical center is its stage anchor; its untransformed layout height
determines viewport entry. Elevation progresses `0 -> 1` from entry to the
stage bottom. During the first half-stage traversal it returns `1 -> 0` while
opacity stays one. At the midpoint scale and depth are neutral, so the cue may
change from the front to the back stacking plane without a visible geometric
jump. During the next quarter-stage traversal, opacity falls `1 -> 0` and
negative depth settles. Reverse scrolling reconstructs the same states without
replaying pixels.

CSS cannot interpolate `z-index`. The depth impression must therefore come
from continuous opacity, perspective translation, scale, and the two surface
planes. The stacking switch occurs only at neutral scale and depth. Do not use
blur, a large perspective distortion, or an unrelated time animation to
simulate the crossing.

## Motion And Attention Contract

- A scene is one cue followed by one explicit runway.
- The stage-bottom crossing begins the cue's descent, not semantic animation.
- The block-local semantic motion corridor begins at 75% of stage traversal,
  after cue opacity reaches zero. Motion retains authored entry holds and may
  continue through the following runway.
- The runway, not an enlarged paragraph or changing caption, supplies the
  remaining scroll distance.
- The next cue remains fully opaque below the stage and does not enter the
  handoff until the preceding segment can settle.
- Consecutive animation blocks retain independent semantic progress and only
  one active sampler.
- Context or conclusion passages may use shorter hold runways while preserving
  the current settled animation frame.

One geometry sample projects an immutable scene state containing stage phase,
cue phase, cue opacity, elevation, depth, scale, stacking, active passage,
active motion block, and local semantic progress. Intersection events may
assist lazy loading but do not own animation or attention truth.

## Text And DOM Contract

- Canonical lesson content remains continuous structured prose.
- Every paragraph exists from initial publication in source order.
- Enhancement must not duplicate, reparent, rewrite, or replace prose.
- The prose column keeps one width, font size, indentation, padding, and line
  wrapping in every cue phase. The depth transform changes only visual paint,
  never layout measure.
- Cue wording remains visually stable while its animation runs.
- Prose below the stage stays fully opaque. The approach changes only its
  transform and composited focus layer, not text opacity or content.
- Released prose leaves through normal page motion. It is not blurred or
  clipped.
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

1. `comfortable`: the preferred stage and one complete readable cue coexist;
2. `compact`: the stage contracts while the prose measure remains unchanged;
3. `reading`: sticky positioning, fading, depth, and runways turn off and the
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

- The prose column always retains the same readable measure. A graph or code
  stage may bleed wider around the same center without changing text width.
- The pinned stage is not elevated: no card shadow, lift transform, rounded
  container, or joined paragraph surface.
- Stage, cue planes, diagram labels, and page use explicit theme roles. The
  stage is fairly opaque; the cue's base and focus planes remain translucent.
- The cue may read temporarily as a raised square shelf. Its focus plane may
  use a restrained gradient, edge, and layered shadow, but not rounded corners.
- Keep the larger shadow fixed on a pseudo-element and project only its
  opacity. Do not animate `box-shadow` itself on scroll.
- Depth is shallow and supportive: roughly 24 CSS pixels above at peak and 24
  below at occlusion, with about one percent explicit scale change in either
  direction.
- Mathematical labels inside the diagram use the same theme roles and surface
  background as inline mathematical prose.

## Controls, Navigation, And Accessibility

- Fine-grained manual controls operate the same block-local normalized
  progress as scroll.
- Manual interaction temporarily owns progress; later scroll rebases from the
  visible state without jumping.
- Keyboard focus forces a fading cue fully visible and removes its depth
  transform so controls are never operated invisibly.
- Semantic URLs and TOC jumps restore scroll destination, active passage, and
  animation state atomically rather than replaying history.
- Document-level CSS Scroll Snap does not own cue punctuation or lesson state.
  Revisit only as a separate browser-tested presentation experiment.
- Reduced-motion presentation returns the stage and fully opaque cues to
  ordinary reading flow. Increased-contrast presentation keeps cues opaque and
  removes the depth transform.
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

Human review of the economics depth-handoff proof precedes any shared
lesson-shell promotion. A structurally different second caller must then prove
the same stage, cue, runway, fit, and accessibility boundaries before this can
become KP's default lesson grammar.
