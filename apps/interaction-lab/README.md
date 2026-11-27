# Interaction lane

This independently runnable lab composes the existing command registry and
searchable row model through `src/interaction/public-api.ts`. It imports no
notebook, chat, ProseMirror, CodeMirror or mathematical runtime. Its source is a
small in-memory fruit catalogue and captured command snapshots; it has no
persistent data or backend service.

From the repository root, after installing the root dependencies:

```sh
npm run --prefix apps/interaction-lab dev
npm run --prefix apps/interaction-lab test
npm run --prefix apps/interaction-lab typecheck
npm run --prefix apps/interaction-lab build
npm run --prefix apps/interaction-lab visual:interaction
```

The development command uses strict port **8011** at <http://127.0.0.1:8011/>.
Build output is local `apps/interaction-lab/dist/`. Browser checks start and stop
their own server, and refuse to reuse an occupied port. The integration owner's
aggregate checks can run the same browser spec with `KP_INTERACTION_LAB_URL` set
to an already running host. This app does not manage the persistent KP preview.

## Public contract

- `createRowPickerSession<T>({ execute, state?, maxVisible? })` is the DOM-free
  query/selection/lifecycle controller. Open it with `Row<T>[]`, then use
  `query`, `filter`, `move`, `select`, `accept`, `close` and `dispose`.
- `mountRowPicker<T>(element, { id, label, rows, execute, state?, facets?,
  maxVisible?, report? })` adds a native modal dialog and input. It returns
  `open`, `close`, `refresh`, `snapshot` and `dispose`.
- `commandRows(registry.snapshot(origin))` projects already prepared commands.
  Pass `state: row => row.resource.state()` and
  `execute: row => row.resource.execute()` to retain command ownership checks.
- Existing `CommandRegistry`, `Row`, availability and facet types are reexported.
  Import `src/interaction/style.css` explicitly when using the DOM adapter.
  Override the component's `--picker-*` variables for host styling.

Each opening captures its rows; query/filter/navigation preserve the resource
objects. Five rows are mounted by default. Navigation moves that window through
all results rather than discarding later matches. Matching and facets retain
their existing owners in `editor-rows`; commands retain theirs in
`editor-commands`. No parallel registry or fuzzy algorithm is introduced.

The adapter closes and restores focus before executing the selected action.
Command execution revalidates availability and captured ownership. An old async
result cannot close a newer opening; queued native close events also cannot
close a dialog that a command reopened. Dispose releases listeners and rows,
removes the dialog, and rejects reopening. The caller owns disposal and should
subscribe to its domain/registry changes when live availability needs refresh.

The query is an ordinary text input deliberately: importing the old picker query
would pull notebook Vim and structural editing into the library. This is a
bounded independent consumer, not a replacement for the accepted notebook
picker. Generic Vim/editor extraction and notebook adoption remain separate.
Matching currently scans its supplied collection; this does not prove catalogue
scale indexing or asynchronous resource discovery.

## Inspect the exemplar

Open the picker, navigate beyond the first five fruits, narrow to Apricot and
press Enter. The status includes `fruit.apricot`; the launcher regains focus.
Open again and use Ctrl-h / Tags to exclude fruit rows, then q to return to the
query. Search for “reset” to find the command through its alias. “Reopen picker”
exercises immediate close/reopen. “Remount picker” disposes the previous owner
and creates a fresh one without duplicated dialogs.

Stable browser selectors: `#open-picker`, `#interaction-picker`, its combobox
and option roles, `data-row-id`, `#selection`, `#remount-picker`, `#mount-status`.

## Evidence — 2026-11-27

- Unit/preservation command: **17 passed** (six new session tests plus existing
  command and row tests). Coverage includes captured targets, removed owners,
  pending execution, reopen, disposal, filtering and bounded navigation.
- Scoped TypeScript: passed.
- Production build: passed; 14 modules, JavaScript 14.89 kB raw / 5.54 kB gzip,
  CSS 2.65 / 0.95 kB, HTML 1.19 / 0.62 kB. Vite's compressed-file estimates are
  not network or startup measurements.
- Browser command: **2 Chromium journeys passed**, including focus restoration,
  alias matching, facets, remount and immediate command-triggered reopen.
- Existing notebook/chat source and behavior were not changed. Integration
  ownership policy and aggregate gates belong to the parent delivery; this
  lane does not claim the entire repository's architecture gate passes.

Worker base: `d81271189`; branch: `feature/20261127-interaction-lane`.
Owned paths: `src/interaction/`, this lab, its two test files and scoped
TypeScript config. No root dependency/lockfile change is needed.
