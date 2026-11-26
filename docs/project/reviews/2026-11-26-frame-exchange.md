# Two continuous frames — fraction checkpoint

## Current continuous-frame revision

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
