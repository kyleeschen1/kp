# One matrix page treatment

The user selected the three-term dot page as the reference and explicitly asked
to port the other matrix examples and menu. This authorizes the bounded rollout
across these existing examples; it is not a site-wide theme change.

Canonical reference: `/experiments/dot-product-passage/`. Review the unified menu
at `/experiments/matrix-examples/`, including columns, row–column products,
identity, orthonormality and composition. Their original KaTeX adapters, clocks,
semantic objects, geometry, timing and source identities are preserved.

`matrix-theme.css` owns the reference dark palette and player typography.
`matrix-example-page.css` owns page framing; `matrix-player.css` owns controls and
cards. Page roots and independently mounted players have explicit classes. The
OS color preference no longer switches some examples to an unrelated light theme.
The menu uses the same treatment as its child. Local stage CSS contains only
its own layout rules: combinations no longer imports the row–column stylesheet,
and the menu no longer imports an animation's stylesheet.

This consolidates page presentation, not all player lifecycle code. Distinct
semantic adapters and their stage layouts remain necessary. The single rollback
unit is the shared styling, host markers, imports and parity regression check.

The new browser check verifies seven page/example routes under both light and
dark OS preferences, including body/card palette, controls, regular KaTeX weight
and iframe parity. Existing interpretation tests cover layout toggles, reduced
motion, source identity, milestones and narrow-page containment. Dot checks retain
the accepted lift/pivot, gradual bracket fade, evaluation and disposal behavior.

The first separated build duplicated KaTeX CSS across page and player assets,
tripping the existing CSS budget. Keeping those common imports under the shared
page entry fixed the cause without raising ceilings. Menu plus default child
now shares one common sheet: 14,443 gzip CSS bytes versus 28,439 before this work.
All complete entry and activated composition budgets pass. Standalone dot CSS
is 14,403 gzip bytes versus 14,461 in the earlier baseline. Gzip numbers are build
estimates, not total transfer measurements; fonts remain separately accounted.

Verification: `npm run visual:matrix-interpretations` (9 tests including parity),
`npm run visual:dot-passage` (6), `npm run visual:matrix-column` (2),
`npm run build:semantic-cost`, `npm run measure:semantic-cost`, and the production
browser cohort through `npm run visual:semantic-cost`. Initial parallel browser
launches interfered with output-directory cleanup; subsequent checks run serially.
