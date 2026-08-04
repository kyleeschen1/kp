# Inline Sticky Lesson Layout

Status: accepted discovery standard
Accepted: 2026-08-04
Revised: 2026-08-04

## Purpose

KP lessons may coordinate prose and animation through one reading axis. A
diagram begins as an ordinary embedded figure and pins in the upper viewport
while its scene is active. The following cue remains ordinary fully opaque
prose until its center crosses the stage's lower edge. It then recedes and
fades through the lower half of the stage, transferring attention from the
instruction to the animation without introducing a separate card or caption.

This is a candidate learner-facing lesson grammar, not a catalogue, editor, or
laboratory layout and not yet a globally required lesson presentation.

## Vocabulary And Geometry

- **Stage:** the sticky animation surface in the upper viewport.
- **Handoff region:** the lower half of the stage, from its bottom edge to its
  midpoint.
- **Cue:** one stable prose block that tells the learner what to inspect.
- **Cue plane:** the theme-page-colored surface behind the cue. It has no
  border, radius, or shadow and exists only to keep text legible while it leads.
- **Runway:** source-order space after a cue that gives its semantic animation
  time to complete and hold before the next cue arrives.

The stage lifecycle is:

```text
embedded -> pinned -> released -> embedded
```

Each cue has the reversible lifecycle:

```text
below -> handoff -> occluded
```

The cue's vertical center is its geometric anchor. While the center is at or
below the stage bottom, the cue and its plane remain fully opaque. As the
center moves from the stage bottom to its midpoint, one smooth projection maps
scroll position to opacity `1 -> 0`, shallow negative depth, and a restrained
scale reduction. At the midpoint the cue is fully absent and may move behind
the stage's stacking plane. Reverse scrolling reconstructs the same states
without replaying pixels.

CSS cannot interpolate `z-index`. The depth impression must therefore come
from continuous opacity, perspective translation, scale, and the cue plane;
any stacking change occurs only after opacity has reached zero. Do not use
blur, a sudden visible layer swap, or a large perspective distortion to
simulate depth.

## Motion And Attention Contract

- A scene is one cue followed by one explicit runway.
- The same cue-center crossing that begins the visual handoff begins the
  block-local semantic motion corridor.
- Motion retains authored holds and may continue through the runway after the
  cue becomes fully occluded at the stage midpoint.
- The runway, not an enlarged paragraph or changing caption, supplies the
  remaining scroll distance.
- The next cue remains fully opaque below the stage and does not enter the
  handoff until the preceding segment can settle.
- Consecutive animation blocks retain independent semantic progress and only
  one active sampler.
- Context or conclusion passages may use shorter hold runways while preserving
  the current settled animation frame.

One geometry sample projects an immutable scene state containing stage phase,
cue phase, cue opacity and depth, active passage, active motion block, and local
semantic progress. Intersection events may assist lazy loading but do not own
animation or attention truth.

## Text And DOM Contract

- Canonical lesson content remains continuous structured prose.
- Every paragraph exists from initial publication in source order.
- Enhancement must not duplicate, reparent, rewrite, or replace prose.
- The prose column keeps one width, font size, indentation, padding, and line
  wrapping in every cue phase. The depth transform changes only visual paint,
  never layout measure.
- Cue wording remains visually stable while its animation runs.
- Prose below the stage stays fully opaque; there is no anticipatory dimming or
  approach phase.
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
- Stage, cue plane, diagram labels, and page use the same theme background.
- The cue plane may cover stage ink while the cue leads, then fades with the
  cue so the graph emerges; it must not look like a separate card.
- Depth is shallow and supportive. At the end of the handoff the text may be
  roughly 24 CSS pixels behind a long perspective plane with about one percent
  explicit scale reduction, not dramatically thrown into space.
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
