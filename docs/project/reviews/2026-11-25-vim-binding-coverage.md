# Vim binding coverage from M-x

The user approved a searchable checklist of Vim commands with explicit support
per editor surface, opened from M-x or Ctrl-x Ctrl-x. Authors can distinguish a
missing binding from a partial implementation, workspace override or inherited
behavior that has not been verified. This is the finite successor to the checked
command-registry candidate; that candidate remains available for visual judgment.

## Scope and authority

Canonical host: <http://127.0.0.1:8000/experiments/fraction-notebook/>. A read-only
DOM panel uses existing workspace typography and theme variables. A pinned Vim
command index owns the reference inventory; audited surface-specific metadata
owns coverage claims. The registry only opens/closes the view. Runtime command
availability (for example an empty undo history) must not change support status.

One package, `coverage`: retain the upstream index and license, parse its command
rows with deterministic coverage checks, annotate current behavior, and expose a
searchable/filterable panel with original-context restoration. Separate notebook
prose, chat/note prose, source editors, transcript, query and ordinary text fields
where behavior differs. Show implemented, missing, partial, overridden,
unverified and not-applicable states. Preserve command descriptions and source
links; treat counts/operators as compositional rules rather than enumerating all
numeric combinations. Do not silently count inherited CodeMirror features as
verified. Do not implement new motions, operators, Ex commands or custom keymaps.

Keep existing document/session owners, native keymaps, selections, histories,
fixed panes and the command picker unchanged. Load the reference only on demand.
One checked implementation/evidence commit is the independent rollback unit.
No remote execution, external service, new dependency or renderer migration.

## Verification and stop

Check the pinned source digest and deterministic row extraction. Unit checks
cover mode/identity uniqueness, status/evidence invariants, profile differences,
search/filtering and workspace overrides. Typecheck the complete notebook/chat
consumer. Chromium checks open from M-x and Ctrl-x Ctrl-x, inspect known rows,
switch profiles/filters, search missing combinations, retain source and chat
positions, and inspect light/dark/narrow layouts. Reuse stable scoped npm browser
commands; run existing command-picker preservation cases. Check project vision,
orientation and Theseus records. The impact selector lacks a focused rule for
this dev-host panel; use these affected consumers rather than an unrelated
production-release matrix.

Use the KP delivery workflow, with a three-hour ceiling, the final quarter for
verification/closeout, and hourly checkpoint/backup obligations. Stop at
HUMAN_CHECKPOINT after the one package is checked. No further behavior rollout is
implied by a useful inventory. Theseus owns live progress.

## Review cues

Open M-x, search `Vim binding coverage`, and press Enter. Search `delete`, `dw`,
`text object` or a literal key. Compare notebook and source profiles. Check that
`u` stays implemented even with an empty history, that simplified motions are
partial, and that inherited/overridden behavior is identified honestly. Escape
or Close returns to the original editor. Judge readability and whether the list
helps decide what to implement next.

## Checked candidate — November 25

The panel contains 1,358 reference forms from the unmodified Vim 9.2.0000 index
(1,336 tagged rows and 22 aliases), plus 11 KP extensions. The 83,355-byte index
and its license load only when opened. Search covers the complete catalog while
rendering starts with 80 results. Editor, support and mode filters distinguish
eight surfaces. Status markers are reference claims, not interactive checkboxes
or live command availability. Source paths and pinned reference links explain
each claim. The list cannot execute its displayed Vim commands.

The existing origin-capture boundary restores selections, source carets and
native history. An import generation guard prevents a late result reopening a
closed panel. Browser checks initially exposed two boundary issues: search fields
consume Escape, and failed ESM imports can remain cached. The dialog now owns
Escape dismissal in capture; failed loading offers an explicit workspace reload.
It never reloads automatically. Both failures and cancellation are exercised by
the stable browser entrypoint.

Verification passed:

- `npm run test:vim-coverage`: four tests, including pinned digest, exact source
  row coverage, status/evidence invariants and composition search examples.
- `npm run typecheck:fraction-notebook`: complete notebook/chat consumer.
- `npm run visual:vim-coverage`: four Chromium cases covering both launch keys,
  filters, paging, selection return, JSON/composer/transcript profiles, streaming,
  cancellation, failed-import recovery and dark/light/390px captures.
- `npm run visual:editor-chat -- --grep 'M-x and C-x|command picker keeps|command prefix cancels|fruit picker restores|note and composer Vim|late form'`:
  six existing command/picker/history preservation cases.
- `npm run test:project-vision`: 75 tests. Initial entrypoint word-budget failures
  were repaired by shortening existing roadmap/thread prose; ceilings are unchanged.
- `npm run project:orientation`, `npm run check:playwright-configs` and
  `git diff --check` passed. The configuration baseline admits exactly the new
  scoped config: 72 → 73 configs; all previous hashes unchanged. It inherits
  three available projects, discovers only the existing chat test file and
  starts no server. The npm command runs Chromium only.
- `theseus workspace validate`: valid, with the selected package complete and
  task/contract deferred at `HUMAN_CHECKPOINT` for the panel's visual judgment.

Light, dark and narrow captures were inspected. The header/modeline remain
outside the panel and the first narrow-screen result is visible. The persistent
launchd web/API services are running and the canonical page returned HTTP 200.

Limits: this is a pinned command index, not every possible count, plugin or Vim
script function. Inherited CodeMirror Vim 6.4.0 behavior remains unverified unless
specifically exercised here; source-editor Ex capture is reported separately.
The support metadata is an audited snapshot, not proof of every browser/OS
shortcut. No cross-browser certification or new Vim behavior is claimed.
Candidate awaits human judgment at the review cues above; broader rollout and
new bindings remain separate decisions.
