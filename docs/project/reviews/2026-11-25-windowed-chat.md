# Persistent composition and layered authoring windows

Status: HUMAN_CHECKPOINT — implemented and checked; visual acceptance is open.

Rollback checkpoint: the subsequent [sliding overlay](2026-11-25-overlay-chat.md)
was rejected and removed. This commit's presentation (`4850ae6fb`) is restored.
The user's requested earlier, left-entry layout is not uniquely identified;
clarification distinguishes this version from the pre-window editor/chat layout.
The restored focus/reload and topic/branch browser cases both pass.

Width correction COMPLETE: restored the pre-window defaults from
`3e4a96445`: 440px KP prose and 491px desktop chat text (the old 540px panel minus
48px padding and its 1px border). The 360px shared cap survived the first rollback.
Use independent content-width variables while retaining the current windows,
permanent composer, mounted editors/player and saved data. Narrow screens still
constrain each column to its available space. This is an exact presentation
correction, not approval of the rejected overlay or a general window redesign.
Verify rendered widths and existing focus/reload/phone behavior in the canonical
fraction notebook, plus scoped types and project-vision consistency. Commit this
bounded correction with its evidence; no new visual gate is needed for restoring
the identified sizes.

Correction evidence: the existing layered-window browser case measures 440px
KP and 491px chat, preserving focus, draft, native player, reload and phone
containment. Four selected notebook browser cases pass for prose/undo, style
comparison, light-theme spacing and phone source/result use. Scoped TypeScript
and all 75 project-vision checks pass. The unmatched-path impact fallback remains
a generic promotion plan; this exact CSS restoration uses these scoped checks.

Approved by “implement” after the window-layout discussion. This succeeds the
checked keyboard-chat candidate: hiding the composer is explicitly superseded.
Keep its session, annotation, context and branch recovery guarantees.

Canonical artifact: the fraction notebook at
`http://127.0.0.1:8000/experiments/fraction-notebook/`. Its existing ProseMirror
document and chat buffers, CodeMirror source buffers and mounted native KaTeX
preview remain the renderers. Notebook JSON owns authored content; native Codex
threads own model history. Window geometry never becomes semantic authority.

Outcome: a permanent draft occupies the lower third of chat. `i` resumes its
caret; Escape restores transcript navigation without hiding the draft. Normal
mode Ctrl-U/D scrolls output. The KP page owns its masthead in reading and editing
modes. Two staggered windows have 60vw outer surfaces on desktop and centered
phone-width columns; phones leave a narrow return edge. Focus changes stacking
immediately, with a restrained shadow/lift transition, without rebuilding editors
or the player. Background alpha and elevation use theme variables. Keyboard
window switching keeps covered surfaces reachable. Saved themes apply before
first paint in the notebook and its development preview, including reloads.

Packages: first-paint theme repair; the two-window exemplar and persistent
composer; preservation verification and one visual review. Theseus owns their
live order and evidence. Allowed repairs include layout/focus, scroll anchoring,
theme startup and their regression checks. Exclude a general desktop framework,
additional chat sessions, public-reader redesign, automatic model calls,
publication, schema migrations and broad visual promotion.

The independently reversible units are the early theme bootstrap and the host
window/composer presentation. Preserve data, native thread identities, existing
inline/focused animation editing and normal public-reader output. No player
reparenting, layout-driven remounts or focus-driven semantic changes.

Acceptance: write a partial question, scroll output, raise the KP page, inspect
its animation, then return to the same draft and passage. Composition stays
visible before/after Escape, Send, notes and reload; columns retain their width
when focus changes. Window switching works with pointer and keyboard, including
the preview iframe, and focus responds before the visual transition finishes.
Reload a saved light theme with the app deliberately delayed: no navy first
frame. Preserve ordinary reader payload and notebook/session recovery.

Checks: scoped TypeScript, chat/notebook unit tests, focused Chromium exemplar
checks first, then the affected chat/notebook browser suites and project-vision
checks. Reuse stable visual commands. Test first-paint behavior with delayed
application modules, corrupt storage and preview startup. Inspect desktop,
phone and reduced-motion behavior. Human review owns translucency, spacing,
elevation and whether returning between windows reduces context reconstruction.

Ceiling: three hours, reserving the final quarter for verification and closeout.
Checkpoint coherent checked work with evidence and back it up at least hourly.
Stop at one reviewable exemplar before generalization; ordinary failures are
repaired within scope. No further implementation approval is needed for this
approved candidate.

## Checked candidate and review

The draft now occupies the lower third throughout reading, writing, sending,
notes and reload. The upper portion scrolls independently. `i` restores the
draft caret; Escape returns to transcript navigation; Ctrl-U/D scrolls the
transcript in Normal mode. Ctrl-backquote switches windows, including from the
preview, and the chat transient offers `C-c W`. The last front window survives
reload. On a phone, either exposed 16px edge raises its window by touch.

Desktop windows are 60vw; the original shared 360px content cap is superseded
by the width correction above. The KP
masthead lives inside the page window. Initial treatment: 96% background opacity,
400ms shadow/lift transition and 2px lift; text stays fully opaque. Styles exposes
window width, background, opacity, shadow, duration and lift. Document width
controls KP prose; Chat text width controls chat. Reduced motion removes the transition and lift.

The host owns stacking and actual focus. Window changes retain the existing
ProseMirror views, draft selection and native iframe/player. Late chat hydration
may update a covered window but cannot claim focus; an unready iframe leaves
keyboard focus in its host controls until its bridge is installed. Structure
menus dismiss after applying a choice, avoiding coverage of the narrower prose.
The shared style validator applies saved preferences in a blocking head script
before either development surface starts. Invalid storage falls back without
overwriting its original bytes. Background opacity uses its own paint layer,
so both decimal and percentage settings work without fading content.

Executed evidence:

- `npm run typecheck:fraction-notebook`: passed, including the Vite startup helper.
- `npm run test:editor-chat`: 23 passed; `npm run test:fraction-notebook`: 20 passed.
- `npm run test:project-vision`: 75 passed; source links and approval boundaries agree.
- `theseus workspace validate`: passed; the selected contract is at its visual checkpoint.
- `npm run visual:editor-chat`: 15 passed. Pointer/keyboard/iframe focus, retained
  DOM and caret, fixed columns, lower-third composition, reload, phone reachability,
  reduced motion, notes, branches, conflicting drafts and delivery recovery.
- `npm run visual:fraction-notebook`: 23 passed. Delayed-module first paint in
  notebook and preview, corrupt preferences, decimal/percentage background alpha,
  structure controls, inline/focused editing, identity, recovery and native player.
- The production reader closure remains 1,250,344 JavaScript bytes, 308,778 gzip
  and 414 modules; no notebook editor dependencies. Startup bundling is cached
  and restricted to the development notebook/preview; public readers are unchanged.

The first full notebook pass exposed menu interception after select changes;
the reload regression then exposed focus entering an unready iframe. Both were
repaired at their owning host boundaries and reproduced in the browser suite.
The initial flex layout measured a 34.2% draft region; the grid now checks at
one third. No semantic model or native conversation protocol changed.

The impact selector had no specific route for these exemplar files and suggested
generic promotion checks. This remains an unpromoted presentation exemplar:
scoped types, unit tests, both affected browser suites, public-reader closure and
project-vision checks bound the candidate. Full cross-browser release certification
and physical mobile-keyboard behavior are unrun. No paid/native inference was
started; chat browser cases use the existing protocol fixture.

At the canonical URL, open Chat, write half a question, Escape and scroll older
output. Switch to the page, inspect its animation, then switch back and press
`i`. Look for the same draft caret and passage, a stable column, one page-owned
masthead, and a restrained shadow/lift. Reload a saved light theme, try Styles →
Windows, and inspect the phone return edges. Desktop dark/light, phone and notes
captures were inspected locally; the stable visual commands regenerate them.
Human judgment of translucency, spacing and motion remains open. Generalization
is not authorized by this candidate.
