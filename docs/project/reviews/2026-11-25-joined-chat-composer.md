# Joined transcript and composer

Status: HUMAN_CHECKPOINT — implemented and checked; visual acceptance pending.

After pausing for discussion, the user approved retaining both editors for
navigation and folding. Fill the chat pane with internal padding, distinguish
You/Codex, and fold code and tool output with za/zo/zc. Search reveals folded
matches. Fold preferences survive streaming and session changes; collapsing
content above the viewport preserves the visible passage. This is the approved
amendment to the same unfinished exemplar, not a new window framework.

The user requests a ChatGPT-style Codex column: two independent ProseMirror
editors inside one continuous border, transcript above and persistent composer
below. The composer grows with its content to a configurable cap, then scrolls
internally. Use ordinary flexbox, without editor nodes or decorations for layout.

Canonical artifact and host: the existing fraction notebook at
`http://127.0.0.1:8000/experiments/fraction-notebook/`. The read-only transcript
and editable composer retain independent states. Native Codex threads own model
history; the chat service owns snapshots and per-branch drafts. ProseMirror
renders those snapshots and edits only the draft. Notebook JSON and the native
KaTeX preview remain unchanged.

Preserve the [completed fixed split](2026-11-25-fixed-chat-split.md): Codex left,
KP right, stationary equal outer panes and the global masthead. This supersedes
the chat's fixed bottom-third sizing and centered 491px card. Preserve Vim, multiline input,
keyboard submission, rich Markdown, notes, explicit branches and draft recovery.
Display native tool results without granting new execution capabilities.

Acceptance: one joined border and separator; bottom composer stays visible,
grows and caps; transcript follows output near the bottom but preserves earlier
reading while resizing or streaming. Streaming must preserve composer focus,
selection and undo. Session/branch changes must retain independent drafts.
One reversible chat package covers CSS, resize ownership, tool-result projection
and focused regressions. No broad editor framework, automatic document changes,
model spending, publication or new session-management system is included.

Verify scoped types, chat unit/browser checks and project-vision sources. Use
the canonical URL for visual review of the joined column before any broader
promotion. Theseus owns execution and evidence.

## Review the candidate

Open Chat at the canonical URL. Its border fills the left pane, with internal
padding, You/Codex labels and a single separator above the persistent composer.
Enter inserts a paragraph; Cmd/Ctrl-Enter sends and leaves composition focused.
Typing grows the composer until its cap, then scrolls within it. Styles → Chat
exposes the maximum height, pane padding and speaker-label color. The cap defaults
to 40vh and cannot consume more than half the chat column.

Click a code/tool disclosure or use za/zo/zc at the block (or before the next
one). Search with / to reveal a folded match. Folding preferences are local to
the project and branch. Navigate upward during output and confirm the visible
passage stays put; G resumes following. i returns to the saved draft cursor.
Judge the padding, labels, divider and balance between writing and reading.

## Evidence and bounds

Passed: `npm run typecheck:fraction-notebook`, all 25 `test:editor-chat` cases,
all 19 Chromium `visual:editor-chat` cases, all 75 `test:project-vision` cases,
`npm run project:orientation` and `git diff --check`. Inspected dark/light,
folded, growing-composer and phone captures from the stable browser command.
Native protocol events use the existing deterministic peer; no model inference
or execution-permission changes were made. Installed app-server types were
inspected for command, function, MCP, dynamic-tool and file-change results.
Non-text results receive an explicit placeholder; command output streams live.

The first full browser pass had 18 successes and one navigation failure. A
focused repeat showed that scroll-intent tracking alone did not repair it:
native selection could remain in the composer when the read-only transcript
received focus, preventing Vim motions from scrolling. The rich-editor focus
boundary now synchronizes the native range on every focus path; explicit
navigation also updates following before deferred resize callbacks. The failing
case passed twice, then the full 19-case suite passed. Regressions cover that
transition, independent undo/caret, cap/internal scroll, near-bottom following,
older reading, fold/search/reload/branch persistence and unchanged native bytes.
Initial type checks caught an unused import and an insufficiently narrowed test
DOM element; both were corrected. Orientation initially exceeded the existing
entrypoint word budgets; shortened prose restored both gates without raising them.

Native messages remain authoritative and read-only transactions remain fenced.
Tool records are a discriminated message variant, projected as literal code for
consistent display/annotation coordinates. Late/foreign output cannot overwrite
a completed or differently owned message. Composer layout needs no custom nodes
or decorations; transcript folds use a local plugin, and resizing uses one
disposed observer. No new dependency or rendering framework was introduced.
Fold identity uses native message IDs plus code-block order, stable during
append streaming; arbitrary historical code-block reordering is not certified.
The UI treatment can roll back independently; retain the tool-record reader if
tool messages have already entered local recovery. General promotion and a
supported-browser release matrix remain outside this exemplar checkpoint.
