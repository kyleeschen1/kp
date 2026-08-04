# Inline Sticky Lesson Layout

Status: accepted discovery standard
Accepted: 2026-08-04
Revised: 2026-08-04

## Purpose

KP lessons may coordinate prose and animation through one reading axis on a
continuous canvas. A quietly bounded motion passage announces entry into that
interaction mode. Its diagram begins as an ordinary embedded figure and pins
in the upper viewport while complete, stable prose approaches and passes
beneath it. A terminal reflection returns to ordinary flow outside the
passage. Paragraph geometry—not synthetic scroll runway, transient caption
text, or an opacity animation—coordinates what receives attention and how
semantic motion advances.

This is a candidate learner-facing lesson grammar, not a catalogue, editor, or
laboratory layout and not yet a globally required presentation.

## Vocabulary And Geometry

- **Stage:** the sticky animation region in the upper viewport.
- **Motion passage:** a bounded run of coordinated stage and prose behavior,
  marked by progressively published entrance and exit gates.
- **Graph bleed:** a diagram may extend wider than prose while sharing its
  center and page hue.
- **Crossing threshold:** the stage's lower edge.
- **Paragraph scene:** one stable prose paragraph and the focus or motion it
  owns.
- **Transition:** a paragraph that prepares and owns one reversible motion.
- **Interpretation:** a non-driving paragraph that explains a completed change
  while the passage remains active.
- **Reflection:** terminal prose after the passage exit; it never passes under
  the sticky stage.
- **Approach:** paragraph travel from the viewport bottom to the threshold.
- **Crossing:** travel from the paragraph's leading edge reaching the threshold
  to its trailing edge reaching the threshold.
- **Stage occlusion:** the wider stage paints above crossed text with an
  opaque or explicitly controlled near-opaque version of the page surface. The
  text itself does not fade.
- **Continuous canvas:** page, paragraph, stage, and diagram share one visual
  ground; no row or card surface separates their explanatory roles.

The stage lifecycle is:

```text
embedded -> pinned -> released -> embedded
```

Each paragraph has the reversible lifecycle:

```text
below -> approach -> crossing -> passed
```

One geometry sample projects the passage and stage lifecycle, paragraph lifecycle,
attention owner, active motion block, and local semantic progress.
Intersection events may assist lazy loading but do not own animation or
attention truth.

## Motion And Attention Contract

- Every paragraph inside the active motion passage owns either continuous
  motion or a deterministic focus/checkpoint change. Terminal reflection is
  explicitly outside that passage.
- Approach is a semantic entry hold: authored motion stays at its initial
  frame while the learner reads what to watch.
- Crossing begins when the paragraph's leading edge reaches the stage bottom.
  Visible motion begins immediately after that boundary; pre-motion delay
  belongs to approach, not an implicit post-crossing hold.
  Authored local keyframes are remapped across the paragraph's physical
  crossing distance.
- Motion reaches its final frame when the paragraph's trailing edge reaches
  the stage bottom. Authored keyframe plateaus own internal pauses.
- A focus-only paragraph becomes the attention owner through the same crossing
  geometry without inventing empty animation time.
- Between paragraphs, the latest passed paragraph remains authoritative until
  the next paragraph crosses.
- Consecutive motion paragraphs retain independent semantic progress and only
  one active sampler.
- Reverse scroll reconstructs the same state from geometry without replaying
  pixels or depending on event history.
- Declared paragraph margins express reading rhythm only. Whether moderate or
  viewport-sized, they never extend semantic progress.
- A transition paragraph establishes the current scene, names the attention
  target, and forecasts the change. Interpretation and reflection explain
  evidence already shown rather than asking the learner to read a new causal
  claim during essential motion.

Do not add a scene-track element, generic runway, viewport-sized spacer, or
second scroll clock merely to create animation time.

## Text And DOM Contract

- Canonical lesson content remains continuous structured prose.
- Every paragraph exists from initial publication in source order.
- Enhancement must not duplicate, reparent, rewrite, or replace prose.
- Prose keeps one width, font size, indentation, padding, line wrapping,
  opacity, transform, scale, and background in every phase.
- Paragraph wording remains visually stable while its animation runs.
- Long paragraphs may continue beneath the stage; stage occlusion, rather than
  paragraph mutation, establishes depth.
- Released prose leaves through normal page motion. It is not blurred, clipped,
  or placed in an internal scrollbar.

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
inherits the actual prose scale, including an explicit reset of the inner
`.katex` enlargement when needed. Long mathematics receives semantic breaks
rather than blanket scaling. Animated readouts use stable tabular geometry and
must not change line height.

Each scene projects one fit class:

1. `comfortable`: the preferred stage and a useful paragraph reading band
   coexist;
2. `compact`: the stage contracts while prose measure remains unchanged;
3. `reading`: sticky positioning and scroll projection turn off and the
   complete diagram and prose return to ordinary flow.

Fit reserves a small multi-line reading band rather than requiring an entire
paragraph to fit below the stage. This permits paragraphs taller than the lower
viewport while preserving readable type.

The adaptation order is:

```text
remove excess spacing
-> contract the stage to its declared useful minimum
-> simplify optional chrome
-> return to reading flow
```

Do not shrink prose indefinitely, clip it, or introduce nested scrolling.
Respect safe-area insets, stable viewport geometry, and user font scaling.

## Visual Contract

- Prose always retains one readable measure. A graph or code stage may bleed
  wider around the same center without changing text width.
- Page and stage use the same hue. The stage uses an occluding surface and a
  higher stacking layer; its player and plot plane remain transparent.
- The stage has no perimeter border, radius, shadow, lift, perspective, or
  scale. A lower-edge threshold bar is an exemplar-local event boundary rather
  than a card edge.
- A motion passage may use a slight role-based wash and thin top and bottom
  gates that extend beyond prose. Avoid side borders and giant rounded
  containers. Entrance labels describe the content rather than the interface.
- Paragraphs have no animated opacity, depth, scale, shadow, or surface.
- Stage occlusion begins physically when prose passes beneath it; do not fake
  the crossing by changing paragraph paint.
- Block-local controls read as a quiet inline divider, not another card.
- A scroll-led presentation may omit visible transport entirely when scroll is
  the primary reversible timeline and the static document remains meaningful.
  Another presentation may retain Rewind, Previous, Play/Pause, Next, or a
  range input over the same semantic progress without changing animation
  truth.
- Stage, prose, diagram labels, controls, and mathematical foregrounds use
  explicit theme roles. KaTeX keeps renderer-owned font metrics.
- An optional theme changes role values, never semantic roles, DOM structure,
  stage fit, scroll geometry, or motion progress. Page and occlusion surfaces
  retain the same RGB channels within a theme so the continuous canvas remains
  visually contiguous.
- A reader-selected theme is URL-reproducible, progressively legible before
  enhancement, and switchable without navigation or layout shift. Review
  capture records a stable theme identity.

The economics discovery caller currently trials `1px` axes, ticks, guides, and
traces; `1.5px` curves; a calculated `0.5px` grid; SteelBlue/red curve roles;
style-preserving opacity ghosts; prose-sized graph math; smaller equilibrium
markers; and no persistent equation banner. These graph details remain
exemplar-local pending a structurally different graph caller.

The current economics geometry trial fixes the complete stage at `50vh`, pins
it at the viewport top, includes `2.5vh` padding at each block edge, separates
the first and adjacent paragraph scenes by `25vh`, uses a near-opaque page RGB
surface, and places a full-bleed `1.5px` grey threshold inside the stage. A
slight passage wash, content label, direction glyph, and thin entrance/exit
rules announce the coordinated segment. Its explicit transition,
interpretation, and reflection roles remain exemplar-local pending a
structurally different lesson.

## Parallel Two-Column Comparison

The economics caller also exposes `?layout=two-column-scroll` as a parallel,
independently reversible desktop experiment. It does not supersede the
one-column contract above. In this mode:

- a mix of concise and longer cards occupies a narrow left column and one
  persistent graph occupies a narrow right column;
- a `1px` vertical rule separates the columns and the graph remains vertically
  centered while sticky;
- the opening card describes the untouched graph and owns its fully settled
  initial state at viewport top;
- every later card owns the state fully settled when its top reaches viewport
  top;
- an incoming transition begins only after its predecessor has reached the top
  and the incoming card is visible, then uses the remaining natural card-top
  distance;
- outgoing and incoming cards exchange opacity over that same interval while
  inactive context remains faintly legible;
- ordinary paragraph height and moderate fixed gaps establish rhythm instead
  of universal viewport-sized steps;
- regular conceptual exposition and terminal reflection remain ordinary prose;
- no transport bar is rendered; and
- narrow or short viewports retain the one-column inline-sticky geometry until
  the desktop grammar passes review.

The query-local sidecar, natural-distance projector, opacity exchange, sticky
text, breakpoint, and two-column paint are comparison machinery rather than
shared authoring or layout standards. The current preservation and promotion
boundary is recorded in
`../decisions/2026-08-04-kp-natural-card-state-handoff.md`.

## Controls, Navigation, And Accessibility

- When present, manual controls operate the same block-local normalized
  progress as scroll.
- Manual interaction temporarily owns progress; later scroll rebases from the
  visible state without jumping.
- Semantic URLs and TOC jumps restore destination, active paragraph,
  checkpoint, and animation state atomically rather than replaying history.
- Document-level CSS Scroll Snap does not own paragraph punctuation or lesson
  state.
- Reduced motion returns the stage and fully opaque prose to ordinary reading
  flow. Increased contrast uses an opaque page-colored stage.
- Static and no-JavaScript publication remains meaningful, searchable,
  selectable, printable, and correctly ordered.
- Large text, short viewports, landscape phones, unsupported sticky geometry,
  or an insufficient useful stage use `reading` mode rather than a compromised
  simulation.

## Promotion Boundary

The canonical discovery caller is the economics demand-shift lesson, available
experimentally through `?layout=inline-sticky`; its bounded midnight palette is
the economics default, with paper available through `?theme=light`. Its domain
model, semantic
frames, graph renderer, prose, checkpoints, controls, URLs, and review capture
remain unchanged. The approved split presentation remains the default and the
query-selected presentation and economics-local theme are independent
reversible rollback units.

Human review of the economics proof precedes shared lesson-shell promotion. A
structurally different second caller must then prove the same stage,
paragraph-projection, occlusion, fit, navigation, and accessibility boundaries
before this can become KP's default lesson grammar. The same promotion gate
applies separately to a shared lesson-theme API.
