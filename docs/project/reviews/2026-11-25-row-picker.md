# Floating rows and filter transient

The user approved the discussed row abstraction and floating Vim-picker exemplar.
Authors should scan richly annotated results, search intentional fields and
narrow by independent tags without losing their query or editing context.
The checked Vim reference/support audit remains authoritative; its full-height
presentation is superseded by this bounded candidate, not accepted as a template.

## Scope and review boundary

Canonical artifact: Vim binding coverage, opened from M-x or Ctrl-x Ctrl-x at
<http://127.0.0.1:8000/experiments/fraction-notebook/>. The renderer is a floating
native dialog with lightweight DOM rows and the existing ProseMirror query.
The pinned Vim index and per-editor support audit own semantics. Rows are
projections with stable IDs, resource references, display/search fields, facets
and registered action identities; they do not own domain data or execution.

One package, `row-picker`: a small typed row/matching/filter boundary, a Vim
adapter and floating picker with five visible results. Matching returns exact
field ranges and exposes any matched hidden alias. Tags distinguish role
(including composable operators), invocation, domain and support. Editor choice
retains the existing eight profiles; support does not depend on live availability.
Filtering uses OR within groups, AND across groups and explicit All/reset.
Sorting may use relevance, keys or tag groups without changing row identities.

C-h opens a filter transient inside the same container; a visible action and
alternate shortcut remain available. Toggles update counts/results immediately;
q or Escape returns one level with the same query/editor state. Query q remains
text. The selected row survives narrowing/reordering when still present. Inspect
details on demand; browsing a binding never executes it. Keep the existing late
import, disposal, failure-recovery and original-editor restoration boundaries.

Preserve document/session ownership, native histories, fixed panes, font/theme
variables, all reference rows and honest support claims. No new Vim semantics,
framework migration, storage layer, production publication or catalogue-wide
picker migration. M-x is the structurally different second consumer after this
exemplar's human review. The implementation and evidence commit is the smallest
independent rollback unit; the previous audit can remain intact on rollback.

## Checks and stop

Standard verification with focused discovery: pure row tests for literal/fuzzy
matching, exact field highlights, hidden metadata, filter logic and identity;
taxonomy/coverage preservation; complete notebook/chat typecheck; stable Chromium
`npm run visual:vim-coverage` checks for query history/mode/caret, transient keys,
zero results/reset, selection, source/chat return, streaming, cancellation and
loading failures. Inspect desktop light/dark and narrow layouts, without claiming
cross-browser certification. Reuse existing picker/history preservation cases.
Check project vision/orientation and Theseus records. The impact selector has no
focused rule for this dev-host UI; use affected consumers rather than an unrelated
production-release matrix. Keep the scoped browser entrypoint and test invariants
while adapting assertions for the explicitly approved presentation replacement.

Use the KP delivery workflow, with a three-hour ceiling, the final quarter for
verification/closeout, and hourly checkpoint/backup obligations. Stop at
HUMAN_CHECKPOINT once this one package is checked. Review density, legibility,
the tag vocabulary and whether moving between filters and query feels continuous.
No second-consumer rollout before that judgment.

## Checked candidate — November 25

The existing command opens a floating dialog with a persistent ProseMirror query
and at most five mounted result rows. All 1,369 reference/extension forms remain
searchable; keyboard movement, wheel and pointer/touch paging reach the remainder.
The selected row is kept visible when a narrow viewport fits fewer than five.
Enter or a row click inspects its evidence without executing the displayed binding.
The reference and license remain available on demand and load with the catalog.

The row boundary carries stable identity, the original resource, named display
and search fields, facet values and registered action IDs. Matching produces the
actual source ranges; hidden aliases/command names become visible when matched.
Unicode case folding maps back to whole source code points. Non-searchable
annotations never enter the matcher. Role, invocation, domain and support are
independent, multi-valued facets; sorting by a tag retains resource selection.
The adapter classifies reference forms independently of surface support, using
the upstream Normal-mode movement flag and context-specific navigation rules.
Insert Backspace/Enter remain operations; their Normal-mode names do not override
that context. Operators also count as operations; text objects remain operands. This inventory is a
bounded reference taxonomy, not a new executable Vim grammar.

C-h, F2 and the Filters action enter one transient inside the dialog. Plain keys
toggle; Shift plus a key isolates a value in that group. Counts account for the
query and other groups. q/Escape return without recreating the query view;
query text, selection, Vim mode and undo survive. Filters/sort are remembered only
in this picker's loaded module, with active filters always shown and r resetting
them. The original editor returns on the next Escape. M-x/fruit retain their own
presentation until review. The picker-support audit now explicitly notes the
coverage finder's local Ctrl-h interception; other Vim claims are preserved.

The first browser run passed one case and failed five. Two test locators included
native select options and one URL assertion compared absolute/relative forms;
those were corrected without weakening their invariants. Actual defects were
transient focus loss when registered actions disabled the focused toggle and
exact Ex names ranking after incidental mentions. The transient now retains
keyboard ownership during action updates; explicit canonical-name fields fix
ranking. Keyboard-toggle/q and exact-name regressions exercise both repairs.

Verification: ten row/coverage unit tests, complete notebook/chat typecheck, six
Chromium coverage cases and six existing picker/chat/history preservation cases
passed. The scoped browser command still covers late imports, cancellation,
explicit reload recovery, streaming, source carets and original selections.
Light/dark desktop and narrow captures were inspected. Scope-specific commands:

- `npm run test:vim-coverage`
- `npm run typecheck:fraction-notebook`
- `npm run visual:vim-coverage`
- `npm run visual:editor-chat -- --grep 'M-x and C-x|command picker keeps|command prefix cancels|fruit picker restores|note and composer Vim|late form'`
- `npm run test:project-vision`: 75 tests passed after the entrypoint repair.
- `npm run project:orientation` and `theseus workspace validate` passed; the
  selected package is complete and deferred for the named human checkpoint.

The persistent launchd web/API services are running; the canonical page returned
HTTP 200. Theseus retains the selected package and human-review stop.

The first project-vision check passed 74/75: roadmap/thread summaries exceeded
their existing budgets by two/three words. Existing prose was shortened; no
budget changed. No new dependency, framework or production payload is introduced;
the row/filter modules follow the existing lazy catalog import. DOM result cost
is bounded to five rows plus the small fixed filter palette. This does not claim
large remote-catalog performance, cross-browser shortcut compatibility or generic
picker promotion.

Review: from M-x choose Vim binding coverage, search `diw`, and inspect Enter.
Return with q, open C-h, press Shift-m then Shift-f for missing motions, and q
back to the query (clear `diw` to browse all missing motions). Compare editor profiles, try tag sorting and F2, then Escape
to your original editor. Judge density, vocabulary and uninterrupted return.
