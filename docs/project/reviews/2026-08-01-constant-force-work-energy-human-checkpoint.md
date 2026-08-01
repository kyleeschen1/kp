# Constant-Force Work–Energy Human Checkpoint

Date: 2026-08-01
Contract slice: `s27`
Status: ready for human visual review

## Live Route

Open:

`http://127.0.0.1:8000/?artifact=animation.physics.constant-force-work-energy`

The development server remains the review authority. The stable capture command
is `npm run visual:animation-catalogue`.

## Canonical Reference

The exact domain contract is
`docs/project/reviews/2026-08-01-constant-force-work-energy-model-contract.md`.
The approved economics dimensional-continuity exemplar supplies the visual
comparison, not semantic or renderer authority. Physics remains one domain-local
native SVG presenter over the existing graph viewport and runtime clock.

## Review Moments

1. Start at playhead `0`: 3 N is established, displacement and work are zero,
   and kinetic energy begins at 4 J.
2. Accumulation at playhead `0.46`: the object reaches 2 m, graph area is 6 J,
   and kinetic energy is 10 J. Moving readouts use approximation notation and
   two fixed decimal places.
3. Settle at playhead `1`: the completed 12 J area equals the kinetic-energy
   change and the object settles at 16 J.
4. Open Parameters and set force to 5 N: the same asset recomputes exact work
   as 20 J and final kinetic energy as 24 J.
5. At a 720 px viewport: the graph/diagram composition, transport, and lower-left
   Review launcher remain visible without document scrolling or collision.

## Observable Acceptance Criteria

- One centered native composition is visible; there is no iframe, nested search,
  dashboard grid, second runtime, or competing paint owner.
- The force-position graph, growing area, moving block, force arrow, displacement,
  energy bar, equation band, narrative, and accessible description agree at every
  reviewed playhead.
- All mathematical labels use inline KaTeX; the SVG contains no raw `<text>`.
- The appearance follows the approved orthographic dimensional-continuity graph
  language while remaining recognizably physics-specific.
- Dynamic displacement, work, and energy readouts keep a stable two-decimal box;
  exact rational values remain in semantic and accessibility state.
- Play, pause, direct seek, rewind, in-shell navigation, Back/Forward, Parameters,
  and Review capture remain functional.

## Preservation Boundary

Human review may request changes to choreography, scale, centering, hierarchy,
color, label placement, explanation density, or the one bounded force control.
It does not reopen the exact model, SI unit law, asset identity, semantic objects,
runtime clock, graph adapter, catalogue shell, review history, accessibility
authority, economics exemplar, or authoring contracts without separate evidence.

## Promotion and Rollback

Approval means the physics exemplar is a credible second caller for the approved
graph language. It permits slice `s28` to audit which API and motif seams are
actually shared by the economics and physics callers; it does not itself create
a universal renderer, scene graph, parameter schema, or motif registry.

The smallest visual rollback unit is the slice `s25` presenter commit. The
smallest catalogue-facing rollback unit is the slice `s26` registration commit.
Either can be reverted without changing the exact physics contract/model or the
approved economics exemplar.

## Automated Evidence

- `npm run visual:animation-catalogue`: start, accumulation, settle, custom 5 N,
  narrow geometry, all catalogue rows, inline KaTeX, fixed readouts, and no iframe.
- `npm run test:browser:physics-work-energy`: Chromium, Firefox, and WebKit exact
  seek/rewind, parameter replacement, accessibility, Review capture, and history.
- Focused catalogue/model/presenter tests, `npm run typecheck`, architecture,
  production build, bundle boundary, dev-review production closure, and the full
  repository suite are the required pre-checkpoint release evidence.
