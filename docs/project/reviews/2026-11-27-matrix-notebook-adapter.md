# Matrix notebook adapter — G2 candidate

Date: 2026-11-27
Authority: [approved bounded adapter](../2026-11-27-matrix-notebook-adapter.md).
Contract: `run-contract.kp.matrix-notebook-adapter-20261127`.
Human acceptance and shared adapter promotion remain pending.

## Inspect this exemplar

Open <http://127.0.0.1:8000/experiments/fraction-notebook/?notebook=matrix>.
From another notebook, M-x / C-x C-x → **Open matrix notebook** opens the same
fixture. Its canonical seed is `content/notebooks/matrix-object-exemplar.json`.

1. Change A11 from 1 to 3. The product becomes (5, 2) in the equation and graph.
   Change v1 too: both representations follow the same registered computation.
2. Use Graph, or select the object and invoke **Graph selected matrix-vector
   product**. Zoom one graph: the other retains its range. Fold either locally.
3. Enter `-` in a field. The draft remains visible, while the last valid
   mathematics stays on screen. Undo/redo and reload retain identities and values.
4. Copy an object into a new prose block: its source/dependency closure is
   independent. Graph creates a linked occurrence instead. Open the quadratic or
   fraction notebook and return; saved drafts and the existing chat remain separate.
5. Toggle Edit through commands to inspect the read-only presentation. Judge
   whether the compact controls, vector legend and source/view relationship are
   understandable at desktop and narrow widths. This is a static linked-view
   authoring exemplar, not new matrix animation choreography.

## Ownership and boundaries

`src/math-resources/public-api.ts` remains mathematical authority. The pinned
`matrix2.vector2@1` recipe uses the existing typed matrix and semantic-state
owners; no second arithmetic or caching system was added. `data-api.ts` exposes
admission independently so ordinary notebook startup does not import evaluation.
KaTeX supplies equations, and the existing Graph2D projection/SVG owner supplies
coordinates and axes. A small retained vector adapter paints supplied endpoints;
equal axis units preserve geometric angles. Thin strokes inherit theme variables,
and input/result vectors also differ by dash and endpoint treatment.

The notebook adds optional matrix-resource data and cells referencing explicit
view occurrences. The hidden data node reuses native ProseMirror history without
replacing the root, focused controls or mounted graphs. Each host has one bounded
evaluator per source closure. Additional views reuse its calculations; separate
copies receive fresh source, product and occurrence identities. Reader and editor
are separate hosts; the reader defers updates while editing. No single global
cache or shared iframe runtime is claimed.

Admission rejects unknown recipes, missing sources/views, duplicate UUIDs and
reused occurrence IDs. Replacement source closures require new identities before
any evaluator updates, preventing a partial refresh. Removed runtime owners are
disposed. The source/view bounds remain finite: 2×2 real matrices, 2-vectors,
numeric fields in [-10,10], 16 resource closures and up to eight stored occurrences
per closure. View extents are local. Cross-notebook imports remain unsupported.

Storage is `kp-matrix-notebook-v1`, with a separate session recovery key. Existing
quadratic and fraction data are not migrated. Source data survives deletion of
its views for undo/cut-paste; this is not automatic resource garbage collection.
No scrolling, window choreography, new dependencies, universal object schema,
arbitrary CAS or publication was introduced. The tabled matrix Pour treatment
remains separate.

## Findings and verification

The first clipboard test exposed a real validation-order error: full notebook
validation rejected temporary duplicate prose IDs before the existing identity
plugin could normalize a split. The matrix transaction filter now guards its
resource/reference invariants, leaving prose identity normalization to its owner;
serialization still validates the complete notebook afterward. The browser
clipboard workflow reproduces this case.

Subsequent test corrections addressed fixture assumptions: copied objects must be
located by UUID, not insertion order; Firefox synthetic ClipboardEvents own their
transfer object; and pasting over a selected graph replaces it, so the copy test
opens a prose block first. Those corrections do not change runtime clipboard
semantics. The initial full Chromium math run passed 9/10; a picker-reopening
assertion failed. The unchanged complete rerun passed 10/10 without a timeout
increase; no root cause is claimed for that initial timing failure.

The Playwright policy changes only the existing mathematics suite's exact test
list to include the matrix workflow. All three inherited browser definitions,
60-second timeout, output directory and no-server-launch policy remain unchanged.
Its inspected hash is updated; no timing budget was raised.

Production inspection found matrix evaluation in the ordinary notebook's initial
chunk through the combined facade. Separating data admission reduced that same
working tree's initial JS from 1,503,320/489,224 raw/gzip bytes to
1,433,290/472,959: 70,030 raw and 16,265 estimated gzip bytes moved out of startup.
The total JS/CSS closure is 1,739,517/558,688; code is deferred, not eliminated.
The stable measurement now guards the matrix runtime/controller alongside the
quadratic owners, and a transitive data-API test rejects evaluator/renderer imports.

`npm run measure:notebook-mathematics` builds complete consumers and checks both
complete scoped type configurations. Its historical baseline predates M0, so its
baseline-to-current totals include prior work and are not this adapter's isolated
cost. Gzip sums are emitted-file estimates, not network/phone startup measurements.
Current type scope: 74 root files, 629 resolved files, 164,975 types and 190,156
instantiations. No compiler budget or dependency was changed.

Final checks: 12 notebook mathematical tests, 28 fraction preservation tests,
seven independent mathematics-lab tests, six lane/service/import-boundary tests,
the full architecture chain, complete scoped and repository-wide TypeScript,
production measurement and 78 Playwright configurations pass. Svelte reports
zero errors and warnings. The expanded chat-switch workflow passes, preserving
the unsent composer across all three notebooks.

The complete Chromium mathematics suite passes 10/10. After the data-entry
repair and Firefox test corrections, all six matrix checks pass across Chromium
and Firefox. Inspected final Firefox desktop and narrow captures. Four targeted
fraction browser checks pass (native prose/undo, phone imports, concurrent drafts,
and production reader closure). Their first run passed 3/4, timing out at native
reader hydration during concurrent compiler work; the unchanged full four-case
rerun passes. No timeout was increased and no causal diagnosis is claimed.

## Checkpoint and next decision

Data adapter checkpoint: `1eff76610`. The visible integration, loading repair and
review evidence form the second reversible checkpoint. Inspect G2 before deciding
whether to promote any shared notebook adapter or add mathematical operations.
Do not resume the wider programme automatically. Resume this boundary with
`theseus work context task.kp.matrix-notebook-adapter-20261127 --mode brief`.

Stop state: **HUMAN_CHECKPOINT**, 2/3 packages complete, G2 pending. The task and
contract are deferred explicitly for that judgment; the global legacy loop
counter does not select this task. The roadmap-selected orientation does.
All 75 project vision/orientation checks pass. Theseus validates 1,348 nodes
before backup. The process-managed port-8000 host remains running.
