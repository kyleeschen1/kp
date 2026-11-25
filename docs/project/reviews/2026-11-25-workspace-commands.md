# Workspace command registry and M-x

The user approved the command-registry proposal and added `Ctrl-x Ctrl-x` as
an alternative to `Alt-x`. This is the selected successor to the fruit picker,
whose appearance was positively received. It helps authors find existing
workspace actions without searching through separate menus or losing a selection.

## Authority and finish

Canonical host: <http://127.0.0.1:8000/experiments/fraction-notebook/>. Retain the
fruit picker's single ProseMirror query, theme roles and quiet floating window.
DOM rows display command descriptions; the registry owns command discovery and
dispatch, while notebook/editor/session owners retain mutations, selections,
history and validation. No animation or authored content changes are involved.

Finish: Commands, Alt-x and Ctrl-x Ctrl-x open the same searchable command picker.
Existing workspace buttons, structural actions, chat transients and Ex commands
invoke registered identities. Scoped form/object commands retain typed targets.
Five rows are visible at a time; more results remain navigable. Availability,
toggle state and shortcut cues come from command definitions. Escape restores
the initiating context. Execution validates the captured owner before applying
an action; query typing cannot affect the background editor.

One bounded package, `commands`: implement registry and adapters, reuse the
query surface, test dispatch/focus/chord ownership, and prepare a visual review.
Retain the current controls during migration. Preserve fixed 50/50 panes,
drafts, native undo, session state, existing confirmations and rendered reading.
The rollback unit is the checked implementation/evidence commit; no external
command execution protocol, plugin loader, remote MCP endpoint, UI redesign,
new session provider, full Emacs compatibility or global renderer migration.

## Verification and stop

Focused unit checks cover registration/disposal, duplicate identities,
availability revalidation, ranked discovery and interrupted key sequences.
Chromium checks exercise both shortcuts, no accidental cut or background typing,
selection-based Bold and Undo in notebook/chat, context return, unavailable
commands, source/form ownership and continued chat streaming. Run notebook
types/units, chat units/browser preservation, affected notebook browser checks,
project vision/orientation and Theseus validation. The impact selector has no
focused rule for this development host; use these complete affected consumers,
not an unrelated production-release matrix.

Use the KP delivery workflow, with a three-hour ceiling and the final quarter
reserved for verification and closeout. Checkpoint and back up at least hourly.
Stop at HUMAN_CHECKPOINT when the bounded candidate is checked; preserve an
explicit unfinished checkpoint if a ceiling or genuine blocker intervenes.
Theseus owns execution progress, this document owns scope and review criteria.

## Review cues

Select notebook text, press Ctrl-x Ctrl-x, find Bold and run it. The original
selection changes; Undo reverses it. Repeat in the chat composer. Try Alt-x,
Styles, Help and structure commands; search unavailable commands to inspect
their explanation. Cancel a query and check cursor/scroll return. Judge five-row
navigation, annotations and shared appearance in dark/light/narrow layouts.

## Checked candidate — 2026-11-25

The registry and picker are implemented. Notebook controls, structural actions,
styles, workspace navigation, chat transients, note controls, transcript folds
and Ex aliases use registered action identities. Repeated notes, topics and
branches bind typed targets to one action rather than registering an action per
object. Native prose/source editors and the session layer still own history,
validation and persistence. The reader keeps its own domain controls; only the
two launcher shortcuts bridge its same-origin iframe to this workspace.

The picker retains the original pane, element, editor selection and scroll.
Execution rechecks availability, captured branch identity and registration
lifetime. A disposed owner cannot execute a captured command or interfere with
a replacement registration. The command query has its own editor state and
never becomes the target. Five rows are visible; all results remain navigable.
Names and aliases match fuzzily; descriptive metadata uses literal matching to
avoid surprising matches across concatenated identifiers. Recent successful
commands rank first among equally relevant and available results.

An initial full chat check exposed stale disabled note buttons after a save.
The registry binding now refreshes repeated target rows when owner state changes
and releases listeners when rows disappear. Both original failures and the full
suite pass after that repair; no acceptance assertion was weakened.

Evidence:

- `npm run typecheck:fraction-notebook` passes.
- `npm run test:fraction-notebook` passes 28 tests, including captured targets,
  disposal/replacement during async work, ranking and interrupted key sequences.
- `npm run test:editor-chat` passes 25 tests.
- `npm run visual:editor-chat` passes all 26 Chromium cases, including both
  launchers, notebook/chat Bold and Undo, five-row navigation, disabled actions,
  keyboard-focused header return, source caret and uninterrupted streaming.
- `npm run visual:fraction-notebook` passes all 23 Chromium cases, including
  structure, inline objects, metadata, source editing, Ex commands and styles.
- `npm run test:project-vision` passes 75 tests; `npm run project:orientation`
  selects this contract and review, and `theseus workspace validate` passes.
- Dark, light and 390px-wide command-picker captures inspected. The existing
  shared font, theme roles, fixed panes and modeline remain intact.

This is a local workspace registry, not an exposed agent execution API. No new
dependencies or model calls were added. Browser evidence is Chromium only;
there is no large-corpus performance or cross-browser certification claim.
`C-x` is now a consumed workspace prefix with a 1.8-second second-key window;
an unrelated key, focus change, composition or Escape cancels it. Native
Command-x on macOS is unaffected. Current scope stops for human visual judgment;
future resource providers, plugin APIs and custom keymaps remain separate work.
