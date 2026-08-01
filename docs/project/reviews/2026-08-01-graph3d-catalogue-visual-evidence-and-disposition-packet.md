# Graph3D Catalogue Visual Evidence and Disposition Packet

Date: 2026-08-01
Status: review-ready; disposition remains `Unreviewed`

## Review Boundary

This packet closes objective Graph3D host verification and pauses visual work
on `animation.graph.surface-mode.mesh-to-donut`. It does not assign Keep,
Retire, Rewrite, or promotion status. Regenerate the evidence with:

```sh
npm run visual:animation-catalogue
```

The stable command emits
`kp.animation-catalogue-graph3d-exemplar.v1` with four named checkpoints under
the disposable catalogue visual-output directory.

## Observable Checkpoints

| Checkpoint | Verified | Human question |
| --- | --- | --- |
| `wide-webgl-40` | Persistent three-column catalogue; canonical saddle surface, three axes, one WebGL paint owner, compact controls visible without document scroll. | Is the mesh-to-donut intermediate legible enough to keep as a teaching artifact? |
| `narrow-webgl-70` | One-column focus stage, rail/Info overlays closed by default, controls and lower-left Review visible, no horizontal overflow. | The graph occupies a small fraction of the available height; should the narrow camera/scale be larger? |
| `semantic-svg-fallback-100` | A failed capability import retains a meaningful donut endpoint, all three axes, exact player progress, no iframe, and no competing canvas accessibility node. | The SVG fallback has much heavier black axes and a large clipped shadow; should fallback presentation be brought closer to WebGL? |
| `context-loss-fallback-70` | Context loss releases the lease and restores the nearest semantic SVG endpoint inside the same stage. | Is nearest-endpoint static fallback sufficient at intermediate progress, or should a later renderer project sampled morph geometry to SVG? |

## Objective Repairs Made During Capture

The first capture exposed two deterministic defects. The catalogue asset had
discarded the canonical scene's three axis objects, so those objects and their
semantic selectors now remain in the asset and render target. The general 3D
SVG renderer uses visible overflow for editor diagnostics; the catalogue
fallback now clips that paint to its own stage. Its accessible status is also
visually hidden while remaining the shell's description.

## Catalogue Disposition Questions

These are prompts for the consolidated human checkpoint, not inferred labels:

1. Is mesh-to-donut itself a useful cross-domain demonstration, or mainly a
   renderer diagnostic?
2. If it stays, should the title explain the invariant being taught rather than
   naming two surface modes?
3. Should axes receive mathematical labels in native KaTeX, and should the
   fallback adopt the WebGL role palette before review approval?
4. Is the narrow view intentionally restrained, or visually under-scaled?
5. Does this row belong in the learner-facing catalogue later, or only in an
   internal rendering/continuity section?

## Preserved Truth

- 35 concrete catalogue identities, 33 meaningful native paints, two explicit
  programming gaps, and zero iframe hosts;
- one semantic asset, one shared runtime clock, and one current paint owner;
- lazy Three.js loading, pooled WebGL 2 acquisition, context-loss release, and
  semantic SVG fallback;
- `Unreviewed` human disposition and unchanged rank-5 vector promotion
  frontier; and
- no universal renderer, Graph3D family rollout, public-site work, or catalogue
  deletion.

## Sources

- `scripts/capture-animation-catalogue.ts`
- `tests/animation-catalogue-graph3d-evidence.test.ts`
- `tests/animation-catalogue-3d.browser.spec.ts`
- `docs/project/reviews/2026-08-01-native-graph3d-catalogue-host-integration.md`
