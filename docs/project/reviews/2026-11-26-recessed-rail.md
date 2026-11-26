# Recessed fraction rail — visual checkpoint

Outcome: HUMAN_CHECKPOINT. One opt-in candidate is ready; visual acceptance and
promotion are still pending. Scope follows the [approved plan](../2026-11-26-recessed-rail-plan.md).

Open http://127.0.0.1:8000/experiments/fraction-notebook/?rail=1&reading=1.
Scroll into the left-hand rail, through two mathematical operations, reverse
partway through one, and continue beyond the rail. Judge whether opaque prose
feels like it passes just over the expression, whether the spacing gives enough room
to follow the mathematics, and whether the final covering feels natural.
Remove `rail=1` to compare the existing presentation.

The canonical artifact remains the fractional-linear model/article, hosted in
the notebook reading iframe and painted by the existing native KaTeX/material
compositor. The adapter changes layout and foreground presence only. It retains
authored annotation ownership and a single stage. No renderer or dependency was
added. Stage placement can move under opaque prose at sticky containment edges;
this does not implement iframe reparenting or a shared player/asset pool.

Each operation retains 280 scroll pixels on desktop and phone. The spacer also
reserves the whole measured stage height so the following text cannot cover an
unfinished operation. A trailing opaque sheet covers the stage before sticky
release. These are measured browser invariants, not a claim of universal support
for every future equation size or viewport.

Verification:

- `npm run typecheck:fraction-notebook` passed.
- `node --disable-warning=ExperimentalWarning --test tests/fraction-notebook.test.ts tests/fractional-rising-scroll.test.ts tests/semantic-reader-page-shell.test.ts` passed, 20 tests.
- `npm run visual:recessed-rail -- --project=firefox` passed the configured Chromium
  and additional Firefox projects at 1280px and 390px widths (four cases).
  Checks cover clearance, pinned position, reversible realized material styles,
  opaque foreground coverage, concealed sticky release, and page errors.

This is a visual discovery checkpoint. Physical phone gestures, large text,
selection/search, reduced motion and broader responsive behavior still need the
post-acceptance hardening pass. The previously measured first-entry preparation
hitch was not repaired here. Depth and rhythm require human judgment. Default
notebook presentation remains unchanged; broader reuse needs a second caller.

## Quiet revision — November 26

User feedback superseded the shaded well and right-hand rail. The revised
candidate uses the same beige as surrounding prose, a left marginal rail and no
recess shadows. Mostly opaque paper permits a faint trace beneath it. An initial
opening presents the expression before the first passage; measured scroll
position samples a shallow six-pixel dip and recovery at each paper edge.
These provisional values remain local to the exemplar. The full stage receives
the transform, so native math and its annotation plane share the same depth.
The mathematical playhead, 280-pixel operation travel and final opaque cover are
preserved. Reduced motion suppresses the dip; forced colors uses opaque paper.

The visual check now additionally covers the left rail, matching surface colors,
depth reversal, initial descent and reduced-motion suppression. Discovery caught
and repaired a CSS specificity conflict in the reduced-motion override. Firefox
also exposed native remeasurement differences of up to 0.01672 CSS pixels;
the reversal check now compares every owner and non-geometric style exactly and
every pixel value within 0.025 CSS pixels, instead of comparing serialized CSS
strings. This is a bounded geometry tolerance, not omitted paint evidence.

Human review should focus on the first descent and a following uncovering. The
previous shaded candidate was checked but not accepted. Physical phone testing
and reuse remain outside this revision.

## Opaque paper and actual depth — current candidate

The user's clarification supersedes translucency: the rail is the wall of the
underlying stage. Opaque prose with the exact page background now covers both
the rail and equation. The rail has a lower stacking level than the paper, so
each paragraph visibly interrupts it. The equation stays below the foreground
throughout; a local perspective transform moves the retained stage into negative
Z before contact and back to its surface after clearance. Opacity stays at one,
and there is no vertical translation. Native math and annotations remain in the
same transformed plane, without changing their semantic model or paint owner.

Depth sampling now accounts for the whole reserved equation box, not just its
center. The browser checks verify negative Z, unchanged opacity, depth reversal,
opaque page-color paper, rail ordering/coverage, reduced-motion suppression,
operation clearance and concealed exit. Chromium and Firefox passed at both
1280px and 390px. Typecheck and the 20 preservation tests passed; the additional
`node --disable-warning=ExperimentalWarning --test tests/document-theater-depth.test.ts`
passed the full-box entry/exit and bounded sampling checks. Its first run caught
an arithmetic error in two expected fixture positions; those positions were
corrected without changing implementation.

At the review URL, watch a paragraph cross the rail: the line and equation should
be buried together, then the expression should rise in the clear opening.
Reverse through this boundary. The depth amount remains provisional and this is
still HUMAN_CHECKPOINT, not promotion across other lessons.

## Continuous reading sheet — current candidate

The user's latest refinement supersedes individual opaque paragraph covers.
All prose remains in the existing article container. Its one background-only
pseudo-element spans the intro, paragraph gaps and afterword; the text paints
above it at full opacity. The solid beige floor is the article background. The
rail and retained equation/annotation plane sit between floor and sheet. There
are no separate paragraph backgrounds in ordinary color mode. Forced colors
uses opaque prose backing for legibility.

The equation rises toward the sheet's underside in clear intervals and retreats
with softer contrast behind prose. Neither the rail nor the paper is removed at
paragraph boundaries. The exit reserve is transparent too: explicit, reversible
presence withdrawal finishes before sticky release, preserving the invariant
that the stage does not visibly drift away at the end. This changes presentation
only; semantic math and operation travel remain unchanged.

The sheet's 18% background alpha and the recessed contrast are provisional local
values. Inspect a paragraph moving across the equation, then the clear interval:
does it feel like mathematical content inside a continuous reading surface?
Reverse through the same boundary and continue past the end.

Checks cover the one sheet spanning the entire article, transparent paragraph
boxes, fully opaque prose, explicit floor/sheet/text order, depth and withdrawal
reversal, reduced motion, native paint and scroll clearance. The initial Firefox
run found that the endpoint sample landed fractionally inside the descent due
to scroll rounding; the test now samples two pixels outside that boundary,
retaining exact surface opacity assertions. Physical phone interaction and
broader reuse still await separate validation and human acceptance.
