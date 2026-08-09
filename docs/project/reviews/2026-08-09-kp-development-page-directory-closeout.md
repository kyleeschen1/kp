# KP Development Page Directory Closeout

Date: 2026-08-09
Status: navigation tranche complete

## Outcome

Every supported first-party development surface is reachable from the fixed
bottom **Pages** disclosure. The disclosure uses grouped native links, marks
the current page, supports ordinary new-tab and copy-link behavior, and does
not reserve document flow. It is development-only: production closure checks
reject both the toolbar protocol and its visible labels.

The executable source of truth is
`src/dev-toolbar/development-page-directory.ts`. The table below is a review
ledger, not a second routing authority; `npm run test:dev-toolbar` fails if a
declared page is absent from this ledger.

## Inspection

Start the development server with `npm run dev`, then [open the animation
catalogue](http://localhost:5173/). Open **Pages** at the bottom of any listed
surface to move among all four groups. The economics route is the canonical
wide/phone toolbar exemplar; reader and diagnostic entries also verify that
only one Review owner is present.

| Group | Page ID | Page | Development URL |
| --- | --- | --- | --- |
| Studio | `studio.catalogue` | Animation catalogue | [Open](http://localhost:5173/) |
| Studio | `studio.editor` | Animation editor | [Open](http://localhost:5173/?view=editor) |
| Studio | `studio.dashboard` | Project dashboard | [Open](http://localhost:5173/?view=dashboard) |
| Studio | `studio.animation-library-host` | Animation library host | [Open](http://localhost:5173/?view=animation-library-host) |
| Studio | `studio.animation-workbench` | Animation workbench | [Open](http://localhost:5173/?view=animation-workbench) |
| Tutorials | `tutorial.ftc` | FTC tutorial | [Open](http://localhost:5173/?view=ftc-tutorial) |
| Tutorials | `tutorial.linear-equation-concept` | Linear equation concept room | [Open](http://localhost:5173/concepts/mathematics/linear-equations/solve-with-balance) |
| Tutorials | `tutorial.economics-demand-shift` | Economics · demand shift | [Open](http://localhost:5173/tutorials/economics/demand-shift/) |
| Tutorials | `tutorial.algebra-fraction-composition` | Algebra · fraction composition | [Open](http://localhost:5173/tutorials/algebra/fraction-composition/) |
| Tutorials | `tutorial.lisp-function-application` | Programming · Lisp function application | [Open](http://localhost:5173/tutorials/programming/lisp-function-application/) |
| Readers | `reader.solve-x` | Solve x | [Open](http://localhost:5173/reader/solve-x/) |
| Readers | `reader.generated-solve-x` | Verified generated solve | [Open](http://localhost:5173/reader/generated-solve-x/) |
| Readers | `reader.solve-x-teacher-zero` | Solve x · explicit zero | [Open](http://localhost:5173/reader/solve-x/teacher-zero/) |
| Readers | `reader.solve-fractional-linear` | Fractional linear equation | [Open](http://localhost:5173/reader/solve-fractional-linear/) |
| Readers | `reader.divide-both-sides` | Divide both sides | [Open](http://localhost:5173/reader/divide-both-sides/) |
| Readers | `reader.split-merge-fractions` | Split and merge fractions | [Open](http://localhost:5173/reader/split-merge-fractions/) |
| Readers | `reader.radical-succession` | Half power to square root | [Open](http://localhost:5173/reader/radical-succession/) |
| Readers | `reader.fraction-composition` | Distribute and solve with a fraction | [Open](http://localhost:5173/reader/fraction-composition/) |
| Readers | `reader.foldable-distribution` | Distribute and collect like terms | [Open](http://localhost:5173/reader/foldable-distribution/) |
| Readers | `reader.fractional-transfer` | Fractional transfer comparison | [Open](http://localhost:5173/reader/fractional-transfer/) |
| Readers | `reader.distribution-area` | Distribution and area | [Open](http://localhost:5173/reader/distribution-area/) |
| Readers | `reader.quadratic-branching` | Quadratic branching | [Open](http://localhost:5173/reader/quadratic-branching/) |
| Diagnostics | `diagnostic.canonical-animation-review` | Canonical animation review | [Open](http://localhost:5173/canonical-animation-review.html) |
| Diagnostics | `diagnostic.glyph-reconciliation` | Glyph reconciliation experiment | [Open](http://localhost:5173/glyph-reconciliation-experiment.html) |

## Evidence

- `npm run test:dev-toolbar`: descriptor, grouping, route-authority, host
  ownership, layout non-reservation, and ledger agreement.
- `npm run test:browser:page-directory`: directory inventory plus all 24 links,
  exact current-page identity, successful documents, fixture exclusion, and
  Review ownership where supported.
- `npm run visual:economics-dev-toolbar`: wide, phone, and short-viewport
  geometry, keyboard behavior, source-state preservation, and real-link use.
- `npm run build`, `npm run check:dev-review-production`,
  `npm run check:reader-production`, and `npm run check:reader-budgets`:
  development-only isolation and unchanged learner closures.

The navigation tranche does not choose a final learner layout or introduce
learner-facing global navigation. It supplies one low-friction development
index so layout and lesson work can proceed without terminal URL lookup.
