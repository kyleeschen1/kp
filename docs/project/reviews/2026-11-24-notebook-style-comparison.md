# Notebook style comparison and rhythm

The user's "go" approves this refinement of the focused notebook candidate.
One fraction exemplar should use the stage beige throughout light mode, make
style comparisons searchable by object and property, show named color references
with swatches, lift the masthead with a subtle shadow, and centralize document
block spacing. The prior candidate at `41966729c` remains recoverable; feedback
does not establish broader promotion or resume parked custom Vim extensions.

Canonical host: `/experiments/fraction-notebook/`. JSON/ProseMirror own content;
the native fraction compiler/player own animation meaning and time. Preserve
UUIDs, drafts, undo, object nesting, focused buffers, Run/save/close behavior and
the public reader. The reversible unit is the experiment's Styles UI and scoped
CSS. No schema change, renderer migration, global public-reader restyling or
transclusion implementation.

One package: a searchable/groupable style catalog, named palette selections and
resolved swatches with advanced exact values, shared light Paper canvas, masthead
elevation, and parent-owned gaps. Start block spacing at .9rem rather than the
prior .5rem paragraph gap and 28px-plus-padding stage entrance. Keep internal
animation geometry and control hit targets; remove outer vertical padding/margins
from document content blocks. Keep title/credit grouping compact.

Verify scoped types, notebook model tests, the full fraction Chromium suite,
project-vision consistency and canonical reader preservation. Add checks for
filter combinations, theme/reference persistence, empty/nested block editing and
measured paragraph/stage gaps. Inspect the light title/paragraph/stage and Styles
comparison on desktop and phone before one human checkpoint. Reserve closeout
time for evidence, commit and backup. Generalization waits for visual review.

## Candidate behavior and review

Styles now searches labels, object names, property types and variable names;
object/property filters intersect and results group by property or object. Search
`weight` to compare the six typography roles together. Each color shows a named
palette selection and resolved swatch. Inherit follows the declared default;
Advanced exposes exact CSS values and arbitrary references. Theme changes update
references, while custom overrides persist. Reset restores inherited values.
The reference graph rejects circular overrides before they can invalidate paint.
Stored preferences retain their format; the old paragraph-gap override migrates
to the shared block gap. Invalid stored cycles fall back to theme defaults.

Light Paper uses the former stage beige throughout this notebook's canvas,
panels, source buffer and preview. Color literals now live in the named palette.
The masthead has a subtle theme-colored shadow and owns a higher stacking layer
than workspace overlays. Document parents own a .9rem gap (14.4px at the current
root size), replacing .5rem paragraph margins and the stage's 28px outer margin
plus vertical padding. Title/credit groups use .4rem. These variables apply to
editor and preview; native animation internals and control hit targets retain
their layout. No public-reader CSS or document schema changes were required.

Open <http://127.0.0.1:8000/experiments/fraction-notebook/> and enable Edit if
needed. In Styles choose Light, search `weight`, compare title and heading values,
then try object/property filters and a named body color. Close Styles and judge
the paragraph rhythm, the smaller entrance gap before the fraction stage, and
masthead elevation. Existing explicit background overrides still take precedence;
Reset overrides reveals the new defaults. Search `gap` to adjust spacing.

Verification and limits:

- `npm run visual:fraction-notebook`: full 21-test Chromium suite, including
  filters/grouping, inherited swatches, override persistence/reset, cycle rejection,
  measured paragraph/stage gaps, shared title grouping, nested outline paint,
  live spacing changes, menu stacking and existing editor/player preservation.
- `npm run typecheck:fraction-notebook`: scoped source and browser-test types.
- `npm run test:fraction-notebook`: 17 model/independent-reading tests.
- `npm run test:project-vision`: 75 tests; original startup budgets retained.
- `npm run visual:anchored-algebra -- --grep 'fractional reasoning'`: one public
  reader preservation check. Production closure remains 1,250,344 JavaScript
  bytes, 308,778 gzip and 414 modules; no authoring dependency enters the reader.

The initial browser run found a native preview paragraph margin overriding the
new shared rhythm. The notebook preview boundary now resets those margins and
the existing editor/preview geometry regression passes. Snapshot checks caught
a duplicate identity and overlong entrypoints; both were repaired without
raising budgets or weakening checks. Desktop/phone captures support this bounded
review, not cross-browser certification, broad rollout or whole-book performance.
The extra catalog, reference validation and panel controls run only in the
development notebook; no dependency, clock or network service was added.

Stop at this exemplar's human visual judgment. The focused candidate at
`41966729c` remains the previous rollback point. Resume this bounded context with
`theseus work context task.kp.style-comparison-20261124 --mode brief`; wider
authoring work and custom-motion exploration retain their previous boundaries.
