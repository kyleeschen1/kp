# Economics Runtime And Scroll Next-Step Review

Date: 2026-08-04
Status: Phases 1–4 approved for execution; Phases 5–7 remain separately gated

## Recommendation

Run one bounded economics runtime-repair tranche before adding another lesson
layout or generalizing the two-column passage. Preserve the reviewed semantic
animation and current visual reference, measure the actual hot paths, replace
whole-subtree SVG playback with a persistent renderer session, then replace
per-scroll geometry measurement with cached local-anchor projection and
IntersectionObserver-assisted lifecycle. Only after those repairs should the
requested paragraph-spacing tuner become the exemplar's next visual control.

This is not a broad runtime rewrite. Economics is the sole canonical caller
through the first human checkpoint. Route closure, dense-page pressure, CSS
retirement, and a shared 2D/3D graph protocol follow only after the repaired
exemplar proves the boundary.

## Candidate Review

Scores use 5 as strongest except Risk, where 5 is most speculative. Slice size
uses 1 for the smallest bounded change and 5 for the largest.

| Candidate | Authoring | Reliability | Reuse | Slice size | Risk | Recommendation |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Instrument the economics SVG and cue hot paths | 3 | 5 | 4 | 1 | 1 | Start here |
| Add an economics-local persistent SVG runtime session | 4 | 5 | 5 | 3 | 2 | First implementation |
| Cache cue geometry and add observer-assisted activation | 4 | 5 | 5 | 3 | 2 | Second implementation |
| Add the requested `0–100vh` paragraph-gap tuner | 5 | 3 | 2 | 1 | 1 | After geometry repair |
| Split route capabilities and statically retain KaTeX labels | 3 | 5 | 5 | 3 | 2 | After exemplar checkpoint |
| Prune all experimental lesson CSS immediately | 2 | 3 | 3 | 4 | 4 | Wait for layout selection |
| Promote a universal 2D/3D graph protocol now | 4 | 4 | 5 | 5 | 5 | Wait for second renderer caller |

## Canonical Reference And Preservation Boundary

The canonical visual reference is the current economics route at
`/tutorials/economics/demand-shift/?layout=two-column-scroll`, including its
current light and midnight appearances and its static, initial, transition,
settled, and reverse-scroll states.

Preserve throughout the tranche:

- the exact economics semantic asset and sampled runtime frames;
- deterministic direct seek, rewind, cumulative motion blocks, URL state, and
  Review capture;
- the pure string renderer used for static output, export, and deterministic
  fixtures;
- the default split and inline-sticky routes as rollback references;
- accessible graph truth, reduced motion, phone reading flow, theme identity,
  and progressive publication; and
- framework-neutral animation and renderer contracts outside Svelte ownership.

Each phase below is one independently reversible rollback unit. The first
human checkpoint follows Phase 4. No second caller or shared protocol is
authorized before that checkpoint.

## Phase 1: Measure The Actual Hot Paths

Extend the stable economics production-performance entrypoint rather than
creating a disposable browser script. Measure the query-selected two-column
route and separate:

- scroll scheduling latency from JavaScript execution time;
- semantic sampling from SVG string construction, DOM replacement, style and
  layout, and screen-space-label synchronization;
- DOM nodes added and removed per seek;
- geometry reads per scroll frame; and
- six-, twenty-four-, and forty-eight-cue projections over one persistent
  stage.

Keep the existing publication budgets, but do not treat the current two-rAF
`33.7ms` sample as isolated renderer CPU time. Record a before snapshot and
mutation count so Phase 2 must demonstrate a real reduction.

Likely files:

- `tests/economics-demand-shift-tutorial-performance.browser.spec.ts`
- `playwright.economics-demand-shift-performance.config.ts`
- the existing scoped `npm run performance:economics-demand-shift-tutorial`
  command and its committed entrypoint

Verification: production build, current semantic tests, and the extended
single-route performance probe. Stop if instrumentation changes learner paint
or semantic timing.

### Recorded before baseline

The scoped production probe recorded this baseline on 2026-08-05 before the
retained renderer or cached scroll projection existed. These values are
comparison evidence, not new ceilings.

| Surface | Before measurement |
| --- | ---: |
| Initial transfer | 344,047 bytes |
| Initial scripts | 244,354 bytes |
| Initial resources | 48 |
| Initial CLS | 0.00978 |
| Active-motion CLS | 0 |
| Active two-rAF p95 | 34 ms |
| Scroll events / coordinator frames | 26 / 26 |
| Canonical geometry reads | 392 total; 15.08 per frame |
| Coordinator anchor reads | 52 total |
| Coordinator execution | 43.7 ms total; 3 ms longest frame |
| Semantic samples | 27 calls; 2.5 ms total |
| SVG strings | 27 strings; 623,249 characters; 3.5 ms construction |
| Runtime subtree replacement | 27 replacements; 13.7 ms total |
| Runtime elements removed / added | 7,335 / 7,380 |
| Observed child-list mutations | 119 |
| Observed nodes removed / added | 115 / 119 |
| Screen-label synchronization | 27 calls; 4.5 ms total |

The same mounted stage produced the following cue-density pressure result:

| Cue count | Geometry reads for one scroll frame |
| ---: | ---: |
| 6 | 15 |
| 24 | 33 |
| 48 | 57 |

That exact `cue count + 9` progression confirms the current all-cue layout
loop. Later scroll slices must make the ordinary-scroll read count independent
of total document cue count, while retaining explicit invalidation reads.

The cold-start long-task sample varied between `122ms` and `201ms` across
identical local production builds. The existing `150ms` ceiling is unchanged;
the variance remains test-reliability pressure and must not be presented as
isolated renderer CPU time.

## Phase 2: Retain The SVG Runtime Tree

Keep `renderKpEconomicsEquilibriumStaticContent` as deterministic complete
markup. Add an economics-local mounted runtime session with explicit
`apply(frame)` and `dispose()` operations. Construct the SVG scaffold, axes,
grid, stable curves, labels, KaTeX nodes, and accessibility owners once. Patch
only changing attributes, text, lifecycle classes, and the accessible
description during playback.

Topology changes should be keyed and discrete. Ordinary progress must not
write `innerHTML`, replace the runtime group, recreate static KaTeX, or lose DOM
node identity. Direct seek must remain history-independent.

Likely files:

- `src/editor/graph-svg-viewport.ts`
- `src/rendering/economics-equilibrium-svg.ts`
- one new economics-local runtime-session module if separation is clearer
- focused renderer, browser, accessibility, and direct-seek tests

Acceptance:

- zero runtime-subtree replacements after mount during ordinary seeking;
- stable node identity for axes, curves, points, guides, labels, and `<desc>`;
- exact static/runtime endpoint parity and rewind;
- no loss of screen-space label or theme behavior; and
- a measured improvement without widening existing budgets.

### Recorded retained-runtime result

The production probe measured the retained economics session after Phase 2.
The pure renderer remains the deterministic complete-markup authority for
static output, export, fixtures, and fresh session mount; only the mounted
economics caller uses the local retained patcher. No other graph caller or
shared graph protocol changed.

| Surface | Before | Retained runtime |
| --- | ---: | ---: |
| Initial transfer | 344,047 bytes | 347,382 bytes |
| Initial scripts | 244,354 bytes | 247,690 bytes |
| Initial resources | 48 | 48 |
| Initial CLS | 0.00978 | 0.00978 |
| Active-motion CLS | 0 | 0 |
| Active two-rAF p95 | 34 ms | 34.4 ms |
| Scroll events / coordinator frames | 26 / 26 | 26 / 26 |
| Canonical geometry reads | 392 | 392 |
| Semantic samples | 27 | 27 |
| SVG strings after probe reset | 27; 623,249 characters | 0; 0 characters |
| Runtime subtree replacement | 27 | 0 |
| Runtime elements removed / added | 7,335 / 7,380 | 0 / 0 |
| Graph-local child-list mutations | not isolated | 3 |
| Graph-local nodes removed / added | not isolated | 0 / 3 |

The retained session therefore eliminates ordinary-progress string assembly
and whole-subtree replacement while preserving exact stage-boundary, direct
seek, rewind, accessibility, and fixed-node identity tests. The three graph
child-list mutations are discrete keyed guide/reference entry, not subtree
replacement. Global observed mutations are now dominated by the existing
scrubber output, status paragraph, and button text updates rather than graph
paint.

Post-change cold-start samples ranged from `124ms` to `212ms`. The final
checkpoint passed at `124ms`; earlier identical-build samples at `162ms`,
`177ms`, and `212ms` remain recorded as local startup variance. The `150ms`
ceiling was not widened. This is still reliability pressure rather than
evidence about retained-renderer CPU cost, but the `212ms` outlier extends the
previously observed machine range and should remain visible in later route
closure work.

## Phase 3: Make Scroll Geometry Local, Cached, And Activated

Retain one passive, rAF-coalesced scroll source for continuous semantic
scrubbing. IntersectionObserver does not replace exact progress; it becomes the
coarse lifecycle authority for near-viewport activation and offscreen pause.

Declare two independent anchors:

1. a stable stage-local anchor, initially the graph's normalized center; and
2. a responsive viewport focus anchor, initially `35dvh` on the wide
   two-column exemplar.

Map the local anchor to the viewport anchor. Align the first prose block-start
to that same focus line. Never make sticky geometry follow a moving object's
live DOM box. Store semantic cue/progress in URLs rather than scroll pixels.

Measure cue document offsets on mount and explicit invalidation only: resize,
font readiness, responsive-mode change, text-side change, theme metric change,
or authoring-tuner change. On scroll, read `scrollY`, binary-search the cached
sequence, and project only the active cue neighborhood. Batch DOM reads before
writes.

Likely files:

- `src/tutorial/kp-tutorial-motion.ts`
- `src/tutorial/economics-demand-shift/economics-demand-shift-layout.ts`
- `src/tutorial/economics-demand-shift/KpEconomicsDemandShiftTutorial.svelte`
- focused unit and two-column browser tests

Acceptance:

- one scroll listener and at most one pending frame for the passage;
- IntersectionObserver owns activation, not semantic progress;
- no all-cue `getBoundingClientRect()` loop during ordinary scroll;
- exact forward, reverse, resize, URL, TOC, and manual-control settlement; and
- stable phone and short-viewport reading fallbacks.

### Recorded cached-scroll result

The integrated production probe now reads only the sticky stage and passage
release bounds during an ordinary frame. Cue and motion-anchor boxes are
measured into document space on invalidation; scroll uses `scrollY`, binary
search, and a five-cue neighborhood. IntersectionObserver changes the coarse
near-viewport set and requests the same coordinator frame, but never computes
semantic progress or creates another clock.

| Surface | Before cache | Cached projection |
| --- | ---: | ---: |
| Canonical geometry reads | 392 | 56 |
| Geometry reads per active frame | 15.08 | 2.07 |
| Coordinator registration / layout reads | 52 / 52 | 0 / 0 |
| Coordinator total / longest execution | 43.7 / 3 ms | 26.9 / 2.1 ms |
| Six-cue ordinary frame | 15 reads | 2 reads |
| Twenty-four-cue ordinary frame | 33 reads | 2 reads |
| Forty-eight-cue ordinary frame | 57 reads | 2 reads |

At the canonical `800px` viewport, the `480px` stage now sits at `40px`, so
its stable center and the opening prose top both land at the `280px` (`35vh`)
focus line. The browser suites retain exact manual rebase, forward/reverse
settlement, URL/TOC restoration, reduced motion, phone fallback, and the
independent inline-sticky rollback route.

## Phase 4: Add The Requested Tuner And Finish The Local Visual Requests

Add the already-recorded internal `0–100vh` paragraph-gap tuner in `1vh` steps,
starting from `16vh`. Keep it beside Review and the other bottom controls.
Persist it in the URL and Review state. A change updates one CSS token and
causes exactly one coalesced geometry invalidation; it does not become semantic
timeline state or learner transport.

Use this phase to visually verify the shared `35dvh` local/viewport anchor,
the first paragraph's already-settled initial state, and the requested neutral
grey dark-mode axes. Define one economics-lesson non-KaTeX font token and apply
it consistently to prose, headings, navigation, controls, review/tuning UI,
and any native text painted by the lesson; KaTeX descendants retain their own
mathematical font families. Do not add new graph decoration. Mobile may clamp
or ignore extreme desktop spacing values.

Acceptance includes zero, default, middle, and maximum spacing in both scroll
directions, exact URL reconstruction, no semantic snap after tuning, and a
human checkpoint over the repaired economics exemplar.

### Recorded Phase-4 checkpoint candidate

The internal tuner now covers `0–100vh` in `1vh` steps with an implicit
`16vh` default. Its query and typed Review evidence reconstruct zero, default,
middle, and maximum values; active-cue anchoring prevents semantic jumps while
one invalidation remeasures the two motion-block anchors. Phone layouts retain
the value for sharing but ignore the extreme desktop gap.

One economics-local Source Serif token now owns all non-KaTeX text in the
lesson, TOC, SVG inheritance, controls, scrubbers, and Review UI. KaTeX keeps
its own mathematical families. The route explicitly resolves the local prose
face before mounting scroll observers, eliminating the late font-swap race and
bringing final checkpoint CLS to zero.

| Production checkpoint | Result |
| --- | ---: |
| Initial transfer | 349,589 bytes |
| Initial script | 249,919 bytes |
| Initial resources | 48 |
| Initial CLS | 0 |
| Final cold longest task | 124 ms |
| Active p95 / maximum frame | 34.3 / 34.3 ms |
| Active geometry reads | 56 total; 2.07 per frame |
| SVG strings / subtree replacements | 0 / 0 |
| Six / twenty-four / forty-eight cues | 2 / 2 / 2 reads |

The final automated checkpoint passed 41 focused semantic tests, two retained
runtime browser tests, twelve tutorial integration tests, eight canonical
visual cases, the production performance probe, build/type checks, and all
architecture gates. Human judgment over the repaired exemplar remains the
required promotion boundary.

## Phase 5: Reduce Route And CSS Closure After Approval

After the Phase-4 visual checkpoint, split the shared graph viewport's static
domain imports so the economics tutorial requests only its selected SVG graph
capability. Do not make it download matrix, integral, physics, catalogue, code,
or WebGL callers merely because the general editor supports them.

Pre-render or statically compile stable KaTeX and retain those nodes at
runtime. Keep dynamic mathematical values exact and keyed; do not parse static
axis labels every frame. Ratchet route transfer, resource-count, initial-task,
and frame-execution budgets from the repaired baseline.

CSS cleanup follows the human layout decision. First split shared lesson
tokens, chosen passage geometry, theme roles, and economics graph paint into
clear ownership layers. Retire rejected experimental branches only with a
preserved visual reference and their own rollback commit. Gzip size alone does
not excuse unused selectors, but a broad stylesheet rewrite before selection
would destroy useful comparison evidence.

## Phase 6: Pressure Dense Pages And Multiple Stages

Prove two distinct cases:

- many prose cues driving one persistent stage; and
- several independent motion passages whose distant stages remain static or
  dehydrated.

The dense-cue fixture should exercise at least 6, 24, and 48 cues without
linear layout reads per scroll frame. The multi-stage fixture should reserve
stable geometry, hydrate only a small near-viewport window, share capability
chunks, pause offscreen playback, and enforce a small live-stage limit. A
WebGL caller must also retain the existing context-lease policy.

This phase proves page-scale behavior; it does not authorize dozens of
simultaneously moving stages or autoplay outside the active passage.

## Phase 7: Promote Only Caller-Proven Graph Seams

Use the existing physics graph-and-diagram caller to pressure the persistent
SVG session and local-anchor contract. If economics and physics both pass,
extract the smallest shared Graph2D runtime-session interface and lifecycle.

Only then define the corresponding Graph3D protocol: renderer-neutral semantic
frames and visual roles, local stage anchors, camera/projection state, theme
resolution, and shared clock; SVG and WebGL remain separate renderer ports.
The 3D renderer maps the same role tokens and line hierarchy to materials and
camera-relative apparent widths without making Three.js a dependency of 2D
pages.

Generated solve-x remains the later third lesson caller. Matrix work, SvelteKit,
Public Web, broad motif promotion, and a universal scene graph remain deferred.

## Recommended Approval Boundary

Phases 1–4 are approved as one bounded exemplar tranche, with a mandatory
visual and performance checkpoint after the spacing tuner and font
unification. Phases 5–7 remain a separately approved consolidation tranche
informed by those measurements and the selected layout.

## Sources

- `docs/project/strategy.md`
- `docs/project/roadmap.md`
- `docs/project/threads/animation-library-promotion.md`
- `docs/project/threads/explanation-attention.md`
- `docs/project/decisions/2026-08-04-kp-essay-embedded-two-column-motion-passage.md`
- `src/tutorial/kp-tutorial-motion.ts`
- `src/tutorial/economics-demand-shift/KpEconomicsDemandShiftTutorial.svelte`
- `src/editor/graph-svg-viewport.ts`
- `src/rendering/economics-equilibrium-svg.ts`
- `tests/economics-demand-shift-tutorial-performance.browser.spec.ts`
