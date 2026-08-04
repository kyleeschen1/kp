# Inline Sticky Lesson Layout

Status: accepted discovery standard
Accepted: 2026-08-04

## Purpose

KP lessons may coordinate prose and animation through one reading axis. A
diagram begins as an ordinary embedded figure, lifts into a temporary sticky
platform when it reaches the activation line, and lets its associated prose
approach and dock beneath it. Scroll through the docked prose drives the same
semantic motion segment; reverse scroll restores the same states in reverse.

This is a candidate learner-facing lesson grammar, not a catalogue, editor, or
laboratory layout and not yet a globally required lesson presentation.

## Scene Lifecycle

The observable lifecycle is:

```text
embedded -> lifting -> pinned -> prose docked -> prose released -> embedded
```

- The diagram is meaningful in normal document flow before enhancement.
- Lift changes visual elevation, not document ownership or semantic state.
- One stable paragraph docks beneath the diagram while its corresponding
  animation segment progresses.
- The paragraph releases only after its segment can settle; the next passage
  approaches from below.
- Reverse scroll reconstructs the same paragraph, platform, and animation
  state without replaying prior pixels.
- Consecutive animation blocks have independent scroll runways and only one
  active sampler.

Scroll geometry projects one immutable scene state containing platform phase,
active passage, active motion block, and local progress. Intersection events
may assist lazy loading but do not own semantic animation truth.

## Text And DOM Contract

- Canonical lesson content remains continuous structured prose.
- Every paragraph exists from initial publication in source order.
- Enhancement must not duplicate, reparent, rewrite, or replace prose.
- Context paragraphs remain ordinary prose. Observation paragraphs directly
  governing motion may dock without becoming changing captions.
- The paragraph remains visually stable while essential motion runs.
- Released prose leaves through normal page motion or opaque platform
  occlusion; active prose is not dimmed, blurred, or continuously faded.
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

1. `comfortable`: preferred stage and readable paragraph coexist;
2. `compact`: spacing and stage height contract while prose stays unchanged;
3. `reading`: sticky docking turns off and the complete diagram and prose
   return to ordinary flow.

The adaptation order is:

```text
remove excess spacing
-> contract the stage to its declared useful minimum
-> simplify optional chrome
-> return to reading flow
```

Do not shrink prose indefinitely, clip it, or introduce nested scrolling.
Use stable viewport units (`svh`) for the reserved platform budget so changing
mobile browser chrome does not resize the lesson during a docked segment.
Respect safe-area insets and user font scaling.

## Visual Contract

- One reading axis does not require one literal width: prose retains a readable
  measure while a graph or code stage may bleed wider around the same center.
- The raised platform uses the page background, square continuous geometry,
  and restrained elevation rather than a rounded card within the page.
- Animate a pre-rendered pseudo-element shadow through transform and opacity;
  do not continuously interpolate a large live box shadow.
- The docked paragraph joins the same platform surface and retains the existing
  positive reading rail or tint.
- Mathematical labels inside the diagram use the same theme roles and surface
  background as inline mathematical prose.

## Controls, Navigation, And Accessibility

- Fine-grained manual controls operate the same block-local normalized
  progress as scroll.
- Manual interaction temporarily owns progress; later scroll rebases from the
  visible state without jumping.
- Semantic URLs and TOC jumps restore scroll destination, active passage, and
  animation state atomically rather than replaying history.
- Reduced motion selects semantic checkpoints without lift interpolation or
  continuous scroll seeking.
- Static and no-JavaScript publication remains meaningful, searchable,
  selectable, printable, and correctly ordered.
- Large text, short viewports, landscape phones, and unsupported sticky
  geometry use `reading` mode rather than a compromised simulation.

## Promotion Boundary

The canonical discovery caller is the approved economics demand-shift lesson,
available experimentally through `?layout=inline-sticky`. Its exact domain
model, semantic frames, graph renderer, prose, checkpoints, controls, URLs, and
review capture remain unchanged. The approved split presentation remains the
default and the query-selected presentation is one reversible rollback unit.

Human review of the economics proof precedes any shared lesson-shell promotion.
A structurally different second caller must then prove the same lifecycle and
fit boundary before this becomes KP's default lesson grammar.
