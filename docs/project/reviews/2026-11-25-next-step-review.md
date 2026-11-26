# Next step: workspace frame, then mathematical authoring

Date: 2026-11-25
Status: workspace-frame implementation approved; visual judgment pending

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

## Checked candidate and review packet

The editor now opens without its header. A single modeline forms the bottom
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
