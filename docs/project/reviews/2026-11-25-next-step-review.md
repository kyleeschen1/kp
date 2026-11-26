# Next step: workspace frame, then mathematical authoring

Date: 2026-11-25
Status: workspace frame accepted; M0 quadratic authoring is the proposed successor

## Direction and current evidence

The user endorses the documented Vim and mathematical direction, then requests
a larger modeline above all application layers, an enclosing workspace feel,
and removal of the editor header for now. Their clarification is that the picker
already feels contained in the split view. Preserve its placement and containment;
do not reinterpret that feedback as acceptance of every row/filter interaction.

The checked row-picker contract remains the execution record for its completed
implementation and pending review. This recommendation is a separate successor,
not an expansion or resumption of that contract. The mathematical programme is
the intended return path after this small presentation pass. The initial review
made no UI changes; the subsequent approval below selects the frame implementation.

## Candidate comparison

Scores are planning judgments from 1 (low) to 5 (high), not measurements; lower
risk is preferable. The user's requested sequence selects the first candidate.

| Candidate | Authoring value | Reliability/demo value | Reuse | Complexity risk | Recommendation |
| --- | ---: | ---: | ---: | ---: | --- |
| Modeline/frame and header pass | 3 | 4 | 3 | 2 | First; small, reversible presentation outcome |
| Complete quadratic authoring workflow | 5 | 5 | 5 | 3 | Next substantial product proof |
| Finite conventional Vim core | 4 | 4 | 4 | 3 | Separate bounded editing slice; not a prerequisite for mathematics |
| Broad Vim parity or generic window framework | 2 | 2 | 3 | 5 | Keep visible in the backlog; not the current priority |

The frame pass resolves the latest interface request without adding a new
window model. The saved quadratic workflow then provides cross-session continuity
and reuses existing math, dependency, graph and command owners. Neither needs
another documentation system, speculative framework, or full editor migration.

## Immediate finite outcome

Canonical artifact and host: the existing fraction notebook and joined Codex
chat at <http://127.0.0.1:8000/experiments/fraction-notebook/>. The workspace DOM/CSS
owns the frame; native dialogs currently own modal picker presentation and focus.
`mountWindows` owns pane focus and the modeline observes editor-owned Vim state.
Codex sessions, notebook data, the fraction compiler and native renderer retain
their current semantic authority.

Approved implementation:

1. Enlarge the modeline, starting around 44–48px at default text size, with
   theme/style variables for text, padding, background and shadow. Allow growth
   with text size and mobile safe areas; reserve space so composition is visible.
2. Make it the substantial bottom edge of a thin surrounding workspace frame.
   Frame/modeline paint sits above the application pickers. Native modal dialogs
   use the browser top layer, so merely increasing a normal z-index is inadequate.
   Resolve layering with deliberate focus, dismissal and accessibility ownership.
3. Hide the header in the editor layout. Keep the site header available for a
   future published layout. Retain commands through M-x / C-x C-x and a small
   pointer-accessible Commands entry; relocate visible save/error status.
4. Preserve picker placement, stationary equal panes, text measure, existing
   selections/history, chat drafts, native rendering and source ownership.

The smallest rollback unit is the frame/header/popup integration change plus its
preservation checks. No storage migration, new window system, popup redesign or
general editor promotion belongs in this pass.

Visual checkpoint after implementation: open M-x and Vim coverage in the split
view. The frame should enclose the workspace, the larger modeline should stay
visibly above the popup, and the header should be absent. Escape must restore
the original editor/selection; save errors remain visible. Check enlarged text,
short/narrow viewports, light/dark themes and continued composer access. Extend
the existing scoped browser checks for focus, mode, dismissal and layout; visual
judgment selects the provisional sizing/shadow.

## Return path and finish lines

After the presentation checkpoint, start the existing
[M0 quadratic workflow](../2026-11-25-mathematical-authoring-programme.md#6-ordered-work-packages-and-dependencies):
one saved polynomial exposes graph, derivative and tangent operations through
the command/row interface. Source edits update the linked representations and
the relationships survive reload. Its exemplar comes before broad abstraction.

Then M1 uses a vector/matrix caller to prove the same discovery, dependency and
persistence boundaries work for a different object. Promote shared adapters only
after both callers. The existing programme owns the later algebra, linear
algebra, complex/trig/eigen, calculus/conic and 3D/multivariable order, supported
families, edge cases and gates; this review does not duplicate its package table.

Keep the accepted [Vim priority and reuse semantics](../decisions/2026-11-25-vim-core-and-semantic-commands.md).
A finite editing-core slice can improve authoring without making exhaustive Vim
parity a gate. Copy, Derive and Transclude stay distinct.

Older moving-window treatments remain rejected; the matrix Pour treatment and
earlier promotion gates remain unaccepted/deferred as recorded. The broader
authoring-to-practice direction remains intact. Select an exact new Theseus
contract when implementation starts; no historical run is implicitly resumed.

## Review-record verification

`npm run test:project-vision` passes all 75 checks and `npm run project:orientation`
reports the proposed frame successor while retaining the named row-picker
execution record. The first check found the roadmap/thread five/two words over
their existing budgets; summaries were shortened without changing those limits.
`git diff --check` passes. These are documentation/vision checks, not evidence
that the proposed frame or mathematical workflow has been implemented.

## Implementation approval

The user says "go" after the ordered frame → review → quadratic → matrix sequence.
Execute this first presentation package through
`run-contract.kp.workspace-frame-20261125`, linked to this review. Its finite
finish is a checked frame/header candidate and one visual review packet before
the mathematical work. Use a three-hour ceiling, reserving the final quarter
for verification, evidence and backup; checkpoint at the coherent rollback unit.

The impact selector has no focused rule for this dev-host UI and defaults to
the production release matrix. Use the complete notebook/chat consumer typecheck,
existing notebook/chat unit checks, Chromium chat/picker integration and the
affected notebook source/reading checks for this bounded discovery pass. The
existing site-header layout remains an explicit compatibility fixture; dedicated
workspace-frame cases exercise the headerless default, modal overlap, focus,
large text and error visibility. Keep the general row promotion and later
cross-browser release boundaries separate from this exemplar's visual judgment.

## Initial checked candidate and review packet

This first candidate is superseded by the requested revision below. The editor
opens without its header. A single modeline forms the bottom
edge of a thin surrounding frame, with a 48px minimum height, larger text and
theme-linked shadow. Styles exposes its size, padding, colors, height and shadow,
plus the frame width/color/shadow. The equal split, document measure and picker
placement remain intact. M-x / C-x C-x and the modeline's Commands button retain
access to the registry. `Toggle site header` restores the optional header for
the current tab; status, errors and fruit selection feedback live in the bar.

One small workspace owner uses a native manual popover for paint above native
modal dialogs and a measured spacer for layout. During a modal the real frame
is reparented under that dialog, keeping the dialog's focus trap and the footer's
existing inert behavior. It adds no editor, dependency or conversation/store
owner. Its two observers and popover have explicit disposal. Codex session state,
notebook identity, compiler, native renderer and independent editor histories
remain with their existing owners.

The live-height regression exposed an invalid geometry assumption: observing
the viewport-sized root did not detect lost usable space when the modeline grew.
Vim coverage now observes the actual pane area. Browser coverage pressures
growth and reversal while the picker is open. Persistent-save errors also retain
their error state after a successful preview; narrow reading mode cannot silently
hide them as routine success status. These are runtime/browser safeguards, not a
claim that CSS geometry or browser top-layer behavior is statically proved.

Final verification:

- `npm run typecheck:fraction-notebook` passes for the complete affected consumer.
- `npm run test:fraction-notebook` passes 28 checks;
  `npm run test:editor-chat` passes 25.
- `npm run visual:editor-chat` passes all 35 Chromium cases, including three
  headerless cases, real modal overlap, selection return, live resize/reversal,
  phone/large text, errors, streaming and multi-tab behavior.
- `npm run visual:vim-coverage` passes its scoped Chromium suite.
- `npm run visual:fraction-notebook -- --grep 'focused source|modal cursors|help, Ex|Styles compares|light canvas|phone focused'`
  passes all seven affected source/reader cases.
- `npm run test:project-vision` passes 75 checks; `npm run project:orientation`,
  `theseus workspace validate` and `git diff --check` pass.

Initial failures and exact reruns are retained in Theseus. A multi-tab fixture
needed context-wide optional-header setup; the new resize case reproduced and
then guarded the geometry repair. One source-reload case timed out waiting for
the preview acknowledgement. It passed unchanged both in isolation and in the
complete seven-case rerun. No timeout/assertion was weakened, and no deterministic
cause has been established: this remains an intermittent observation, not a
claimed lifecycle fix. This discovery pass establishes Chromium behavior; it is
not a supported-browser release matrix or aesthetic acceptance.

Review at <http://127.0.0.1:8000/experiments/fraction-notebook/>:
open Commands (or M-x / C-x C-x), then inspect the Vim bindings picker. Judge
whether the larger bottom bar and thin rim feel like one enclosing layer, and
whether its height and shadow are comfortable. The popup should keep its familiar
placement, with the frame above it. Escape should return to the same editor and
caret. Try light mode or larger text through Styles if useful; the composer stays
above the bar. Visual acceptance remains the next decision before the quadratic
authoring workflow; no mathematical or broad row-picker promotion was started.

## Requested visual revision

The user requests more modeline spacing and end padding, removal of routine save
messages and the Chat/KP/Commands controls, and the former beige background. They
also report a wrong initial color and blue background in the rendered KP page.
This authorizes the `quiet-modeline` successor package in the existing contract;
it does not accept the preceding candidate or begin mathematical work.

Keep the same canonical notebook, native reader and semantic owners. The bar
shows mode and time, with transient command-prefix feedback and actionable
notices/errors only. Keep context in accessible labels/tooltips and commands in
M-x / C-x C-x; the optional header can retain its launcher. Start with 16px block
padding, 32px end padding and a 64px minimum height. Restore the accepted light
paper as the default while retaining an explicit saved dark theme. Load the
preview's notebook palette before first paint, not only with its deferred editing
bridge. Preserve split measure, native animation, drafts, history and picker
focus. The rollback unit is this presentation/startup revision plus its checks.

Use the existing focused-check exception above: affected consumer types and unit
checks, the complete chat browser suite, native Vim coverage, and theme/startup
plus affected reader checks. Pressure delayed modules, default/saved/corrupt
preferences, transparent embedded preview and explicit theme switching. Judge
spacing and the matching beige at the same URL before the mathematical return.

The revised candidate implements those defaults. Normal operation displays only
mode and time; mode context remains available to assistive technology and in the
tooltip. Routine checking/success status is hidden at every width. Pending source
work and errors remain visible without a save acknowledgement. Commands remains
in the optional header, and both keyboard launchers and pane-switch commands work
without it. No modeline button or pane label remains.

The startup regression was reproduced with the old deferred-only stylesheet:
the parent was already light while the embedded reader retained its native dark
color scheme, ink and stage tokens until `preview.ts` arrived. The existing
render-blocking preview stylesheet now imports the same notebook theme. Browser
checks delay that bridge and sample paper, ink and scheme from the parent render
loop before release, then verify the hydrated result. The accepted `#eeefe9`
paper is the default; saved dark/custom choices still work and unreadable stored
preferences are preserved. No new dependency or reader/animation owner was added;
the already-required stylesheet loads earlier.

Style comparison also exposed a real focus-boundary defect: calling native
`reportValidity()` from a blur-triggered change handler could divert the next
edit. The field now retains its custom validity and shows associated inline alert
text without reentering focus. Correction and reset clear that feedback. The
existing invalid-cycle → valid-color → reload test now also checks the accessible
error and its removal. This is a browser regression safeguard, not static proof
of focus behavior across all engines.

Final revised checks: complete consumer typecheck; notebook/chat unit checks
(28/25); `npm run visual:editor-chat` (35 Chromium cases);
`npm run visual:fraction-notebook -- --grep 'theme|default beige|light canvas|Styles compares|focused source|help, Ex|phone focused'`
(11 Chromium cases); `npm run visual:vim-coverage` (six Chromium cases); and
project-vision checks (75) pass. The selected source
reload case passed in this run. Initial failures and repairs remain in Theseus,
including the deliberate old-stylesheet reproduction, parent-frame paint-sampling
correction and updated expectations for the requested light/no-save defaults.

Latest review cue: reload the canonical notebook and inspect the 32px end padding,
16px vertical padding and matching beige. The bar should read as mode at the left
and time at the right, without the prior labels or routine save message. Use
Alt-x or C-x C-x for M-x, and `Edit` there to inspect the rendered reading from
startup. Escape returns to the previous editor. The existing frame's modal paint
ownership and fixed split remain intact; mathematics still follows this review.

## Remaining blue pane edge

The user's follow-up identifies a blue line on the KP pane's left edge. The
canonical headerless notebook reproduces it when the pane container owns focus
before its reader bridge is ready: Chromium applies an `auto 1px` outline in
`rgb(0, 95, 204)`. The top/right/bottom are covered by the enclosing frame, leaving
the left edge visible. The normal iframe and themed pane divider do not own it.

The shared window wrapper now suppresses only its duplicate native outline.
Existing active-pane shadow, child control focus rings and the explicit
forced-colors outline retain focus indication. The rollback unit is the
container style, focus-order correction and browser regression; no theme palette, pane geometry,
selection, reader model or animation is changed. This is an exact paint-owner
repair, with no new motif or additional aesthetic approval gate. The broader
frame's existing review boundary remains open.

The same regression pressures startup, picker dismissal, both themes,
forced-colors and returning to editing. It also exposed a focus ordering defect:
`setEditing` requested document focus before the layout owner cleared the
reading-only `inert` state. It now applies that layout transition before choosing
the keyboard destination, so the document actually receives focus on return.
This preserves the existing layout/focus owners and adds no new state store.

Verification: `npm run typecheck:fraction-notebook`, the focused pane-edge
regression, the complete `npm run visual:editor-chat` suite (36 passed), and
`npm run visual:vim-coverage` (six passed). The regression first reproduced the
native blue outline, then exposed the inert/focus ordering failure; both were
repaired without weakening assertions. The canonical host responds HTTP 200.

Reload <http://127.0.0.1:8000/experiments/fraction-notebook/> in reading mode,
open/dismiss M-x, and return to Edit. The pane edge should stay neutral while
the editor receives keyboard focus; text inputs retain their own focus rings.

## Accepted frame and next recommendation

After the neutral-edge repair, the user says "great! what's next". This accepts
the bounded frame refinements and closes their review checkpoint. It does not
accept every earlier row/filter interaction or approve the full mathematical
programme. Keep those distinct review boundaries and the rejected moving stacks.

The candidate comparison above now selects **M0: complete quadratic authoring
loop**. Begin with one saved object such as `f(x) = x² + c`; select it to discover
Graph, Derivative and Tangent in the existing command/row interface. Changing
`c` updates its declared symbolic and graphical dependents. Moving the tangent
point exposes the relationship between `f`, `f′` and slope. IDs, dependency
recipes and separate occurrence settings must survive save/reload; invalid or
superseded drafts must preserve the last valid result.

This is the first product proof of the proposed mathematical programme, not a
claim that the fixture or commands already exist. The programme owns its exact
family limits, operation contracts, performance baseline, M0 sequence and G1
checkpoint. Use the existing notebook host and domain renderers. After G1, a
vector/matrix caller tests whether discovery, persistence and dependencies are
actually reusable before expanding the remaining animation families.

The finite conventional Vim core remains worthwhile alongside this work; broad
parity is not a prerequisite. Copy, Derive and Transclude retain their accepted
distinct meanings. Current recommendation: M0 only with the proposed six-hour
ceiling, reserving the final quarter for checks and handoff; it is a ceiling,
not an effort estimate. This turn records the handoff and recommendation without
starting mathematical implementation or resuming historical runs.

Handoff verification: all 75 `npm run test:project-vision` checks pass;
`npm run project:orientation` reports the resolved frame contract and proposed
quadratic successor. The first check caught 661 words against the roadmap's
650-word limit; shortening its charter pointer restored the existing budget.
This is direction/record verification, not mathematical feature evidence.
