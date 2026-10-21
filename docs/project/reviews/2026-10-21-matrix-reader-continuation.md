# Persistent matrix comparison and selected loading

Scope: [approved continuation](../2026-10-21-matrix-reader-continuation.md).
Accepted reference: projection-loss and dependent-columns on the existing local
column-combination KaTeX player. No mathematical, explanatory, optical or motion
treatment changed. Runtime integration, not universal compositor promotion.

## Reader and author outcome

The original page loads discovery labels without fetching any authored source.
Selecting an explanation loads that source only. Numeric preservation inputs
remain one small shared module. ES module caching reuses their immutable objects;
there is no independent scene store or unbounded prepared-DOM cache.

Result column links now compare at the held progress within one document.
Source/example links retain their authored start. Named milestone hashes still
work; fractional positions use `#p=0.64` and round-trip exactly. Reload and
Back/Forward restore the selected source, column and progress. Modified native
links retain browser behavior. Keyboard focus returns to the corresponding link.

The former entry module separates into source/page preparation, player lifecycle
and document navigation. The existing shared latest-session handoff prevents late
loads from replacing newer selections. A failed source load leaves the current
player usable. Failed connected endpoint preparation reconstructs the previous
known source at its held position. Player replacement disposes its observer,
config subscription, clock and control handlers. Geometry and choreography remain
owned by the unchanged presentation/continuity modules.

While extracting the lifecycle, an input ordering hazard was repaired: pausing a
playing clock publishes its old frame, which can overwrite the slider value.
The handler captures the requested target before pause. The browser regression
scrubs during active playback and checks the resulting exact URL/state.

Registration moves to `content/authoring/convergence/matrix-sources.ts`, which
declares a lightweight ID/title and lazy loader. Loaded identity/title must match
the descriptor; unknown IDs produce MatrixColumnGap. The source-owned mathematics
and ColumnReading API are unchanged. The title is currently repeated in the
descriptor and checked; this is a bounded registry, not a source-index generator.

## Complete cost attribution and explicit policy amendment

Baseline: commit `1689f1ab1`, before loading/navigation work. Built in a detached
temporary worktree with the same installed dependencies and matrix Vite config.
The current `measure:semantic-cost` script was applied to both builds to obtain
matching selected-source closures. Normalize the dependency symlink prefix when
comparing module inventories. No baseline implementation was edited.

JS gzip bytes (CSS remains 14,533 bytes for these matrix routes):

| Consumer | Baseline | Current |
| --- | ---: | ---: |
| Original route, static import closure | 106,738 | 108,184 |
| Original route, including automatically loaded source registry | 109,191 | 108,184 |
| Selected projection explanation | 109,191 | 109,603 |
| Selected dependent-columns explanation | 109,191 | 109,864 |
| Selected numeric input | 109,191 | 108,708 |
| Composition modules plus static closure | 110,940 | 112,387 |
| All matrix dynamic chunks, union | 113,393 | 115,540 |

The baseline host always fetched the full source registry, even on original and
composition routes. Thus its actual original activation included 2,453 bytes
omitted from the old static-only number. Lazy loading saves 1,007 bytes on the
original route despite navigation overhead. Selected explanations grow 412/673
bytes overall. These are compressed build closures, not latency measurements;
the union also grows, so this is not an across-the-board payload reduction.

The measurement now names both selected composition and `matrix-all`. The latter
retains the old all-lazy accounting; no consumer disappears. New selected-source
cohorts use the unchanged 111,000-byte column-player ceiling. The diagnosed
composition ceiling changes from 111,500 to 113,500 (1,113 bytes of headroom);
the explicitly retained union is bounded at 117,000 (1,460 bytes headroom).
The additional code buys persistent comparison, exact restoration and failure
recovery. Removing those behaviors merely to meet a stale ceiling was rejected;
splitting all source bodies and avoiding prepared-DOM caches are the boundary
repairs. Broad renderer optimization is outside this change.

Three small row budget amendments are also explicit, under standing engineering
budget-repair authority. All other existing limits and all CSS limits remain:

| Consumer | Baseline | Current | Old ceiling | New ceiling |
| --- | ---: | ---: | ---: | ---: |
| row-guided | 117,064 | 117,098 | 117,000 | 118,000 |
| row-composition | 123,103 | 123,137 | 123,000 | 124,000 |
| row-composition-sequence | 123,974 | 124,008 | 124,000 | 125,000 |

The first two already failed before this work. Normalized module inventories are
identical for all three consumers; none imports a new reader/source module.
The 34-byte shifts occur in emitted shared chunks/import identifiers after the
entry graph changes, not new row functionality. Retain every consumer and gate;
do not represent this headroom correction as an optimization. The measurement
now writes complete closure evidence before enforcing budgets, so failed gates
can be diagnosed without first raising limits.

## Executable evidence

- Matrix unit cohort: 23 pass, including source identity/title and exact position
  round-trips, invalid progress, signed contributions and preserved semantics.
- Full typecheck passes; test types also pass after production-browser additions.
- `npm run visual:matrix-interpretations`: all 21 Chromium checks pass. Includes
  the accepted scenes, both explanatory sources, themes/reduced motion/phones,
  exact comparison/history, delayed loads, failure rollback and disposal.
- The initial focused navigation run was 2 pass / 1 fail: the test tried clicking
  links deliberately hidden in embedded mode. It now checks query preservation
  with a visible host context. The corrected three-test rerun and complete suite
  both pass. No production behavior was changed to satisfy that mistaken test.
- `npm run visual:semantic-cost -- --grep 'matrix source navigation'` passes on
  built production assets. Twelve source switches after warmup make zero new
  resource requests and only one document request total. Post-GC counters remain
  2,772 nodes, one document and 30 event listeners. Heap samples rise from about
  4.07 MB to 4.39 MB; they are diagnostic, not evidence of constant process memory.
- `npm run measure:semantic-cost` passes all complete closures after the measured
  policy amendment. Its initial failure and baseline reproduction remain recorded.
- `npm run build:bundle` passes, including canonical source freshness checks.
- `npm test`: all architecture/inference/catalogue gates and 7,389 tests pass,
  with none skipped. No human learner outcome or universal compositor
  certification is claimed.
- The initial cross-browser run exposed a test assumption: WebKit pointer clicks
  did not focus the link. The check now activates a focused link with Enter to
  verify keyboard focus preservation. No pointer behavior is forced in production.
  That run also collected six copied tests from the temporary baseline worktree;
  the scoped Playwright config now fixes `testDir` to `./tests`, structurally
  excluding scratch copies. The duplicates are not counted as extra coverage.
- Corrected three-engine command:
  `npm run visual:matrix-interpretations -- --project=firefox --project=webkit --grep 'persistent comparison|latest matrix|repeated selection|failed native preparation|explanation keeps'`:
  all 18 canonical checks pass (six per engine). The Chromium project is supplied
  by the stable npm command. The baseline worktree was removed after measurement.

## Remaining boundaries

The fixed seven-step presentation, 2×2 numerical input boundary, horizontal phone
stage and plain-text editorial slots remain. Selection reconstructs one player;
it does not animate between different source identities. Sources are trusted
bundled modules, not arbitrary uploaded code. There is no complete no-JavaScript
edition, editable source UI, universal narrative composer or production release.
The next content/API decision should ask which supported explanation needs a
different sequence, rather than add another framework before observing that need.

Outcome: **COMPLETE**, all four packages delivered. The existing accepted visual
treatment was preserved, so no new aesthetic approval is required.
Retrieval context: `theseus work context task.kp.matrix-reader-continuation --mode working`.
