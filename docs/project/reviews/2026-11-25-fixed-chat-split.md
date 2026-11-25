# A simple fixed split for chat and KP

Status: COMPLETE — the clarified static split is implemented and checked.

The user rejected the [recency window stack](2026-11-25-recency-window-stack.md):
“let's just do a simple split. codex on the left, and kp on the right.”
After discussing Org without Emacs, the user clarified: “by 50% vw, I meant
side by side, like an ordinary split. no animations. it's fine if its centered
if there is no other window.” This resumes the authorized replacement; the Org
discussion does not authorize a tracker migration or implementation.

Outcome: two stationary equal columns, each 50% of the viewport, with chat left
and KP right. No overlap, focus-driven repositioning or window animation. A lone
KP pane is centered at 50vw on desktop and fills a phone. Retain the global
masthead, centered reading columns, permanent composer and keyboard controls.
Text constrains to each pane on narrow screens; command dialogs remain readable
and inside the viewport.

Canonical host: `http://127.0.0.1:8000/experiments/fraction-notebook/`. Preserve
mounted ProseMirror/CodeMirror buffers and the native KaTeX preview. Notebook JSON
and native Codex threads retain semantic authority. No data migration, native
inference, general window framework or broader editor redesign is authorized.

One reversible host-layout package, with scoped types and the existing notebook
and chat browser preservation checks. Verify draft/caret, scroll, source/result,
reload and phone use. The window host owns focus only; CSS grid owns fixed
geometry. Remove stack ordering, movement timers and obsolete style controls.
The entire host correction is independently reversible. Theseus owns execution.

## Delivered correction

CSS grid fixes Codex left and KP right at equal viewport halves. Focus metadata
has no geometry or elevation rules; the host no longer tracks recency or writes
positions. Stack motion code and its pointer timers are removed. A single KP
pane is centered on desktop. The global masthead and existing text widths remain.
The chat DOM order matches the visible order; its command popup is clamped to
the viewport with a readable minimum width even in a narrow pane.

Checks passed: scoped TypeScript, all 16 chat browser cases, all 23 notebook
browser cases and 75 project-vision checks. The first notebook pass had two
obsolete geometry assertions and two startup/update timeouts. Geometry checks
now exercise the existing vertical source/result layout at 720px and its
horizontal divider in a wider pane. All four failed cases passed together,
then the full notebook suite passed. The timeouts did not reproduce; no startup
repair is claimed. No native inference or semantic/storage changes were made.

At the canonical URL, open Chat and switch focus by pointer or Ctrl-backquote:
neither pane moves. Close Chat to see the centered KP pane. Draft selection,
undo, scroll, reload, notes/branches and the mounted native player are preserved
by the affected browser checks. Dark desktop and phone captures were inspected.
The unmatched-path impact selector proposed broad promotion gates; this exact
host-layout correction used the declared affected checks. It is not a general
editor promotion or cross-browser release certification.
