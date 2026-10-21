# Dependent nonzero columns: source reuse evidence

Scope: [approved trial](../2026-10-21-dependent-columns-authoring.md).
Candidate for explanatory review, not yet human-accepted. Live preview:
<http://localhost:8000/experiments/matrix-column-combinations/?input=dependent-columns>.

## Outcome and authoring cost

The new source is `content/authoring/linear-algebra/dependent-columns.ts`:
40 lines defining A = [[1,2],[2,4]], B = [[3,5],[-1,-2]], their product, title,
introduction, fourteen milestone cues, connecting argument and transfer question.
One import and registry entry make it selectable in the existing host.
No runtime, semantic owner, type, API, host, renderer, CSS, timing or clock changed.
The source and registration worked on the first implementation attempt.
This is an observed agent-authored reuse result, not a general LLM success rate.

The first explanation lost a coordinate through a zero column. Here both columns
and both contributions are nonzero: 3(1,2) − (2,4) = (1,2), and
5(1,2) − 2(2,4) = (1,2). The argument derives the combined weight x + 2y and
explains why an input change (2,−1) disappears. Transfer distinguishes (7,−3)
from (7,−2), preventing the inference that all inputs give the same output.

The second mathematical mechanism fits the existing editorial seam. Both callers
still share the same seven-step presentation, dimensionality and interaction.
This does not demonstrate different narrative topology, arbitrary LA composition,
a new shared motif, general native-compositor certification or Article publication.
There is no reason from this trial to add another authoring abstraction.

## Cost and limitations

No new dependency or per-frame computation. The production registry chunk grows
from approximately 3.00 kB raw / 1.45 kB gzip in the prior recorded build to
6.07 kB raw / 2.46 kB gzip: about 1.01 kB more compressed source text and data.
These are build-reported chunk sizes, not a complete route-transfer measurement.
All registered sources are loaded together; this is bounded reuse, not a claim
of economical catalogue-scale loading.

Desktop capture keeps commentary above the stage, signed terms in their native
matrix brackets and the full explanation below. Phone capture retains horizontal
stage scrolling; the result initially lies beyond the visible right edge. The
long source title also lengthens the wrapping menu. Neither is a new layout
repair in this source-only scope. Comparing columns still reloads the player.
Editorial claims remain manually authored rather than machine-verified prose.
No-JavaScript output remains an honest preview notice, not a complete edition.

## Evidence and review

The unit cohort verifies independent expected products and signed contributions,
source references, separate equal-result identities, transfer outputs and nine
additional compensating input changes. The existing browser test is parameterized
over both explanatory sources, preserving the accepted projection checks and
adding actual scaled-paint values/opacity and factor-reference checks for both.
It checks every cue, both results, direct seek/reversal, source-preserving column
navigation, above-stage commentary, phone overflow, reduced motion and no-script
truth. Captures are disposable; rerun the stable scoped command to reproduce.

Verification results are recorded on `task.kp.dependent-columns-authoring`.

- `npm run test:matrix-interpretations`: 21 pass.
- `npm run typecheck`: all app, Node, test, Svelte and domain checks pass;
  `npm run typecheck:tests` also passes after the final browser assertions.
- `npm run build:matrix-interpretations`: passes, 152 transformed modules.
- `npm run visual:matrix-interpretations -- --grep 'explanation keeps|accepted continuity'`:
  3 pass; the subsequent complete command below includes final signed-paint checks.
- `npm run visual:matrix-interpretations`: all 16 Chromium checks pass.

The impact selector has no focused rule for this content registry and recommends
the broad fallback. The approved trial instead uses focused mathematical and
browser cohorts plus full types and the actual matrix build: only content and
tests changed. No full repository unit suite or three-engine promotion is claimed.

Inspect both result columns, particularly the scaled contributions before addition.
Does the argument make clear that changes to the two contributions cancel, while
their total remains nonzero? Does the comparison explain why a zero column is
unnecessary for information loss? Can the reader predict the two transfer outputs?
Automated correctness and reuse checks do not answer those teaching questions.

Outcome: **HUMAN_CHECKPOINT**, source and exemplar checks complete;
the changed explanation awaits review before broader promotion. Next context:
`theseus work context task.kp.dependent-columns-authoring --mode working`.
