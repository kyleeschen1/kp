# Upper stage with rising passages

Presentation superseded by the user-directed
[document-backed caption candidate](2026-10-28-fractional-caption-reader.md).
The record below preserves the preceding experiment and its evidence.

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
paragraph measurement. The local scroll geometry now holds the previous
mathematical checkpoint while the next instruction approaches and clears the
divider. Registered mathematical programs remain unchanged; their scroll pacing
is delayed until the instruction has been read.

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
- Read, clear, then animate: each operation holds its source through arrival
  and the 5%-height prose fade. The next 32% of available-height scrolling
  advances its existing animation, then holds the result until the next
  instruction clears. Reverse scrolling samples the same piecewise geometry.
  These distances are provisional exemplar choices, pending visual review.
- Navigation moves into a **Steps** disclosure in the masthead. The Motion
  control remains available. Steps opens an instruction at its source state,
  before its operation. Focused prose remains legible for keyboard use.
- Shared links retain a local `kpReading` fraction as well as mathematical
  progress, distinguishing positions within a hold. Restoration validates the
  pair against measured geometry; stale or invalid reading coordinates cannot
  override semantic progress. This adds no second clock.
- The layout activates only with this route's enhancement. No-JavaScript
  retains the static document; print removes the stage and restores full prose
  opacity. Existing reduced/static equation-motion preferences remain available.

Rollback unit: `fractional-rising-passages.ts`, its local scroll helper, CSS import, and the small
entry hooks. Other lessons retain their current layout. The proposed historical
derivation trail is still not implemented by this visual experiment.

## Verification and review

```sh
node --disable-warning=ExperimentalWarning --test tests/fractional-rising-scroll.test.ts
npm run visual:fractional-linear-equation -- --rising --base-url=http://127.0.0.1:8000
npm run visual:fractional-linear-equation -- --smoke --base-url=http://127.0.0.1:8000
npm run typecheck
```

The 41-frame animation preservation smoke passed, including direct, forward
and reverse traversal and inactive-paint checks. Chromium layout checks use
1280×900 and 390×844 viewports: passage positions at 75%, 50%, 47.5%, 45%,
29%, 13%, 5%, and back to 50% of usable height; source holds, animation and
result holds; peak/fading opacity; measured masthead exclusion;
uniform text sizes; white divider; bottom ink clearance; no horizontal overflow;
exact rewind; URL reload preserving a held reading position; Steps navigation;
print and no-JavaScript readability. Pure geometry tests exercise every
operation, inverse sampling, and invalid spacing/measurement rejection.
Full app, tooling, tests, Svelte and domains typecheck passed. Captures were
inspected on both viewport sizes. No cross-browser promotion is claimed.

Open `/reader/solve-fractional-linear/` and choose **Steps → Multiply both sides
by two**. The passage should be fully visible at the divider while the equation
still shows `x/2 = 4`. Scroll onward: the text clears before multiplication
begins. The result holds while the next instruction approaches. Reverse and
reload should preserve the sequence and reading position. Judge whether this
gives enough reading time without feeling stalled. Human visual acceptance
remains pending.
