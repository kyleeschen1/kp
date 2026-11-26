# Two-frame crossing — first-passage checkpoint

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
