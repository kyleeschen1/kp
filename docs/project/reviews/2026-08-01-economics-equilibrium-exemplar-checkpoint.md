# Economics equilibrium exemplar checkpoint

Status: `HUMAN_CHECKPOINT`

This is the canonical economics exemplar for deciding whether the catalogue's
cross-domain presentation seam is visually convincing enough to pressure with
a structurally different physics caller.

The first visual treatment was returned for revision. The current checkpoint
implements the accepted dimensional-continuity language through one local SVG
profile; it does not generalize the treatment to other graphs.

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
5. Decide whether the warm orthographic plane, sparse quiet-blue grid, dark
   arrowed axes, teal stable supply, rust changing demand, and faded historical
   state feel like a 2D pose of the existing 3D technical language.
6. Confirm that the direct KaTeX labels (`P`, `Q`, ticks, `D_0`/`D_t`/`D_1`,
   `S`, and `E_0`/`E_t`/`E_1`) stay legible and collision-free at start,
   midpoint, settlement, and narrow width.

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
- The graph carries `kp.graph.dimensional-continuity.economics.v1`, contains no
  raw SVG mathematical text, and keeps every mathematical label in KaTeX.
- The performance route does not request Three.js; CLS and the deterministic
  interaction proxy pass their current targets. Initial transfer, constrained
  LCP, and constrained frame p95 remain explicit release debt rather than
  hidden or weakened budgets.

## Preservation and rollback boundary

Preserve the exact economics model and sampled-frame contracts, the existing
SVG graph adapter, one isolated lazy economics pack, the compact catalogue
shell, URL/history restoration, and semantic Review capture. Human approval of
this choreography does not yet authorize a shared cross-domain renderer, a
catalogue-wide motif rollout, or physics implementation.

The smallest rollback unit is the revised economics presenter and local style
profile plus the stable visual/performance harness changes. The economics
model, runtime, registration, deterministic behavior proof, catalogue shell,
and review history remain independently committed behind it.

## Verification already completed

- `npm run visual:animation-catalogue`
- `npm run test:browser:economics-equilibrium`
- `npm run perf:animation` — no regression; Three.js absent; named target debt
- `npm test` — 3,230 tests passed
- `npm run typecheck`
- `npm run build`
- `npm run check:architecture`
- `npm run check:dev-review-production`
- `theseus workspace validate`

Do not begin the physics second caller until the human verdict is explicit.
