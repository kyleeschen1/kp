# Upper stage with rising passages

User-approved exemplar implementation: the stage occupies the upper half of
the page; text rises from below, reaches peak emphasis at the 50vh division,
then fades as it crosses the stage. This follows the removal of the temporary
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
centers are cached with scroll geometry; opacity is projected from absolute
scroll position without another listener, frame loop, history state or per-frame
paragraph measurement. Semantic progress still maps to the authored beat
centers; changing the layout does not retime the mathematical operations.

## Candidate behavior

- The borderless stage stays above a full-width divider at 50vh, on the same
  dark page background as the prose. The existing progress rail occupies that
  divider. Mathematics retains its previous typography.
- Each passage's center reaches opacity 1 at the division. Incoming prose
  rises from 0.35 opacity; departing prose smoothly reaches zero by 30vh.
  These optical thresholds are provisional. An initial longer fade lingered
  too strongly over the equation and was shortened after visual inspection.
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
1280×900 and 390×844 viewports: passage positions at 75%, 50%, 35%, 22%, and
back to 50%; peak/fading opacity; stable stage boundary; no horizontal overflow;
exact rewind; URL reload; Steps navigation; print and no-JavaScript readability.
Full app, tooling, tests, Svelte and domains typecheck passed. Captures were
inspected on both viewport sizes. No cross-browser promotion is claimed.

Open `/reader/solve-fractional-linear/?kpLesson=lesson.solve-x.fractional-linear&kpVersion=1&kpProgress=500`.
Scroll down and back: the equation should remain above the divider while prose
crosses it at full emphasis and then retreats. Judge whether the fade hands
attention to the mathematics soon enough, and whether the spacing feels useful
rather than empty. Human visual acceptance remains pending.
