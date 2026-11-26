# Quadratic authoring exemplar evidence

Date: 2026-11-25
Scope: approved M0 in [the mathematical programme](../2026-11-25-mathematical-authoring-programme.md).
Execution: `run-contract.kp.quadratic-authoring-20261125`.

## Accepted result

The user reviewed the exemplar and said "this looks great!", then asked for an
accomplishment summary. Record G1 accepted for the bounded quadratic authoring
presentation and interaction at `9b1b8c908`. M0 is complete. Matrix reuse is the
recommended successor, still proposed; neither the wider mathematical programme
nor shared adapter promotion is approved by this feedback. The measurements and
limits below remain unchanged.

Acceptance reconciliation: all 75 vision/orientation checks pass. The initial
record made the roadmap 651 words; shortening it restored the unchanged 650-word
budget. Theseus validation passes. This update records acceptance and the proposed
successor without changing the mathematical implementation.

## Mathematical resource boundary

The notebook adapter now has validated quadratic, derivative and tangent resources,
persistent UUIDs/revisions and explicit registered recipe versions. Invalid numeric
drafts retain admitted values and remain recoverable. The finite recipe family
requires a source quadratic, so cycles, missing sources and unsupported derivative
chains produce explicit gaps. This first resource-only checkpoint was committed
and backed up as `a093a9b6e`; integration follows below.

Existing expression constructors, differentiation and evaluation remain authority.
The semantic-state model/graph owns dependency evaluation. Source coefficients map
to the stable notebook/resource namespace; occurrences will reference resource UUIDs.
Derivative dependencies deliberately exclude the constant coefficient. One notebook
owner shares computed values, releases removed sources and disposes its cache.

The first pressure test exposed unbounded retained fingerprints in the existing
caller cache. An optional positive capacity now uses least-recently-used eviction;
existing callers keep their prior default. The quadratic owner retains at most
three computed fingerprints and 128 temporary parameter edits before rebasing.
No runtime snapshot escapes that owner; notebook/ProseMirror history owns user
undo. A 300-edit test checks bounded retention and correct results across rebasing.

The existing Graph2D SVG implementation is extracted into a 2D-only entrypoint;
the legacy path reexports it. Scene construction, sample policy, geometry and paint
output are preserved. This avoids importing 3D depth/lighting into the new caller.
Complete notebook payload and interaction measurements belong to integration;
no bundle or latency improvement is claimed from source separation alone.

Checks: six mathematical object tests; 33 existing rendering/cache tests;
`npm run typecheck:fraction-notebook`, including affected rendering/cache consumers;
75 `npm run test:project-vision` checks. Initial compiler/runtime checks also caught
a missing explicit return and strip-only TypeScript syntax; both were repaired.
The direction update exceeded the active-thread budget by one word and was shortened
within its unchanged ceiling. No checks or bounds were weakened.

The impact selector has no focused rule for these dev-host paths and falls back
to production promotion checks. This unpromoted exemplar uses the approved standard
tier: domain invariants, complete affected types, legacy preservation tests and one
canonical Chromium workflow before human visual judgment. Release/promotion remains
outside M0.

## Integrated exemplar and G1 review

Canonical source: `content/notebooks/math-object-exemplar.json`.
Canonical host: <http://127.0.0.1:8000/experiments/fraction-notebook/?notebook=quadratic>.
From the KP pane, `M-x` / `C-x C-x` → **Open mathematical notebook** opens it;
**Open fraction notebook** returns. Both retain separate saved documents and the
existing project chat. The process-managed dev service remains the host.

Reproduce these accepted checkpoints:

1. Change **c** from 0 to 3. The equation and graph move together. Create a
   **Derivative**: it remains 2x when only c changes; changing a or b updates it.
2. Create a **Tangent**, move **Contact x** between -2 and 2, and try **Play**,
   **Pause** and **Reverse**. The contact marker, line, formula and slope share
   domain truth. Zoom out to inspect points outside the current graph viewport.
3. Use **Graph** again, then zoom one occurrence. Both share a source while their
   viewport settings remain independent. Fold one occurrence; the other stays open.
4. Reload. Source/derived UUIDs, recipes, values and local views survive. Enter
   an incomplete numeric draft such as `-`: its text survives and the last valid
   mathematics remains visible with a local explanation.
5. Open chat alongside it. The accepted split, modeline and persistent composer
   remain. Judge whether these object controls and the relationship cues make the
   mathematical editing loop understandable, including in reading mode.

G1 is now accepted for this exemplar; shared promotion still needs a distinct caller.
M1 matrix reuse and the 24-outcome portfolio remain outside this run. The seed is a
repository-authored example, not evidence of autonomous LLM generation or learning.

### Ownership and prevention

The persisted notebook adds optional mathematical resources and occurrence cells.
Ordinary fraction JSON remains unchanged. A nonselectable ProseMirror data node
holds resources in native transaction history; JSON serialization removes this
buffer representation. The initial browser test exposed that mutable document-root
attributes recreate every NodeView and lose input focus. Moving resource edits to
their own node prevents that root replacement; browser assertions retain input
focus and mounted graph identity through editing and undo.

Graph creates another occurrence of the same source. Clipboard copying allocates
an independent source/dependency closure. Derivative and tangent create explicit
versioned dependencies. Cross-notebook resource import is rejected with a repair
message; this pilot does not implement the programme's live/pinned import work.

Buttons resolve their own occurrence at invocation. M-x captures the selected
document revision and rejects a stale command after another admitted edit. Both
use the existing registry. Slider previews avoid persistent writes until release;
release makes one undoable edit. Escape, pointer cancellation, document edits and
disposal cancel transient playback. Existing reader-clock direction and endpoint
semantics own motion; reduced motion settles directly. No new animation scheduler,
algebra engine or graph geometry implementation was introduced.

The owner reuses source expressions across views; a constant-term change retains
the derivative calculation. Folded objects skip mathematical rendering; the
reading iframe defers document rendering while editing. Visible SVG nodes update
in place. Unfolded offscreen occurrences still redraw in this bounded pilot; no
book-scale virtualization claim is made. Curves use the existing 161-sample 2D
scene and smoothing path, a graphical approximation rather than an exact solver.

### Verification and diagnosed failures

- `npm run test:notebook-mathematics`: eight tests, including native undo and
  persistence conversion, analytic oracles, cache limits and contact/slope truth.
- `npm run visual:notebook-mathematics`: seven Chromium cases, including local
  views, copy, invalid drafts, save/reload, drag/clock interruption, stale commands,
  startup theme and desktop runtime measurements. Desktop editing/reading and
  narrow dark screenshots were inspected. This is not cross-browser certification.
- `npm run test:fraction-notebook`: 28 existing preservation tests pass.
- `npm run typecheck:fraction-notebook`: complete affected consumers pass.
- Initial `visual:editor-chat`: 36 existing cases passed; the added switch test
  invoked a notebook-scoped command from Chat and timed out. Its corrected focused
  rerun passes by selecting the KP pane, preserving the intended ownership rule.
  The final complete rerun passes all 37 cases, including retained drafts across
  notebook switches. That switch case also covers the explicitly enabled legacy
  site header; the existing workspace-frame cases cover the headerless default.
- Initial `visual:fraction-notebook`: 23 passed, two failed. One assertion still
  expected the former dark border although the accepted light palette and CSS are
  unchanged. The other treated recovered-draft readiness as completed iframe
  hydration; two focused reproductions passed. The check now waits for reader
  hydration using its existing 45-second startup budget, then requires the queued
  revision acknowledgement within the normal response budget. The final complete
  rerun passes all 25 cases, including the unchanged native fraction reader build.
- The configuration gate initially rejected the new scoped Playwright entry.
  Inspected its exact test, output path, 60-second timeout, three inherited browser
  definitions and absent server launcher, then added only its policy hash to the
  existing fixture. Existing policies and budgets were not refreshed.
  `npm run check:playwright-configs` passes all 74 configs / 179 projects.
- `npm run test:project-vision`: all 75 checks pass with the roadmap, active thread
  and source-linked vision pointing to this G1 judgment, without claiming acceptance.

### Measured cost and limits

`npm run measure:notebook-mathematics` compares complete independent production
consumers with accepted baseline `1c1e8791c06f106f7237a2a92666309bf9b6ece5` without
changing checkouts. It includes reachable lazy chunks and all emitted font formats;
per-file gzip sums are estimates, not HTTP transfers. HTML, API payloads, server
work and transport overhead are excluded. It also typechecks both revisions'
complete scoped configurations against the same installed dependencies; the new
scope adds mathematical, rendering/cache tests and measurement code.

Final complete measurement (bytes; independent consumers, so do not add the rows):

| Consumer and closure | Baseline raw / gzip | M0 raw / gzip |
| --- | ---: | ---: |
| Notebook initial JS | 1,415,710 / 466,189 | 1,425,019 / 470,920 |
| Notebook complete JS/CSS | 1,609,692 / 519,265 | 1,712,440 / 549,119 |
| Notebook all emitted assets | 2,914,804 / 1,617,941 | 3,017,552 / 1,647,795 |
| Native reader initial JS | 442,492 / 124,911 | unchanged |
| Native reader complete JS/CSS | 1,249,847 / 339,678 | unchanged |
| New mathematical reading initial JS | — | 545,710 / 159,635 |
| New mathematical reading complete JS/CSS | — | 599,009 / 173,357 |
| New mathematical reading all emitted assets | — | 1,904,121 / 1,272,033 |

Notebook initial JS grows by 4,731 gzip bytes; the complete JS/CSS closure grows
by 29,854. No math runtime or graph renderer enters the ordinary notebook's
initial JS, and the mathematical consumer excludes 3D, the animation catalogue
and MathJS. The mathematical reading adds an independent read-only ProseMirror/
KaTeX consumer; shared fonts remain browser-cacheable. All-emitted figures include
every font format, not a claim that browsers download every format.

Both complete TypeScript consumers pass. Baseline → M0: root files 53 → 63,
resolved files 444 → 569, types 122,443 → 156,061, instantiations 131,357 → 174,302.
This is added checking cost, including the new mathematical code, preservation
tests and Vite/TypeScript measurement consumer; no compiler-speed improvement is
claimed. No compiler budget or existing baseline was raised.

Desktop Apple M2 / macOS arm64, Chromium 149.0.7827.55, 1440×1000, one cold browser cache on a warm Vite
server: controls ready in 570 ms; three warm reloads 444/572/699 ms. Sixty numeric
edits measured 17.5 ms p95 to the next RAF (a paint-opportunity proxy); 90 tangent
playback intervals measured 17.4 ms p95. Sixty warm metadata searches over 5,000
synthetic records measured 3.0 ms p95, without solvers. Existing M-x has five visible
rows but mounts its small full command registry: this does not certify a 5,000-row
UI or fulfill the wider programme's five-mounted-row target. Phone performance,
browser cohorts and learner effectiveness remain unmeasured.

Maintenance added: one narrow quadratic resource/runtime adapter, one mathematical
NodeView/2D projection and selected-fixture reading host, optional registry button
target resolution, plus bounded cache capacity at the existing owner. Coefficients
are finite decimals in [-10,10], tangent contact in [-4,4], at most 32 resources;
linear and constant degeneracies are admitted. No arbitrary CAS, higher-order
derivative chain, general concept catalogue or 3D notebook authoring is claimed.

### Review handoff

Initial stop state: **HUMAN_CHECKPOINT**, the planned G1 review. The selected task
and run contract were deferred for that judgment with implementation complete.
Subsequent user acceptance above closes this bounded run as **COMPLETE**.
`theseus workspace validate` passes (1,333 nodes / 34,848 events). The final
orientation/vision suite also passes after recording this stop state.

The global `theseus workspace handoff --limit 3` still proposes the older
authoring-to-practice run and reports pre-existing global hygiene gaps. It is not
authority to resume that work. Use the roadmap-selected contract and the bounded
resume command `theseus work context task.kp.quadratic-authoring-20261125 --mode brief`.
The shared process-managed server is running from the product worktree; the
browser suites exercised the actual review host. Disposable measurements and
screenshots are removed after review; stable commands above reproduce them.
