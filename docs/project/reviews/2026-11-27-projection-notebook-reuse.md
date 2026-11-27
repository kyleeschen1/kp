# Persistent projection notebook

Date: 2026-11-27
Status: implementation approved by “go as long as possible”; implemented second-host candidate, human review pending.
Execution: `run-contract.kp.projection-notebook-reuse-20261127`.

## Outcome and authority

An author saves an integer R2 vector pair, discovers its projection explanation,
and reuses the accepted presentation inside a notebook. Native undo/reload retain
sources and occurrences; linked occurrences observe the same source but have
independent playback. Ordinary copy produces an independent source; cut/move
preserves identity. This advances reuse in the twelve-loop studio horizon before
the next transformation/composition family.

Canonical host: `/experiments/fraction-notebook/?notebook=projection`. Canonical
presentation: the accepted `/experiments/inner-product-projection/`. Semantic
authority remains the vector projection compiler and eight-beat sampler; KaTeX
and Graph2D/SVG own notation and geometry. Extract only the demonstrated shared
presentation. Notebook history owns source edits; each mounted view owns its
existing reader clock. No new animation choreography or generic math evaluator.

Preserve fraction scrolling, matrix/quadratic schemas and behavior, the independent
projection reference, current chat, theme overrides and typed invalid-input gaps.
Rollback unit: additive projection notebook resource/host integration. The shared
presentation extraction is independently recoverable. New optional resources do
not rewrite existing saved documents. Exclude decimals, mixed-family notebooks,
cross-notebook Derive/Transclude, arbitrary inner-product spaces, paid model calls,
deployment, and new mathematical families in this finite tranche.

## Packages and gates

1. **source:** strict persistent vector-pair data, last admitted source, stable
   identities, native history round trips and independent-copy semantics. Guard
   invalid external data, duplicate IDs, missing links and capacity reclamation.
2. **host:** reuse accepted notation/graph/player in reference and notebook;
   source inputs, linked explanation, folding, commands/discovery, reader and
   lazy loading. Preserve focus during edits and dispose hidden/removed players.
3. **verification:** focused source/controller/lifecycle tests, scoped and full
   types as needed, Chromium/Firefox notebook workflows, narrow/theme checks,
   reference preservation, architecture and complete emitted payload accounting.
4. **review:** one second-host review packet. Judge readability and practical
   authoring/reuse, not unchanged choreography again. Stop before broader family
   promotion; record any independent next recommendation from the existing horizon.

Use a six-hour ceiling with the final hour reserved for checks and backup. Finish
earlier when scope is complete or this new host needs human judgment. Commit
coherent recoverable slices with evidence and back up at least hourly and at
handoff. Repair observed ownership, lifecycle and budget failures in scope.
No routine phase permission requests. Actual-model revision remains pending
separately and must not be reported complete based on deterministic transport tests.

## Implemented workflow and review

Open `http://127.0.0.1:8000/experiments/fraction-notebook/?notebook=projection`.
The seed contains editable prose, a saved vector pair and its linked explanation.
Change a coordinate and scrub the explanation. Use **Explain projection** to add
another occurrence: both observe the same saved source, while their sliders remain
independent. **Linked view** adds another input view of that source. **Return to
inputs** navigates without an undo event. Fold/unfold and reload retain local
playback; editor and reader keep separate playback preferences.

Select a vector-pair heading, then M-x or C-x C-x → **Discover selected mathematical
object**. The existing row picker offers explanation and linked-input commands.
**Insert new vector pair** creates an independent object. Native copy/paste also
creates an independent source when the original remains; cut/move preserves
identity. Copying multiple views together retains their internal sharing. Clipboard
items require their source to remain available in this notebook: this is not a
cross-notebook import protocol. Sixteen source pairs and eight active occurrences
per source bound this exemplar. Deletion releases occurrence capacity immediately;
unused source records are reclaimed atomically when insertion needs capacity.

Try an incomplete coordinate such as `-`, reload, then repair it. Both the draft
and last admitted source survive; playback is disabled until the draft is valid.
Setting b to (0,0) is a valid source with an explicitly undefined projection, not
an invalid draft or a stale visible graph. Integer bounds remain −1000 to 1000.

Judge whether editing, discovering and reusing this explanation feels coherent
inside the notebook, especially on a narrow screen. Use **Toggle editing** through
M-x to inspect the reader, and **Set theme** for the inherited light/dark palette.
The eight-beat choreography is unchanged; this review concerns the new host.

## Ownership and maintenance

The reference and notebook now share `src/projection-explanation/`: a strict
data/draft boundary, source preparation through the existing semantic compiler,
notation/Graph2D paint and one existing reader clock per mounted occurrence.
Architecture ownership classifies those responsibilities separately. There are
no new dependencies, renderer exceptions, mathematical evaluators or global clocks.
The notebook adapter owns storage/history/selection, not arithmetic or animation.

Within each host, a cache keyed by source identity and admitted coordinate values
shares calculation among occurrences. It does not trust revision numbers alone:
undo/re-edit can reuse a revision with different content. Invalid drafts reuse the
last admitted geometry. Unrelated document changes retain the mounted player;
source changes pause and update it without replacing input DOM or losing focus.
Hidden editors, hidden readers, folded/deleted views and disposal release their
players. Generation checks reject late imports after folding/removal. The existing
clock pauses offscreen, on blur and document hiding; no scroll manipulation added.

The optional `projectionResources` field and `projectionObject` node preserve old
notebooks unchanged. The selected projection host loads lazily. Native KaTeX and
its fonts remain shared within each host's module graph; the existing reading
iframe has its own runtime as before. No universal content schema, mixed-family
notebook or cross-host live subscription is claimed.

## Verification findings and policy reconciliation

The initial scoped typecheck caught an unsupported `onfocusin` DOM property; it
now uses the standard event listener. The first discovery tests retained a literal
five-command inventory: the two new owned commands are now explicitly included,
while the evaluator-free discovery import closure remains enforced.

Screenshot inspection caught ProseMirror's inherited preserved whitespace turning
generated HTML indentation into extra vertical space. The renderer now owns normal
whitespace inside its subtree; authored prose remains untouched. A computed-style
regression protects this boundary. A dark-theme check now goes through the real
workspace theme command and verifies realized graph paint, rather than merely
setting the independent reference's different theme attribute.

The delayed-import test initially missed Vite's timestamp query and then removed
its route before the pending continuation completed. Both harness errors were
repaired. The capacity check initially pressed Delete in normal mode, where that
binding is deliberately absent; it now exercises supported native cut. This work
adds no Vim bindings or claims of additional Vim parity.

The tooling gate exposed stale inventory/policy snapshots. The bounded amendment
adds the earlier standalone projection config and this notebook config (three
declared browser projects each; shared port 8000, no spawned server), and records
the existing matrix linked-embed test addition from `1e6877328`. The Vite snapshot
now includes the already implemented notebook theme startup injection and palette
hot-update invalidation hooks in both resolved modes. Existing policies, timeouts,
test discovery and consumers remain intact. These are explicit inventory repairs,
not blanket baseline regeneration or weakened checks.

Measured against `794ba3eb7351324035478a5d310cd1709809039b`:

| Complete consumer | Before | After | Qualification |
|---|---:|---:|---|
| Notebook initial JS | 475,511 | 476,678 | gzip bytes, +1,167; projection evaluator/player remain lazy |
| Notebook complete JS/CSS | 619,318 | 633,651 | gzip bytes, +14,333 across all lazy chunks |
| Notebook all emitted assets | 1,717,994 | 1,732,327 | gzip bytes, includes all emitted font formats; 108 files |
| Native reader complete JS/CSS | 340,792 | 340,792 | unchanged |
| Scoped TypeScript instantiations | 202,334 | 204,793 | complete current scoped consumers, +2,459 |

`npm run measure:notebook-mathematics -- --baseline 794ba3eb7351324035478a5d310cd1709809039b`
builds full independent consumers and enforces lazy projection ownership. The
mathematical reading emits 237,930 gzip JS/CSS bytes, 1,336,606 including its assets.
The independent projection build emits 103,020 gzip JS/CSS bytes and 1,014,618 total,
64 files. These are per-file gzip estimates, not network transfer, memory or frame
timing. The full notebook is still a substantial editor application; this slice
does not claim to have made the entire studio lightweight.

Final verification:

- `npm run test:projection-notebook`: 38 passed, including source/history/copy/cache
  laws, the existing matrix/quadratic persistence suites and metadata discovery.
- `npm run test:fraction-notebook`: 28 passed; original fraction admission,
  serialization, structural editing and preview boundaries retained.
- `npm run visual:projection-notebook -- --project=firefox`: 14 passed without
  retries after the documented harness repairs. Runs both Chromium and Firefox,
  including the original independent reference, source edits, separate sliders,
  native copy/cut/undo/reload, invalid/zero states, stale picker captures, folding,
  delayed imports, capacity recovery, 390px width and real light/dark settings.
- `npm run typecheck`: full application/node/tests/Svelte/domains passed.
  Final `npm run typecheck:fraction-notebook` and `npm run typecheck:tests` passed
  after the late test and shared renderer refinements.
- `npm run check:architecture` and `npm run check:tooling-configs` passed after
  assigning the new modules to their responsible layers and the explicit
  inventory reconciliation above. No retiring dependency exception added.
- `npm run test:project-vision`: 75 passed. The first run caught expanded startup
  summaries; those summaries were shortened under the existing 650/450-word
  limits, preserving linked evidence and without raising either budget.
- Both complete-consumer measurement and independent projection production build
  passed. Theseus workspace validation passed (1,363 nodes, 35,385 events), as did
  Git whitespace checks. Contract state is HUMAN_CHECKPOINT, 3/4 packages complete.

The impact selector had no focused notebook-schema rule and suggested its broad
fallback. This bounded candidate uses the declared domain/persistence suites,
full types, architecture, real two-browser workflows and complete consumer builds.
The repository-wide `npm test`, root production build and WebKit visual suite
were not run; no general release or publication claim is made.

The next mathematical family remains transformation composition and signed area
from the approved studio horizon. Scope that finite exemplar after this host
review; do not silently turn notebook acceptance into all-family promotion. The
real-model contextual revision trial remains pending separately.
