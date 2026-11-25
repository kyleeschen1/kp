# A conversation column with a retained draft

Approved by “implement this” after the single-column chat design discussion.
This succeeds the checked rich-chat candidate; its permanent toolbars were not
accepted. Preserve that candidate's formatting, annotations and recovery.

Canonical exemplar: Chat at
`http://127.0.0.1:8000/experiments/fraction-notebook/`. ProseMirror owns the
read-only transcript and independent editable draft; CodeMirror owns optional
Markdown source. KP reader typography/theme variables own presentation. Native
Codex threads own model history. KP stores annotations, explicit orientation,
topics and branch references; no topic or note is silently sent as context.

Outcome: read and navigate a quiet column; `i` reveals the continued draft;
Escape retains it and restores the reading point. Explicit Send clears only the
acknowledged draft. Incoming responses follow the end only while already there.
A Ctrl-C transient owns its keyboard scope and restores the invoking selection.
It exposes notes/comments/tags, Markdown, search, help and connection commands.
Topics, a manually authored objective and a saved return point help the author
recover context. A branch forks through a completed response and retains its own
draft and reading position; branch switching cannot redirect a pending send.

Three packages: the column and scoped transient; bounded topics/orientation and
native branch navigation; integrated exemplar verification and review. Theseus
owns their live order and status. Keep one chat host; no standalone workspace,
general editor framework, image-generation integration, automatic model calls,
notebook editing, publication or broad renderer changes. Advanced custom Vim
operators remain parked. Existing notebook and native reader are preserved.

Acceptance: move to an old passage, write part of a question, Escape, navigate
elsewhere and resume the same draft. Selection, scroll and draft caret survive.
Streaming, source mode, transient dismissal, notes, reload, conflicts and branch
switches cannot cause implicit sends or cross-thread writes. Context is explicitly
editable. Unsupported native branching must retain the original conversation.

Focused verification: `npm run test:editor-chat`,
`npm run typecheck:fraction-notebook`, `npm run visual:editor-chat`, affected
notebook checks and `npm run test:project-vision`. Use the deterministic native
peer for turns and branching; installed schema/lifecycle checks do not request
inference. The impact selector has no focused chat rule; this visual exemplar
uses declared focused checks before human review, not a production promotion.

The reversible unit is this chat interface and versioned navigation reader,
keeping old recovery records readable. Checkpoint implementation and evidence
together; back up at least hourly. Allow up to three hours with a final-quarter
verification reserve. Stop at one human interaction checkpoint before promotion
or a second host; repair failures within this scope without waiving checks.

## Checked candidate — human interaction review pending

The transcript and retained composer now share KP document typography and theme
variables without permanent toolbars or speaker labels. Normal mode navigates
read-only output; `i` resumes the independent draft caret. Escape saves/hides the
draft and restores the selected passage and viewport. Ctrl/Cmd-Enter sends
explicitly. Markdown source and notes retain independent Vim state; their first
Escape enters Normal, and the next returns to reading.

`C-c` opens sticky scoped commands. `h` shows keys, `/` searches loaded output,
`g` opens topics, `w` opens explicit orientation, `b` branches at a completed
native response, `s` switches branches and `r` returns to a saved passage.
Branch creation retains a return point to its parent. Objectives/topics/notes
remain local navigation records; they are not hidden prompt input.

Version 3 recovery reads existing version 1/2 records. Native thread identity,
branch-scoped mutations, context revisions and pending-delivery guards prevent
cross-branch writes. Runtime checks reject duplicate owners, ancestry cycles and
parked pending sends. Failed fork persistence restores the original branch and
draft without automatic retry. A native fork may have been created before that
local failure; it is not silently reused or deleted. Roll back presentation
independently; retain the version 3 reader for any newly saved branches.

One transcript and one composer stay mounted, plus at most one active note
editor. Unchanged parsed message nodes are reused. Snapshots omit parked message
bodies; all branches share the existing display/storage budget. Bounds: 16
branches, 32 topics per branch, 80 loaded messages per branch, 6 MiB total display
cache and 8 MiB recovery file. Search is limited to loaded output, with 1,000
matches maximum. Book search and arbitrary custom Vim text objects remain parked.
Transient text prompts use native fields; full Vim minibuffers are not claimed.

Verification on November 25:

- `npm run test:editor-chat`: 23 passed, covering migration, prefix branches,
  revisions, interruption, restart, failed persistence, HTTP and transport.
- `npm run visual:editor-chat`: 14 Chromium checks passed. They cover selection,
  viewport/caret return, streaming, source/notes, delayed acknowledgements,
  cross-tab drafts, topics, branches, reload, themes, phone layout and live
  recovery-file privacy. Desktop reading/draft/transient and light/phone captures
  were inspected. A racing test helper was repaired to observe dismissed dialogs
  without waiting for a hidden accessibility role.
- `npm run typecheck:fraction-notebook`: passed without weakening types.
- `npm run test:fraction-notebook`: 20 passed; `npm run visual:fraction-notebook`:
  21 passed. The production reader remains 1,250,344 JS bytes / 308,778 gzip,
  414 modules, excluding notebook/chat editors.
- `npm run test:project-vision`: 75 passed after retaining the roadmap word budget.
- `npm run check:editor-chat:codex`: installed Codex connection and empty-thread
  restart passed with no inference. Installed 0.169.0 protocol includes
  `thread/fork.lastTurnId`; populated branching uses a deterministic native peer
  in tests. Real model-backed branching and cross-browser/mobile keyboard
  behavior remain unverified.

Observed focus and scrolling failures were repaired at their owners:
read-only ProseMirror now receives actual focus, native selection and motion
events while retaining its transaction write fence; save acknowledgements cannot
scroll unchanged output; transient generations prevent stale acknowledgements
from closing a newer popup. Executable browser cases retain these safeguards.

Review at the canonical URL: open Chat (use `C-c R` to connect/resume if needed),
select an older passage, press `i`, type part of a question, Escape, then `i`.
Judge whether both places survive without reconstructing context. Use `C-c h`
for commands, `C-c w` to record the broader objective, then branch from a completed
reply and use the return command. This is one candidate awaiting human judgment,
not acceptance or promotion of a general workspace.
