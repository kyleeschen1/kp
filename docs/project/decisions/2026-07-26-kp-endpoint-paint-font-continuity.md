# Make native paint continuity the renderer-boundary contract

Date: 2026-07-26
Status: accepted; radical exemplar awaiting human visual confirmation

## Decision

The canonical radical succession must preserve the live native KaTeX paint at
both ownership boundaries. Layout-box agreement is insufficient. The endpoint
contract includes:

- final composited glyph position and bounds;
- inline baseline and inner paint offset;
- font family, size, style, and weight;
- glyph silhouette;
- structural rule geometry;
- forward, direct-seek, and rewind behavior at DPR 1 and DPR 2.

The live native source and target KaTeX remain the canonical references.
Semantic models, choreography, accessibility DOM, and authoring contracts are
outside this presentation repair.

## Root cause

Two generic boundary errors combined in the radical reader:

1. Glyph handoff eligibility used wrapper and line-box geometry. The cloned
   `x` contained an approximately eight-pixel inner paint offset, so the old
   bounded-translation law rejected the exact lineage-backed paint frame before
   that paint frame could normalize the clone.
2. Structural succession transferred the source fraction to a raster canvas as
   soon as progress left zero. The isolated capture could substitute a fallback
   font, and even a correct font face rasterizes differently from same-document
   KaTeX. This made `1/2` visibly change font at the endpoint.

The earlier decision to retain a bounded cross-renderer residual
(`2026-07-24-kp-radical-cross-renderer-handoff-residual.md`) is superseded for
the canonical reader source endpoint. It remains useful historical evidence of
why atlas-only and box-only diagnostics were inadequate.

## Canonical repair

- Lineage-backed glyphs may select target-style reverse-flip when their source
  and target paint fingerprints, font revision, and clip path agree.
- Glyph normalization measures the visible text paint inset, not only the
  wrapper or Range line box.
- Same-document KaTeX material clones retain structural source ownership until
  the typed morph profile actually begins.
- When the solid-mask canvas takes over, its text-bearing source capture is
  painted through the document canvas with the computed font and measured
  inline baseline. It must fail closed if that font is unavailable; it cannot
  silently use the isolated foreign-object fallback.
- Canvas ownership at a source or target boundary is atomic only after a
  nonempty endpoint frame is observable. Until then, native material clones
  retain structural paint; unrelated glyph tracks continue at their requested
  progress and are never rewound as part of the fallback.
- Source and target paint colors interpolate through the structural morph.
- Replaced solid-mask sessions explicitly release their WebGL context so
  responsive remeasurement cannot exhaust the browser context quota.

No fraction-specific offset, animation-ID branch, lifecycle category, or
operation-specific schedule is introduced.

## Regression gate

The radical reader browser gate samples the last native and first material
paint at both ends, repeats the checks after rewind, and runs at DPR 1 and DPR
2. It inspects final screenshot pixels rather than accepting internal atlas
geometry. The gate also requires:

- the source `1/2` clones to resolve to `KaTeX_Main`;
- the endpoint paint owner to be `native-material-clones`;
- the structural canvas to use `document-font-canvas`;
- the first canvas-owned `1/2` frame to retain the normalized native KaTeX
  silhouette within the same bound at DPR 1 and DPR 2;
- one structural canvas and no legacy radical WebGL canvas;
- bounded normalized silhouette difference;
- exact endpoint `x` and structural paint geometry, with at most one CSS pixel
  of antialiased fringe at the intentional DOM-to-morph renderer boundary.

This makes the covered canonical renderer path unable to pass its promotion
suite after reintroducing the observed font substitution or endpoint jump. It
does not claim that every future browser, font, or new renderer is
mathematically incapable of a new paint bug; new renderer boundaries must adopt
the same gate.

## Preservation and rollback

Preserved:

- semantic transformation and selector lineage;
- motif and timing profile;
- native accessible source and target DOM;
- responsive, reduced-motion, static-JS, export, and reader integration seams.

Smallest rollback unit:

- glyph paint-frame eligibility and normalization;
- structural source ownership timing;
- document-font structural capture and source-color interpolation;
- the endpoint paint regression gate.

Library expansion remains queued behind human confirmation of this exemplar.
