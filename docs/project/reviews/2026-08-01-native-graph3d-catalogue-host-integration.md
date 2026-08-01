# Native Graph3D Catalogue Host Integration

Date: 2026-08-01
Status: implementation complete; visual evidence follows in the next slice

## Result

`animation.graph.surface-mode.mesh-to-donut` now resolves the exact bounded
Graph3D adapter in the persistent catalogue. The adapter immediately renders
the existing semantic SVG fallback, requests the existing Three.js capability
only when the selected stage is visible, and samples the retained WebGL scene
from the catalogue player's one canonical clock.

The catalogue truth is now 35 loadable assets, 33 meaningful native paints,
two programming adapter gaps, zero iframe hosts, and zero inferred human
dispositions.

## Lifecycle Evidence

- A non-3D initial selection requests neither `graph-webgl-three.ts` nor Three.
- Selecting the 3D row happens inside the persistent document and resolves
  `editor-animation-surface.graph.webgl-3d` ahead of the generic SVG graph
  adapter.
- The first visible 3D selection acquires one shared WebGL lease and exposes a
  typed ready/fallback outcome while semantic SVG remains the pre-hydration
  paint owner.
- Current Three.js requires WebGL 2. The browser gate exposed that the shared
  pool had only a WebGL 1 acquisition path; the pool now supports an explicit
  WebGL 2 request while preserving WebGL 1 as the default for existing callers.
- Direct seek updates the existing retained renderer at the canonical runtime
  progress instead of starting a second requestAnimationFrame clock.
- Replacing the selection dispatches the shared player disposal event,
  releases the context lease, and removes the Graph3D shell without reloading
  the document.

## Preservation Boundary

The semantic graph/surface values, transformation, runtime sampler, persistent
catalogue shell, generic 2D SVG graph adapter, existing Three renderer, SVG
fallback, and global WebGL lease limit remain authoritative. The adapter admits
one exact asset and does not define a universal graph surface.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/editor-graph-3d-host-contract.test.ts tests/editor-graph-3d-surface-adapter.test.ts tests/animation-catalogue-surface-hostability.test.ts tests/animation-catalogue-health.test.ts tests/animation-catalogue-seam-atlas.test.ts tests/graph-webgl.test.ts tests/webgl-context-lease-pool.test.ts`
- `npm run test:browser:animation-catalogue-3d`
- `npm run typecheck`
- `npm run build`
- `npm run check:architecture`
- `npm run check:promotion-memory`

## Next Slice

Extend the stable catalogue visual command with wide, narrow, SVG fallback,
and context-loss Graph3D captures. Inspect those images manually, then publish
the compact disposition packet without assigning Keep, Retire, or Rewrite.

## Sources

- `src/editor/graph-3d-surface-adapter.ts`
- `src/editor/graph-3d-surface-contract.ts`
- `src/rendering/graph-webgl-three.ts`
- `src/rendering/webgl-context-lease-pool.ts`
- `tests/animation-catalogue-3d.browser.spec.ts`
