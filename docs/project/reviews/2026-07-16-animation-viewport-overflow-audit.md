# Animation Viewport Overflow Audit

Date: 2026-07-16

## Scope

The audit sampled all 44 concrete editor animation descriptors at progress
`0`, `0.5`, `0.92`, and `1` under 360px, 768px, and 1280px browser viewports.
That produced 528 descriptor/viewport/checkpoint samples.

The measurement covers renderer-owned animation layout containers. It excludes
document scrolling, playback controls, inspector panels, and KaTeX-internal
structural masks.

## Baseline

- 217 nested-scrollbar findings;
- 217 corresponding content-overflow findings;
- 52 horizontal findings;
- 165 vertical findings;
- 35 findings at 360px;
- 86 findings at 768px;
- 96 findings at 1280px.

All findings belong to `div.editor-equation-stage__object`. No graph or diagram
layout container produced a nested-scrollbar finding.

The largest range was 107px of horizontal overflow in
`editor-animation.animation.sample.fourier-transform-pair` at the 768px
viewport. Finding counts describe containers, not unique animations;
comparison surfaces can contribute multiple equation objects at one sample.

## Diagnosis

The equation object currently combines `max-width: 100%`, padding, and
`overflow-x: auto`. CSS normalizes the other overflow axis to a scrollable
mode, so small vertical content differences also become scrollbar risks.
Many 2–7px findings are therefore real nested scroll ranges even when a
platform uses visually unobtrusive overlay scrollbars.

The concentration in one container gives the next slices a narrow repair
boundary:

1. fit equation content with native typography and stable layout geometry;
2. prove that active and settled content remains inside its reserved stage;
3. remove the equation object's scroll-container behavior;
4. retain the catalog audit as a zero-finding promotion gate.

Removing `overflow-x: auto` alone is not sufficient. Visible content overflow
must remain measurable and contained by the animation stage so scrollbars are
not replaced by clipped or off-stage notation. Token ink and deliberate travel
may extend beyond an individual equation object's layout box.

## Native-Fit Follow-up

The responsive native-fit slice reduced the baseline from 217 to 201 nested
scrollbar findings and from 52 to 36 horizontal findings. It eliminated the
large Fourier range entirely: the long forward transform fits at both 360px
and 768px using a shared source/target font size and no transform scaling.

The remaining horizontal ranges are small motion excursions from independently
translated tokens. The unchanged 165 vertical findings come from the equation
object's scroll-container policy and KaTeX structural height. Those findings
belong to the following scrollbar-elimination slice rather than further
typographic shrinking.

## Scrollbar-Elimination Follow-up

Equation objects now expose their fitted notation with visible overflow rather
than creating nested scroll containers. The solve-step sequence wraps as part
of the animation layout instead of becoming a separate horizontal viewport.
The catalog gate records zero nested-scrollbar findings across all 528 audited
descriptor, width, and checkpoint samples. Content overflow remains reported
separately so visible ink and token travel cannot be mistaken for a scrollbar;
the next surface-containment slice owns any ancestor-boundary spill.

## Surface-Containment Follow-up

The same catalog gate now rejects content overflow on every animation surface,
equation stage, transition, layer, solve sequence, graph, and diagram boundary.
The only permitted local extent is the equation object's visible KaTeX ink or
structural box. This proves that graph and diagram renderers remain contained
and that removing equation scrollbars did not replace scrolling with clipping
at an ancestor boundary.
