# Vector dot-projection view

Date: 2026-08-02
Run: `run-contract.kp.six-loop-product-convergence-v0`
Slice: `s18`
Status: implemented; human aesthetic review remains deferred to `s20`

## Outcome

The existing `animation.dot-projection.basic` graph host now renders one
synchronized symbolic and geometric projection. It adopts
`kp.graph.dimensional-continuity.v1` through the linear-algebra presentation
profile, so its warm plane, orthographic axes, quiet grid, stable teal,
changing rust, focal ink, and native inline KaTeX match the approved graph
language without introducing another graph engine.

The view shows the exact non-axis-aligned story from the frozen contract:

- `a=(4,2)` and `b=(1,1)`;
- indexed component products `4·1=4` and `2·1=2`;
- dot product `6`, scale `6/2=3`, and projection `(3,3)`;
- residual `(1,-1)` and a final right-angle witness.

Every SVG coordinate and displayed semantic value is projected from the
deterministic runtime frame or the frozen exact-LaTeX contract. The presenter
does not compile or recompute the dot product, projection scale, projection,
or orthogonality. Screen-space normalization is limited to sizing the visual
right-angle marker.

## Presentation and accessibility

- All mathematical labels, ticks, component chips, and current relations use
  native inline KaTeX. The vector branch emits no SVG `text` elements.
- The current relation occupies one fixed strip and component products occupy
  two fixed-width cells, avoiding width changes while the clock advances.
- Stable geometry IDs bind the two component pairs to source, target, and
  projection guides.
- The projection point radius is `3.25`, smaller than the prior `5` marker.
- The SVG remains one accessible image whose synchronized description states
  the exact vectors, dot product, approximate angle, projection, and residual.
- The focused browser gate proves semantic-label containment and non-overlap,
  exact forward/rewind half-drop agreement, and reduced-motion settlement.

## Preservation and rollback

The animation ID, family/sample/pack identities, graph host, shared player,
clock, catalogue shell, semantic model, and compact default controls are
unchanged. The independently reversible unit is the linear-algebra presenter,
its graph-viewport dispatch/profile selection, its scoped styles and tests.

`s19` may harden persistent catalogue integration and compact Details behavior.
It may not add another host, expose more default controls, load an eager graph
capability, change the exact story, or promote the exemplar before the `s20`
human checkpoint.
