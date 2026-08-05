# Essay motion bridge and semantic transit long-loop proposal

Status: proposed on 2026-08-05. Execution requires explicit approval of this
slice order. The accepted economics two-column exemplar at commit `aa943107`
remains the canonical reference until a human checkpoint approves replacement.

## Why this is current

The accepted two-column passage now enters and releases cleanly, but every
paragraph still reads as part of a conspicuous scrollytelling system. The next
experiment should make most prose behave like an ordinary essay while reserving
visible scroll distance for transformations that genuinely need it.

A motion bridge suspends one statement around a deterministic animation:

1. a short before statement establishes what to watch;
2. a generated ellipsis and thin vertical rail mark a configurable scrub
   interval;
3. an after statement completes the thought when the animation reaches its
   terminal semantic state.

Ordinary paragraphs retain normal document spacing. Their stage effects use a
fixed approach interval and reach their authored final state when the paragraph
top reaches the shared reading anchor. Neither ordinary beats nor motion bridges
derive progress from paragraph height.

The second exemplar moves one visual proxy from an inline semantic reference in
the text column to a matching object in the animation stage. Source and
destination DOM remain stable; only the proxy travels. This preserves layout,
selection, accessibility, reverse scrubbing, and direct semantic seeking.

The unexecuted `s18`-`s25` tail of
`run-contract.kp.economics-synchronized-passage-entry-v2` must be superseded,
not repurposed silently. Its header, mobile, navigation, accessibility,
page-scale, and release work is carried forward below.

## Canonical reference and acceptance

Canonical current behavior: the economics demand-shift two-column page at
commit `aa943107`, including its graph semantics, checkpoints, review controls,
theme tokens, and synchronized passage entry.

Canonical experiment: an opt-in economics route variant containing one demand
shift motion bridge and one literal inline `P` to price-axis `P` semantic
transit. The accepted route remains available as the rollback reference through
both visual checkpoints.

Observable acceptance criteria:

- without enhancement, the full essay reads in source order with no reserved
  blank scrub space and no meaningful punctuation supplied only by JavaScript;
- ordinary prose uses normal spacing and reaches its authored stage state over
  one fixed approach distance ending at the header-safe reading anchor;
- a standard motion bridge has an exact 50% usable-viewport semantic interval,
  with `short`, `standard`, and `extended` authored presets;
- before and after statements are visually connected by generated ellipses and
  one thin square-ended rail, while assistive technology receives natural prose;
- forward, reverse, direct URL, TOC, and history settlement produce the same
  semantic endpoint without replaying intermediate animation;
- the text-to-stage exemplar animates a visual proxy through compositor-safe
  transforms without reparenting the inline or stage DOM;
- source and destination identities remain stable, and the proxy has a defined
  static, reduced-motion, phone, and interrupted-scroll result;
- enhancement adds no initial layout shift, no per-frame synchronous layout
  reads, and only the active passage schedules frame work;
- the current economics semantics, graph renderer, checkpoints, themes, review
  capture, text-side toggle, and framework-neutral runtime ownership remain
  intact.

## Boundaries

Allowed work:

- a framework-neutral typed motion-bridge and semantic-transit contract;
- pure regular-beat, bridge-progress, usable-viewport, and direct-settlement
  projections;
- progressive static publication markup and CSS for the economics exemplar;
- one opt-in demand-shift bridge and one inline `P` to stage-axis `P` proxy;
- focused unit, browser, visual, accessibility, and page-scale fixtures;
- the still-relevant hardening originally planned for the accepted passage tail.

Disallowed work:

- changing economic meaning, graph geometry, renderer ownership, or animation
  keyframes beyond mapping the existing semantic interval;
- moving or reparenting live inline KaTeX, prose, SVG, canvas, or stage nodes;
- making Svelte the semantic, authoring, clock, or publication authority;
- catalog-wide rollout, a universal visual type family, or a second domain
  before both exemplar checkpoints approve the motif;
- raw time, frame, or progress URLs; intermediate navigation replay; unrelated
  stage hydration; or a second scroll authority;
- unrelated user-owned worktree files and the unrelated gold-equation frontier.

Preservation boundary: accepted economics semantics and route, static
publication order, graph assets, checkpoints, direct-navigation guarantees,
review controls, mobile reading fallback, and framework-neutral motion runtime.

Smallest rollback unit: one verified slice and focused commit. New behavior
stays behind an opt-in exemplar route until its checkpoint approves promotion.

## Proposed slices

Each slice is one independently reversible commit containing implementation,
tests, and its completed Theseus evidence.

| Slice | Target and intended change | Risk and verification | Stop condition |
|---|---|---|---|
| `s01` | Freeze the accepted economics route and add an opt-in motion-bridge exemplar route descriptor. | Focused route/publication assertions. | Stop if the canonical route or URL state changes. |
| `s02` | Define typed `ordinary-beat`, `motion-bridge`, duration-preset, and semantic-endpoint authoring records. | Focused pure contract tests. | Stop if authoring requires framework-owned types. |
| `s03` | Extend the lesson compiler to validate paired before/after prose and semantic endpoints. | Compiler and publication tests. | Stop if malformed bridges can compile silently. |
| `s04` | Emit complete progressive markup whose no-JS reading order contains both statements and no artificial scroll gap. | Static HTML and no-JS tests. | Stop if enhancement becomes necessary to read the essay. |
| `s05` | Add shared `short`, `standard`, and `extended` distance tokens plus fixed ordinary-beat approach tokens. | CSS ownership tests. | Stop if paragraph height enters timing authority. |
| `s06` | Add a pure ordinary-beat projection that reaches state one when its top meets the reading anchor. | Forward/reverse geometry tests. | Stop on direction or element-height dependence. |
| `s07` | Add a pure bridge projection between two semantic anchors with exact zero and one endpoints. | Dense pure progress tests. | Stop on overshoot, history, or ambiguous endpoint ownership. |
| `s08` | Project both primitives through the cached usable viewport and persistent-header inset authority. | Geometry and resize tests. | Stop if a new viewport coordinate system appears. |
| `s09` | Render generated ellipses and a thin square-ended progress rail with theme tokens. | CSS/static/browser smoke checks. | Stop if punctuation or meaning exists only in generated content. |
| `s10` | Compile one demand-shift before/after pair into the opt-in economics exemplar. | Focused tutorial tests. | Stop if economic prose or graph semantics must change. |
| `s11` | Connect bridge progress to the existing semantic demand-shift interval and preserve manual takeover. | Runtime session tests. | Stop if another clock authority is required. |
| `s12` | Prove reverse traversal, direct endpoint settlement, and accepted-route isolation. | Standard unit/browser checks and typecheck. | Stop on replay, route leakage, or state mismatch. |
| `s13` | Capture the motion-bridge exemplar in dark, light, reverse, and no-JS states. | Stable visual command plus manual review. | Always stop at `HUMAN_CHECKPOINT`; transit work needs fresh approval. |
| `s14` | Apply only checkpoint-approved bridge spacing, typography, rail, and timing refinements. | Focused visual check. | Stop on unreviewed choreography expansion. |
| `s15` | Restrict scroll-frame work to the active/near passage using observation only for activation and pure projection for scrubbing. | Runtime/performance tests. | Stop if IntersectionObserver becomes animation progress authority. |
| `s16` | Cache source, destination, stage, and viewport geometry with resize/font invalidation. | Layout-read probes. | Stop on per-frame synchronous measurement. |
| `s17` | Define stable text-reference and stage-object identities plus transit endpoint validation. | Pure identity/compiler tests. | Stop if identity depends on DOM position or display text. |
| `s18` | Add a viewport-level, pointer-inert, accessibility-hidden visual-proxy layer. | DOM and accessibility tests. | Stop if source or destination must be reparented. |
| `s19` | Scrub an inline `P` proxy to the price-axis `P` using transform-only interpolation and exact reverse. | Focused Chromium trace and visual captures. | Stop on layout mutation, blur, or endpoint discontinuity. |
| `s20` | Define phone, interrupted-scroll, resize, and reduced-motion transit settlement. | Responsive and reduced-motion browser checks. | Stop if content or identity is lost at any fallback. |
| `s21` | Present the semantic-transit exemplar in desktop and phone layouts. | Stable visual command plus manual review. | Always stop at `HUMAN_CHECKPOINT`; promotion needs fresh approval. |
| `s22` | Apply approved transit refinements and add a second economics caller with a different destination shape. | Motif regression and visual checks. | Stop if the second caller exposes a false shared boundary. |
| `s23` | Harden URL, TOC, history, text-side toggle, and direct semantic reconstruction with no proxy replay. | Broad navigation/browser tests. | Stop on raw choreography URLs or intermediate frames. |
| `s24` | Close keyboard, screen-reader, static reading, sticky-header, dynamic-viewport, and mobile behavior. | Broad accessibility/responsive checks. | Stop if enhancement can conceal or reorder prose. |
| `s25` | Pressure-test 1, 3, 12, 24, and 36 passages, run release verification, and reconcile durable evidence. | Page-scale budgets, tutorial suites, CSS checks, typecheck, build, visual commands, and Theseus validation. | Stop on a release blocker or unexplained performance regression. |

## Checkpoints and promotion

Slice 13 approves only the motion bridge: document rhythm, before/after
punctuation, rail, fixed scrub distance, reversibility, and the distinction
between ordinary paragraphs and explicit transformation intervals.

Slice 21 approves only semantic transit: whether the inline-to-stage movement
clarifies correspondence without becoming theatrical noise, plus its reverse,
phone, and reduced-motion behavior.

Only after both checkpoints may the run add one structurally different
economics caller and complete the carried-forward hardening. No other lesson or
domain is included in this contract.
