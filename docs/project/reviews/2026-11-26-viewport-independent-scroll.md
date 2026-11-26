# Consistent scroll pacing across reader sizes

Date: 2026-11-26
Request: avoid compressing scroll distance generally, including on phones.
Scope: shared document-reader pacing; this does not change the pending graph
review or implement the proposed new scrollytelling format.

## Exemplar and boundary

Canonical example: `/experiments/fraction-notebook/`, embedding
`/reader/fraction-notebook-preview/?surface=window`; compare
`/reader/solve-fractional-linear/?reading=reasoning`.
The fractional-linear compiler/model and canonical article remain semantic
authority. The existing native KaTeX/material compositor still owns equation
paint. Notebook JSON and its ProseMirror editing layer retain their roles.

Acceptance: changing viewport or embed height does not change the scroll travel
for a mathematical operation; measured scrolling, reverse and semantic position
restoration remain correct. Layout can reflow independently. Human judgment is
still needed for whether the chosen pace feels comfortable on a physical phone.

Preserve the transformations, endpoints, annotation/prose order, native scroll
input, motion preferences, URLs and renderer. The independently reversible unit
is the cadence function and its associated regression checks in this checkpoint.

## Change and prevention

`src/reader/preparation/document-passage-cadence.ts` now allocates 100 CSS pixels
to reading and 280 to the operation, independent of viewport height. These values
are near the previous full-reader desktop pace; their exact aesthetic value is
provisional. They replace viewport percentages in the existing shared owner.
Static compiler output and the hydrated reader use that same self-contained
function, so startup does not invent a second scroll geometry.

The violated invariant was that reducing the display size should not increase
scroll control sensitivity. The function no longer multiplies its distances by
viewport height. Tests pressure heights from 160 to 1600 pixels, both directions,
source/result endpoints, overlapping-passage rejection and the compiler-embedded
function. Existing invalid-height validation remains enforced.

The diagnostic now obtains cadence from the responsible function, checks the
actual hydrated semantic position, supports a phone viewport and verifies
position preservation across a 100-pixel height change. No new animation or
authoring abstraction was introduced.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/fractional-rising-scroll.test.ts tests/fractional-passage-progress.test.ts tests/semantic-reader-page-shell.test.ts` — 9 checks passed.
- `npm run typecheck:fraction-notebook` — passed, including the diagnostic.
- `npm run visual:fraction-notebook-scroll -- --browser=firefox --phone` — passed
  for standalone reader, notebook reading and inline editing at a 390 × 844 outer
  viewport. The inline player measured 316 × 440; every operation retained 280
  pixels. All hosts retained semantic progress 765 across the height change.
- `npm run visual:fraction-notebook-scroll -- --browser=chromium` — passed for the
  same hosts at 1280 × 900. Every operation retained 280 pixels; all retained
  progress 765 across the height change.
- `npm run visual:fractional-linear-equation -- --base-url=http://127.0.0.1:8000 --continuity`
  — passed 47, 50 and 47 one-pixel positions in three moving portions, with no
  repeated poses on changing positions and no forward/reverse pose mismatches.
- Inspected phone captures of all three hosts: the sampled equation and
  accompanying paragraph remain visible. This is bounded viewport evidence, not
  physical-device touch testing or a complete phone layout certification.

Sampled moving portions now span about 47–50 scroll pixels in every host, compared
with 26–28 in the previous desktop inline embed. Warm moving interiors had no
session builds, no scroll-geometry remeasurement and no callback gaps over 33.4
ms in these runs. Callback cadence is not a presented-frame measurement.

The first-entry preparation cost from the
[earlier diagnosis](2026-11-26-fraction-notebook-scroll-diagnosis.md) remains.
This change neither prewarms more scenes nor adds smoothing or input interception.

## What to inspect

Reload the notebook, scroll through the fraction animation, then scroll back.
Compare editing and reading modes or narrow the window to phone width. The same
amount of scrolling should advance a transformation by the same amount, with
more room than the former inline pace. Judge whether that pace feels natural;
inertia and physical touch gestures have not been measured here.
