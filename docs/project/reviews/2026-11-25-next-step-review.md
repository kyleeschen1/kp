# Next step: workspace frame, then mathematical authoring

Date: 2026-11-25
Status: recommendation and discussion record; no new implementation run started

## Direction and current evidence

The user endorses the documented Vim and mathematical direction, then requests
a larger modeline above all application layers, an enclosing workspace feel,
and removal of the editor header for now. Their clarification is that the picker
already feels contained in the split view. Preserve its placement and containment;
do not reinterpret that feedback as acceptance of every row/filter interaction.

The checked row-picker contract remains the execution record for its completed
implementation and pending review. This recommendation is a separate successor,
not an expansion or resumption of that contract. The mathematical programme is
the intended return path after this small presentation pass. No UI changes or
new mathematical capabilities are implemented by this review.

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

Recommended implementation:

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
judgment selects the provisional sizing/shadow. This candidate does not exist yet.

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
