# Middle-step unfolding: energy review

Review state: HUMAN_CHECKPOINT. Disclosure latency and preservation checks pass;
the separate larger-font cross-browser gap below remains open. Visual acceptance
is pending. Theseus owns live counts and execution under
`run-contract.kp.chain-first-authoring-v1`. The
[approved proposal](../2026-09-17-chain-first-authoring-long-loop-proposal.md)
requires this judgment before scalar transfer. No later slice has started.

## Disclosure follow-up: retain the handle's blue outline

The energy reader now retains an already visible handle focus outline across
opening and closing substeps. Previously the browser's focus transfer to the
disclosure removed the cue despite preserving the rail position. The reader
captures presence before pointer focus transfers and retains it on the existing
handle through remount. Actual keyboard focus stays with the disclosure;
Tab, Escape, another pointer target or focus elsewhere clears the retained cue.
An absent outline is not introduced by disclosure. Nonpersisted page disposal
clears the cue and its listeners. This isolated reader helper and CSS selector
are the rollback unit; semantic mappings and native compositor are unchanged.

Validation: the regression failed before the fix, then passed with frame samples
in Chromium, Firefox and WebKit. Delayed preparation/input/page-disposal checks
also passed in all three engines (six tests total). Existing frame-by-frame
equation/handle continuity passed in Chromium. Full typecheck and architecture
gates passed. No claim is made that this repairs the separate larger-font gap.

## Startup follow-up: prepare the visible derivation first

The user accepted the improved disclosure response and authorized profiling the
remaining initial rail lag. The canonical artifact, host, checked semantic
source and native compositor below are unchanged. This is a scheduling repair,
not a new visual treatment or authoring format.

The viewport observer used a whole-viewport preload margin. At the energy
entry, that also started the power derivation approximately 1,590px below the
viewport top in a 1,100px window. Both native scene batches competed on the
main thread. Automatic preparation now begins at actual viewport entry. All
transitions of the visible view still prepare before enabling its handle, so
continuous dragging retains its no-cross-edge-wait guarantee. Explicit
disclosure and navigation keep their existing preparation paths.

Three runs per browser, at the same 1280×1100 energy entry, measured the interval
from the rail being unhidden to its handle being enabled in the shared
development server (DOM readiness timestamps, not input-to-paint timings):

| Browser | Previous median | Current median | Reduction |
| --- | ---: | ---: | ---: |
| Chromium | 845ms | 470ms | 44% |
| Firefox | 1,488ms | 946ms | 36% |
| WebKit | 2,757ms | 434ms | 84% |

These are local samples, not universal device budgets or full navigation times.
Network/module startup and native preparation still cost time. The Chromium
profile showed substantial computed-style copying, but alternate CSS copying
and read/write batching did not produce a consistent improvement. Bulk CSS
serialization also failed WebKit custom-property parity. Those experiments
were removed completely; the final production diff only changes viewport
activation. No compiler, paint, font, theme or semantic guarantees were relaxed.
The mathematical record and templates were already compiled at publication;
introducing another serialized plan did not address the measured bottleneck.

The durable startup test captures timings and a Chromium CPU profile, asserts
zero prepared stages in the later offscreen section, then scrolls into that
section and verifies its handle becomes usable. Restoring the old observer
margin made this test fail with six offscreen prepared stages. All nine final
startup runs pass across three engines; all 21 scoped Chromium preservation
checks, full typecheck, architecture, production build, reader closure and
reader budget checks pass. Repeat with
`npm run visual:mechanics-relations -- --project=firefox --project=webkit --grep 'startup preparation profile' --repeat-each=3 --trace off`.

The previously documented large-font cross-browser renderer gap remains open;
startup timing does not certify that motif. The rollback unit is the reader's
viewport observer change. No scalar transfer or wider motif promotion started.

## Earlier repair: publish detail before preparing native animation

The previous repair below honored a cold click but still waited for native
preparation before opening the text. That wait was the wrong boundary. The
canonical artifact remains `examples/physics/momentum-energy.article.md`, hosted
at the supplied relationship-map URL, with the existing native KaTeX compositor
and checked momentum-energy plans as semantic authority.

Disclosure now captures validated semantic intent synchronously, unfolds the
published explanation in the click task, and immediately binds close/reopen
controls. Checked parent/child mappings are prepared with the issued plans,
not imported during a click. A handoff generation prevents an obsolete success
or repair completion from changing the latest view. Actual existing paint can
remain leased until its successor is ready; a cold view needs no paint lease.

Native preparation explicitly yields the first frame and then yields between
uncached scenes. Current-view activation and its input queue no longer await
hidden detail warming. Abort/generation checks and cleanup retain ownership
across reversal and page retirement. Warm cached scenes still activate directly.

Two unnecessary rebuild causes were repaired: Firefox DOMRect subtraction
noise (for example 54.3999939 versus 54.4000092 pixels), and mount-local font
event counters masquerading as cache identity. Numeric native extents now use
a 0.01px comparison; font identity remains exact. The scene pool owns a shared
invalidation revision, including late paint leases. Prepared geometry is
compared with its post-font measurement baseline. Real resize recovery updates
the rail from published text before native preparation finishes.

Evidence: 15 focused cases pass across Chromium, Firefox and WebKit, including
both early detail clicks, rapid close/reopen with fonts deliberately held,
page disposal and frame-by-frame immediate parent return. Controlled cold
disclosure first-frame samples were 8.4ms, 14ms and 19ms respectively. These
measure click-handler-to-frame latency, not all device/input-queue latency.
All 20 scoped Chromium preservation checks pass, including font resizing,
held real paint, exact returns, every-pointer dragging, repair recovery and the
existing scalar reader. Six metric/cache ownership unit checks, full typecheck
and architecture checks pass. Production bundle, reader closure (12 manifest
routes) and reader budget checks pass. No timeouts, budgets or visual laws were relaxed.

Repeat the focused browser cohort with
`npm run visual:mechanics-relations -- --project=firefox --project=webkit --grep 'relationship-map|cold disclosure gives|Back to step 3'`.

### Open, separately reproduced larger-font gap

The broader `equation geometry survives` check fails in Firefox and WebKit;
Chromium passes. Replacing only the reader with its exact `784f82673` version
reproduced both failures, then the new reader was restored. The current WebKit
trace reaches a protected-transit rejection between the retained exponent and
introduced right parenthesis in `energy.extract-norm-scale` after font resizing.
Native scene preparation also exceeds the existing timeout in this pressure
case. This is not waived or certified by the latency checks. Repairing the
motif's font-size geometry remains separate from publishing disclosure text;
no arbitrary collision arc, tolerance change, fallback or choreography rewrite
was introduced to conceal it.

Try either **Inspect smaller steps** from
`http://localhost:8000/experiments/mechanics-relations/#relationship-map`, including
an early click after reload. Text and close/reopen controls should respond
immediately. Native animation can still prepare on a cold entry; this does not
claim zero renderer cost. The energy review remains the approved next judgment,
before scalar transfer; it is not a claim of full cross-browser font conformance.

## Earlier repair: supplied entry URL, blocked expansion and competing scroll

The user supplied
`http://localhost:8000/experiments/mechanics-relations/#relationship-map`.
This is the same canonical document, with an earlier reading entry point.
The old tests entered at the energy anchor and waited for a ready handle. A
regression starting at the supplied URL instead exposed the dropped click:
`capture()` threw while preparation was pending, so the detail never opened.
Early scene preparation widened that unhandled lifecycle interval.

Capture now joins the active seek/preparation completion before recording state.
Concurrent seek consumers share that completion instead of returning early.
Disposal returns a cancelled capture and cannot open detail or display a repair
notice after the page retires. The disclosure retains the click's original
viewport offset across the wait. A second regression exposed a 42px reading
shift: the post-disclosure automatic reveal could compete with the clicked
reading anchor by navigating to an old off-screen selection. Disclosure no
longer invokes that separate navigation action. Explicit inspection/navigation
still owns equation reveal and readable viewport margins.

Both parent details now open from the supplied entry URL, remain at the clicked
reading position, and return to their labeled parent. The new tests hold font
readiness deliberately, click before preparation finishes, then release it;
they never wait for the handle to become ready before attempting disclosure.
Both parent paths and disposal pass in Chromium, Firefox and WebKit. WebKit's
first disposal fixture failed to hold font readiness reliably; pinning the
fixture's FontFaceSet and asserting the pre-release coarse
state made the timing pressure explicit. The corrected cohort passes.
All 18 scoped Chromium preservation checks and full typecheck pass as well.

This supersedes the previous missing-URL blocker. The energy human checkpoint
remains open; the user's report is not treated as acceptance or permission to
generalize. Retry from the exact supplied URL, scroll to either **Inspect
smaller steps**, open it directly, then use the labeled parent return.

## Earlier follow-up: prior return/handle repair did not resolve the report

The user reports both original symptoms still persist. The prior warm-scene
checks were insufficient: a fresh short-viewport test observed **222ms before
the first frame**, and another run exposed a disabled first frame. Checking
only enabled state after rendering can miss main-thread preparation latency.

The energy reader now prepares its bounded published detail scenes during
initial preparation, beginning one viewport before the section is visible.
The first disclosure reuses these scenes; return does not repeat that preflight.
Native plan, compositor, retained-paint and font/layout invalidation owners remain
unchanged. This shifts work earlier; it does not eliminate first page-load or
font-rebuild cost. The small-viewport regression checks first-frame latency,
handle position/availability, then visits the final smaller step and returns to
the saved step-3 position without an off-screen or delayed jump. All 15 scoped
Chromium checks and full typecheck pass.

**At that checkpoint the reported whole-reader reset was unconfirmed.** The
canonical URL and tested click sequence restore step 3 correctly. The user has
been asked for the actual URL and sequence, including whether “reset” means
collapsing detail, moving to the beginning or reloading the page. Do not present
the latency repair as resolution of both symptoms or as visual acceptance.

## Revision: return destination and ready handle

“Back to step 3” previously restored whichever transition was selected before
opening detail, including step 1. The labeled child/parent return now targets
its own parent and restores that parent's saved progress (or its source if
unvisited). The global collapse continues to restore the exact earlier selection.

Disclosure also disposed every prepared compositor and reissued the same plans.
The energy exemplar now retains a bounded, local pool of detached scenes with
exclusive ownership transfer and reuses its immutable issued plans. Scene keys
include source, transition, native template and font/layout measurements. Native
geometry changes invalidate the pool; page retirement disposes idle scenes and
any outstanding paint lease returned later. Static records are baseline-aligned
even when all compositor scenes are reused. No shared semantic or renderer
contract changes; scalar presentation is not promoted.

The initial new regression exposed two disabled frames even after scene reuse:
repeated asynchronous module/plan loading still delayed activation. Reusing those
resolved resources removed the gap. The final regression checks all 20 return
frames, original scene identity, repeat opening by the next frame, and exact held
parent progress. Fourteen scoped Chromium checks and full typecheck pass;
three pool ownership/eviction/disposal unit checks pass. Two older browser
expectations were corrected to the existing held-selection/visible-handle policy;
their viewport stability and every-pointer drag assertions remain intact.

First-time detail preparation and genuine font/layout invalidation can still
require preparation; retained real paint covers that interval. This evidence
does not claim zero cold-load latency on every device. Try opening step 3 while
step 1 is selected, then **Back to step 3**, and repeat from a held step-3 position.
The return should select step 3 immediately without disabling the handle.

Repeat with `npm run visual:mechanics-relations -- --grep 'Back to step 3|disclosure preserves|pending disclosure|nonterminal unfolding|inline refinement|smaller steps preserves|every substep returns|expanded drag follows|equation geometry survives'`.

## Revision: preserve the visuals around the handle

User feedback: preserving the argument would work better if it preserved the
visuals around the handle. The previous version anchored the disclosure button,
retired the old paint, then restored a semantically equivalent child position.
That did not preserve the reader's visual point of attention.

The local energy adapter now anchors the on-screen handle. It retains the actual
paused compositor paint while preparing the successor, then releases it in the
same turn as the checked successor takes over. The retired clock relinquishes
its paint reference before disposal, preventing its final snapshot from moving
the held equation. No glyph snapshot, second visible paint owner, animation or
new mathematical mapping is introduced. When the handle is off screen, the
existing disclosure-button anchor remains the fallback.

The retention capability is released on completion, recovery, reader input,
resize, blur or page disposal. New paint remains hidden during preparation;
interruption removes the retained paint rather than leaving a floating overlay.
The change is a local helper, reader lifecycle handoff and presentation mask;
semantic plans and the scalar caller are preserved. It is independently
reversible without reverting the checked nonterminal correspondence.

Current regression evidence: ten scoped Chromium checks pass, including
frame-by-frame open/return at 16px and 24px, both refinement recovery cases,
edge clearance and the off-screen button-anchor fallback. The frame check was
then strengthened and passed again: every visible material fragment keeps its
semantic identity and stays within two pixels in position/size; the handle is
also stable and there is exactly one visible prefix owner per frame. Delayed
font readiness pressures input interruption and page-disposal cleanup.
The first run caught a roughly 400px displacement from the retiring clock's
final projection; removing its write authority fixed the invariant.

Repeat with `npm run visual:mechanics-relations -- --grep 'disclosure preserves the visible handle|pending disclosure paint|nonterminal unfolding|inline refinement|smaller steps preserves its anchor|rail jumps'`.
38 semantic/unit checks, full typecheck, architecture, build and production
closure/budget checks also pass. This is still an unaccepted visual exemplar.
Exact paint correspondence is demonstrated for the norm's identical checked
children; cancellation still has only shared endpoints and exact saved return,
not a newly invented interior correspondence. A changed child position on
collapse returns to the saved parent position by design.

## Try the exemplar

Open [energy from momentum](http://localhost:8000/experiments/mechanics-relations/#energy-from-momentum)
on the existing shared server (HTTP 200 verified). No comparison query is needed.

1. Find **2 · Square the denominator too**. Inspect that step and drag the rail
   into its middle; leave the handle held there.
2. With the handle and inspected equation visible, click **Inspect smaller steps**
   beneath that explanation. The equation should stay with the handle while
   surrounding material unfolds. The original
   equation and parent explanation remain; **2.1** and **2.2** open underneath.
   **3 · Cancel one mass factor** and the final result stay in the argument.
3. Inspect step 3, then use **Collapse smaller steps** or **Back to step 2**.
   Return should restore the exact step-2 position saved before expansion.
4. Repeat at a larger font size. Try clicking the rail at either end and dragging
   near the window edges. The selected equation should remain readable.

The judgment: does this preserve your place while making the smaller reasoning
available, or does opening/returning still require you to search? In particular,
judge the retained parent plus child explanations and the unchanged downstream
step. Automation cannot settle whether that amount of context feels useful.

## What changed and what owns it

Canonical artifact: `examples/physics/momentum-energy.article.md`; host: the URL
above; renderer: shared native KaTeX scene compositor; semantic authority:
checked momentum-energy model and issued derivation plans. No new clock,
salience store, renderer or mathematical authority was introduced.

The plan issuer inserts only its own checked child operations. Unchanged moves
retain identity; publication emits checked correspondence for all original
rows. The local energy DOM adapter retains equations, prose and grip, including
the downstream cancellation. Both existing cancellation detail and the new
norm detail remain available, with one detail level active at a time.

Norm inspection uses the same checked children in compact and expanded forms,
so its actual child-clock position can be mapped through the existing act gate.
Shared endpoints alone do not license an interior mapping. Exact saved return
is retained in either case, and unaffected move selections/bookmarks survive
insertion. Copied plans, another model, wrong parents and recursive disclosure
are rejected. Browser recovery keeps the original reading if optional detail
is incomplete.

Rollback unit: local reader implementation commit `402639eb7`. Semantic
correspondence is independently isolated in `9b613ce23`; approval/scope baseline
is `7032e4798`. Preserve semantic authority if only the visual treatment changes.

## Evidence and limits

- 43 focused checks pass: momentum/scalar semantics, mapping negatives, act-gate
  inversion and budget-boundary regressions.
- Full `npm run typecheck`, `npm run check:architecture`, production build,
  11 equation-surface preservation checks, all 12 reader production closures,
  reader payload gates and Theseus validation pass.
- The final steady-source Chromium preservation run passes 14 cases, covering
  both details, two font sizes, retained DOM, semantic pose mapping, downstream
  selection/bookmarks, exact return, rail edges, keyboard/scroll ownership,
  delayed reflow, disposal and optional-view repair. Existing scalar behavior
  is checked for preservation, not promoted as the new second caller.
- Review capture/native-dock smoke passes two cases via
  `npm run visual:mechanics-relations -- --grep 'nonterminal unfolding|audit trail keeps'`.
  It generates the compact 16px/24px capture set under the command's disposable
  output directory. Both captures were inspected; these are not reviewed goldens.
- The complete preservation command is
  `npm run visual:mechanics-relations -- --grep 'nonterminal unfolding|inline refinement|rail jumps|rail press|keyboard navigation|smaller steps preserves|disclosure settling|disclosure anchor|scalar reader reuses'`.

Earlier browser attempts were interrupted by source reload/server disconnect;
a temporary baseline checkout also caused unintended test discovery. The
checkout was removed, the disconnect was confirmed in the trace, and the final
14-case run passed without builds or edits in parallel. These failed attempts
remain recorded, with a corrected shorthand command record marked not-run.

Three pre-existing HTML-budget failures reproduced identically before this
implementation. The explicit, bounded
[baseline amendment](2026-09-17-chain-first-reader-budget.md) retains all
consumers and runtime ceilings. Physics transfer estimates now measure 47,747
initial and 165,344 activated gzip JS/CSS bytes; HTML is 779,276 raw / 52,404
gzip bytes. This is emitted payload accounting, not browser latency evidence.

Full cross-browser promotion and final `npm test` remain later release gates.
There is no claim of family-wide visual certification, fraction-chain support
or demonstrated LLM inference precision from this reader checkpoint.

## Continue after judgment

Inspect the stopped contract with
`theseus work inspect run-contract.kp.chain-first-authoring-v1 --mode brief`.
Both contract and target are blocked at this human checkpoint; the generic
`loop:status` helper omits blocked runs and therefore reports no active loop.
That does not mean this approved portfolio is complete or abandoned.
After explicit energy acceptance, complete
`chain.energy-review`, restore both contract and target to ready, then use
`theseus plan run` and continue the already
approved scalar-transfer slice without another permission round. If changes
are requested, repair this reversible exemplar and keep the gate closed.

The loop remains appropriate so far: it exposed and removed a terminal-only
assumption while preserving the existing child semantics. That unlocks a
meaningful independent transfer test; it does not yet establish cheap authoring.
The next useful evidence is whether the scalar caller can reuse this boundary
without a separate reader treatment. The 24-hour active-work ceiling remains;
this checkpoint used roughly half an hour, excluding the ensuing human wait.
