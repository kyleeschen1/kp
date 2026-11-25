# Unified fraction notebook surface

Subsequent review: the user says "It looks great!" and accepts this candidate.
The [focused-buffer next-step review](2026-11-24-focused-buffer-next-step-review.md)
records the successor direction and parked custom Vim extension work.

The user accepts the structure-editor candidate, then approves this bounded
presentation refinement: one masthead, editor typography in the reading pane,
an animated opening/closing split, and red modal cursors. Preserve the accepted
structure operations and the prior candidate at `9416ea2ca`.

Canonical host: `/experiments/fraction-notebook/`. Versioned JSON and ProseMirror
own document content; the existing reader/compiler/KaTeX player retain semantic
and animation authority. The rollback unit is the experiment's shell, scoped
preview styling and cursor presentation. No notebook migration, equation change,
public-reader typography rollout or expansion into the later authoring agenda.

One delivery package: consolidate tools in the top masthead, remove pane chrome,
retain accessible reading controls, match prose typography, slide both panes
over roughly 280 ms, and derive block/line cursors from the existing Vim mode.
Preserve mounted player identity, reading context, drafts and keyboard editing.
Reversal must settle at the latest requested layout; reduced motion is immediate.
Normal uses a steady theme-variable red block with readable text; Insert uses
a red line. Check empty paragraphs, line endings, inline objects and JSON mode.

Verify scoped model/types and Chromium browser tests, production dependency
exclusion, canonical reader preservation, and project-vision consistency.
Use the stable `npm run visual:fraction-notebook` command for captures and
interaction checks. Stop at one visual review before wider promotion. Theseus
owns execution; this document owns scope and review evidence.

## Candidate and evidence

The candidate keeps one top masthead with Writing, Structure and native Reading
options. Both prose surfaces use Source Serif 4. Edit reversibly opens the split
over 280 ms (vertical on narrow screens), with immediate reduced-motion layout.
The native player stays mounted and retains its selected mathematical moment.
Normal mode paints a steady red block; Insert uses a red line. Both read
`--kp-editor-cursor`, with block text from `--kp-editor-cursor-ink`. Cursor
decorations never enter saved content. The existing bounded prose Vim vocabulary
is unchanged; this is not full Vim parity or a general theme implementation.

Verification on 2026-11-24:

- `npm run visual:fraction-notebook`: 15/15 Chromium checks, including split
  interruption/reversal, mounted-player continuity, reduced motion, mobile
  stacking, grapheme/empty/inline cursor boundaries, JSON Vim keys and colors.
- `npm run visual:anchored-algebra -- --grep 'fractional reasoning'`: 1/1,
  run concurrently with the notebook suite against separate development servers.
- `npm run test:fraction-notebook`: 17/17; `npm run typecheck` and
  `npm run typecheck:fraction-notebook`: passed.
- `npm run test:project-vision`: 75/75; dependency-direction gate passed.
- `npm run check:tooling-configs`: includes a real Vite config-resolution test
  proving separate caches for ports 8000/8012 and stable cache identity on restart.
- Production-reader closure remains 1,250,344 JavaScript bytes, 308,778 gzip,
  414 modules, with no notebook editor dependency. No packages were added.

Desktop, phone and JSON cursor captures were inspected. Screenshot capture keeps
the caret intact because Playwright's default caret hiding disturbed editable
NodeViews. These are Chromium discovery checks, not cross-browser certification.

Testing exposed a shared development-cache violation: the independent test
server rewrote optimized chunks still referenced by the persistent server's
in-memory graph, producing distinct CodeMirror facet owners and silently absent
Vim. The root serve configuration now assigns a cache by server port; the editor
fails visibly if Vim cannot attach. The config baseline adds only that plugin's
declaration, preserving all build inputs and limits. The integration test plus
concurrent browser suites guard the observed failure; unrelated server-failure
causes are not claimed solved. Reading options are also disabled until the
preview acknowledges readiness, preventing commands lost during draft recovery.

## Visual checkpoint

Open <http://127.0.0.1:8000/experiments/fraction-notebook/>. Toggle Edit in both
directions and mid-transition: judge the slide and the single masthead. Compare
prose fonts, press `i` and Escape in the document and expanded animation JSON,
and check the red line/block distinction. At a selected mathematical moment,
close and reopen Edit to verify that the reading remains there. Native Reading
options are available from the top masthead. The persistent web/API services
are running and the experiment returned HTTP 200 at handoff preparation.

Stop at this one exemplar for human visual judgment before promotion. Later
theme, transclusion, indexing and autocomplete work remains outside this slice.
