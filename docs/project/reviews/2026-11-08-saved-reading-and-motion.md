# Saved reading restoration and Firefox motion diagnosis

Canonical artifact: What counts, `/reader/what-counts/` on local product server
8011. The document theater and native KaTeX compositor remain presentation
owners. Checked mathematics remains `content/authoring/algebra/what-counts.json`,
revision `7b2d98b4554f80a3456ee6891df12dfdf069f76c11af05471b727908e37f2c61`.
The independent editor checkout is untouched.

## Saved version 1

The supplied link returned HTTP 422 because the current manuscript was version
2 and the page rejected version 1 before hydration. Version 1 had eight beats;
version 2 has ten and substantially different prose. Reusing old reading
coordinates on the newer manuscript would not faithfully restore the link.

Recovered the original generated prose from `945a667ed^:scripts/what-counts-reader-page.ts`.
The checked math and commentary have not changed since that version. Retained
that eight-beat manuscript under a source digest, and resolved reading identity
and version together. Archives cannot be changed silently; unknown revisions,
cross-reading versions and changed math pins remain errors. Situated return
links can return to the retained original. The default remains version 2.

The exact user URL returns HTTP 200 on 8011. Regression checks cover Firefox
and Chromium, desktop and phone, load/reload, eight original beats, native
endpoint ownership, reading position and navigation reversal.

## Motion complaint and bounded repair

The user reports skipped/stuttering frames on that saved link, and says stopping
broad background checks improves but does not eliminate the hitches. The broad
unit suite was deliberately terminated to remove load; it is not a passed check.
No trajectory, timing, typography or mathematical content was changed by the
saved-link repair.

Firefox sampling found unnecessary compositor rebuilds when reader focus changes
or prose advances. The chrome-free host included narrative beat identity in its
presentation revision and did not honor the descriptor's native-color focus
capability. The fractional reader already separates native color from geometry.

The repair declares this existing capability for authored algebra, carries it
through the chrome-free session, and removes narrative beat identity from the
host's paint revision. Actual presentation/salience, font, layout and motion
revisions still invalidate through their existing owners. No cache capacity,
trajectory, duration, global focus store or renderer family was added.

The repeatable command is:

`npm run visual:anchored-algebra -- --project=firefox --grep transition.diagnostic`

It drives the exact restored location and all three transitions of both versions,
records frame intervals and compositor counters, and captures intermediate ink.
The first diagnostic extension had an incorrect DOM selector; that harness
error was repaired before the measurements below. Merely declaring the capability
also failed the regression until the actual chrome-free owner consumed it.

Measured on this machine, with broad checks stopped:

| Observation | Before | After |
| --- | --- | --- |
| Exact saved-link traversal, compositor builds | 3 / 108 ms total | 1 / 57 ms total |
| Focus-caused builds during each sampled v1 transition | 1, 1, 1 | 0, 0, 0 |
| Focus-caused builds during sampled v2 transitions | 0, 1, 0 | 0, 0, 0 |
| Largest v1 sampled transition frame intervals | 53, 44, 44 ms | 44, 29, 28 ms |

These are single-run observations, not a general frame-rate guarantee. The
remaining first-entry preparation caused one 63 ms frame in the restored traversal.
Machine load also changes timings. The structural regression asserts that focus
does not rebuild geometry, rather than imposing a noisy wall-time threshold.
Human confirmation of smoothness remains distinct from the automatic checks.

Post-repair checks: 19 focused reading/focus/descriptor tests and 11 equation
surface-preservation tests pass. The ten-case Chromium/Firefox preservation
cohort passes for saved links, annotation fades, focus release, reverse reading
and exact-context return. App, Node and test type checks pass. The earlier
75 project-vision tests pass; the complete unit suite remains interrupted.

To inspect: reload the user's version-1 URL, scroll from “Only the counts meet”
toward five copies, then reverse. Equations should retain their established paths
and native ink; focus release should not trigger another geometry build.

## Authoring work parked during diagnosis

The approved programme is `run-contract.kp.authoring-to-practice-20261108`.
A separate unreviewed `reading=product` manuscript explains why count and quantity
multiply, including the contrast 30 versus 11. It uses the existing four checked
states and annotation treatment, with no new renderer or CSS. Its first shared
HTTP preview returned 200 in 78 ms; that is server response time, not model
generation or end-to-end authoring latency. Native-workbench integration was not
exercised. Editorial acceptance and safe revision-saving work remain unfinished.

The full unit command initially found a missing promotion-ledger retrieval link
after the earlier roadmap trim. The link and tabled matrix status are restored;
that gate passed on rerun before the later deliberate cancellation. Do not
interpret that cancellation or focused results as a clean full-suite result.

## Follow-up: visible startup geometry shift

The user reports that motion is improved but still feels glitchier, with a
noticeable initial layout shift. This follow-up is diagnosis; production behavior
was not changed. Added a pre-readiness Firefox trace to the existing scoped test:

`npm run visual:anchored-algebra -- --project=firefox --grep startup.diagnostic`

Six navigations cover the exact saved v1 URL and the v1/v2 openings at 1100px
and 390px widths, each 900px high. The test records geometry from the first
document frames through 750ms after ready. Passing means the trace completed,
not that layout stability passed: it reproducibly exposes the defect.

| Reading / width | Initial card height | Settled card height |
| --- | --- | --- |
| v1 / 1100 | 320px | 372px |
| v1 / 390 | 320px | 426px |
| v2 / 1100 | 320px | 642px |
| v2 / 390 | 320px | 750px |

For the saved desktop link, the first interactive equation viewport starts at
493px and settles at 438px: a visible 55px upward move. The browser initially
lands on the HTML fragment at scrollY approximately 3522, then reader restoration
settles at approximately 1811 after document spacing changes. Those scroll
coordinates are not a 1711px equation displacement; the document itself changed
geometry. The final equation-height reserve changes only 82→83px, so that
particular late reserve is not the main jump in this sample.

Responsible boundary: static document → interactive reader startup. CSS supplies
a 320px fallback and provisional holds/gaps. `exemplar-entry.ts` marks the document
hydrated before `mountDocumentTheater` measures prose, before the canonical
session is ready, and before `restoreUrlLocation` runs. The initial fragment
landing, changed prose/card geometry and later semantic position restoration
therefore become separately visible. Font readiness protects final measurements,
but does not make the entire startup handoff atomic.

History checked with `git blame` and the relevant commits: fallback sizing dates
to `105a0fbc2f` (October 28); annotation-dependent sizing to `c8e4c85b8e`
(October 31); dynamic equation-height reservation to `f9052805b9` (October 31).
The richer v2 manuscript was accepted in `945a667ed` (November 8). The focus-rebuild
repair `05c0ae0de` did not change document sizing, CSS or stage-layout code.
This establishes that the geometry mismatch predates that repair, but does not
prove identical subjective smoothness across all historical application versions.

Why now: the saved-link repair makes the previously rejected v1 page reachable
again. Its old manuscript runs in the current reader; `kpVersion` pins reading
content, not the complete CSS/runtime release. A mid-reading fragment exposes
initial reflow directly in the visible theater. Longer prose also changes the
maximum-height layout calculation. Recent focus-release work increased occasions
for the separately diagnosed paint-rebuild defect. Timing/load can amplify both.

Verification gap: prior browser checks primarily called `ready(page)` before
inspecting stable endpoints. They established correct settled state and later
presence, not continuity from the first visible paint. The new startup trace
retains evidence of that distinction. Recommended next repair is a coherent
static-to-interactive handoff: settle sizing and saved location before exposing
the interactive stage, preserving readable static content and native ownership.
Do not disguise incorrect initialization with additional easing or a blanket
page-hiding rule. No new treatment or broad reader rewrite is justified yet.
