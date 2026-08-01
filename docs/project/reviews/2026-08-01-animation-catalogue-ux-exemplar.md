# Animation catalogue UX exemplar

Status: awaiting human review at run-contract slice s08.

Review the live solve-x exemplar at:

`http://127.0.0.1:8000/?artifact=animation.linear-solve.solve-x`

The canonical reference is the solve-x catalogue asset. It is intentionally the
only asset receiving the proposed centered, compact equation-stage geometry.
Approval promotes the treatment as a direction to pressure against other
surface families; it does not make these exact dimensions universal.

## What changed

- Selecting a catalogue result replaces only the selected asset, player,
  inspector content, and their owned lifecycle. It does not reload the page.
- Back and Forward restore catalogue assets in the existing shell.
- Search query, rail position, inspector mode, review composer, unsaved review
  draft, and relevant focus contexts survive selection and history traversal.
- Solve-x groups its equation, explanation strip, and four steps into one
  centered unit. The steps use compact intrinsic-height chips instead of tall
  columns. Playback remains fixed at the bottom of the visible stage.

## Captured acceptance evidence

`npm run visual:animation-catalogue` records start and midpoint captures and
checks the complete 33-row host inventory. At a 1440 by 1000 viewport it
observed:

- content-center offset below 0.01 px on both axes;
- a 196.52 px centered content unit inside the 949.78 px visual stage;
- four step chips with a maximum height of 26.46 px;
- playback controls visible without document scrolling;
- inline KaTeX and no visible h1 or h2 in the catalogue shell;
- selected-row, search, inspector, and review-composer focus preservation;
- document, shell, review host, query, inspector mode, rail position, and
  unsaved draft preservation across selection and Back/Forward.

Disposable captures are written to
`tmp/codex/animation-catalogue/desktop.png` and
`tmp/codex/animation-catalogue/desktop-midpoint.png`.

## Preservation and rollback

The semantic model, runtime, clock, renderer, paint ownership, accessibility,
and authoring contracts are unchanged. The visual rollback unit is the
solve-x selection-scoped block in
`src/editor/animation-catalogue-shell.css` (commit `4f135709`). The persistent
navigation units are commits `d927ed35` and `4f7bc84e`.

## Human decision

Approve the catalogue interaction and solve-x visual direction, or request a
specific adjustment. Approval authorizes the next slice to generalize only the
parts that remain valid when pressured against structurally different
catalogue surfaces.
