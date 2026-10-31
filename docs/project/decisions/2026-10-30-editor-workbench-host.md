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
