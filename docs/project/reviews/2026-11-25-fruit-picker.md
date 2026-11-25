# Floating fruit picker MVP

The user approved the walkthrough with “go”: a floating picker with a tiny
ProseMirror query, at most five preset fruit suggestions, fuzzy filtering,
keyboard selection and a shrinking result list. This is a bounded successor to
the checked focus pass; that candidate remains available for visual judgment.

## Canonical exemplar and authority

Host: <http://127.0.0.1:8000/experiments/fraction-notebook/>. A masthead Picker
command opens the fruit demo from either pane. ProseMirror owns a single plain
text paragraph and its history; the picker owns transient query-derived results
and one selected fruit identity. DOM rows render suggestions. The existing window
and editor owners restore input focus; Codex conversation and KP notebook/native
rendering retain their authority. No model call, file access or persisted data
migration is involved.

Observable outcome: the query starts in Insert. Typing reveals up to five ranked
matches with emphasized matching characters. Clearing it leaves just the query;
an unmatched query shows a small status cue. The top edge stays fixed while rows
appear/disappear. Arrow keys/Ctrl-n/Ctrl-p navigate, Enter accepts, Escape cancels,
Ctrl-[ enters Normal, i resumes Insert and Normal j/k navigate results. Pointer
selection works too. Choosing reports the fruit and restores the invoking pane,
selection and scroll. No result can be accepted during IME composition.

Use existing theme and cursor roles, a quiet shadow and a transparent backdrop.
The query editor stays mounted during filtering. The dialog owns input while
open; keys cannot operate the background document/chat. No continuous animation,
background polling or dependency is needed for a few dozen static candidates.

## Approved package and verification

One package: implement the fruit-only matcher/query/dialog and minimal workspace
entrypoint, verify state ownership and focus restoration, then show one visual
candidate. The rollback unit is its checked implementation/evidence commit.
Preserve the fixed split, current-line treatment, documents, draft histories,
native preview and the older focus review. No general picker service, library
extraction, file/session/object integration or full fzf compatibility is approved.

Focused checks: matcher ranking/positions and exact five-result cap; single-line
query and native undo; focused Chromium picker interactions including empty/no
matches, narrowing/reversal, paste, IME, modal keys, source/prose/chat restoration,
streaming, repeat open/close and a dark/light/narrow visual packet. Run notebook
types/units, affected chat preservation checks, vision/orientation and Theseus
validation. Reuse stable npm visual commands. An unmatched impact-selector broad
fallback does not promote this development exemplar into a release certification.

Use the KP delivery and visual-salience workflows: one finite exemplar before any
generalization. Two-hour ceiling, final quarter reserved for verification/backup;
checkpoint at least hourly and before handoff. Stop at HUMAN_CHECKPOINT when the
candidate passes its scoped checks, or a named unresolved blocker/ceiling. No
routine phase approval is needed inside this already approved scope.

## Review cues

Open Picker, type `ap`, then `apric`, and erase back to empty. Judge the fixed
query line, five-row cap, matching emphasis and shrinking window. Select with
Ctrl-n/Enter, then reopen and cancel with Escape. Check that the prior editor's
caret and scroll return. Compare light/dark and a narrow viewport. Theseus owns
execution status; this proposal owns scope and the visual finish line.

## Checked candidate

The masthead Picker command now opens one plain-text ProseMirror query. Thirty-six
fixed fruits have deterministic IDs; case-insensitive matches rank exact names,
prefixes, contiguous substrings and then ordered subsequences, with stable ties.
The matcher returns the same character positions used for visual emphasis and
caps results at five. This is intentionally a small local matcher: the existing
catalogue search has stricter distance rules and does not return match positions.
Neither matcher nor catalogue behavior was changed globally.

The one-paragraph schema excludes rich objects and additional paragraphs. A
transaction guard bounds query length and disallows line breaks; plain-text paste
normalizes breaks and respects the remaining 256-character capacity. Normal mode
cannot paste or create a paragraph below. Filtering rebuilds only the small result
list, leaving query selection/history untouched. A new query starts on each open;
closing destroys that editor and removes the result DOM.

The native modal owns input, with the agreed Escape/Enter/navigation keys and an
IME acceptance guard. Arrow/Normal j/k movement keeps focus in the query. Roles,
selected options and active-descendant references describe the same selection;
an arrow and underline supplement color. A transparent backdrop retains the
workspace visually. The query stays above an independently scrollable result list
in a short viewport. Named picker colors and shadow are exposed in Styles, and
keyboard help includes the picker bindings.

Workspace invocation no longer implies switching to the KP pane: the command
declares workspace ownership. Return calls the existing pane/editor focus owner
and restores the captured scroll containers. The modeline reads the transient
query's actual Vim mode without overwriting the remembered pane surface. Global
notebook command handling yields to an open dialog. These boundaries keep query
typing, selection and Enter from modifying a background draft or notebook.

Verified on 2026-11-25:

- `npm run typecheck:fraction-notebook` — pass, including browser test types.
- `npm run test:fraction-notebook` — 23 pass, including three matcher/query tests.
- `npm run visual:editor-chat` — 23 Chromium checks pass. The two new picker
  scenarios exercise stable query identity, growth/narrowing/clearing, zero
  results, pointer/keyboard selection, Vim modes, undo/redo, paste bounds,
  composition-key guards, repeat open/close, theme/forced colors/narrow layout,
  transcript selection/scroll, streaming draft focus and source caret return.
- `npm run visual:fraction-notebook -- --grep 'help, Ex|Styles compares|focused source|phone focused'`
  — five affected Chromium checks pass.
- `npm run test:project-vision` — 75 pass, with unchanged orientation budgets.
- `npm run project:orientation` — current approved fruit successor is explicit;
  the prior focus candidate remains checked, not silently accepted.
- `theseus workspace validate` — valid; receipt closed and the checked package
  deferred at its visual review boundary.

The first focused browser run found a test error after successful source-caret
restoration: it compared an initial virtualized CodeMirror viewport with a later
larger DOM range. The assertion now compares the edited first line through Undo;
the full suite subsequently passed. No application check was disabled.

Inspected the regenerated dark/light/390-by-380 captures from the stable visual
command. They show a stationary query, shrinking rows, matching-letter emphasis,
selected-result cue and no backdrop dimming. Captures remain disposable review
aids, not accepted goldens. The persistent local service is running; the canonical
URL returned HTTP 200 at handoff.

No new dependency, service, polling loop or persistent resource format was added.
Matching is synchronous over 36 labels; no large-corpus performance claim follows.
Chromium checks and composition-key guards do not certify other browsers, assistive
technologies or every operating-system IME. Exact placement and appearance remain
subject to visual judgment before a second resource kind or general picker API.

Outcome: `HUMAN_CHECKPOINT` for this single fruit exemplar. Use the review cues
above; Theseus owns the completed package and deferred review state.

## Subsequent acceptance

The user responded “Very nice,” explored Helm/Vertico/fzf customization, then
approved [workspace commands](2026-11-25-workspace-commands.md) as the next use
of this presentation, with both Alt-x and Ctrl-x Ctrl-x. The fruit exemplar's
finite finish line is retained; the new command registry has its own contract.
