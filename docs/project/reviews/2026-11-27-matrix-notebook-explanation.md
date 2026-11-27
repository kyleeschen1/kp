# Matrix notebook explanation — review candidate

Date: 2026-11-27
Authority: [approved scope and worker packet](2026-11-27-next-step-review.md).
Contract: `run-contract.kp.matrix-notebook-explanation-20261127.v1`.
Presentation acceptance remains pending; the accepted G2 static notebook stays accepted.

## Inspect the connected example

Open <http://127.0.0.1:8000/experiments/fraction-notebook/?notebook=matrix>.
Select the equation and choose **Explain column combination** in M-x / C-x C-x,
or use its **Explain** button. The new occurrence is inserted below that object.

1. Use the seven milestones, scrubber and Previous/Next controls. The actual
   vector supplies both column weights; there is no fabricated second column.
2. Return to inputs, change A11 from 1 to 3, and revisit the explanation. Its
   output becomes (5,2), matching the equation and graph; playback holds its place.
3. Enter `-`: the draft remains editable and the existing explanation pauses at
   its last valid revision with a diagnostic. Correct the value to resume use.
4. Fold/unfold, reload, and switch Edit off/on. Occurrence identity persists;
   editor and reader each retain their own position. Seeking is not document undo.
5. At narrow widths, pan inside the mathematical stage. The page itself should
   remain within its pane. Judge the inherited card's size, cue readability and
   whether the connection from inputs to explanation is clear.

Canonical source: `content/notebooks/matrix-object-exemplar.json` and the saved
notebook revision. Mathematical truth remains the registered resource runtime
and existing typed matrix owners. Reference renderer:
`/experiments/matrix-column-combinations/`, using its existing native KaTeX
presentation, optical profiles and timeline clock. No choreography or scroll
behavior was redesigned.

## What changed and what is prevented

`runtime.explanation()` builds a genuine 2×2 × 2×1 interpretation from the exact
cached typed operands. The structural product is shared across occurrences;
explicit result/entry correspondence connects its result to the existing source
result. Revision keys include IDs, counters and values, so undo followed by a
different edit cannot collide merely because a revision counter is reused.
The cache retains one product, clears on disposal and rejects incomplete drafts.

The additive `columns` view uses the existing occurrence/resource relationship,
native history and copy closure. Explain has the same draft/cap/stale-target
checks as Graph. Return selects an existing input occurrence of the same source
without changing history. A copied explanation-only resource cannot navigate to
another resource's inputs. The existing eight-stored-occurrence bound remains.

The notebook dynamically imports the bounded embed, explicitly requests native
math fonts before measurement, and prepares connected geometry before replacing
the old player. Unsupported notation or failed preparation leaves the previous
display usable with a diagnostic. Async generation checks prevent a delayed
load or error from reviving a removed/folded view. Folding, removal and hiding
the editor dispose its player; an inactive reading iframe disposes its matrix
reading. Both reuse the established player cleanup rather than another clock.

Playback preferences are best-effort localStorage entries keyed by surface and
occurrence, pinned to the exact source revision. An idle reading view cannot
overwrite the editor's held position. Document truth stays in notebook storage;
denied preference storage does not invalidate source edits. On reload with an
invalid draft and no mounted prior player, the explanation shows a repair gap
until corrected; it does not claim to reconstruct a previous painted revision.

## Boundary and verification findings

The first architecture run rejected the application-to-experiment import. Ten
specific already host-free TypeScript modules and their four scoped styles now
have explicit ownership classifications. The entry, page, author and reading
route hosts remain experiments. A transitive import test prevents the embed
from pulling those hosts, notebook/chat state or the separate saddle library
into playback. No dependency exception, directory-wide promotion, new general
player API or semantic authority was introduced. This is an inspected reuse
boundary, not visual certification of a broader renderer family.

Read-only worker review caught three lifecycle risks before handoff: waiting on
fonts.ready alone did not request the required faces; late failures lacked the
same cancellation guard as successes; and editor/reader mounts initially shared
one playback preference key. These are repaired at the mount boundary. Browser
regressions cover pending-load removal, fold/disposal and independent surface
positions. The first browser run passed 1/2; the narrow assertion used an
ambiguous role locator. Its exact accessible name is now asserted, with no
runtime workaround or timeout change. The first new import test also required
explicit classification of its scoped CSS; the complete rerun passes.

Checks executed:

- `npm run test:notebook-mathematics`: 27 tests, including source identity,
  cache reuse, 300-edit rebasing, undo branches, copies, invalid drafts, finite
  decimal admission and preservation of the original two-column adapter.
- `npm run typecheck:fraction-notebook`: complete expanded scope passes.
- `npm run typecheck`: repository application, Node, tests, Svelte and domain
  scopes pass; Svelte reports zero errors and warnings.
- `npm run test:library-boundaries`: seven checks pass.
- `npm run check:architecture`: complete chain passes, zero new exceptions.
- `npm run visual:notebook-mathematics`: all 12 Chromium workflows pass.
  After extending explanation coverage, both explanation workflows pass again
  in Chromium and Firefox, including reverse/next, unsupported notation, pending
  removal, narrow layout, source edits, native history, reader handoff and reload.
- `npm run visual:matrix-interpretations -- --grep 'columns and coefficients|reduced-motion controls|shared configuration'`:
  three original-player preservation workflows pass.
- `npm run measure:notebook-mathematics`: complete production consumers and
  expanded scoped type configurations pass; lazy-runtime guard includes the
  column embed/player/presentation. No budget was increased.
- `npm run test:project-vision`: 75 checks pass; Theseus validates 1,351 nodes.

## Cost, limits and integration

Current complete notebook JS/CSS: 1,867,661 raw / 596,682 estimated gzip bytes,
versus 1,739,517 / 558,688 at the prior matrix adapter: +128,144 / +37,994 bytes.
Initial JS is 1,433,097 / 473,327, versus 1,433,290 / 472,959 previously; chunk
splitting slightly changes compression. This is deferred functionality, not a
startup speedup. Complete emitted assets include existing fonts; gzip sums are
file estimates, not network or phone measurements. The script's older historical
baseline predates quadratic authoring and is not this change's isolated delta.
Current complete type scope: 77 roots, 671 files, 171,813 types, 198,452 instantiations.

The existing matrix-card layout remains a fixed minimum-width mathematical
stage with local horizontal scrolling. Arbitrarily long ordinary decimals,
new choreography, automatic prose correctness and learner transfer are not
certified. Scientific-notation paint is rejected explicitly. Cross-notebook
imports, saved vignette export, universal adapters and LLM edits remain separate.

Workers delivered isolated, backed-up commits: mathematics `33376f179`,
playback `d28fd7783`, commands `7bf5d63b0`. Integration applies their exact owned
diffs once, adds notebook ownership/lifecycle and combined verification, and
retains their branches. No protected branch merge or publication occurred.
Smallest rollback unit: the explanation occurrence/command adapter and its mount;
preserve accepted static matrix, quadratic and fraction authoring.

Stop at **HUMAN_CHECKPOINT**: two of three contract packages are checked; the
connected exemplar awaits judgment. Resume this boundary with
`theseus work context task.kp.matrix-notebook-explanation-20261127 --mode brief`.
The short-lived initial contract lacking execution fields was superseded by
the explicit `.v1` record through the CLI; its scope was unchanged. Other
historical contracts were not resumed or rewritten.
