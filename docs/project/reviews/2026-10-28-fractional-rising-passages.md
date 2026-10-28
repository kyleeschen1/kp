# Upper stage with rising passages

User-approved exemplar implementation: the stage occupies the upper half of
the page; text rises from below, reaches peak emphasis at the 50vh division,
then fades as it crosses the stage. The user's follow-up makes that division
halfway through the available space below the masthead, rather than raw 50vh.
This follows the removal of the temporary
typography controls. It is a local visual candidate, not a new reader default.

## Authority and preservation

Canonical host: `/reader/solve-fractional-linear/`. Artifact: the fractional
linear equation animation asset. Mathematical source of truth remains
`src/semantic/fractional-linear-equation-asset.ts`; the existing mixed native
KaTeX/material renderer and registered operations remain responsible for math.
The existing reader scroll clock, piecewise authored checkpoints, focus, URL
restoration and geometry scheduler remain in use. No equation is copied into a
new animation path, and the inactive-paint containment repair remains intact.

The local layout module wraps the existing prose nodes, including the opening
text, and exposes measure/render/dispose hooks to the current reader. Narrative
leading edges are cached with scroll geometry; opacity is projected from absolute
scroll position without another listener, frame loop, history state or per-frame
paragraph measurement. Semantic progress maps the authored checkpoints to the
passage's leading edge at the divider, so incoming prose stays below the
bottom-aligned equation. Mathematical operation timings remain unchanged.

## Candidate behavior

- The borderless stage stays above a full-width, 1px translucent white divider
  halfway through the space below the measured masthead. The gold progress
  fill is hidden. The existing fit planner works in a compact 120px workspace
  at the bottom of the stage, leaving breathing room above the line while
  retaining motion clearance. Mathematics retains its previous typography.
- Passage headings and paragraphs use the same 17px regular text treatment;
  semantic heading elements remain for navigation/accessibility.
- Each passage's leading edge reaches opacity 1 at the division. Incoming prose
  rises from 0.35 opacity; departing prose reaches zero after crossing 5% of the
  available height (about 40px at the checked viewports). The earlier slow fade
  is superseded by the user's request for a rapid retreat.
- Passages occupy one centered reading measure and move over the stage.
  Phone spacing preserves the same relationship rather than inheriting the
  compact transcript's closely spaced beats.
- Navigation moves into a **Steps** disclosure in the masthead. The Motion
  control remains available. Focused prose remains legible for keyboard use.
- The layout activates only with this route's enhancement. No-JavaScript
  retains the static document; print removes the stage and restores full prose
  opacity. Existing reduced/static equation-motion preferences remain available.

Rollback unit: `fractional-rising-passages.ts`, its CSS import, and the small
entry hooks. Other lessons retain their current layout. The proposed historical
derivation trail is still not implemented by this visual experiment.

## Verification and review

```sh
npm run visual:fractional-linear-equation -- --rising --base-url=http://127.0.0.1:8000
npm run visual:fractional-linear-equation -- --smoke --base-url=http://127.0.0.1:8000
npm run typecheck
```

The 41-frame animation preservation smoke passed, including direct, forward
and reverse traversal and inactive-paint checks. Chromium layout checks use
1280×900 and 390×844 viewports: passage positions at 75%, 50%, 47.5%, 45%, and
back to 50% of usable height; peak/fading opacity; measured masthead exclusion;
uniform text sizes; white divider; bottom ink clearance; no horizontal overflow;
exact rewind; URL reload; Steps navigation; print and no-JavaScript readability.
Full app, tooling, tests, Svelte and domains typecheck passed. Captures were
inspected on both viewport sizes. No cross-browser promotion is claimed.

Open `/reader/solve-fractional-linear/?kpLesson=lesson.solve-x.fractional-linear&kpVersion=1&kpProgress=500`.
Scroll down and back: the equation should remain above the divider while prose
crosses it at full emphasis and then retreats. Judge whether the fade hands
attention to the mathematics soon enough, and whether the spacing feels useful
rather than empty. Human visual acceptance remains pending.
