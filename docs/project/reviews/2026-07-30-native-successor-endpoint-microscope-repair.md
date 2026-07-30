# Native successor endpoint microscope and repair

Date: 2026-07-30

Run contract: `run-contract.kp.executable-motif-perceptual-continuity-repair-v0`

Slice: 14 — extend successor endpoint microscope

## Outcome

Native KaTeX successor paint now reaches its exact target pose before the final
ownership handoff and remains there through settlement. A development-only
endpoint microscope correlates successor and target paint by renderer-issued
atom identity and compares the last live successor frame, the native target,
and the post-settlement frame.

The repair is generic. It introduces no glyph-, notation-, operation-, or
browser-specific offsets.

## Root cause

Successor-owned text paint did not carry the target atom's measured native
paint rectangle. The material layer therefore aligned the cloned wrapper box,
but could not correct differences between wrapper geometry and the ink actually
painted inside it. WebKit made the missing contract visible as roughly 0.64 px
of paint/baseline displacement and 0.663 px of inner positioning error.

The first repair exposed a second generic hazard: measuring a clone while its
motion transform was at the initial `scale(0)` pose cached transformed paint as
if it were intrinsic paint. The material layer now temporarily neutralizes its
own motion transform while measuring cloned paint, then restores the transform.

## Contract

- Renderer-session endpoint atom IDs are the sole correlation authority.
  Glyph text and geometry are never used to guess identity.
- Non-path successor atoms carry the measured native target paint rectangle.
- The material layer applies its existing measured-ink alignment to that
  rectangle and publishes the expected target ink insets for diagnostics.
- Target paint reaches its exact pose at progress `0.99` and dwells through the
  handoff. Phase telemetry may still advance; the painted material may not move.
- The microscope samples `1 - epsilon`, `1`, and post-settlement and checks
  inventory, ownership, visible paint geometry, baseline, inner ink inset,
  style/font fingerprints, fraction rules, opacity, silhouette, and raster.
- Post-settlement native paint must be exact, with zero tolerance.

The microscope is dynamically imported only in development. Endpoint identity
and target paint geometry remain renderer-session data and do not enter the
semantic or serialized authoring model.

## Cross-browser evidence

`npm run visual:operation-evaluation-continuity`

- 45/45 checks passed.
- Chromium, Firefox, and WebKit.
- Wide and phone viewports at DPR 1 and DPR 2.
- Twelve endpoint profiles in total.

The suite first caught the real WebKit displacement described above. A
screenshot-derived silhouette metric also produced a Firefox false positive
despite matching correlated paint geometry and raster. Silhouette topology is
therefore derived from the exact per-atom visible paint rectangles, while the
independent screenshot raster comparison remains in force.

Neighbor preservation:

- `npm run visual:radical-handoff` passed.
- `npm run visual:radical-handoff:dpr2` passed.
- `npm run visual:fraction-canonical-checkpoint` built and captured 20 frames.

The radical capture script also stopped expecting the removed second pause
button and now uses the canonical play/pause toggle.

## Preservation boundary

This slice does not change semantic plans, motif selection, operation roles,
authored timing, or fraction/radical topology. Its only runtime timing change is
the bounded target-pose dwell from `0.99` through settlement.

The canonical reader contract still reports the inherited `18 / 2 → 9`
scale-only motif observability failure. That failure is outside this endpoint
repair and was not weakened or reclassified.
