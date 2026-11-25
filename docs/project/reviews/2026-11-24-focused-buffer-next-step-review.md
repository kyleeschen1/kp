# Next step: focused animation editing

The user accepts the unified notebook surface ("It looks great!"). Subsequent
discussion accepts the direction of one rich document, an optional full reading
preview, and a focused source buffer beside the animation being edited. The
current request asks what comes next; it does not start implementation.

Custom motions, text objects and their extensible operator grammar are explicitly
parked. This does not park the notebook workflow, styles or keybinding help.

| Candidate | Authoring benefit | Reliability / continuity | Reuse | Complexity risk | Order |
|---|---|---|---|---|---|
| One document with focused animation source and result | High; removes duplicate prose while retaining feedback | Must preserve playhead, drafts and return location | Existing editor and native player | Medium; player placement and lifecycle need inspection | First |
| Shared typography and Styles controls | High; fixes visible font/color inconsistency | Makes inheritance explicit | Shared tokens across document and embedded content | Low–medium | Second |
| Help panel, basic Ex commands and line-number controls | High; makes existing editing discoverable | Save/run/close need honest semantics | Command metadata can supply help | Medium | Third |
| User-defined motions and text objects | Useful later | Requires structural range/operator contracts | Potentially high | High before editing boundaries settle | Parked |

Recommended next outcome: in `/experiments/fraction-notebook/`, write in one
rich document, open the fraction animation's source beside its running result,
change the existing supported specification, run it, then close the buffer and
return to the same document position. Keep full reading Preview optional.
Use the native fraction compiler/player; JSON and ProseMirror retain content
authority. Inspect mounting and semantic restoration before choosing placement.
This is not permission to invent a separate animation renderer or execute
arbitrary Python/JavaScript. The current fraction source is a bounded JSON spec.

Accepted feedback direction: lightweight caption/style changes may update live;
structural source changes use Run / Shift-Enter. Preserve the selected semantic
moment when possible, explain fallback when it disappears, and retain the last
working result with a visible stale marker on failure. Save persists a recoverable
draft; running validates and updates the result. Define the exact draft/undo and
close semantics before implementation; do not imply that closing discards autosave.

Following priorities remain: Source Serif across human-readable interface and
embedded/transcluded prose, native math/code fonts, independent masthead/title/
heading/object/body weights, exposed colors including the current off-white,
inherit/override/reset controls, and palette references. `:h` / `:help` should
show a searchable side panel of available bindings by active buffer. Add bounded
save/close Ex behavior and line-number controls without claiming full prose Vim.

Review one animation workflow before generalizing. Preserve accepted nested
editing, UUIDs, metadata, history, recoverable drafts and the public reader.
No new implementation contract is issued by this next-step review. The wider
authoring programme, orientation grill, transclusion/search agenda and declined
MathML exploration retain their existing dispositions.
