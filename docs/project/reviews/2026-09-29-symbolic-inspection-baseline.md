# Canonical distribution inspection baseline

Canonical host: `/experiments/authoring-distribution-focus-card/`, entry
`src/experiments/authoring-distribution-focus-card/entry.ts`. This is distinct
from the full reader's structural-preview query mode. Both reuse the exact
preview restorer, but the focus-card endpoint includes its native template.

The host fetches `/api/dev/authoring-structural/distribution-focus-card` and
restores its animation with `restoreKpReaderAuthoringDistributionPreview`.
The restorer checks exact canonical payload equality before reconstructing
authority. It returns before/after version pins. The asset is
`animation.fraction-composition.two-thirds-solve`; the selected transformation
is `fraction-solve.step.distribute`, the first cohort of the 8,400 ms timeline.

Semantic source: `src/semantic/fraction-composition-equation-asset.ts`, its
lawful fraction-solve macro, endpoint specs and authored lineage; the prepared
authoring result adds `definition.generated.distribution.distribute-multiplication`.
Source/target IDs, roles, law refs and assumptions are inspected from this exact
restored transformation, never reconstructed from DOM strings.

Paint path: `mountKpCanonicalEquationStageShell` →
`createKpChromeFreeCanonicalEquationSession` → reader canonical session → native
KaTeX compositor. The host already uses coherent transport opt-in and the shared
range controller. Keep both. `sample({ focus })` is the existing semantic-focus
input; selection must not create a second clock or paint owner.

Baseline commands: `npm run typecheck`, `npm run check:architecture`,
`npm run build:bundle`, `npm run visual:authoring-distribution-card -- --project=chromium`,
and direct Node tests for canonical distribution, entity provenance and object
registry. The existing browser command includes Firefox as well; passing another
project option accumulates projects rather than restricting the list. Future
discovery uses a dedicated single-project inspection command.

The initial attempt to measure this route in the main build failed because the
route is dev middleware, not an HTML production entry. The isolated real-client
build now uses `npm run build:symbolic-inspection` followed by
`npm run measure:symbolic-inspection`: **140,602 gzip bytes initial (4 files),
234,875 activated (17 files)** before inspection. This counts reachable JS/CSS,
not transferred dev modules or observed execution. It excludes HTML, separately
host-loaded styles, fonts, API response and server-side preparation. The host
still needs the dev API; this is not a deployable offline edition.

Baseline outcome: full types, architecture, main build, isolated build and 14
focused owner tests pass; all 30 existing Chromium/Firefox browser cases pass.
The inspection treatment will be additive and opt-in; none was present during
these baseline captures.
