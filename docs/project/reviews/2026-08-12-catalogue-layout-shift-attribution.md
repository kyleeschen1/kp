# Catalogue Layout-Shift Attribution

Date: 2026-08-12
Status: repaired and executable

## Finding

The `kp.animation-catalogue.stage-reservation.v1` outer box was already stable.
Both reported shifts came from resources that settled around that box:

- selected equation and Graph SVG capabilities imported KaTeX CSS, mounted
  visible math, and only then allowed the browser to finish the KaTeX font
  families used by the first frame; and
- on the narrow route, development-toolbar CSS mounted before the catalogue's
  application-wide box model and reading styles, so the fixed toolbar changed
  height during the same CLS observation window.

The browser regression now records the attributed source nodes and rectangles
when its unchanged `0.001` threshold fails. Before repair, the equation route
reported `0.0057` CLS and the graph route `0.0024`; the outer reservation's
`x`, `y`, width, and height remained within `0.5px` throughout.

## Repair

- Equation and Graph SVG capabilities await the exact KaTeX family/weight
  probes they use before registering a paint adapter.
- Catalogue preparation awaits its regular and emphasized reading-font metrics
  before replacing the loading shell.
- Bootstrap resolves the catalogue stylesheet owner before mounting fixed
  development chrome; the toolbar also declares its own box model and
  route-independent UI font.

This is resource reservation, not a visual redesign. It preserves the selected
asset, initial frame, lazy capability boundary, player geometry, accessibility,
and settled styling.

## Evidence

- `npm run test:browser:animation-equation-capability`: 5/5 pass at the original
  threshold for wide equation and narrow graph routes.
- `npm run typecheck`: pass.
- Focused catalogue preparation, route, capability, and toolbar tests: 15/15
  pass.
- `npm run check:architecture`: pass.

