# Economics equilibrium exemplar checkpoint

Status: `HUMAN_CHECKPOINT`

This is the canonical economics exemplar for deciding whether the catalogue's
cross-domain presentation seam is visually convincing enough to pressure with
a structurally different physics caller.

## Open the exemplar

- Default demand shift:
  <http://127.0.0.1:8000/?artifact=animation.economics.supply-demand-equilibrium-shift>
- Bounded custom target at 20:
  <http://127.0.0.1:8000/?artifact=animation.economics.supply-demand-equilibrium-shift&demandIntercept=20>

The development server must be running on port 8000. The stable capture command
is `npm run visual:animation-catalogue`; it regenerates disposable start, shift,
settle, custom-target, and narrow-screen evidence under
`tmp/codex/animation-catalogue/`.

## What to review

1. Scrub from 0% through roughly 44% to 100%. Decide whether the demand-line
   movement, old-demand reference, equilibrium point, guides, equations, and
   prose read as one event rather than several synchronized widgets.
2. Decide whether the graph has the right visual scale and centering in the
   otherwise quiet stage, with Play and the scrubber immediately available.
3. Open **Parameters**, move **New demand intercept**, and confirm that this is
   useful exploratory machinery without making the default catalogue busy.
4. At a narrow viewport, confirm that **Review** remains lower-left without
   covering Play or the scrubber, and that the graph and explanation remain
   legible.

## Observable promotion criteria

- Supply stays fixed while demand, equilibrium, guides, equations, and prose
  advance from the same exact frame.
- Direct seek and rewind tell the same visual and semantic truth.
- Start and end states are native exact states; no approximation or stale
  reference remains after settlement.
- The default surface exposes only Play and the scrubber. Inline KaTeX, compact
  headings, in-shell artifact switching, and lower-left Review remain intact.
- The centered graph and controls fit without document scrolling at the wide
  and narrow captured viewports.
- The custom parameter changes model truth while preserving playhead and
  direction, then pauses for inspection.

## Preservation and rollback boundary

Preserve the exact economics model and sampled-frame contracts, the existing
SVG graph adapter, one isolated lazy economics pack, the compact catalogue
shell, URL/history restoration, and semantic Review capture. Human approval of
this choreography does not yet authorize a shared cross-domain renderer, a
catalogue-wide motif rollout, or physics implementation.

The smallest rollback unit is the economics visual-capture/checkpoint slice:
the stable capture extension plus the narrow catalogue control-spacing repair.
The economics model, runtime, registration, and deterministic behavior proof
remain independently committed behind it.

## Verification already completed

- `npm run visual:animation-catalogue`
- `npm run test:browser:economics-equilibrium`
- `npm test` — 3,229 tests passed
- `npm run typecheck`
- `npm run build`
- `npm run check:architecture`
- `npm run check:dev-review-production`
- `theseus workspace validate`

Do not begin the physics second caller until the human verdict is explicit.
