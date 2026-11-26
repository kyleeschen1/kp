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
