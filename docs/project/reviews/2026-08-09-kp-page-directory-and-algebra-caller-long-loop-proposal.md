# KP Page Directory And Algebra Caller Long-Loop Proposal

Date: 2026-08-09
Status: accepted; execution approved 2026-08-09
Proposed contract: `run-contract.kp.page-directory-and-algebra-caller-v1`
Source recommendations:
- `2026-08-09-post-payload-algebra-production-next-step-review.md`
- `2026-08-09-kp-article-v1-reader-payload-recovery-closeout.md`
- `../decisions/2026-08-08-kp-universal-dev-toolbar-queue.md`

## Objective

First, make every first-party development page reachable through real clickable
links in one host-owned page selector at the bottom of the document beside
Review and route-local controls such as Edit. Then author one compact
multi-step algebra article as the structurally different second
`kp.article.v1` caller, using the existing canonical fraction-composition
animation rather than inventing another runtime or layout.

Estimated elapsed work: 8–14 hours across 30 bounded slices. The navigation
tranche is expected to occupy roughly one quarter of the run; the algebra
caller, verification, and final human checkpoint occupy the remainder.

## Canonical Reference And Acceptance

The accepted economics development toolbar is the visual reference. The page
selector adds no new learner-facing chrome and no independent visual motif. It
uses the toolbar's existing surface, typography, spacing, focus treatment, and
responsive placement.

Observable navigation acceptance:

- a **Pages** control is visible in development beside Review and, on the
  economics authoring route, Edit;
- it opens grouped, real `<a href>` links so ordinary click, open-in-new-tab,
  and copy-link browser behavior work;
- it identifies the current page and covers all supported first-party Vite
  entry pages and internal SPA views, while excluding test fixtures;
- the selector is present on the catalogue, internal views, concept room,
  tutorials, common and specialized readers, and diagnostics;
- each link resolves without a terminal URL lookup, 404, duplicate toolbar,
  or hidden Review launcher;
- production HTML and JavaScript contain no development toolbar or page
  directory, and static/no-JavaScript publication remains unchanged.

Observable algebra acceptance:

- one canonical `.kp.md` source publishes at a stable algebra tutorial URL;
- it reuses the existing fraction-composition semantic asset and renderer
  through a versioned vignette with at least two independently addressable
  motion ranges;
- prose, KaTeX, semantic links, checkpoints, static figures, reduced motion,
  direct seek/rewind, no-JavaScript reading, and whole-file editing work;
- the article grammar remains frozen and the pre-caller common reader closure
  of 124,778 gzip bytes remains the recorded comparison baseline;
- a deterministic visual package is ready for a human teaching and attention
  checkpoint.

## Preservation Boundary

Preserve the framework-neutral semantic/runtime/renderer authority, the frozen
`kp.article.v1` grammar, one-clock direct sampling, static HTML/MathML/SVG,
current reader payload ceilings, existing economics and Lisp routes, and the
user's uncommitted economics source/publication edits. The page directory is
development-only and cannot become learner navigation by accident.

The smallest navigation rollback unit is the host-owned page-directory control
plus its dependency-free manifest. Each route mount is separately reversible.
The algebra rollback unit is the new article, lockfile, vignette, route, and
its tests; the existing fraction-composition reader remains untouched.

## Allowed Work

- `src/dev-toolbar/`, development-only route mounts, dependency-light route
  directory metadata, Vite input/conformance checks, and scoped toolbar tests;
- making currently internal SPA surfaces canonically addressable when the page
  directory would otherwise point at an unreconstructible view;
- a new algebra article source and lockfile, a fraction-composition vignette,
  layout-neutral compilation/publication, a stable tutorial route, and the
  minimum caller-proven shared seams;
- focused documentation, Theseus evidence, stable visual entrypoints, and
  measured payload/bundle checks.

## Disallowed Work

- learner-facing global navigation, final floating TOC geometry, or layout
  selection/redesign;
- changes to the user's current economics prose or its generated publication;
- a new animation clock, renderer, algebra truth model, article directive, or
  arbitrary executable Markdown;
- generalizing an article/vignette/editor seam beyond what economics and
  fraction composition both require;
- advanced CodeMirror history/completion, Internal Studio, Public Web, Graph3D,
  Lisp promotion, or the tabled matrix/vector frontier.

## Ordered Slices

Every implementation slice receives a bounded Theseus context receipt and an
independent commit after its stated checks. A failed invariant, required scope
expansion, production leakage, payload-ceiling breach, or semantic mismatch is
a stop condition rather than permission to widen the contract.

| # | Target and intended change | Risk | Verification and expected checks | Commit / stop condition |
| ---: | --- | --- | --- | --- |
| 1 | Define a dependency-free development-page descriptor, group vocabulary, canonical URL policy, and current-page matcher. | Low | Focused: new unit tests through `npm run test:dev-toolbar`. | Commit descriptor contract; stop on ambiguous identity for query-backed views. |
| 2 | Populate the directory with the catalogue, editor, dashboard, animation host/workbench, FTC, concept room, tutorials, readers, and diagnostics; exclude fixture harnesses. | Medium | Focused: uniqueness, absolute-path, label, ordering, and exclusion tests. | Commit manifest; stop if a listed surface has no reconstructible URL. |
| 3 | Add a drift gate comparing the browser-safe directory with reader-route authority and supported Vite entry inputs without importing compiler graphs into browser code. | Medium | Standard: directory tests, typecheck, architecture boundary check. | Commit gate; stop if closure requires a runtime import of the reader compiler. |
| 4 | Make the project dashboard a canonical query-addressable internal view and align existing internal-view navigation with browser history. | Medium | Focused: route parser/navigation tests and dashboard browser smoke. | Commit route repair; stop if it alters catalogue default routing. |
| 5 | Extend the toolbar protocol with one host-owned Pages directory control that route contributions cannot omit or override. | Low | Focused: `npm run test:dev-toolbar`. | Commit typed protocol; stop on collision with route-local choices. |
| 6 | Render Pages as a grouped disclosure containing real anchors, current-page indication, stable link order, and native new-tab behavior. | Medium | Focused DOM/browser assertions for roles, hrefs, `aria-current`, and no click interception. | Commit renderer; stop if link semantics require a custom navigation clock. |
| 7 | Add keyboard, focus, disclosure-close, and long-label behavior using native semantics with only the minimum event handling. | Medium | Standard: toolbar unit tests plus keyboard Playwright coverage. | Commit interaction; stop on focus loss when returning to the document. |
| 8 | Fit the selector into the accepted wide toolbar without changing Review/Edit ordering or economics theme tokens. | Low visual | Focused: deterministic economics toolbar capture and geometry assertions. | Commit wide styling; stop on document overlap or toolbar duplication. |
| 9 | Add compact phone/short-viewport overflow behavior without shrinking tap targets or hiding labels from assistive technology. | Medium visual | Browser: phone and short-viewport toolbar checks. | Commit responsive style; stop if ordinary document content becomes unreachable. |
| 10 | Complete the economics exemplar: Pages beside Review/Edit, current tutorial marked, and a link opens another page/new tab while source state remains intact. | Medium | Broad exemplar: `npm run visual:economics-dev-toolbar` and authoring smoke. | Commit exemplar; stop on editor/modal or Review regression. |
| 11 | Mount and identify the directory across root SPA surfaces: catalogue, editor, dashboard, animation host/workbench, FTC, and concept room. | Medium | Browser route matrix with exactly one toolbar and correct current link. | Commit root coverage; stop on eager loading of an unrelated surface. |
| 12 | Confirm the Lisp tutorial uses the same directory and review host without taking ownership of its unresolved visual checkpoint. | Low | Browser: existing toolbar route test plus Lisp smoke. | Commit Lisp coverage; stop on any Lisp choreography change. |
| 13 | Add a development-only toolbar mount to the shared equation-reader entry without adding it to production closure. | High payload | Standard: reader unit/conformance subset and production-closure attribution. | Commit common-reader mount; stop on production bytes or duplicate Review UI. |
| 14 | Cover the specialized distribution and quadratic reader entries through the same lazy development seam. | Medium | Browser route tests and specialized route budget checks. | Commit specialized coverage; stop if either imports the common equation runtime. |
| 15 | Mount the same selector on canonical-review and glyph-reconciliation diagnostics while preserving their existing review capture. | Medium | Browser diagnostics smoke and one-toolbar assertions. | Commit diagnostics coverage; stop on review-provider ownership conflict. |
| 16 | Audit every directory anchor by navigation: successful document, expected page identity, current marker, Review availability where supported, and no fixture entry. | Medium | Broad: stable scoped Playwright route-directory command. | Commit audit; stop on any unresolved or mislabeled first-party route. |
| 17 | Prove development-only isolation and layout stability in production builds. | High release | Broad: `npm run build`, `npm run check:dev-review-production`, `npm run check:reader-production`, `npm run check:reader-budgets`. | Commit closure evidence; stop on any toolbar string/module in learner closure or budget regression. |
| 18 | Close the navigation tranche with durable route inventory, verification evidence, and user-visible inspection instructions. | Low | Standard: `theseus workspace validate`; review prior recorded checks. | Commit tranche closeout; stop if durable and executable inventories disagree. |
| 19 | Define the compact algebra teaching brief around the existing two-thirds fraction-composition solve, its claims, static checkpoints, and at least two motion ranges. | Medium semantic | Focused: existing fraction-composition semantic/evaluation tests and source audit. | Commit brief/contract evidence; stop if requested prose would misstate the canonical trace. |
| 20 | Wrap the existing fraction-composition asset in a versioned article vignette with object, transition, checkpoint, accessibility, and static-projection metadata. | High boundary | Standard: vignette, import-lock, accessibility, and preservation tests. | Commit vignette; stop if semantic truth must be duplicated or inferred from glyphs. |
| 21 | Add the canonical algebra `.kp.md` article and exact import lockfile, mixing ordinary prose, compact focus passages, semantic links, and multiple motion blocks. | Medium editorial | Focused: parse, source-map, identity, reference, and validation tests. | Commit source; stop on any need for a fifth directive or layout attribute. |
| 22 | Compile the second caller through the generic Article v1 document, static Markdown, HTML/MathML/SVG, stage-manifest, deck, and accessibility paths. | High shared | Broad Article v1 suite and deterministic artifact checks. | Commit compiler projection; stop if economics-specific behavior is silently made generic. |
| 23 | Add a stable `/tutorials/algebra/fraction-composition/` entry and static-first page shell, with no JavaScript required for reading or search. | Medium routing | Standard: build, static HTML assertions, direct route smoke. | Commit route; stop on client-only content or duplicate canonical source. |
| 24 | Bind the article stage to the existing canonical fraction-composition renderer/runtime through a lazy capability and the vignette's named ranges. | High runtime | Browser: existing fraction composition determinism plus new route playback smoke. | Commit enhancement; stop on a second clock, second semantic model, or repaint fork. |
| 25 | Implement semantic hover/focus/pin references and checkpoint navigation against stable object paths without making inline links timeline authority. | Medium attention | Focused/browser: reference resolution, keyboard focus, pin, direct checkpoint tests. | Commit semantic navigation; stop on hidden or invented object IDs. |
| 26 | Prove direct URL restoration, seek, rewind, reduced-motion endpoint jumps, and history navigation without replaying intermediate animation. | High lifecycle | Browser: reload/back-forward/deep-link/reduced-motion matrix. | Commit lifecycle; stop on nondeterministic reconstruction or scroll-jacking. |
| 27 | Reuse the whole-file CodeMirror/Vim authoring path for the algebra source, including last-valid preview, `:w`, `:q`, `:wq`, and no-reload save. | High persistence | Broad authoring API/unit/browser save test; preserve economics regression. | Commit second-source authoring; stop if arbitrary filesystem access or grammar change is required. |
| 28 | Pressure responsive fit, searchable text, no-JavaScript reading, keyboard access, forced colors, and static checkpoint comprehension. | Medium release | Browser accessibility/responsive/no-JS checks plus static text assertions. | Commit conformance; stop on clipped math, missing prose, or inaccessible controls. |
| 29 | Measure marginal payload and runtime cost from the 124,778-byte baseline, attribute new closure, and run build/reader/article/full test gates. | High release | Release: build, production closure, reader budgets, Article v1 suite, browser conformance, and `npm test`. | Commit release evidence; stop on ceiling breach, unexplained closure adoption, or any broad failure. |
| 30 | Produce deterministic wide/phone/reduced-motion review artifacts, close the run records, and stop for human review of teaching clarity, attention handoff, and authoring leverage. | Human visual | Manual/runtime checkpoint backed by captured states and exact URL links in the Pages directory. | Commit checkpoint package; outcome must be `HUMAN_CHECKPOINT` unless an earlier stop condition fired. |

## Commit Cadence And Verification

- Commit each completed slice with its Theseus evidence; never stage the
  user's existing economics edits or unrelated untracked documents.
- Use focused tests during the inner loop, standard type/architecture checks at
  each boundary, and broad build/closure/browser/full-suite checks at slices
  17, 22, 29, and 30.
- Reuse the stable `visual:economics-dev-toolbar` command and add one stable,
  scope-specific page-directory browser command rather than driving a changing
  scratch script.
- Derive every heartbeat from `npm run --silent loop:status`.

## Stop Conditions

Stop immediately if:

- production output includes development page-directory code or exceeds an
  established reader budget;
- completing a page link requires test-fixture exposure, cross-repository
  mutation, or destructive work;
- the algebra caller requires changing the frozen article grammar, replacing
  the canonical fraction-composition semantics, or introducing another clock;
- user-owned economics changes would need to be overwritten or committed;
- deterministic tests cannot establish semantic correctness or direct state
  reconstruction;
- slice 30 reaches the mandatory human visual/editorial checkpoint.

## Expected End State

You can open one bottom **Pages** selector from any supported development page
and click directly into every other meaningful KP page without consulting the
terminal. The same run then leaves a real, editable, searchable, static-first
multi-step algebra article at a stable URL, powered by existing animation
infrastructure and ready for your human teaching review. The run does not claim
that KP's final learner layout has been selected.
