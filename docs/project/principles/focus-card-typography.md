# Focus-card typography

Status: canonical; text positioning and typography accepted by user 2026-09-11.
Acceptance: `../decisions/2026-09-11-focus-card-layout-type-acceptance.md`.
The gradient's explanatory adequacy and endpoint gestures remain separate G3 issues.

## Ownership

`src/tutorial/focus-deck-scaffold.css` imports `focus-deck-typography.css` for
every canonical card, including static markup. Ordinary stage words inherit
the same default as the passage. Controls keep the UI family; mathematical
notation stays native KaTeX and actual code keeps its canonical code renderer.
Never simulate mathematics by assigning a math font to ordinary HTML text.

For plain-language stage annotations use `renderKpFocusDeckAnnotation` from
`src/tutorial/focus-deck-annotation.ts`. It requires identity and escaped text,
defaults to the `label` role, and optionally provides supporting detail. Its
input has no font, size, scale, raw HTML, geometry or timing fields. The renderer
positions the resulting HTML label over or next to its plot; this is not a new
semantic registry, animation path, clock or layout solver.

```ts
renderKpFocusDeckAnnotation({
  entityId: component.id,
  text: component.label,
  detail: component.explanation
});
```

Do not put reading labels inside a scaled SVG or use individual per-card font
declarations. Native math labels continue through the existing math renderer
and equation typography policy, not the plain-language helper. Canvas/WebGL
paint does not inherit CSS automatically: use the existing renderer adapter or
HTML annotation projection, not a claimed universal font override.

## Canonical text positioning

For focus cards, default to one instruction area above the figure. Keep the
passage-to-stage handoff compact, with the current cue/action near the boundary.
Bottom-align text within its reserved passage area so shorter readings leave
space above, not between the instruction and its evidence. Keep the stage and
handoff stable through playback; viewport or user text-size changes may reflow
the composition. Preserve native overflow access for longer/enlarged prose.

These accepted defaults do not require all motion passages or longer essays to
adopt the same projection, or imply that existing cards have been migrated.
Canonical means the reviewed starting policy, not immutable font values or
exemplar-specific container dimensions.

## Shared controls

- `--kp-focus-card-passage-font`: prose and explanatory stage text; fallback
  Georgia, Times New Roman, serif. Changing it updates both without card edits.
- `--kp-focus-card-ui-font`: controls/chrome; fallback system UI/sans serif.
- `--kp-focus-card-label-size`: primary annotation, initially `1.125rem`.
- `--kp-focus-card-support-size`: supporting explanation, initially `1rem`.
- `--kp-focus-card-meta-size`: incidental metadata, initially `.875rem`.

Exact aesthetics remain adjustable. These are role defaults, not native KaTeX
font-size overrides or minimum sizes for subscripts. Related labels share the
same role; focus does not animate font size, weight, spacing or line height.
Theme inheritance applies to static HTML that loads the shared stylesheet too.
Previously frozen/bundled exports need rebuilding; raster exports cannot inherit
later CSS changes.

## Reading space

Typography remains in screen space while anchors follow semantic geometry.
Recompose before shrinking: wrap, reserve more space, or place labels beside the
plot in a stable annotation area. Responsive or user-text-size changes may
alter composition; ordinary playback must not. Do not silently clip required
labels or hide them to meet a fit check.

The gradient adapter demonstrates side annotations when space permits and a
below-plot area at narrow reading widths, with one column at large text sizes.
Its container thresholds are exemplar-local, not a universal graph layout.

## Evidence and limits

`tests/focus-deck-annotation.test.ts` covers escaping, role validation and
negative type examples. `tests/focus-deck-typography.browser.spec.ts` exercises
actual scaffold CSS import, fresh static markup, live theme inheritance, native
math/code isolation, screen-size parity, stable seeks and enlarged-text fit.
Run through `npm run visual:gradient-contour` during the current G3 review.

Types constrain the helper API, not arbitrary CSS or caller-supplied `stageHtml`.
Computed browser geometry must still verify readability and fit. Existing
renderer-specific font declarations are not automatically migrated; do not
describe this as renderer-wide typography certification.
