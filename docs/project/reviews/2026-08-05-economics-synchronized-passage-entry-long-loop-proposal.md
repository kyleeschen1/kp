# Economics synchronized passage entry long-loop proposal

Status: approved for execution on 2026-08-05. The executable Theseus run
contract owns live slice status and verification evidence.

## Why this is current

The economics two-column passage currently enters through two coordinate
systems: runtime stage placement and static prose padding. The graph can pin
before the first prose cue reaches its reading position, so an ordinary-looking
document becomes an apparently empty text column followed by a late prose
arrival. Exit salience has the symmetric problem: the first and last cues can
fade even though no cue exists beyond them in that direction.

The approved repair makes the passage read as a static two-column document
until one simultaneous latch places the first paragraph top at the default 35%
reading anchor and the graph center at the default 50% stage anchor. Semantic
animation progress remains zero until later scroll travel. The graph, vertical
divider, and horizontal boundary remain one local assembly. Persistent page
chrome is represented by one usable-viewport coordinate system rather than
more independent viewport constants.

The same run preserves and pressure-tests exact semantic navigation. URLs,
TOC actions, and history restoration must settle directly at authored
checkpoints without replaying intermediate frames, hydrating unrelated stages,
or allowing the next scroll projection to overwrite the requested state.

## Canonical reference and acceptance

The canonical reference is the published economics demand-shift two-column
passage in dark mode, with the existing semantic graph and motion blocks
unchanged.

Observable acceptance criteria:

- before engagement, the graph and first prose are both present as an ordinary
  document rather than an empty prose column beside an already-pinned graph;
- at one latch scroll position, the first paragraph top reaches 35% of the
  usable viewport while the graph center reaches 50%;
- animation progress remains exactly zero through that latch and starts only
  with subsequent travel;
- internal cue handoffs remain reversible, while the first cue stays fully
  present before entry and the final cue stays fully present after settlement;
- graph, vertical divider, and horizontal boundary preserve local spacing
  through entry, pinning, and release;
- dark-mode graph axes consume the same theme token as the current vertical
  divider (`--kp-lesson-theme-stage-divider`, currently `#626775`);
- section, block, and checkpoint navigation restores cumulative semantic state
  in one transaction, uses instant viewport movement, produces no intermediate
  animation frames, and remains stable when reader scrolling resumes;
- 1, 3, 12, 24, and 36 passage-instance fixtures remain within the agreed
  active-window, layout-read, live-stage, layout-shift, and memory envelopes.

## Boundaries

Allowed work:

- the economics two-column passage geometry and presentation;
- framework-neutral tutorial viewport, passage-state, navigation, and scroll
  projection helpers when a pure shared contract is already demonstrated by
  the exemplar;
- focused unit/browser/visual fixtures and stable scoped verification commands;
- durable project and Theseus evidence required by this run.

Disallowed work:

- economic semantic changes, new graph content, or animation-keyframe redesign;
- catalog-wide lesson rollout before the economics human checkpoint;
- a shared visual type family or renderer migration based on one caller;
- public raw progress/time/frame URLs;
- Svelte-only semantic, clock, asset, renderer, or publication authority;
- unrelated user-owned worktree files or the unrelated gold-equation frontier.

Preservation boundary: economic assets, semantic motion projections, graph
runtime frames, checkpoint identities, authoring contracts, review controls,
publication output, mobile reading fallback, and existing framework-neutral
runtime ownership remain intact.

Smallest rollback unit: one verified slice and its focused commit. Presentation
changes stay isolated to the economics exemplar through slice 17.

## Approved slices

| Slice | Target and intended change | Verification and commit boundary | Stop condition |
|---|---|---|---|
| `s01` | Capture deterministic entry, latch, midpoint, terminal, and reverse geometry as the baseline. | Focused economics visual/browser probe; commit baseline assertions. | Stop if current behavior cannot be reproduced deterministically. |
| `s02` | Define ordinary-document, entry-latch, scrub-corridor, and terminal/release passage states. | Focused pure lifecycle tests; commit state contract. | Stop if state requires scroll-direction history. |
| `s03` | Add a pure usable-viewport projection with optional persistent top and bottom insets. | Focused geometry tests; commit helper. | Stop if it requires scroll-time layout reads. |
| `s04` | Derive default 35% text and 50% graph anchors from that viewport authority. | Focused projection tests; commit anchor contract. | Stop if the anchors cannot share one latch position. |
| `s05` | Derive the document-space graph/text offset for simultaneous settlement. | Focused forward/reverse math tests; commit latch projection. | Stop on more than the accepted sub-pixel drift. |
| `s06` | Encode first-before-entry and last-after-settlement salience policies. | Focused state tests; commit endpoint policy. | Stop if direction history is needed. |
| `s07` | Represent graph, vertical divider, and horizontal boundary as one local stage assembly. | Standard layout tests and typecheck; commit assembly contract. | Stop if viewport placement changes internal spacing. |
| `s08` | Make the static and pre-enhancement passage read as a complete two-column document. | Focused CSS/no-JS checks; commit progressive layout. | Stop on layout shift or missing initial prose. |
| `s09` | Resolve persistent chrome and viewport geometry on mount/resize with cached measurements. | Standard geometry/runtime checks; commit measurement integration. | Stop if synchronous layout work enters each scroll frame. |
| `s10` | Replace competing prose and stage offsets with the shared simultaneous latch. | Focused Chromium/browser check; commit synchronized entry. | Stop if either column visibly settles first. |
| `s11` | Hold semantic progress at zero through the latch and start motion only on later travel. | Runtime session and browser tests; commit progress gate. | Stop if seek, scrub, or reverse becomes discontinuous. |
| `s12` | Preserve divider-to-boundary spacing through entry, pin, and release. | Focused layout/visual checks; commit local assembly behavior. | Stop on separator drift. |
| `s13` | Keep the first cue fully present before entry without weakening internal handoffs. | Browser salience assertions; commit entrance endpoint. | Stop if later handoffs regress. |
| `s14` | Keep the final cue fully present through terminal settlement and release. | Browser salience assertions; commit exit endpoint. | Stop on a final-state jump or asymmetric reverse. |
| `s15` | Make dark graph axes consume the dark stage-divider token; preserve light mode. | Focused CSS ownership/theme tests; commit token repair. | Stop if a graph-local override defeats the token. |
| `s16` | Prove exact forward/reverse symmetry across entry, handoffs, terminal state, and release. | Standard tutorial motion and browser tests; commit reversibility proof. | Stop on direction-history dependence or state jumps. |
| `s17` | Run the stable economics two-column visual command and present the exemplar. | Manual visual checkpoint plus focused tests; commit only durable test/evidence changes. | Always stop at `HUMAN_CHECKPOINT`; no post-checkpoint work without explicit visual approval. |
| `s18` | Apply only timing and spacing adjustments explicitly approved at the checkpoint. | Focused visual check; commit approved polish. | Stop on unreviewed choreography expansion. |
| `s19` | Integrate fixed/sticky-header insets and freeze shrinking-header geometry during an active passage. | Standard geometry/browser tests; commit header-safe anchors. | Stop if ordinary scrolling headers affect anchors. |
| `s20` | Add dynamic-viewport, safe-area, short-height, and phone fallback behavior. | Broad responsive checks; commit responsive contract. | Stop if the accepted mobile reading flow regresses. |
| `s21` | Reconcile the generic reading band with passage-local anchor authority and retire redundant constants only where proven. | Standard attention tests and typecheck; commit authority cleanup. | Stop if another lesson changes unintentionally. |
| `s22` | Revalidate TOC, links, URLs, history, manual scrub, text-side toggle, and gap tuning. Index destinations and anchors, restore cumulative semantic state in one transaction, sample only the requested frame, avoid unrelated-stage hydration, land on the new anchor, and preserve scroll takeover rebasing. | Broad navigation unit/browser tests, including mutation traces proving no intermediate frame and large-page fixtures; commit direct-navigation hardening. | Stop on raw choreography URLs, intermediate replay, unrelated hydration, history incompatibility, or viewport/state mismatch. |
| `s23` | Verify reduced motion, keyboard/accessibility behavior, no-JS reading, and endpoint legibility. | Broad accessibility and static-publication checks; commit accessibility closure. | Stop if enhancement can hide content. |
| `s24` | Run 1, 3, 12, 24, and 36 passage-instance pressure fixtures and record scroll-frame, layout-read, active-stage, DOM/payload, retained-memory, WebGL-lease, and CLS evidence. | Broad page-scale/performance checks; commit bounded scale proof. | Stop on an unexplained budget regression or more than three live 2D stages/one active 3D stage. |
| `s25` | Run release verification, reconcile durable evidence, and close or report residual risk honestly. | Tutorial suites, CSS ownership, browser release coverage, typecheck, build, impact verification, diff audit, and Theseus validation; commit closeout. | Stop on any release blocker; do not claim completion without the post-checkpoint approval path. |

## Checkpoint and promotion

Slice 17 is mandatory `HUMAN_CHECKPOINT`. Promotion requires explicit approval
that initial prose is never missing, text and graph latch simultaneously,
progress is held at zero through entry, outer cues remain readable, reverse is
visually symmetric, and dark axes match the vertical divider. Slices 18–25 are
approved in scope but remain gated by that visual judgment.

The second-caller requirement still applies before any visual choreography is
made universal. Pure viewport and navigation contracts may be shared when their
framework-neutral tests establish semantic ownership independently of the
economics presentation.
