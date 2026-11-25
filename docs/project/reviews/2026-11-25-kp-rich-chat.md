# Rich chat, notes and passage annotations

Approved by “implement this for the chat window”, following the discussion of
reusable ProseMirror profiles, small notes, comments and tags. Deliver the first
chat exemplar inside KP; broader library extraction remains a later decision.

Canonical host: the existing Chat panel at
`http://127.0.0.1:8000/experiments/fraction-notebook/`. ProseMirror owns composer
and note/comment editing. Markdown remains the portable text representation sent
to Codex; native thread history stays authoritative. KP owns independently saved
annotations and notes. Preserve notebook JSON, the accepted native fraction
renderer, all existing chat delivery/recovery rules and theme variables.

Outcome: write formatted messages with the existing normal/insert conventions;
read formatted replies; select a passage, attach a rich comment and tags, and
revisit its exact context after reload. Create small conversation notes in the
same panel. Persist annotations separately from model messages, retaining the
quoted passage when its target changes or is no longer in the display cache.
No automatic send or inference is allowed in verification.

Two packages: reusable local rich-text profiles and durable annotation boundary;
then the integrated chat UI, regression checks and one visual review packet.
Use shared schema/style definitions with independent editor state. Keep mounted
views bounded by visible/editing surfaces, and update only changed messages.
Protect read-only transcript text even when a keyboard command dispatches a
transaction. Use explicit target identity, quoted range and revision checks for
annotations; ambiguous or changed targets remain visible and recoverable.

Verification: existing service/recovery tests plus annotation validation, stale
write conflicts, legacy-record migration, formatting round trips and lifecycle;
focused TypeScript; one Chromium chat suite including Send, delayed acknowledgement,
comments/tags/notes, reload, keyboard isolation, transcript protection, themes and
phone layout; notebook/reader preservation checks where affected. Actual paid
model responses remain the user's explicit Send. Existing scoped npm commands
own browser checks and disposable captures.

The reversible unit is the chat enhancement and its data reader, preserving old
recovery data and portable draft text. No new session manager, general workspace,
catalogue rollout, external deployment, library publication or automatic notebook
editing. Existing standalone Spindle remains untouched. After this exemplar's
human review, choose any second host or generalization explicitly.

Allow up to three hours including a final-quarter verification/backup reserve;
checkpoint coherent verified work and push at least hourly. Finish at the working
chat's human interaction checkpoint. Repair observed failures within this scope;
do not waive preservation checks or broaden the product to fill the timebox.

## Candidate and inspection

Open the fraction notebook URL above and choose **Chat**. If the development
service has restarted, choose **Resume conversation**. The composer starts in
Normal mode: `i` writes, Escape returns to Normal, and `:h` or **Keys** lists
available commands. **Markdown** opens a CodeMirror source editor; **Rich text**
returns to the same document. Cmd/Ctrl+Enter sends only from the composer.

Responses render headings, lists, links, fenced code and KaTeX. Select a passage
in one completed, unclipped message, then choose **Comment selection** or **Tag
selection**. Write a comment and/or comma-separated tags, and **Save note**.
**Add note** creates an independent conversation note. **Notes** supports text/tag
search, editing, removal, and **Show passage** to return to the selected context.
Reload and verify the saved note and quotation are still available. Judge the
space, keyboard behavior, readable highlighting and ease of returning to context.

Notes stay in private project recovery alongside the conversation record, outside
native Codex messages. They are not automatically sent as model context. Saved
records migrate from v1 to v2 while preserving existing draft bytes, messages and
thread identity. Per-note revisions reject competing writes; removed identities
remain archived to prevent stale recreation. An unsaved note has tab-local recovery.
A changed/ambiguous or unloaded passage retains its original quotation with an
explicit attachment status. This is one conversation exemplar, not a new session
manager, standalone notes application or general editor library.

## Verification and boundaries

- `npm run test:editor-chat`: 18 pass. Existing delivery/recovery checks plus
  legacy migration, Markdown/math round trips and math copy text, safe links,
  source-checked anchors, changed/ambiguous references, note revision conflicts,
  archived identity and failed-storage rollback.
- `npm run typecheck:fraction-notebook`: passes with library checking enabled.
- `npm run visual:editor-chat`: all nine Chromium cases pass. Real HTTP/service
  boundaries use a deterministic native peer for rich composition, formatted
  replies, comments, tag-only annotations, notes/search/reload, read-only text,
  separate Vim state, unsaved recovery, competing notes/drafts and all previous
  Send/interruption cases. Desktop, light and phone captures were inspected.
  The rich-composer and live-private-storage cases pass again after the final
  math clipboard repair. No fixture response is claimed as model inference.
- `npm run visual:fraction-notebook`: all 21 existing cases pass.
  `npm run test:fraction-notebook`: 20 pass.
  `npm run visual:anchored-algebra -- --grep 'fractional reasoning'`: passes.
  The public reader remains 1,250,344 JS bytes / 308,778 gzip / 414 modules,
  excluding the notebook/chat dependency closure.
- `npm run check:editor-chat:codex`: installed native connection/restart and
  unsent-draft recovery pass without requesting a model turn or changing the
  editor's conversation. Populated-thread behavior remains covered by existing
  user acceptance and deterministic tests, not a new hidden inference trial.
- `npm run test:project-vision`: 75 pass. Theseus validates and whitespace checks
  pass. The impact selector has no focused rule for the existing chat boundary;
  this exemplar uses its declared focused checks and preservation suites, not a
  full production release or a cross-browser promotion matrix.

Initial checks exposed incompatible Markdown-it 15 default-export declarations
in ProseMirror Markdown 1.14. The integration uses compatible Markdown-it 14.3.3
and its real type declarations; no checking was disabled. Vite needed a fresh
web process after this dependency change; the owned launchd job restarted with
saved conversation data intact and no active model turn. Early browser failures
included selectors for hidden/search controls, a fixture reply before its turn
existed, and a dependency-optimizer reload; corrected checks wait for observable
state. Startup documents initially exceeded their word limits by one and three
words and were shortened without changing budgets.

Runtime cost: about 610 new production lines / 41 KB of source in eight modules,
plus changes to the existing chat and theme adapters. New dependencies are the
ProseMirror Markdown/list helpers and compatible Markdown parser/types. Existing
ProseMirror, CodeMirror and KaTeX engines are reused. No editor views exist for a
never-opened chat. An opened panel has two ProseMirror views, plus one when a note
is being edited; Markdown source views are created on demand and destroyed on
return. Unchanged messages reuse their parsed nodes, and transcript updates use
document differences. Note cards use static markup. This is not a benchmark for
many simultaneous chats or unbounded history.

The current limits remain 80 displayed messages / 6 MiB with 64 KiB per message;
notes add at most 128 records / 1 MiB, 16 KiB per body and 12 tags each. Those are
explicit exemplar limits, including archived identities. Invalid TeX preserves
its source; images remain explicit links. The rich prose Vim layer remains the
existing bounded subset; Markdown source uses CodeMirror Vim.

Status: **HUMAN_CHECKPOINT**. Both implementation packages are checked; judge
this single chat before adding another host or promoting shared editor libraries.
The accepted persistent chat milestone is closed at its original scope. The
broader authoring-to-practice programme and independent Spindle/library discussion
remain available return paths.

## Interaction direction awaiting discussion

The user requests a sketch before further implementation: one scrolling column,
no permanent composer labels or buttons, output motions in Normal mode, and the
saved message appearing when entering Insert mode. Replies should share the KP
reading surface's formatting. A persistent-until-dismissed Ctrl-C command popup
would expose commands on demand. Topics and conversation branches are design
questions, not authorization for a session manager. The checked candidate above
is a recoverable foundation; its current toolbars have not been visually accepted.

The user subsequently approved the [keyboard interface and context-return
successor](2026-11-25-keyboard-chat.md). Its contract owns the new interaction;
this review retains the original foundation's scope and verification.
