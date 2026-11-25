# Workspace focus and modeline exemplar

The user authorized recording the full multiplexer discussion and implementing
four presentational changes: no line numbers, chat spacing matching KP's rendered
form, a dark overlay on inactive windows, and the discussed bottom bar.
The [full vision](../2026-11-25-multiplexer-vision.md) preserves the future design;
this record bounds the current implementation rather than approving that whole
platform at once. Theseus owns execution progress.

## Outcome and authority

An author can tell which pane and editing surface owns keyboard input, switch
between Chat and KP through the bottom bar, and read both with consistent spacing.
The bar shows actual Vim mode and local weekday/date/time. Agent monitoring and
saved multi-workspace layouts are future capabilities, not simulated indicators.

Canonical host: `/experiments/fraction-notebook/` on the shared service at port
8000. Artifact: the current joined chat and fractional-linear manuscript. Native
Codex remains conversation authority; independent ProseMirror/CodeMirror states
own editor interactions; the fraction compiler/playhead/native KaTeX renderer
remain semantic and paint authorities. Existing `mountWindows` owns pane focus.

Preserve the fixed equal split, stationary global masthead, joined chat border,
persistent composer, streaming focus/undo, drafts, annotations, native preview
and existing command bindings. No storage migration, live inference, general
window manager or new agent service. The rollback unit is this exemplar's
presentation/modeline commit; no underlying document or conversation migration.

## Approved package and verification

One package: record the vision; add the bottom bar, focus overlay and shared
reading spacing; disable default gutters; verify real focus/mode changes in prose,
source buffers and the iframe, disposal and existing chat/editor behavior.
Theme values are provisional until visual review. Keep overlay paint separate
from focus and content presence; preserve pointer and keyboard access.

Focused checks: notebook types and units, chat units, Chromium chat integration,
focused notebook source/command checks, project vision/orientation and Theseus
validation. The impact selector lacks focused rules here and recommends broad
production checks; this development-only exemplar uses its explicit focused
gates, not a repository-wide release claim. Reserve the final quarter of a two-hour
ceiling for repair, evidence and backup; checkpoint owned work at least hourly.

Finish with one working review packet and a recoverable backed-up commit. Stop
for the user's visual judgment before broader promotion. Existing unrelated
global Theseus pressure is not authorization to repair or resume older projects.

## Review cues

Open <http://127.0.0.1:8000/experiments/fraction-notebook/> and open Chat. Compare
its transcript/composer text measure with KP; click or keyboard-switch panes and
check which pane dims. Inspect the bottom mode/surface label while entering and
leaving Insert in prose and source. The time belongs at the right, and the bar
must remain visible without covering the composer. Check light mode and a narrow
viewport. Judge spacing and overlay strength; the split must remain stationary.

## Implemented candidate and evidence

The modeline observes the focused editor's existing mode projection and the
existing window host; it does not own a second Vim state or switch focus during
streaming. Native iframe focus still uses the exact-origin/source bridge. The
bar's timer, focus listener, observer and window subscription are disposed with
the host. Pane buttons use the same focus path as Ctrl-backquote. The bar lives
in the app's flex layout so it reserves space instead of covering the composer.

Chat uses the reader's 440px measure through internal horizontal padding and its
3rem/5rem vertical rhythm, with compact padding for short viewports. Both outer
panes and the joined chat border still fill their original slots. New overlay
and modeline tokens are available in Styles. The inactive veil is paint-only,
click-through and disabled in forced-color mode; pressed pane buttons retain an
independent active-state cue. Prose and both source editors start without line
numbers; the existing explicit notebook Ex commands remain available.

- `npm run typecheck:fraction-notebook`: passes.
- `npm run test:editor-chat`: all 25 pass.
- `npm run test:fraction-notebook`: all 20 pass.
- `npm run visual:editor-chat`: all 20 Chromium cases pass. The new case checks
  actual prose/source modes, background streaming, iframe focus, reading spacing,
  overlay hit testing, light/forced-color modes, narrow/short viewport geometry
  and a single modeline after reload. The focused first run also passed.
- `npm run visual:fraction-notebook -- --grep 'cursor|focused source|styles|light canvas|phone focused'`:
  all seven affected cases pass, including cursor graphemes and native source/run
  preservation. The old masthead-mode assertion now reads the modeline.
- `npm run test:project-vision`: all 75 pass within unchanged orientation budgets.
- `npm run project:orientation` and `git diff --check`: pass.
- `theseus workspace validate`: valid, 1,319 nodes and 34,641 events at closeout.
- Dark, light and phone captures inspected from the scoped browser entrypoint;
  outputs remain disposable. No live inference or cross-browser release claim.

The user's subsequent font question is diagnostic: the prose remains Source
Serif 4 and code remains monospace pending their preference. Normal cursor paint
follows the real grapheme; empty positions use a fallback block, and Insert uses
a line. The request is not treated as permission for a font migration. The
Web Component suggestion is recorded in the full vision as a future option.

Theseus outcome: **HUMAN_CHECKPOINT**, one of one implementation packages
complete. Review this bounded exemplar before promoting its aesthetic choices;
the broader multiplexer remains the recorded implementation horizon.
