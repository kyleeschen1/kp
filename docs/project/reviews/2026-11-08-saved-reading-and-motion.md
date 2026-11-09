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

## Implemented startup repair and remaining motion difference

User authorized the best-practice infrastructure repair after the CWV discussion.
This section supersedes the unfixed startup status above. Math, choreography,
reading versions, native compositor and editor ownership are unchanged.

The compiler now embeds the same dependency-free geometry function used by the
document runtime. Its 4,980-byte inline setup runs after initial CSS and the real
prose, before the animation module graph. Only the unmeasured theater waits for
that pass; the document intro remains readable. Native fragment navigation also
runs before exposing that measured theater. Annotation CSS is now part of the
initial stylesheet: its formerly late heading-size rule caused another ~7px
document shift. Transcript-only equations no longer distort caption measurement.

The interactive stage stays measurable but inert and unpainted until fonts,
saved location and a successfully rendered frame agree. A layout invalidation
cancels the pending handoff; disposal rejects late callbacks; repeated samples
cannot starve readiness. Print does not falsely certify an interactive frame.
One commit exposes native paint and transfers accessibility ownership.

An intermediate candidate retained visible static math while preparing. Its boxes
were stable, but comparing actual ink exposed a ~13px difference between static
KaTeX centering and the canonical sequence fit. The final policy therefore exposes
canonical math directly when ready, with its box reserved and prose readable
during preparation. Static MathML remains the accessibility owner until handoff.
No-JS reading retains visible static math. Entry-module and later runtime-module
failures restore the full static document, including all prose and transcript math.
This avoids a second approximate fit model or an equation-specific pixel offset;
the tradeoff is that visual equation paint waits for canonical preparation.

The former trace is now an assertion-bearing regression:

`npm run visual:anchored-algebra -- --project=firefox --grep startup`

It covers the saved v1 link, both opening versions and the fractional reader,
at 1100px/390px widths and 900px height, from navigation through 750ms after ready.
Visible card bounds remain stable (at most 1px tolerance); the first native frame
has the requested progress, and its actual KaTeX ink stays stable afterward.
The last Chromium run recorded startup layout-shift sums of zero in all eight
cases. Earlier repaired runs included 0.000017. These local observations are not
field p75 CWV, production LCP/INP, or a general frame-rate guarantee. The inline
layout pass measured mostly 2–9ms warm, with cold observations up to 74ms; those
costs include forced initial document layout and are not a claimed universal budget.

Verification:

- 16 focused startup/reading/font/page-shell unit tests pass, including embedded
  code execution syntax, an 8KB bound, and preservation through production HTML
  compaction. No full production build or field performance claim is made.
- 11 equation surface/authority preservation tests pass. App, Node and test type
  checks pass. `verify:impact` identified reader-system impact but selected no
  commands; the actual reader/browser and preservation checks were run explicitly.
- Startup, delayed enhancement, entry failure, later runtime failure, and a
  standard non-theater reader canary pass in Chromium and Firefox. Existing saved
  link, annotation fade/reversal, focus release, delayed paint, no-JS, and long
  reasoning checks passed. An initial Firefox delayed-load screenshot timed out
  while its entry module was deliberately held; the final test uses DOM/state
  assertions during the hold and captures after readiness, and passes both engines.
- The Firefox transition diagnostic still passes its zero presentation-rebuild
  invariant. Latest exact-saved traversal: one transition preparation of 48ms,
  a maximum callback interval of 51ms, and 179 session reuses. Warm v1/v2 sweeps
  had no builds. This repair does not claim to remove the remaining cold-entry hitch.

The user then supplied the smooth fractional-reader opening as a control. Source
comparison found a concrete policy difference despite the shared compositor:

| Policy | Fractional page path | Authored-algebra reusable path |
| --- | --- | --- |
| Prepared transition capacity | Up to 4 for native-color focus | Default 1 |
| Neighbor preparation | Enabled, subject to idle/cost/ownership guards | Explicitly disabled by descriptor |
| Unchanged equation frame | Page host can skip the unchanged math frame | Reusable session is still sampled |
| Layout/motion | Existing fractional descriptor and selected canonical operations | Semantic-envelope layout, checked endpoint handoffs and evaluation certificates |

Owners: `exemplar-entry.ts`, `equation-lesson-descriptors/fractional-linear.ts`,
`equation-lesson-descriptors/authored-algebra.ts`,
`chrome-free-canonical-equation-session.ts`, and `reader-canonical-equation-session.ts`.
What counts does cache pure plans, but that is not retention of complete prepared
native scenes. Its remaining synchronous preparation is consistent with the
observed entry hitch. The fractional link also starts at the opening, allowing
more idle preparation time than a mid-lesson saved link. No matched A/B has yet
isolated the contribution of each difference, and annotations are not established
as the main cause. This is shared-host policy drift, not evidence that Firefox,
authored content, or JS animation is inherently unsuitable.

Recommended next motion work: apply one bounded preparation/reuse policy through
both host adapters, preserving font/resize/style invalidation, exclusive native
paint, cancellation and disposal. Simply turning on prewarming is insufficient:
the reusable host must provide compatible presentation/color identities too.
Compare first/repeat/reverse traversal from equivalent starting locations before
claiming parity. No caching or prewarming change is included in this startup slice.

To inspect on 8011: reload the exact saved What counts URL, wait for the equation
to appear, then scroll forward and reverse. The theater and equation should no
longer jump during initialization. Distinguish that startup correction from the
remaining cold transition preparation. The broader authoring programme remains
1/13 complete; this is a bounded repair within its saved-reading prerequisite.

## Automatic preparation and reuse — approved amendment

The user approved implementing the shared policy after discussing automatic
optimization for rapid authoring. Both host adapters now derive preparation
from the renderer's native-color capability. Authors supply no cache capacities,
prewarm flags or lesson-specific optimization code. The session retains at most
four prepared transitions including the active one, or fewer for a smaller
cohort. Unknown/geometry-sensitive paint keeps one active scene and does not
speculate. Embedding hosts can still prohibit speculative work during playback.

The reusable host now passes the same presentation/color identity to preparation
and activation, and schedules neighbors only when that request changes. Held
mathematical frames skip redundant renderer applies while native color refresh
and host annotation/prose work continue. Idle preparation requires a real idle
budget, at least 120ms without foreground samples, and a previously observed
preparation cost no greater than 45ms. No timeout forces a monolithic build.

The violated invariant was that equal supported renderer capabilities should
receive the same reuse policy. Its owner is the shared canonical session, not
each lesson descriptor. The third caller also exposed a distinct invalid state:
geometry identity alone cannot authorize a cached pure plan containing exact
paint styles. A reduced/full-motion round trip on divide-both-sides reused an
old colored plan against neutral measured ink. The final cache entry requires
an exact fingerprint of already-observed endpoint paint and geometry; the
compositor's strict signature validation remains intact. Font/layout invalidation
clears measured and pure caches and retires prepared sessions. New source sessions
own separate caches; stale reading/source hashes remain rejected by existing tests.

Measured result: before this change, three forward/reverse passes through What
counts created **12 additional geometry sessions**. The final same test creates
**zero**, as do fractional-linear and divide-both-sides. Revisited glyph identities
match, positions/dimensions remain within 0.25px, and opacity is compared too;
hidden transitions paint no visible glyphs. Resize, font changes, motion-mode revision,
held frames and disposal are exercised in both Chromium and Firefox.

Cold cost remains separate. Final local first-traversal preparation totals
(including startup; not one frame) were 117/180ms for What counts, 140/164ms for
fractional-linear and 33/40ms for divide-both-sides, Chromium/Firefox respectively.
These single development-server runs used actual idle deadlines; no speculative
build ran in that final timing cohort. A separate Chromium ownership canary uses
a controlled clock/budget to execute actual hidden preparation, prove unchanged
visible paint, and consume the prepared neighbor without rebuilding. Its timing
is deliberately excluded from performance evidence.

The exact saved-link Firefox diagnostic still encountered a 51ms cold build and
a 58ms callback interval. Warm v1/v2 sweeps built no geometry, but one interval
still reached 51ms. The policy removes repeated work; it does not yet bound an
uninterruptible cold build or prove universal smoothness, production CWV, or
ChatGPT-level content-generation latency. The next runtime optimization, if
prioritized, is reducing/splitting measured cold preparation at its existing owner.

Verification for this amendment:

- `npm run visual:reader-preparation -- --project=chromium --project=firefox`:
  final run 7 passed, 1 intentional skip (the controlled ownership canary runs
  once in Chromium). This is the repeatable three-reader regression command.
- `npm run visual:anchored-algebra -- --project=firefox --grep 'startup keeps|saved version-1|both readers release|annotation fades|transition diagnostic'`:
  9 passed, 1 intentional skip; includes both engines, desktop/phone startup and
  the exact saved link. Chromium startup CLS remained zero in all eight cases.
- 28 focused reading, startup, host and idle-queue tests; 11 equation preservation
  tests; app, Node and test type checks; project vision checks and Theseus validation.
- Initial tests deliberately reproduced the 12 extra builds. Test setup repairs
  selected the third reader's canonical phase and its actual motion select;
  a TypeScript narrowing error was repaired. The newly exposed stale-color
  runtime failure was fixed at the shared cache boundary before the final pass.

Inspect on the existing 8011 server: open the same saved What counts link, scroll
through the equations and reverse across them twice. Revisited scenes should
retain their motion/paint without recompilation; first encounters can still hitch.
For automated evidence run the preparation command above. No new visual treatment
or human reapproval is required for this bounded repair. Theseus owns live counts;
the broader authoring-to-practice programme is not complete.

## Cold preparation: fewer layout flushes and one construction pass

The user approves continued shared optimization after automatic reuse. The
canonical source, three-reader cohort, motion, prose, annotation treatment and
authoring inputs above remain unchanged. Initial instrumentation separated
observation, the optional standalone plan pass, and scene mounting. Mounting
includes the factory's own planning/certification; a zero standalone-plan count
does not mean planning or validation was removed.

Two responsible-boundary repairs reduce actual work:

- Material alignment now sets up all new owners, measures them together, then
  commits corrections. Its synchronous native-ink helper deduplicates overlapping
  roots and batches independent leaf probes; compound text retains sequential
  measurement. Existing paint-size guards remain, and failed probes restore
  transforms and remove temporary markers.
- Native-color readers retain complete validated scenes. Their cold factory now
  performs its existing planning/certification once, without first compiling a
  separate reusable pure plan. Conservative callers retain that pure-plan path
  and its exact-paint cache guard. Idle eligibility and cost ceilings are unchanged.

In the same Chromium two-seek diagnostic, browser work fell from 278 layouts /
395 style recalculations to 123 / 175. These are browser-work counts, not frame
rates. A rotating Firefox comparison against `74c56acba` used three fresh contexts
per arm after an excluded warmup, disabled speculation consistently, and compared
actual glyph identity, position, dimensions and opacity across all arms:

| Opening v1 | Previous implementation | Batched alignment only | Final shared path |
| --- | ---: | ---: | ---: |
| Initial preparation, median | 84 ms | 81 ms | 65 ms |
| Two later cold builds, median total | 69 ms | 64 ms | 60 ms |

Later-build samples were 67/69/70, 64/64/64 and 60/60/62 ms respectively.
The saved-v1 entry has only one remaining cold build in this traversal; its
medians were 35, 34 and 33 ms. Gains depend on entry state. The stable diagnostic
is `npm run profile:reader-preparation -- --baseline=74c56acba --browser=firefox
--entry=opening` (or `--entry=saved`). It intercepts only the three historical
modules inside its own browser contexts, leaving the server and checkout alone.
Supporting modules are current, historical TypeScript is stripped with Node,
and samples are small local development measurements, not production CWV or
general latency guarantees. Earlier noisy single-run improvements are not used
as the comparative result. Computed-style copying remains unchanged: the prior
October investigation already found no reliable gain from bulk cssText writes.

The three-reader Chromium/Firefox reuse, actual paint, motion/font/viewport
invalidation, idle ownership and disposal cohort passes (8 passed, 2 intentional
diagnostic skips). Warm reversal still builds zero scenes. Independent subtree
geometry comparisons cover fractions, scripts, radicals, matrices, compound and
duplicate roots at three font/transform settings; the native preparation suite
passes all 15 cases across Chromium, Firefox and WebKit. No persistent geometry
cache or author tuning was added. First construction can still exceed a frame;
this repair does not promise hitch-free cold playback.

Final preservation: the scoped anchored-algebra cohort passes 9 cases with one
intentional Chromium skip, retaining startup, saved v1, annotation fades and focus
release. Chromium reports zero startup CLS in all eight sampled entry/viewport
cases. The final Firefox exact-link trace measured one 40ms cold build and a 50ms
maximum callback interval; a prepared sweep still had one 72ms interval despite
zero builds. Browser scheduling/other frame costs remain, so the result does not
establish universal smoothness. App, Node and test types, 28 focused reader tests
and 11 equation-surface preservation checks pass. An initial unused-destructure
type error was removed before rerunning successfully.

The Chromium canonical compositor canary also passes both realized-paint seam
and lifecycle cases (`npm run test:browser:native-katex-compositor-conformance`).
The generic impact planner additionally suggested the historical
`visual:linear-equation` capture. Its default server 8000 was unavailable; an
explicit 8011 retry then timed out on the old coordinated-stage selector. That
capture is **not passed**. No legacy-host changes were kept to make it run; the
actual changed native compositor and three current reader paths supply this
repair's bounded browser evidence. Project vision checks pass (75 tests).
