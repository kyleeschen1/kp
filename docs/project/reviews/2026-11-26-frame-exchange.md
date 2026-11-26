# Raised prose handoff — fraction checkpoint

## Current raised-prose revision

Outcome: HUMAN_CHECKPOINT. Approved in the
[fraction plan](../2026-11-26-recessed-rail-plan.md#approved-raised-prose-handoff).

Open http://127.0.0.1:8000/experiments/fraction-notebook/?rail=1&frames=1&reading=1.
Scroll slowly through one passage and the following mathematical operation,
then reverse. Look for text physically emerging behind the stage's upper edge,
clearing it, then lifting into a slightly enlarged resting position. The stage
recedes for that reading turn and rises again before mathematical motion.
Judge the depth separation, the position of the reading hold, and the handoff.

The canonical model/article, notebook iframe and native KaTeX/material renderer
remain the source and paint authorities. The same opt-in presentation adapter
is the rollback unit. Prose now has a lower paint layer during emergence and
crosses to the foreground only after its complete text box clears the stage.
Stage depth increases from 12px to 48px; prose holds at 24px depth with a small
additional scale. A fixed shadow layer reinforces each surface's attention.
No tilt, bounce, extra clock or semantic timing changes are introduced.

The pure projection uses intrinsic paragraph geometry. The reading shelf holds
the paragraph bottom 24px above the stage's layout top, then lets natural scroll
resume. Its elevation releases before the existing 280px mathematical act.
Reduced motion restores ordinary untransformed prose in the foreground.

Focused checks cover exact layer-switch clearance, long paragraphs, elevated
reading holds, release before math, reverse, scaled annotation anchors and
unchanged operation travel. Initial browser checks sampled exactly at the
96px boundary and landed fractionally before it because scroll offsets round;
browser samples now sit just inside phases while unit checks retain exact
boundary assertions. Human visual acceptance remains pending.

Verification: `npm run typecheck:fraction-notebook` and the four focused test
files (`document-theater-depth`, `fractional-rising-scroll`, `fraction-notebook`,
`semantic-reader-page-shell`) pass, 24 tests. The final
`npm run visual:recessed-rail -- --project=firefox` run passes eight cases.
Desktop and phone captures were inspected. One earlier comparison-page startup
timed out; the managed services remained running and the final clean run
loaded it without a server-code change. Firefox exposed a separate label-fit
failure at the stronger perspective: inverse screen measurement made a 326px
label appear 326.009px wide. Labels now declare border-box sizing and use their
intrinsic computed dimensions, retaining runtime fit guards and the measured
anchor-gap regression. This supersedes relying on rounding slack for label
width in the preceding trial.

## Superseded rail-emergence revision

Outcome: HUMAN_CHECKPOINT. The user rejected the continuous frames and approved
the simpler rail handoff in the [fraction plan](../2026-11-26-recessed-rail-plan.md).

Open http://127.0.0.1:8000/experiments/fraction-notebook/?rail=1&frames=1&reading=1.
Scroll through the first cue, a mathematical operation and the next cue, then
reverse. The left rail stays fixed. The stage lifts and scales slightly while
it owns attention. New prose emerges at the stage center, settles to ordinary
size along the rail, then scrolls upward. Judge the emergence location, scale
and transfer of attention. Removing `frames=1` retains the soft-backing comparison.

Canonical artifact and semantic source remain the fractional-linear model and
article, hosted in the notebook reading iframe with the native KaTeX/material
compositor. The opt-in presentation adapter is the rollback unit. The failed
full-section frame wrapper and exchange projection are removed. This trial
uses the existing scroll clock and intrinsic paragraph bounds; transformed
paint is never fed back into layout measurement. Stage and prose use modest
perspective depth and scale, with left-anchored prose settling. No tilt or new
renderer is added. Reduced motion removes scale and depth; Read all and print
retain ordinary prose. Selection and focused links remain visible.

The stage annotation yields during the prose attention turn so the same cue
does not appear twice. Scaling also exposed a coordinate-space requirement in
the annotation adapter: viewport measurements must be converted to stage-local
CSS pixels before positioning labels. The adapter now normalizes those bounds
and rejects unmeasurable planes. A browser check measures the actual label gap
under perspective scaling; native material transit retains its 280-pixel travel.

Verification and visual acceptance are separate. Typecheck and 23 focused unit
tests pass. The browser checks exercise desktop/phone widths, emergence and
settling, reversal, later passages, unchanged mathematical progress, full
operation travel, annotation alignment, reduced motion and resize. One initial
Chromium phone run exposed a 0.000014px overflow after inverse scaling of an
exactly fitting annotation. The fit guard now permits only 1/1024px rounding
slack while preserving rejection of real overflow. The final
`npm run visual:recessed-rail -- --project=firefox` run passes all eight cases
in Chromium and Firefox. Desktop and phone captures were inspected. Results
are recorded in the rail-emergence Theseus slice. This remains a single-exemplar
candidate; physical phone input and broader reuse are not established.

## Rejected continuous-frame revision

Outcome: HUMAN_CHECKPOINT. Approved scope follows the continuous-frame
clarification in the [fraction rail plan](../2026-11-26-recessed-rail-plan.md).
This supersedes the first-passage card trial recorded below; neither is an
accepted visual reference yet.

Open http://127.0.0.1:8000/experiments/fraction-notebook/?rail=1&frames=1&reading=1.
Scroll through several passages, then reverse. Look for two continuous surfaces
with slightly offset edges, spanning the full sequence. Prose takes foreground
priority before crossing the pinned equation; the stage regains it in the clear
interval. Judge whether the whole surfaces feel lifted and whether their
translucency makes the crossing readable. Remove `frames=1` to compare the
preceding soft-backing treatment.

Canonical authority remains the fractional-linear model/article, hosted in the
notebook reading iframe and painted by the native KaTeX/material compositor.
One wrapper, installed before measurement/hydration, gives the existing sticky
stage a full-section containing block. All passages share the other frame.
Background planes lift by two pixels and exchange shadow strength; native ink
retains its geometry and full opacity. Layer ordering is sampled from measured
passage bounds, so direct seek and reversal need no independent timer. Local
paragraph cards and the separate rail are removed in this opt-in treatment.

The checks exposed an existing rail invariant violation: its compact stage did
not reserve room for complete authored commentary. The annotation adapter
correctly returned a repair gap, whose alert added an extra grid row. Rail
layout now uses the document reader's commentary reserve based on intrinsic
text height. Measuring text rather than reserved passage height prevents growth
on repeated layout. Runtime annotation bounds remain enforced; browser checks
assert no visible repair alerts, equal full-section frame lengths and stable
stage height after resize. This fixes the reserve for both rail candidates.

The native renderer, semantic operations, 280-pixel operation travel and default
notebook presentation remain unchanged. Reduced motion removes background lift.
Final withdrawal still occurs before sticky release. The reversible unit is the
opt-in CSS adapter, wrapper and frame-focus projection; the commentary-space
repair is independent of that aesthetic choice.

Verification:

- `npm run typecheck:fraction-notebook` passed.
- `node --disable-warning=ExperimentalWarning --test tests/document-theater-depth.test.ts tests/fractional-rising-scroll.test.ts tests/fraction-notebook.test.ts tests/semantic-reader-page-shell.test.ts` passed, 23 tests.
- `npm run visual:recessed-rail -- --project=firefox` passed all eight cases in
  Chromium/Firefox at desktop/phone widths, including the comparison treatment.
  Checks cover full frame length, first and later crossings, reverse, unchanged
  first-handoff math, native operation travel, reduced motion and resize.
- Initial runs exposed the commentary reserve gap. A first repair measured
  reserved passage height and fed it back into layout; switching to intrinsic
  text height removed that growth. The comparison check now aligns actual text
  with the equation, preserving its coverage assertion despite larger reserve.

Desktop and phone captures have been inspected; physical phone input and
aesthetic acceptance are not established. Reuse beyond this exemplar remains
gated on human review.

## Superseded first-passage trial evidence

Outcome: HUMAN_CHECKPOINT. Approved scope is the first crossing in the
[fraction rail plan](../2026-11-26-recessed-rail-plan.md).

Open http://127.0.0.1:8000/experiments/fraction-notebook/?rail=1&frames=1&reading=1.
Scroll the first passage ("Three was added after x was halved") across the
equation, then reverse. Prose should gain the foreground shadow before overlap;
the stage should regain it after the passage clears. Judge whether this reads as
two surfaces exchanging prominence and whether the shadow is restrained enough.
Remove `frames=1` to compare the preceding soft-backing candidate.

Canonical authority remains the fractional-linear model/article, hosted in the
notebook reading iframe and painted by the native KaTeX/material compositor.
The trial adds one local CSS adapter and a deterministic layout-clock projection.
Background planes lift by two pixels and exchange their shadow strength; ink and
mathematical geometry stay unchanged and fully opaque. Z-order changes before
contact, with prose above throughout overlap. The first halo and continuous
sheet are disabled for this trial. The rail becomes the stage frame's left edge.
Later passages retain their prior backing rather than acquiring this unreviewed
choreography. All broader application remains pending.

The semantic progress stays zero during the tested handoff. No equations are
duplicated, reparented or independently animated. Existing final withdrawal,
scroll cadence and ordinary notebook mode are preserved. Reduced motion removes
background lift while retaining readable foreground ordering. The rollback unit
is the opt-in frame adapter and its small projection/query bridge.

Verification:

- `npm run typecheck:fraction-notebook` passed.
- `node --disable-warning=ExperimentalWarning --test tests/document-theater-depth.test.ts tests/fractional-rising-scroll.test.ts tests/fraction-notebook.test.ts tests/semantic-reader-page-shell.test.ts` passed, 22 tests.
- `npm run visual:recessed-rail -- --project=firefox` passed eight cases: the new
  first-crossing trial and previous candidate, each in Chromium and Firefox at
  desktop and phone widths. Assertions include ordering, foreground hit tests,
  unchanged semantic progress, stationary native paint, full ink opacity,
  reversal and reduced motion. Initial test parsing failed on a duplicate local
  variable; that test-only error was repaired before the passing full run.
- The final query guard requires `rail=1` alongside `frames=1`; the focused
  Chromium first-passage checks passed again after that guard was tightened.

Phone-width overlap and cleared captures were inspected. Physical phone input,
broader passage choreography and aesthetic acceptance are not established.
