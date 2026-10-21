# Focused engineering checks

Inspect the affected owner's checks with
`npm run verify:impact -- --path <file> --mode discovery`; add `--run` to execute.
Unknown owners still select the broad safe gate. Discovery is an inner-loop
check, not release certification.

- Algebra/matrix capability changes select source, semantic and import tests.
  Contract mode also measures all complete authoring consumers and checks types.
  `npm run check:authoring` is the standalone equivalent for those boundaries.
- Prepared revision/staging changes select session laws and actual browser
  staging/Apply checks. The browser uses the shared dev server on port 8000.
- Visibility changes select a production browser canary for registration,
  cancellation, multiple documents and callback isolation, including initially
  hidden documents. `npm run visual:semantic-cost` runs the full resource cohort
  and now builds its own fixtures first. Do not overlap it with `build:bundle`:
  both write dist. Main build goes first, then fixture/browser commands.

For Bayes history restoration specifically, use
`npm run visual:bayesian-reasoning:shared -- --grep 'Bayes addresses restore'`.
The authoring-entrypoints configuration selects a bounded cohort and does not
include every Bayes test; a command-line grep cannot broaden its selection.

At integration, run full types, `npm test`, production build and affected
production closure/budget checks. Focused success is not a replacement for those
gates. Browser checks establish preservation, not instructional effectiveness.
