# Motion Passage, Publication, And Authoring Long-Loop Proposal

Date: 2026-08-07
Status: superseded in execution order on 2026-08-08; retained evidence
Source Decision:
`../decisions/2026-08-07-kp-motion-passage-vocabulary-and-ordered-horizon.md`
Ordering Authority:
`2026-08-07-motion-passage-publication-authoring-next-step-review.md`

## Objective

> The first nine slices remain completed evidence. The remaining split-first
> order is superseded by
> `2026-08-08-animation-transition-packet-checkpoint-next-step-review.md`,
> which advances layout-independent publication, authoring, and semantic
> navigation before the delayed human checkpoint.

Deliver the accepted immediate tranche in strict order: perfect one stacked
station exemplar, repair static publication and route closure, prove split
projection parity, finish the practical CodeMirror authoring loop, and add
robust motion-passage navigation.

The run contains 30 bounded slices and two mandatory human visual checkpoints.
It is expected to require roughly 8–14 active development hours, depending on
the publication-boundary and startup-long-task findings. Each slice receives a
fresh bounded context, focused verification, durable Theseus evidence, and an
exact commit. Full release checks occur only at promotion boundaries.

## Canonical Reference And Preservation Boundary

The canonical visual reference is the economics `animation-station` projection
at `/tutorials/economics/demand-shift/?layout=animation-station`, preserving the
approved economics model, retained SVG session, deterministic shared player,
semantic salience roles, themes, direct seek/rewind, compiled lesson source,
review capture, and existing split projection.

The smallest visual rollback unit is the animation-station presenter and its
local station stylesheet. Publication, CSS-closure, split-projection, editor,
and navigation phases each remain independently revertible. No slice may
rewrite domain semantics or broaden a presentation rollback into the animation
runtime.

## Visual Acceptance And Promotion Criteria

The stacked exemplar may be promoted after slice 9 only when human review
confirms:

- the initial cue is visible before the station pins, so the page first reads
  as a static document rather than an empty narrative column;
- the graph and text settle together, rails enter only after the graph reaches
  its station, and no scroll position produces a missing or doubled state;
- an ordinary cue approaches, becomes ready, holds for a short reading beat,
  and hands off without opacity-based unreadability;
- a motion cue exposes a clear read-only progress rail and maps one bounded
  scroll corridor to one shared semantic playhead;
- motion finishes before the next explanatory passage takes ownership;
- reverse scroll and direct seek reconstruct the exact state without replay,
  event-history dependence, or a second clock;
- the long-prose release is calm, the stage withdraws in a controlled stagger,
  and neither wheel interception nor scroll snap is used; and
- phone, large-text, reduced-motion, midnight, and light projections retain
  readable document flow.

The split projection may be promoted after slice 22 only when it expresses the
same semantic phases and progress without copying stacked geometry or
regressing the approved current split layout.

## Ordered Slices

### Phase A — Stacked Station Exemplar

| # | Target and bounded change | Risk | Verification and expected evidence | Commit boundary and stop |
| --- | --- | --- | --- | --- |
| 1 | Preserve the current economics station as an explicit fixture. Record DOM ownership, current geometry tokens, compiled source, screenshot anchors, runtime/performance baselines, and the exact presentation rollback path. Add no new choreography. | Low | `npm run test:economics-demand-shift-tutorial`; `npm run test:economics-demand-shift-css`; `npm run visual:economics-animation-station`; compare initial, pinned, terminal, and reverse checkpoints. | Commit preservation fixture and baseline only. Stop if existing deterministic or publication tests fail before the change. |
| 2 | Introduce one pure layout-neutral station phase model: `approach -> ready -> scrub -> settle -> handoff`. Its inputs are local geometry plus authored cue kind; its outputs are active passage, phase, semantic progress, checkpoint, and ownership. Do not paint from this slice. | Medium | Add focused unit/property checks for phase boundaries, monotonicity, exact reverse, zero-height safety, long-passage safety, and direct projection. Run `npm run test:tutorial-motion-page-scale`. | Commit phase model and tests. Stop if it requires a second semantic clock or Svelte-owned per-frame truth. |
| 3 | Replace viewport-global settling heuristics with one local usable-viewport projection. Latch graph placement and station entrance together; bring side rails in only after the graph reaches its station. Express all anchors through named CSS/custom-property inputs that can account for a future header and safe-area inset. | Medium | Extend station browser checks for initial static composition, header offset, resize, zoom, and upward/downward boundary symmetry. Run `npm run visual:economics-animation-station`. | Commit local station geometry. Stop if the initial cue is absent before pinning or graph/text settle on different scroll intervals. |
| 4 | Project cue approach from its bottom edge entering the rail region. Materialize without a card background, begin near `0.95` scale, reach stable ink and scale at `ready`, and keep the complete passage in published DOM. Use transform/opacity only for station entrance paint, not semantic salience. | Medium | Focused browser assertions at just-before, entry, ready, and reverse coordinates; large-text and long-cue overflow smoke. Visual capture in midnight and light. | Commit cue approach projection. Stop for clipping, layout shift, text duplication, or unreadable pre-enhancement prose. |
| 5 | Give an ordinary cue a tokenized reading hold near `10vh`, followed by a deterministic handoff that trades ownership with the next passage without adding semantic animation time. | Medium | Unit tests for corridor independence from passage height; browser checks for short and long cues, fast scroll, reverse, and resize while ready. | Commit ordinary-cue rhythm. Stop if document spacing itself becomes a motion clock. |
| 6 | Add a progressively published, read-only horizontal progress rail to a motion cue. Reserve its geometry in static HTML/CSS, expose accessible progress semantics, and distinguish it from an interactive scrubber. Do not add transport chrome. | Medium | Static/publication assertion with JavaScript disabled; keyboard/accessibility tree smoke; CLS check; focused custom-element/projection tests. | Commit progress-rail structure and styles. Stop if enhancement inserts geometry that shifts the page. |
| 7 | Map the motion cue to a `50vh` scroll corridor, provisionally `40vh` scrub plus `10vh` settle. Drive the existing shared player only; URL, TOC, scroll, future scrubber, and keyboard remain alternate drivers of that playhead. Support exact reverse and direct seek. | High | Player and projection unit tests; browser sampling through forward/reverse checkpoints; direct URL restore; active-frame performance sampling. Run `npm run test:browser:economics-runtime-session`. | Commit motion-cue corridor. Stop if any CSS animation, tutorial-local RAF accumulator, or Svelte rerender becomes motion authority. |
| 8 | Implement terminal long-prose release. As ordinary prose enters, rails separate and fade; the stage then withdraws with small renderer-owned delays across axes and curves, returns to normal document flow, and reconstructs exactly in reverse. Add phone reading fallback and reduced-motion settlement. | High | Browser checkpoints for prose entry, rail release, staggered stage withdrawal, post-station flow, reverse, phone, large text, reduced motion, and both themes. Run `npm run visual:economics-animation-station`. | Commit release choreography. Stop if long prose is clipped, scroll-jacked, nested, or forced through the animation stage. |
| 9 | Stabilize the exemplar with focused regression tests and produce the review capture set. Update only discovery evidence, not shared projection contracts. | Medium | `npm run test:economics-demand-shift-tutorial`; `npm run test:economics-demand-shift-css`; `npm run test:tutorial-motion-page-scale`; `npm run test:browser:economics-demand-shift-tutorial`; `npm run visual:economics-animation-station`; focused performance smoke. | Commit review checkpoint and record Theseus evidence. **Stop with `HUMAN_CHECKPOINT` until the user approves the stacked exemplar.** |

### Phase B — Static Publication And Route Closure

| # | Target and bounded change | Risk | Verification and expected evidence | Commit boundary and stop |
| --- | --- | --- | --- | --- |
| 10 | Measure the approved exemplar's production startup. Attribute initial transfer, JavaScript, CSS, fonts, resources, module evaluation, hydration/mount, and the startup long task using the existing performance harness. Change no product behavior. | Low | `npm run performance:economics-demand-shift-tutorial`; checked-in attribution report or test evidence naming dominant modules/tasks; compare against the slice-1 baseline. | Commit diagnostic evidence only. Stop if results are not reproducible enough to guide boundary work. |
| 11 | Extend the compiler/publication artifact so route HTML contains ordered prose, headings/lists, stable motion-passage and passage IDs, inline KaTeX HTML/MathML, semantic links, and TOC anchors before JavaScript. Preserve source order and search/indexing truth. | High | `npm run check:economics-demand-shift-publication`; `npm run test:compiled-publication-artifact`; no-JS browser assertions; Cmd+F/searchable text smoke; HTML escaping and accessibility checks. | Commit static narrative shell. Stop if publication requires runtime Markdown or KaTeX compilation. |
| 12 | Publish the initial economics SVG and reserved station/progress/control geometry in the artifact. Enhancement must adopt or bind existing nodes rather than replace the visual tree or reflow the page. | High | No-JS screenshot and DOM contract; one-SVG ownership assertion before/after enhancement; CLS check; existing static SVG tests. | Commit static stage shell. Stop if hydration duplicates the SVG, prose, IDs, or progress rail. |
| 13 | Define and implement the progressive-enhancement boundary: Svelte hosts optional composition and binds to published state; framework-neutral compiler/runtime/renderer/custom elements own durable contracts. Prefer an island or adoption seam over remounting an empty app root. | High | Browser parity with JS on/off; mount/unmount test; direct seek before and after enhancement; no duplicate listeners/nodes; `npm run typecheck`. | Commit enhancement boundary. Stop if the only workable path makes Svelte the semantic source or replaces published content. |
| 14 | Remove global `styles.css` closure from the economics public entry. Create the minimum `tutorial-foundation.css` containing document, typography, theme, accessibility, and progressive-control primitives actually used by the route. Preserve appearance. | Medium | Stylesheet ownership tests; computed-style snapshots for prose/KaTeX/themes/forced colors; production CSS/resource diff; visual exemplar comparison. | Commit foundation CSS extraction. Stop for an unexplained visual change outside token rounding. |
| 15 | Split graph styling by responsibility: `graph-surface`, `dimensional-continuity-graph`, `economics-equilibrium-graph`, and `economics-demand-shift-lesson`. Preserve canonical axis-owned stroke tokens, theme roles, and domain-local labels. | Medium | `npm run test:economics-demand-shift-css`; computed-stroke checks across themes; economics visual capture; verify no catalogue-wide selector drift. | Commit graph/domain CSS split. Stop if extraction changes graph semantics or silently universalizes economics choices. |
| 16 | Split stacked, split, and station presenter styles/JavaScript into selectively loaded route capabilities. Keep CodeMirror and unselected experimental presenters out of initial public closure. | High | Build chunk/route manifest assertion; query each layout; editor chunk remains dynamic; production transfer/resource comparison; navigation among layouts without full-page load. | Commit presenter closure. Stop if selection causes duplicated runtimes, full route reloads, or breaks direct URLs. |
| 17 | Apply the bounded font/theme policy. Retain Source Serif 4 during choreography; preload or load it without layout shift, exclude unrelated New Computer Modern/editor assets from the reader route, preserve system monospace for code, tune midnight first, then verify light-token parity and forced colors separately. | Medium | Network/font closure assertions; before/after CLS; computed font/inline-KaTeX alignment; midnight/light/forced-colors snapshots; no editor chunk on reader load. | Commit font/theme closure. Stop if a font swap changes passage geometry enough to invalidate the approved checkpoint. |
| 18 | Close the publication phase against production budgets and durable HTML truth. Diagnose remaining startup long tasks and accept no unexplained regression. | High | `npm run build`; `npm run performance:economics-demand-shift-tutorial`; `npm run test:browser:economics-demand-shift-tutorial`; no-JS/Cmd+F/deep-link checks; record transfer, JS, CSS, font, resource, startup-task, active-frame, and CLS results. | Commit phase closeout. Stop with `STOP_CONDITION` if budgets remain materially over baseline after bounded diagnosis would require unrelated architecture work. |

### Phase C — Split Projection Parity

| # | Target and bounded change | Risk | Verification and expected evidence | Commit boundary and stop |
| --- | --- | --- | --- | --- |
| 19 | Extract only the layout-neutral station state and progress-rail contract proven by the approved stacked caller. Keep geometry, pinning, and presenter CSS local. | Medium | Type/contract tests with stacked as first caller; import-boundary check; no visual change; `npm run typecheck`. | Commit shared semantic seam. Stop if extraction requires a universal scene graph or moves paint/domain truth into the contract. |
| 20 | Bind the existing split projection to the same phases and playhead. Place its horizontal read-only progress rail above the active passage in the narrative column; preserve user-selectable left/right placement and current graph composition. | High | Split browser checkpoints forward/reverse; left/right placement; progress equality with stacked at named semantic locations; `npm run visual:economics-two-column-scroll`. | Commit split binding. Stop if stacked layout geometry leaks into split projection. |
| 21 | Prove driver parity across stacked, split, and compact phone projection: direct URL, TOC destination, browser history, manual control, reverse scroll, and reduced motion all set the same checkpoint/progress without replaying intermediate animation. | High | Transaction tests; back/forward browser checks; exact runtime-frame samples; phone and reduced-motion smoke; no needless animation-computation assertion on direct jump. | Commit projection driver parity. Stop if any projection keeps an independent source of semantic truth. |
| 22 | Produce a split-projection review set and pressure the shared seam without promoting it beyond economics. | Medium | Wide left/right, narrow/phone, midnight/light, large text, keyboard, reverse, and direct-jump captures; focused browser suite plus performance smoke. | Commit review checkpoint. **Stop with `HUMAN_CHECKPOINT` until the user approves split parity.** |

### Phase D — Practical CodeMirror Authoring Loop

| # | Target and bounded change | Risk | Verification and expected evidence | Commit boundary and stop |
| --- | --- | --- | --- | --- |
| 23 | Define one whole-lesson structured buffer serialization with stable lesson, motion-passage, passage, stage, motion-block, and semantic-reference IDs. Preserve Markdown-like prose and typed directives; do not persist arbitrary Svelte source or executable `kp` code. | High | Round-trip, stable-ID, reorder, escaping, schema-version, and invalid-input tests; current compiled lesson reconstructs identically. | Commit schema/serialization only. Stop if persistence must evaluate framework source. |
| 24 | Compile the whole-lesson buffer incrementally with debounce, last-valid preview retention, deterministic diagnostics, and restoration to the nearest stable passage ID. Avoid restarting the entire stage/runtime for prose-only edits. | High | Editor browser tests for valid/invalid/repair cycles, stage-session identity, scroll-anchor retention, save state, and compile timing; `npm run test:browser:economics-lesson-editor`. | Commit compiler/preview session. Stop if invalid source destroys the last valid document or editor keystrokes remount animation state. |
| 25 | Replace hard-coded completion with a repository-backed semantic index covering valid entity IDs, motion blocks, checkpoints, vignettes, and typed reference forms. Surface completion and diagnostics in the existing CodeMirror/Vim environment. | Medium | Index freshness, foreign/stale ID rejection, completion context, insertion template, and keyboard/Vim tests; editor chunk remains lazy. | Commit semantic completion. Stop if discovery requires bundling the entire repository into the public reader. |
| 26 | Expose reversible add, duplicate, delete, and reorder operations for passages and motion passages through buttons and commands backed by one structured history. Preserve stable IDs and explicit destructive confirmation where needed. | Medium | Pure command tests; undo/redo round trips; browser test for operation sequence, save, reload, and unchanged publication; no one-editor-per-passage regression. | Commit structured editing commands. Stop if operations fork editor history from document history. |
| 27 | Finish the focused editor chrome: large single modal, buffer/modeline/ex-command area only, ex input below the modeline, ample padding, site-derived dark colors, Vim `:q`, `:w`, `:wq`, visible dirty/valid/save state, and `1rem/1.5` editor type. | Medium | Keyboard-only/Vim browser checks; save-to-source adapter test; light/dark contrast; modal focus trap and return; build/chunk comparison. | Commit practical editor checkpoint. Keep sidecar, arbitrary typed JavaScript, advanced tree operations, and public editing deferred. |

### Phase E — TOC And Motion-Passage Navigation

| # | Target and bounded change | Risk | Verification and expected evidence | Commit boundary and stop |
| --- | --- | --- | --- | --- |
| 28 | Build a progressively published hierarchical TOC from lesson headings and motion-passage starts. Use semantic light DOM with reserved geometry, a vertically useful floating desktop rail, and a compact mobile disclosure. Do not list individual scrub moments. | Medium | No-JS links, active-heading updates, keyboard disclosure, mobile/wide layout, CLS, large text, and nested heading tests. | Commit outline and responsive presentation. Stop if navigation overlaps prose or requires hidden duplicate text. |
| 29 | Implement one direct navigation transaction: resolve destination, set semantic checkpoint/progress immediately, update URL/history, then place the document anchor. Add previous/next motion passage, skip/settle, and exit actions. Never replay intermediate frames, intercept the wheel, or require smooth scroll. | High | Deep-link cold load; back/forward; repeated same-target; stacked/split/phone; reduced-motion; skip/settle/exit; no needless sampler loop; exact state-before-paint assertion. | Commit navigation transaction. Stop if scroll position and semantic state can visibly disagree after settlement. |
| 30 | Run the immediate-tranche release gate, reconcile project memory and Theseus evidence, and close the contract without pulling in rank 6. | Medium | `npm run typecheck`; `npm run build`; economics unit/CSS/publication/browser/editor/navigation suites; no-JS and accessibility checks; `npm run performance:economics-demand-shift-tutorial`; `theseus workspace validate`; compare current metrics to slice 1 and report known debt. | Commit closeout and report `COMPLETE` only if every required slice and checkpoint is approved. Otherwise report the exact stop outcome. |

## Allowed Actions

- Modify the economics lesson compiler, publication artifact, route host,
  presenter adapters, local/shared lesson contracts proven by the exemplar,
  focused tests, committed visual-check entrypoints, and project memory.
- Add narrowly scoped custom elements or light-DOM structures for a progress
  rail and TOC when they progressively enhance published geometry.
- Split modules and styles to improve route closure while preserving behavior.
- Add diagnostics and stable npm verification entrypoints when a check becomes
  repeatable evidence.

## Disallowed Actions

- No animation-library reranking, Lisp retirement, matrix/linear-algebra work,
  multi-step algebra caller, broad vignette schema, Canvas/WebGL/Graph3D
  promotion, SvelteKit migration, Internal Studio, Public Web, or Public Editor.
- No arbitrary Svelte or JavaScript evaluation in lesson source.
- No universal scene graph, universal renderer, catalogue-wide CSS migration,
  repository-wide vocabulary rename, or unproven shared layout grammar.
- No scroll snap, wheel interception, internal document scroller, duplicated
  semantic clocks, Svelte per-frame object state, or CSS-owned semantic motion.
- No deletion or overwrite of user-authored dirty lesson/publication files.
  Overlap must be reconciled deliberately or stopped for user direction.

## Checkpoint And Commit Cadence

- Run `npm run --silent loop:status` at slice start, completion, each commit
  boundary, and before every stop report.
- Commit exact scoped paths after every successful slice. Never stage unrelated
  user work.
- Use focused unit or single-browser checks during visual discovery. Run the
  broader browser, accessibility, responsive, and performance matrices only at
  slices 9, 18, 22, and 30.
- Record verification commands and observable results in Theseus. Scratch
  screenshots belong under `tmp/codex/`; stable visual entrypoints belong in
  `scripts/`, `tests/`, and `package.json`.
- Mandatory human checkpoints occur after slices 9 and 22. They are real stop
  conditions, not invitations to infer approval from earlier strategy consent.

## Explicit Deferrals

Ranks 6–11 from the accepted horizon are not part of this run. In particular,
the multi-step algebra caller, shared vignette contract, 1/6/12 full-renderer
benchmarks, advanced editor features, 3D salience parity, and SvelteKit product
surfaces remain ordered future loops. The already verified lifecycle fixtures
with 1, 3, and 12 motion passages remain test evidence; they are not claims
about rendered page capacity and there is no intended `13` profile.

## Approval Boundary

This proposal records the exact intended contract but does not activate it.
After explicit approval, create one Theseus run contract sourced from this
document, persist these 30 slices in this order, and begin at slice 1. If the
current stale Theseus next action conflicts, supersede that execution boundary
without deleting its historical evidence.
