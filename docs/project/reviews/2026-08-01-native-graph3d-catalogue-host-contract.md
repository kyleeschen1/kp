# Native Graph3D Catalogue Host Contract

Date: 2026-08-01
Status: executable contract complete; catalogue mounting remains the next slice

## Result

The existing `Graph3D` semantic model, renderer-neutral scene model, Three.js
capability module, and semantic SVG fallback are sufficient for the catalogue.
No second animation runtime, graph engine, or universal 2D/3D renderer is
needed.

The bounded catalogue contract currently admits exactly
`animation.graph.surface-mode.mesh-to-donut`. It fails closed if the asset no
longer contains one `graph-3d` object, a referenced `surface-3d` object, or the
declared mesh-to-donut target metadata. This exact support boundary prevents a
generic graph shell from claiming meaningful paint for future 3D assets it
cannot interpret.

## Host Laws

- Three.js is owned by the existing lazy `graph-webgl-three.ts` capability and
  is requested only after the selected surface becomes visible.
- Each mounted surface borrows one lease from the existing two-context WebGL
  pool. Selection replacement, player disposal, and context loss release that
  lease; capacity waiters retain the semantic SVG paint.
- Hydration returns a typed `ready`, `capacity`, `unavailable`, `invalid`, or
  `fallback` outcome instead of reducing lifecycle truth to a boolean.
- The semantic SVG fallback owns paint until WebGL reaches `ready`. The canvas
  never competes with the fallback in the accessibility tree.
- One labelled image and a changing accessible status describe pending, ready,
  waiting, and fallback states.
- The projected host frame derives transition progress directly from the
  canonical runtime clock. Forward `p` and rewind `1 - p` produce the same
  mesh-to-donut state and description.

## Preservation Boundary

The semantic `Graph3D` and `Surface3D` values, transformation identity,
renderer-neutral scene model, WebGL/SVG renderers, shared playback clock, and
existing editor 3D path remain authoritative. This slice changes resource and
host contracts only; it does not register a catalogue adapter or count the row
as meaningfully hosted.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/editor-graph-3d-host-contract.test.ts tests/graph-webgl.test.ts tests/webgl-context-lease-pool.test.ts`
- `node --disable-warning=ExperimentalWarning --test tests/animation-catalogue-health.test.ts`
- `npm run typecheck`
- `npm run check:architecture`
- `npm run check:promotion-memory`

## Next Slice

Register one persistent-catalogue graph adapter around this contract, reuse the
selected asset's existing playback session, and prove that unrelated catalogue
selections do not request the Three.js chunk or consume a WebGL lease.

## Sources

- `src/editor/graph-3d-surface-contract.ts`
- `src/rendering/graph-webgl.ts`
- `src/rendering/graph-webgl-three.ts`
- `src/rendering/webgl-context-lease-pool.ts`
- `tests/editor-graph-3d-host-contract.test.ts`
- `tests/graph-webgl.test.ts`
- `tests/webgl-context-lease-pool.test.ts`
