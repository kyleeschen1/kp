# Raised pane and current-line focus exemplar

The user approved the discussed focus treatment and clarified “Focus pass and
existing custom blocks.” Remove the inactive overlay, suggest elevation with a
shadow on the active pane, remove doubled editor borders, make the modeline at
least the default text size, and highlight the focused text line. Existing custom
blocks participate through their ProseMirror-owned text; no new component or Lit
integration is included. The [multiplexer vision](../2026-11-25-multiplexer-vision.md)
retains that later horizon.

## Canonical surface and outcome

Canonical host: <http://127.0.0.1:8000/experiments/fraction-notebook/>. The artifact
is the joined Codex chat and current fraction notebook. ProseMirror owns prose,
including existing custom block titles/paragraphs. CodeMirror owns source input.
The existing window host owns pane focus; Codex retains conversation authority;
KP's manuscript/compiler/playhead/native KaTeX renderer retain domain authority.

An author can identify the active pane, actual editing line and mode without
hunting for the cursor. Keep pane geometry stationary. Give the layout one
vertical separator and one quiet transcript/composer separator; editor wrappers
are borderless. The modeline follows the document/default text size and can wrap
at narrow widths. Line paint follows only the focused editor and withdraws during
command/other-editor focus; selection and undo remain editor-owned.

For prose, highlight one rendered visual line, including wrapped lines in existing
custom text blocks. Source uses CodeMirror's active code-line mechanism with the
same theme role. Geometric presentation state must never become document content,
persisted metadata, native history or a second selection. No continuous measuring
loop. Preserve original caret semantics, font family, native playback, transcript
folding, drafts and save/run boundaries.

## Bounded delivery

One reversible package: the focus presentation and its owning lifecycle/geometry
checks, source-linked direction and review evidence. The prior overlay treatment
is superseded; the successful fixed split, spacing and modeline remain foundations.
The rollback unit is this exemplar's presentation commit. No general window manager,
shared-framework extraction, new task store, content migration or live inference.

Focused verification: notebook types/units, chat units, chat Chromium integration,
affected notebook cursor/source/style cases, orientation/vision and Theseus
validation. Cover wrapped prose, custom title/body text, empty positions, focus
switching, streaming, folding, selection, theme/resize/scroll and disposal. Inspect
one light/dark/narrow review packet before wider promotion. The impact selector's
unmatched-path broad fallback is not a release requirement for this development
exemplar; the listed gates own its bounded verification.

Time ceiling two hours, final quarter reserved for repair, evidence and backup.
Checkpoint owned work at least hourly and before handoff. Stop at one verified
candidate for visual judgment, or a genuine unresolved blocker/ceiling. Theseus
owns package progress. Unrelated historical global pressure does not authorize
resuming or repairing other projects.

## Review cues

Open Chat and switch with the pane buttons or Ctrl-backquote. Both panes should
remain readable and stationary; only the active one should appear raised. Move
through a wrapped paragraph with j/k, enter Insert and open a command popup.
The line should follow the actual input/reading point and disappear behind the
popup. Check a KP custom block title/body and its source buffer. Compare the
single separators and larger bottom bar in dark/light themes and a narrow view.

## Candidate and prevention evidence

The checked candidate removes inactive dimming. The existing window owner now
selects shadow/paint order; it does not move or resize panes. Layout owns the
vertical divider and transcript/composer separator. The modeline is at least
the larger of the root/default and document text sizes, and wraps instead of
shrinking. Styles exposes the shadow, modeline size and named current-line color.

One ProseMirror plugin marks the selected text block with a view decoration and
paints a measured visual-line band. Geometry stays in view-root CSS variables;
it cannot enter notebook IDs/metadata, Codex history or the undo stack. Focus,
selection, resize, scroll and font events invalidate a single queued measurement;
destroy cancels it and removes listeners/observers. CodeMirror uses its existing
active-line extension with the same theme role. Native input and selections
remain owned by their editors.

Discovery caught a real soft-wrap mismatch: ProseMirror's default coordinate
bias can point to the following glyph line while the Insert caret is on the
preceding line. Insert/Visual now measure the native range head only when it
agrees with the ProseMirror position. Normal follows its next-glyph block cursor.
The regression exercises this boundary, resize/font changes, scrolling, empty
drafts, source switching, transient blur/restore, streaming, Undo/Redo, selection
restoration and hiding/reopening chat. Existing custom title/body, nested folding
and player-preservation checks also pass. There is no new component schema.

Two other discovery failures were repaired: a CSS import was moved from the
unit-imported editor module to the browser entrypoint; duplicate orientation prose
was shortened to retain existing startup budgets. No checking was disabled or
budget raised. A fixture assertion was corrected to preserve a trailing draft
space, rather than expecting normalization the application does not perform.

Verified on 2026-11-25:

- `npm run typecheck:fraction-notebook` — pass.
- `npm run test:editor-chat` — 25 pass.
- `npm run test:fraction-notebook` — 20 pass.
- `npm run visual:editor-chat` — 21 Chromium checks pass, including the new
  current-line regression and the updated border/shadow/modeline check.
- `npm run visual:fraction-notebook -- --grep 'cursor|focused source|styles|light canvas|phone focused|split, nest, titles'`
  — eight Chromium checks pass.
- `npm run test:project-vision` — 75 pass.
- `npm run project:orientation` — current focus successor and contract agree.
- `theseus workspace validate` — valid; the context receipt is closed and the
  implementation package is complete, deferred at its visual checkpoint.

The stable visual commands regenerate disposable dark/light/narrow and custom
block captures; these are review aids, not accepted goldens. Inspected the desktop
dark/light and 390px split: no veil, quiet shadow, one separator, visible current
line and readable modeline. The persistent dev service remains on port 8000;
the canonical URL returned HTTP 200 at handoff.

Limits: this is a Chromium exemplar, not a cross-browser release certification.
CodeMirror highlights a logical code line (including its wraps). Forced colors
uses an outline around the current text block/code line when gradients are
suppressed. The native reading iframe keeps its own attention system; the editor
line band applies to editable/navigation buffers. Exact shadow and wash intensity
await human judgment. No generalization or new reusable text component is approved.

Outcome: `HUMAN_CHECKPOINT` after the bounded candidate checks. Theseus owns live
package state; the working URL and review actions above are the acceptance surface.
