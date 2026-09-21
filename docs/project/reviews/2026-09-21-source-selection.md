# Native code selection and whole-equation LaTeX copying

Status: implemented bounded extension; no catalogue-wide promotion.
Execution: `run-contract.kp.passage-consolidation-v2`, `code-transfer`.

The user approved the recommendation to make code selectable after settling and
to copy whole equations as LaTeX. Arbitrary selected math fragments and selection
of moving glyphs remain excluded.

## Interaction

- Code: <http://localhost:8000/experiments/centroid-reasoning/?reading=focus#extract>.
  During motion, click the code once to settle/pause to the nearest complete
  state, then drag or double-click to select native text and copy normally.
  Enter/Space on the focused code region also settles. The first press is
  consumed because settling can replace its target text node; the subsequent
  selection therefore has a stable browser anchor. Touch scrolling is preserved;
  touch users retain the Copy code action.
- Equations: <http://localhost:8000/experiments/mechanics-relations/#energy-from-momentum>.
  Click or keyboard-activate a written equation to select the entire expression;
  Cmd/Ctrl+C copies its checked LaTeX, without display delimiters or KaTeX DOM
  duplication. Copy current LaTeX works between states without seeking, using
  the nearest complete row of the active view. Smaller-step disclosure rebinds
  copying to that view's checked source. Rail input clears the copy selection.

## Authority and preservation

Canonical code artifact and renderer remain centroid generated source plus the
native/token theater. Canonical equation source is `plan.view.states` from the
checked energy publication. Publication escapes that source into a per-row
attribute; it does not scrape glyphs or reverse-engineer KaTeX markup. The
energy reader owns current position; its compositor and rail are unchanged.
Only namespace `energy` enables the equation interaction in this exemplar.

A small shared `source-clipboard.ts` transports an already captured string and
returns copied/manual/disposed outcomes. Each adapter owns its semantic source,
selection and fallback. Permission failure selects a readonly source field;
an aborted adapter cannot update retired UI after clipboard completion.

Rollback unit: clipboard helper, local selection adapters/host hooks, equation
source attributes and scoped selection styling. No new motion or semantic engine.

## Verification

- Thirteen centroid Chromium cases passed; final focused selection rerun covers
  preserving touch scrolling and actual native word selection/copy.
- Four mechanics Chromium cases passed through the stable visual command with
  `whole equation selection|persistent lens follows|rail jumps directly` filtering.
  They cover clipboard contents, current held position, disclosure rebinding,
  pointer/keyboard selection clearing and existing edge/rewind preservation.
- Eleven equation-surface preservation checks passed.
- App/node/test TypeScript and architecture gates passed.
- Equation selection capture inspected; source and clipboard assertions are
  executable evidence, not claims about arbitrary fragment mapping.

An existing exact-string rewind assertion failed on a 0.00000007 difference from
browser pointer-coordinate rounding after scrolling. Its repeated-drag check now
uses six-decimal numeric precision while retaining exact document-layout checks.
The complete four-case cohort then passed. No renderer precision was changed.
