# Evolve the existing editor into the workbench

Date: 2026-10-30
Status: accepted direction; first bounded candidate approved

After comparing `../spindle`, `../editor` and KP, the user chose to evolve the
editor into a different product: a lightweight, programmable workspace for rich
reading, capture, custom interfaces and LLM collaboration. Editing remains useful
without imposing a text-buffer representation on every view. Reuse the editor's
CLJS/SCI commands, keymaps and selection contracts; borrow other mechanisms only
when a concrete caller demonstrates the need.

The user approved starting with “got it! shall we start?”. Implementation lives
in `/Users/kyleeschen/Code/.worktrees/editor-workbench-20261030`, on
`feature/20261030-workbench-reader-preview`, based on editor `dev` at `4e00c5d`.
The editor owns the human-readable execution plan at
`docs/superpowers/plans/workbench-reader-preview/index.md` and its active
`docs/project/threads/programmable-workbench.md`. Do not duplicate that execution
queue in KP or start the older KP-hosted workbench proposal automatically.

The first review is a separate browser entry: labeled reading fixtures, exact
revision-bound excerpt captures with notes/tags, shared commands and search,
live command redefinition, and real local website previews. KP keeps its actual
dev-server URL, styles, renderer and mathematical authority. The preview also
uses an unrelated HTML site to pressure that separation. The daily editor stays
available; this does not migrate its native sessions into the new entry.

The earlier [independent-workbench proposal](../2026-10-30-independent-workbench-v1.md)
is superseded as the immediate host and delivery sequence. Its exact-reference,
comparison, native-session and personal-practice ambitions remain successor
directions, not completed features or newly authorized scope. In particular,
the [native Codex constraint](2026-10-30-native-codex-workbench.md) remains:
preserve native session/context ownership without a separately billed fallback.
The existing editor has native Codex/terminal capabilities; joining them to this
rich-view candidate requires a separately bounded follow-up.

KP's shared-algebra-mount outcome and other engine work retain their own scope.
This decision changes neither mathematical models nor reader choreography.
The workbench is a tool for the larger co-creative practice goal; it is not yet
a completed question/attempt/revision/return loop.

Review the candidate at `http://127.0.0.1:1422/`: capture a passage, add a note
and tags, reload and return to the source; inspect/redefine a command; compare
the embedded KP page with the same URL opened in a browser. Browser captures
persist at that origin and can be exported. Fixture reading is explicitly
distinguished from live model output. Desktop persistence and a full searchable
conversation archive are outside this candidate.

## First review and proposed successor

The user subsequently said “this looks great! What's next?”. This is local visual
acceptance of the reader/capture/preview interface, not approval for a new run,
merge, native effect or editor remote push. The editor's
`docs/project/reviews/2026-10-30-workbench-next-step-review.md` owns the detailed
successor recommendation: one real native Codex conversation in that reader,
with explicit status/approval/interrupt behavior, exact completed-response capture,
and thread/draft/capture recovery after reopening. Preserve the native session
and transport owners; separate their editor-buffer assumptions instead of copying
orchestration. The current browser entry cannot launch the native bridge, and the
desktop candidate's temporary storage must be resolved before claiming durable
personal capture. The older temporary output store is not a permanent archive.

This makes it possible to use the workbench while discussing and improving it.
The accepted first outcome is retained; the live-conversation outcome is a finite
successor proposal. A unified inbox/next-action view, broader archive search and
multiple active agents remain later work. KP engine and reader behavior are
unchanged. The editor candidate remains locally checkpointed; automatic approval
review rejected its backup push under this session's KP-only standing permission.

## Approved live-conversation candidate

The subsequent “go” approves that bounded successor. Implementation is in the same
editor worktree on `feature/20261030-workbench-live-conversation`. Its plan is
`docs/superpowers/plans/workbench-live-conversation/index.md`; its concrete review
is `docs/project/reviews/2026-10-30-workbench-live-conversation.md` in that checkout.
These editor-owned artifacts own phase status and detailed evidence.

The separate Spindle Workbench native app is built and launched. It uses the
existing native Codex transport and a shared session controller, with a new rich
view adapter and native file records in `~/.spindle/workbench`. Completed response
captures preserve their exact original source; an explicit action quotes them in
an editable follow-up. Reopening restores draft/thread intent without auto-send.
The daily editor and browser fixture entry remain separate preservation consumers.

The original browser reader checks, new mocked-native conversation/recovery
checks, model checks and actual installed CLI initialization provide bounded
evidence. They do not claim a real inference/native GUI end-to-end review. The
next action is the integrated human checkpoint: connect, send, capture a completed
passage, quote it, and close/reopen with an unsent draft. Native normal window
close flushes or asks before discard; abrupt exit can still lose unacknowledged
keystrokes. One writer and bounded local records are the supported scope.

This is an implemented candidate, not another visually accepted milestone or a
complete personal-practice/knowledge-management system. The previous editor backup
rejection remains; no permission to push its source/history was inferred from
implementation approval. KP's origin backup authority remains unchanged.
