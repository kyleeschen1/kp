# Economics Layout Production-Reachability Audit

Date: 2026-08-12
Status: first pruning wave implemented in two reversible commits

## Implementation Outcome

The approved retirement completed without changing Article v1 source, its
generated publication, economics semantic truth, or the remaining projection
set. Commit `de85d0d5` removed production reachability; the following deletion
commit removes the unreachable Station implementation and its focused
certification surface.

Historical `?view=animation-station` and `?layout=animation-station` inputs now
normalize in place to `reader` while retaining unrelated preferences. The
active presenter payload fell from 191,991 bytes to about 181.8 kB, and a fresh
production build emits no Station capability chunk. The surviving views are
`reader`, `split`, `deck`, `attention-stage`, `two-column-scroll`, and
`inline-sticky`.

The next independently reversible action is unchanged: make whole-file editing
a projection-neutral Article capability before evaluating the two-column and
inline-sticky relationship.

## Question

Which economics demand-shift projections still answer a live product or
authoring question, which are temporary dependencies, and which can leave the
production surface without changing Article v1, the canonical economics
animation, or historical evidence?

## Finding

The default route is already better isolated than the source tree first
suggests. `reader`, `deck`, and `attention-stage` use the progressively enhanced
static publication path. The four historical presenter layouts load a separate
Svelte presenter and then dynamically load layout-specific CSS.

The main convergence cost is therefore not the default reader payload. It is:

- seven user-visible modes and two query vocabularies (`view` and legacy
  `layout`);
- a 3,212-line shared Svelte presenter with interleaved branches for four
  layout experiments;
- layout-specific styles, geometry, browser suites, preservation fixtures,
  toolbar options, and compatibility tests; and
- hidden coupling between the two-column authoring surface and the old
  inline-sticky presentation geometry.

The clean first retirement is `animation-station`. It was a provisional
stacked-layout exemplar, never promoted to shared grammar, has an already
documented rollback boundary, and has no current editor dependency.

## Reachability Classification

| Projection | Current path | Classification | Recommendation |
| --- | --- | --- | --- |
| `reader` | Static publication plus small progressive enhancer; current default | Release baseline | Keep. This is the safest public and no-JavaScript truth. |
| `split` | Shared Svelte presenter | Accepted interactive comparison | Keep through the public-projection gate. The Article v1 checkpoint identifies it as the accepted interactive projection. |
| `deck` | Static publication plus progressive deck enhancer | Retained comparison | Keep. It is a cheap alternate projection and a useful explicit-control candidate. |
| `attention-stage` | Static publication plus progressive stage enhancer | Bounded product experiment | Keep until the product proof compares symbolic, graph, and code material. It is not universal grammar. |
| `two-column-scroll` | Shared Svelte presenter plus two-column capability CSS | Temporary authoring dependency | Keep short-term. Whole-file editing and its save checks are currently reachable only from this view. Decouple editing before reconsidering it. |
| `inline-sticky` | Shared Svelte presenter plus inline-sticky capability CSS | Retirement candidate with dependents | Do not delete yet. The two-column capability imports its stylesheet and reuses its geometry/data hooks. First extract the surviving shared behavior behind neutral names. |
| `animation-station` | Shared Svelte presenter plus station capability CSS and phase model | Rejected historical experiment | Retire first in two reversible steps. |

This classification does not select the final public layout. It makes the
comparison set smaller and distinguishes a release path from diagnostic and
authoring dependencies.

## Evidence And Cost Shape

The current build contains an independently loaded animation-station chunk of
13,207 bytes of CSS and 281 bytes of JavaScript. Any presenter layout also
loads the shared presenter closure, currently 191,991 bytes of JavaScript and
40,309 bytes of CSS. Removing the station does not materially change the
default reader closure, because that route already avoids the Svelte
presenter. It should reduce the optional presenter closure, but that delta must
be measured after implementation rather than predicted.

Direct station-only source and tests include:

- 511 lines of station CSS;
- 251 lines of station phase logic;
- 805 lines of station browser checks;
- 272 lines of focused phase and preservation tests; and
- one preservation fixture and presenter-capability module.

Additional station branches are interleaved through the shared Svelte
presenter, layout projection helpers, route parsing, navigation, stylesheet
ownership tests, and general presenter browser checks. This is why deleting a
CSS file alone would produce little architectural benefit.

## Proposed Pruning Wave 1

### A. Remove Production Reachability

Make one commit that changes no Article source, semantic graph model, canonical
animation frames, renderer contract, or accepted projection.

1. Remove `animation-station` from the active view and presenter-layout unions,
   view selector, development toolbar, and presenter capability loader.
2. Treat legacy `?view=animation-station` and `?layout=animation-station` as
   retired inputs and normalize them to `reader` with `history.replaceState`;
   do not perform a document reload.
3. Remove the station capability from the production import graph and assert
   that the production build no longer emits a station chunk.
4. Preserve the existing review documents and preservation baseline as
   historical evidence. They are provenance, not active product routes.
5. Keep the physical implementation for the checkpoint until the remaining
   reader, split, deck, attention-stage, two-column, and editor checks pass.

Acceptance criteria:

- the default route remains `reader` and retains static/search/accessibility
  truth;
- old station URLs settle on the reader without a full reload;
- selectors and the global dev toolbar no longer advertise Station;
- no production asset or dynamic import is emitted for Station;
- Article v1 source and generated publication are byte-for-byte untouched;
- economics animation identities, frames, direct seeking, and review capture
  remain unchanged; and
- the two-column whole-file editor still saves without reload.

Rollback unit: revert only the reachability commit. No source implementation
has been deleted at this point.

### B. Delete The Unreachable Implementation

After checkpoint A passes, make a second commit that removes the now-dead
implementation and focused certification surface:

- `src/tutorial/economics-demand-shift/presenters/animation-station-presenter-capability.ts`;
- `src/tutorial/economics-demand-shift/economics-demand-shift-animation-station.css`;
- `src/tutorial/economics-demand-shift/economics-animation-station-phase.ts`;
- station-only branches and markup in
  `KpEconomicsDemandShiftTutorial.svelte`;
- station geometry/types from `economics-demand-shift-layout.ts`;
- station parsing from `economics-demand-shift-route-entry.ts` and
  `economics-demand-shift-view.ts`;
- unused station theme variables from `economics-demand-shift-theme.css`;
- `tests/economics-animation-station-phase.test.ts`;
- `tests/economics-animation-station-preservation.test.ts`;
- `tests/economics-animation-station.browser.spec.ts`;
- `tests/fixtures/economics-animation-station-preservation-baseline.json`;
  and
- station-only assertions and commands in shared tests and `package.json`.

The historical review documents remain. Git history plus those reviews retain
the rejected design and its rationale without keeping it executable.

Acceptance criteria:

- no runtime or test import references the removed files;
- no `animation-station` identifier remains in production source or built
  assets except an explicit legacy-query decoder, if needed for normalization;
- the reader and accepted/retained comparisons render and seek identically;
- split and two-column presenter payloads are no larger than their pre-wave
  baselines;
- the default reader budgets do not regress; and
- focused tests cover the legacy-URL normalization, remaining view list,
  editor availability, stylesheet ownership, and production closure.

Rollback unit: revert only the deletion commit. The reachability decision can
remain while the implementation is restored for diagnosis.

## Verification Set For An Approved Implementation

Use focused truth before broad visual certification:

1. view, enhancement-mode, layout, static-publication, stylesheet-ownership,
   and route-entry unit tests;
2. Article compilation and publication-artifact tests;
3. reader, split, deck, attention-stage, two-column, and authoring-save browser
   checks;
4. production build plus route-closure inspection for the absent station
   capability;
5. accessibility and route performance budgets; and
6. one human check that the remaining global view picker is understandable.

Do not rerun or rewrite the rejected station's full visual matrix before
retirement. Its existing preservation record is sufficient provenance.

## Recommended Follow-Up

After this wave, decouple whole-file editing from `two-column-scroll` so the
editor is a development capability of Article v1 rather than a layout feature.
Then extract only the inline geometry genuinely shared by the surviving
two-column view into neutrally named presenter infrastructure. That makes
`inline-sticky` the next independently reversible retirement candidate.

Do not decide between split and two-column in the same tranche. That is the
later product-projection gate and should use symbolic, graph, and code content,
not repository tidiness, as its evidence.

## Preservation Boundary

- `content/lessons/economics-demand-shift.kp.md`;
- the generated Article v1 publication;
- economics domain semantics and graph renderer;
- deterministic clock, frames, seek, rewind, and URL state;
- `reader`, `split`, `deck`, and `attention-stage` behavior;
- current two-column editing and saving;
- review capture, navigation, themes, accessibility, and no-JavaScript truth;
  and
- historical decision and review documents.

## Decision Record

Pruning Wave 1 was approved and implemented as the proposed two-commit slice.
The audit remains the rationale and rollback record; it does not authorize a
later projection retirement.
