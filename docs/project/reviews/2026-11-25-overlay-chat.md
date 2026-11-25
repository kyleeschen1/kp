# Full-width KP with a sliding chat overlay

Status: REJECTED — user requested rollback during review. Do not resume this
treatment from its implementation approval below. The candidate's source changes
were removed, returning presentation to commit `4850ae6fb`; the requested earlier
target is being clarified. Drafts, notes and native sessions were not changed.

Approved by the user's request to restore the shared editor header, keep KP
fully open, slide chat in from the right, and substantially increase transparency.
This supersedes the page-owned masthead and reduced-width KP surface in the
[previous candidate](2026-11-25-windowed-chat.md); its persistent draft, focus,
recovery and first-paint repairs remain foundations, not visual acceptance.

Canonical artifact and host: the fraction notebook at
`http://127.0.0.1:8000/experiments/fraction-notebook/`. Existing ProseMirror/CodeMirror
buffers and the native KaTeX preview remain mounted. Notebook JSON owns content;
native Codex threads own model history. This is host presentation only.

One reversible package: a global masthead above a full-width KP canvas, with
chat sliding from the right over that canvas. The centered prose columns and
bottom-third draft remain stable. Start with 70% background opacity, preserving
opaque text and existing theme overrides. Keep the global Chat control reachable
when the full-width page is raised. Opening/closing must support reversal,
keyboard focus, reduced motion, reload and disposal without replacing editors
or the player. Closed chat becomes inert immediately while its exit completes.

Acceptance: opening chat leaves KP geometry unchanged, the header remains
visible across both surfaces, slide direction is visibly right-to-left, and
lower content is clearly visible through the background. Close, reopen during
exit, switch focus and reload without losing draft/caret or reading position.
Human review selects opacity and motion. The rollback unit is this host layout
and visibility refinement; preserve semantic models, storage and native sessions.

Use scoped TypeScript, focused Chromium geometry/motion/recovery checks, then
the affected chat/notebook browser suites and project-vision checks. The impact
selector has no focused host rule and proposes generic promotion checks; this
bounded, unpromoted visual refinement uses the declared scoped gates instead.
No new framework, renderer, model calls, publication or broader promotion.
Ceiling: two hours with the last quarter reserved for verification and backup.
Commit the checked implementation and evidence together, then review this one
exemplar. Theseus owns execution status; this file owns scope and rationale.

## Result before rejection

Scoped TypeScript, both focused slide/focus cases, all 23 notebook browser cases
and 75 project-vision checks passed. The full chat suite passed 15 of 16 cases:
after reload, opening the transient during entry motion left its Branches command
outside the viewport. The position was measured from the moving column and not
updated as that column translated. This candidate was neither verified nor
accepted; the user redirected work to rollback before further repair. No native
inference was started. The previous theme-startup and persistent-data mechanisms
were preserved throughout.
