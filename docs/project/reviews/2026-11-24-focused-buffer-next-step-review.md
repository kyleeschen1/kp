# Next step: focused animation editing

## Approved implementation round

The subsequent "go" approves the three ordered outcomes below in the fraction
exemplar: focused source/result editing, exposed styles, and help/basic Ex/line
number controls. One integrated reversible candidate will stop for human review;
no custom motion API or wider rollout. Preserve source IDs, shared history,
draft recovery and the native player. The rollback unit is the experiment shell,
editor adapters and scoped preview presentation, retaining `c8124ee37`.

Use standard verification: notebook unit tests, full typecheck, the scoped
Chromium suite, canonical fraction preservation, dependency and project-vision
checks. Inspect desktop/phone captures before handoff. Repair demonstrated
lifecycle, persistence or boundary failures within scope. Reserve the final
quarter of the session for checks and backup; reassess if a shared renderer
change is required. No arbitrary code execution or semantic animation expansion.

The user accepts the unified notebook surface ("It looks great!"). Subsequent
discussion accepts the direction of one rich document, an optional full reading
preview, and a focused source buffer beside the animation being edited. The
original request asked what comes next; the subsequent implementation approval
is recorded above.

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
The implementation contract is `run-contract.kp.focused-buffer-20261124`. The wider
authoring programme, orientation grill, transclusion/search agenda and declined
MathML exploration retain their existing dispositions.

## Candidate evidence and limits

One rich document now contains the native animation result in its measured slot.
Opening its specification moves the existing CodeMirror editor into a focused
source pane beside that same iframe; closing restores the mapped selection and
document scroll. Reading mode expands the existing iframe. No second player,
clock, rendering path, UUID copy or document-schema migration is introduced.
The bounded fraction specification still edits wording and focus references for
nine admitted moments; arbitrary executable code and topology changes remain
unsupported. A removed moment therefore fails admission rather than silently
choosing a new semantic moment.

Source typing saves recoverable drafts without preview requests. Run / Shift-Enter
validates and applies a checked revision. An error retains the previous result
with visible stale/error feedback. A newer edit aborts and invalidates an older
Run; the delayed-response regression confirms that it cannot replace the result.
Prose and captions retain live feedback against the last admitted source while
unrun source stays separate. Reload restores the saved working result and pending
source. `:w` awaits local persistence, `:q` closes without discarding, and `:wq`
closes only after successful save. None publishes or implicitly runs source.

Styles exposes workspace-wide theme defaults and overrides, including body,
surface, links, inline math, annotations, cursor, selection, code token colors,
palette references and independent weights/sizes. Blank values inherit; Reset
removes overrides. Preferences persist locally and are sent through the checked
same-origin preview bridge. Light themes change palette variables and increase
body weight. Human-readable masthead/controls/prose/annotations share Source
Serif; code and KaTeX retain native fonts. Per-element cascade inspectors and
cross-notebook transclusion UI are not implemented by this round.

`:h` / `:help` opens searchable help with document, JSON and inline-input scope.
Workspace Ex dispatch and its help entries share a registry. Document Vim stays
bounded; JSON still uses CodeMirror Vim, with common bindings listed and explicit
limits on enabled Ex commands. No exhaustive Vim parity, custom motion API,
register/macro editor or substitution over structured documents is claimed.
Absolute/relative/off gutters are available through `:set number`,
`:set relativenumber` and `:set nonumber`; prose numbering follows measured wrapped
lines and never enters persisted content. Inline link/math sources remain their
existing text inputs; the focused indirect-buffer exemplar is animation JSON.

Verification:

- `npm run visual:fraction-notebook`: 19 Chromium checks, including earlier
  nested/inline/history/recovery behavior, one-player identity, semantic moment
  preservation, pending/failed/superseded Run, save/close, style inheritance,
  help/Ex/gutters, and phone source/result layout.
- `npm run test:fraction-notebook`: 17/17.
- Full `npm run typecheck` and final scoped notebook typecheck passed.
- `npm run visual:anchored-algebra -- --grep 'fractional reasoning'`: 1/1,
  preserving the independent public reading.
- `npm run check:architecture` passed. Its initial private-clock inventory gate
  caught the two new RAF measurement coalescers. The explicit inventory now
  describes their bounded DOM-only purpose and disposal; semantic time remains
  owned by the reader. No checking or authority rule was disabled.
- `npm run test:project-vision`: 75/75; startup budgets remain unchanged.
- Production-reader closure stays 1,250,344 JavaScript bytes, 308,778 gzip,
  414 modules, with authoring dependencies excluded. Six new experiment-local
  modules/styles total 26,146 source bytes; no package was added.

The initial layout test exposed lost semantic position when hiding prose. The
dev-only reader bridge now captures semantic progress/location before layout or
style mutation, then restores through the reader's existing positioning path.
Desktop, light-theme and phone captures were inspected; a dark card left behind
by light-theme switching was corrected using the shared surface token. These
are single-exemplar Chromium discovery checks, not cross-browser certification
or whole-book performance evidence. One RAF coalesces each gutter/slot update;
the existing document size limits still apply.

## Review checkpoint

Open <http://127.0.0.1:8000/experiments/fraction-notebook/>. If Edit is off from a
previous session, enable it. Scroll to the embedded animation, select a moment,
then open **Edit animation specification**. Change wording, save with `:w`, and
Run with Shift-Enter: judge the feedback and legibility beside the result. Try
invalid JSON and confirm the previous result remains marked. Close the buffer
and confirm the document returns to its prior place. Toggle Edit for full reading.

In Normal mode try `:h`, search for Run, then close help. Try line-number modes,
Styles → Body color → `var(--color-green-light)`, and switch dark/light themes.
Judge inheritance, heading weights and the phone stacked source/result layout.
The persistent web/API services are running; the experiment returned HTTP 200.
Stop here for this exemplar's human judgment before wider promotion. Custom
motions/text objects and the broader parked agenda remain outside the candidate.
