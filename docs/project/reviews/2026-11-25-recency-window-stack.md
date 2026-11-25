# A stable front position for authoring windows

Status: REJECTED — the user called the visible result a disaster and requested
a [simple fixed split](2026-11-25-fixed-chat-split.md), Codex left and KP right.
Discuss Org-based issue tracking before that replacement. Do not resume or
promote this visual treatment. The recoverable checkpoint preserves the rejected
candidate and its evidence; it is not acceptance or the requested split.

Approved by “the outer windows, and i follow yotur rec. go” after the layout
discussion. This succeeds the earlier fixed-position window candidate. It does
not resume the rejected sliding overlay. Preserve the restored 440px KP and
491px chat reading columns, centered within 55vw desktop windows.

Beneficiary and outcome: an author can switch between the explanation and its
conversation while the active work always occupies the upper-left position.
Clicking or keyboard-switching promotes that window; the others move down and
right in recency order. The global Kinetic Press masthead stays stationary above
the entire workspace, with its own shadow. Scroll and hover do not reorder work.

Canonical artifact/host: the fraction notebook at
`http://127.0.0.1:8000/experiments/fraction-notebook/`. Existing ProseMirror and
CodeMirror views and the mounted native KaTeX iframe remain the renderers.
Notebook JSON owns authored content; native Codex threads own model history.
The window host alone owns ordering, geometry and focus.

One reversible exemplar package: 55vw outer surfaces, recency ordering and
translation, global masthead elevation, exposed phone return edges, and the
necessary pointer/keyboard/popup preservation checks. Desktop windows spread
across the available horizontal space; the rear window begins 24px lower.
Start with a 400ms transition and retain existing theme opacity. Phones use
nearly the full width and a small stagger. Reduced motion removes animation,
not access to the windows. Keep these presentation settings in Styles.

Acceptance: repeatedly click exposed windows and cycle with Ctrl-backquote;
the active window becomes leftmost/topmost below the header, and the other
remains reachable. Clicking controls/text must still work during promotion.
Preserve cursor, draft, scroll, undo, editor/player identity, animation source
editing, chat transient reachability, reload and close/reopen behavior. Avoid
reparenting or remounting live content. Opening a single window centers it.

Verification: scoped TypeScript, focused browser cases for stack geometry,
header, pointer selection, keyboard/iframe switching, interruption/reversal,
chat transient placement, phone and reduced motion, plus affected existing
notebook/chat preservation cases. Run project-vision and Theseus validation
after recording the successor. Inspect the impact selector; this unpromoted
host exemplar does not need a renderer-wide release matrix. Use existing stable
visual commands, with no native inference. Human review owns movement, overlap,
spacing and the usefulness of exchanging positions.

Preserve storage, IDs, model history, existing composer proportions, reader
typography and semantic models. Exclude general window-manager extraction,
additional window types, public-reader changes, model calls, publication and
broader promotion. The rollback unit is this host layout, its focus handling and
associated regression checks, committed with its evidence.

Ceiling: two hours, reserving the final quarter for verification and closeout.
Repair routine failures within this boundary, then stop at the one exemplar
for visual review. No additional implementation approval is needed. Theseus
owns slice status; this document owns rationale, scope and the review criteria.

## Evidence at rejection

Scoped TypeScript, 16 chat browser cases, 23 notebook browser cases, 23 chat unit
tests, 20 notebook unit tests and 75 project-vision checks passed. The last chat
pass precedes the small phone-variable cascade adjustment and explicit 8px
phone-stagger assertion; that assertion has not been rerun. Notebook checks ran
after the cascade adjustment. Desktop light/dark and phone captures were inspected.
These functional checks did not establish visual acceptance.

The initial stack regression exposed teardown overwriting the remembered front
window. Detachment now recomputes live geometry without persisting a new user
choice; the existing reload case reproduces and guards that boundary. Shared
pointer-release activation preserves selection in host and preview; popup
positioning follows an ancestor only while it is moving. These mechanisms are
not permission to keep the rejected stack in the successor.

Project-vision initially exceeded the existing startup word budgets. Shortening
the roadmap/thread restored the gates without changing their budgets. The
impact selector selected generic promotion checks for unmatched exemplar paths;
this bounded host candidate used the declared scoped checks. No native inference,
deployment or semantic model change occurred. Cross-browser certification and
physical mobile-keyboard behavior remain unrun.
