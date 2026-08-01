# Solve-x Catalogue Preservation Proof

Date: 2026-08-01  
Status: verified exemplar boundary

## Claim

The catalogue changes the solve-x host projection, not the animation. The
selected object remains `animation.linear-solve.solve-x` from the lazy algebra
pack with primary descriptor
`editor-animation.animation.linear-solve.solve-x`.

## Preserved ownership

- `loadKpAnimationAsset` owns asset and pack loading.
- `createKpEditorAnimationPlayerState` owns player state and delegates every
  sampled frame to `sampleKpAnimationRuntimeFrame`.
- The runtime clock remains the only normalized playhead authority in both
  forward and rewind directions.
- `dispatchKpEditorAnimationSurface` selects the equation slot.
- `kpEditorEquationSurfaceAdapter` owns native KaTeX equation rendering. The
  catalogue requests inline layout but does not create a renderer.
- The established player controller owns playback, seek, keyboard, reduced
  motion, and initial-frame events.
- The host continues to hydrate surface listeners before the player controller
  so the first established runtime frame is observable.

## Executable boundary

`tests/animation-catalogue-solve-x-preservation.test.ts` compares catalogue
identity against the lazy loader, compares forward and rewind player frames
against direct runtime samples at five stable playheads, exercises the dense
reverse law, proves equation-adapter hostability, and prohibits runtime,
renderer, asset-pack, or solve-x implementation imports in the catalogue shell
and selection modules.

The broader focused matrix retains existing playback-session, equation-stage,
semantic visual-frame, native-lineage, accessibility, route, production-review,
and architecture checks. A failure in those established sources blocks shell
promotion; it is not repaired by moving behavior into the catalogue.
