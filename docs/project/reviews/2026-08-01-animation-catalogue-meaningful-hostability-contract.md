# Animation Catalogue Meaningful Hostability Contract

Date: 2026-08-01
Status: accepted implementation baseline for six-loop slice `s01`

## Finding

The prior catalogue probe correctly proved that all 35 concrete assets load,
route, and resolve a recognized surface shape. It overstated paint coverage by
one row. `animation.graph.surface-mode.mesh-to-donut` resolved the generic SVG
graph adapter, which mounted a plot plane, grid definitions, and axes, but
`renderRuntimeContent` had no case for that 3D semantic asset. The host observer
treated the nonempty SVG chrome as paint.

The corrected executable inventory is:

| Evidence layer | Result |
| --- | --- |
| Concrete identities | 35 unique assets across 12 lazy packs |
| Loadability | 35 loaded; zero load failures |
| Meaningful native hostability | 32 ready |
| Capability gaps | 3: one Graph3D surface and two programming slots |
| Iframe use | 0 |
| Human dispositions | 35 `Unreviewed` |

## Contract

Catalogue truth has separate layers:

1. **Identity** proves exactly one catalogue row maps to one concrete asset.
2. **Loadability** proves the named lazy pack returns that exact asset.
3. **Surface dispatch** proves its render-target vocabulary maps to catalogue
   slots.
4. **Native hostability** requires every slot to resolve an adapter that
   explicitly supports the selected asset.
5. **Meaningful paint** requires asset-specific semantic content, not merely a
   canvas, SVG plot plane, wrapper, placeholder, controls, or fallback chrome.
6. **Health** derives from those facts and release evidence; it does not imply
   promotion or a human disposition.

The SVG graph adapter therefore declares the exact six animation IDs for which
it owns runtime content. Its declaration and renderer switch are one contract.
The 3D surface transition is a missing-adapter capability gap until a native
Graph3D adapter renders its semantic objects and lifecycle. It must not fall
back to the generic 2D plot merely because both use the `graph` slot.

This is deliberately not a new surface taxonomy or universal renderer. The
existing graph slot remains useful layout vocabulary; adapter support is the
fidelity boundary.

## Preservation Boundary

- all 35 concrete asset identities, lazy packs, routes, and semantic bundles;
- the existing six meaningful SVG graph callers and their exact runtime output;
- the programming gaps and all `Unreviewed` human dispositions;
- one persistent catalogue shell, no iframe fallback, and no eager WebGL;
- the Graph3D semantic fixture, capability manifests, and retained editor
  WebGL evidence.

## Next Slice

Define the smallest native 3D host contract for the existing surface-mode
asset: lazy WebGL ownership, one bounded lease, context loss and static
fallback, accessible state, exact seek/rewind, and a meaningful-paint marker
derived from semantic content. Do not restore the row to `ready` until that
adapter exists and is observed.

## Evidence

- `src/editor/graph-svg-viewport.ts`
- `src/editor/animation-catalogue-surface-hostability.ts`
- `src/editor/animation-catalogue-host-observation.ts`
- `tests/animation-catalogue-surface-hostability.test.ts`
- `tests/animation-catalogue-load-probe.test.ts`
- `docs/project/reviews/2026-08-01-animation-catalogue-seam-atlas.md`

