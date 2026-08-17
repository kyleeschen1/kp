# KP Place-Value Checkpoint Closure And Preservation

Status: verified

## Result

Place-value selection and native motion are now two explicit production
checkpoints rather than one collapsed bundle event.

| Checkpoint | Comparison | Incremental gzip bytes | Ceiling | Headroom |
| --- | --- | ---: | ---: | ---: |
| Initial selection | selected solve-x | 51,396 | 75,000 | 31.5% |
| First native-motion request | initial place-value selection | 53,522 | 60,000 | 10.8% |

The initial checkpoint retains the existing 75,000-byte ceiling. The native
KaTeX feature-pack implementation is a forbidden owner there. The later
motion checkpoint names that implementation as an expected owner and gives
its newly downloaded closure a separate, tighter ceiling. Deferring work is
therefore visible in the production evidence rather than omitted from it.

The measured fully activated experience is 1,372,512 gzip bytes including the
catalogue entry, its shared fonts and styles, place-value semantics and
surface, and the requested native renderer. The initial selected experience
is 1,318,990 gzip bytes. KaTeX CSS and fonts are intentionally paid at initial
selection because the static written checkpoint already renders native math;
their ownership no longer depends on the legacy application bootstrap.

Reproduce after `npm run build:bundle`:

```sh
node --disable-warning=ExperimentalWarning scripts/measure-kp-bundle-experiences.ts --scenario bundle-experience.catalogue.place-value-motion --check
```

The audited production manifest is
`8e8368f01257c5d80228b4ed3d6c17bef8a998713bb45d7436e72547e2723fea`.

## Behavior preservation

The split preserves:

- the same seven causal beats, semantic IDs, lineage, and accessible states;
- native settled KaTeX endpoints and material-paint ownership;
- absolute direct seek, rewind, replay, and rapid-seek equivalence;
- the one mounted runtime controller and deterministic disposal contract;
- wide and phone projection behavior; and
- the existing Animation Library route, review capture, and selection
  lifecycle.

Static selection and the base-ten-only phone path do not request the heavy
renderer. The first written checkpoint in the motion interval coalesces one
literal feature-pack request, waits for owned KaTeX fonts and connected
geometry, then applies only the latest buffered frame. No scroll callback
constructs the compositor.

## Boundary conclusion

The place-value budget now has structural rather than accidental headroom.
The domain pack remains small, the initial surface owns the accessible native
math it actually paints, and the heavyweight compositor has one attributable
late owner. This closes the place-value repair without changing choreography,
raising the accepted ceiling, or duplicating a renderer.
