# A simple fixed split for chat and KP

The user rejected the [recency window stack](2026-11-25-recency-window-stack.md):
“let's just do a simple split. codex on the left, and kp on the right.”
Before implementing that replacement, the user asks to discuss tracking issues
in Org without Emacs. Keep the split as the next authorized UI task; the Org
question does not authorize a tracker migration or implementation.

Outcome: a stationary two-column workspace, with chat on the left and the KP
notebook/reader on the right. Remove overlapping surfaces and focus-driven
repositioning. Retain the global masthead, centered reading columns, permanent
composer and existing keyboard controls. Adapt the split to narrow screens
without making the text unusable.

Canonical host: `http://127.0.0.1:8000/experiments/fraction-notebook/`. Preserve
mounted ProseMirror/CodeMirror buffers and the native KaTeX preview. Notebook JSON
and native Codex threads retain semantic authority. No data migration, native
inference, general window framework or broader editor redesign is authorized.

One reversible host-layout package, with scoped types and the existing notebook
and chat browser preservation checks. Verify draft/caret, scroll, source/result,
reload and phone use, then review the simple split. Theseus owns execution;
implementation remains deferred while the Org question is discussed.
