# KP Place-Value Production Closure Attribution

Status: measured; no runtime boundary changed

## Question

Which emitted modules and resources account for the place-value catalogue
experience's incremental production closure, and where can the next slices
separate startup from heavy rendering without hiding downloaded work?

## Reproduction

After `npm run build:bundle`:

```sh
node --disable-warning=ExperimentalWarning scripts/measure-kp-bundle-experiences.ts --scenario bundle-experience.catalogue.place-value --details
```

The targeted command includes transitive comparison bases, so this one request
measures the empty catalogue, solve-x comparison, and place-value experience.
The audited production manifest was
`606d5ccde214af757eac337894cd2b928a917bfbaf254c6ecf3511f0ff89b255`.

## Measured phases

| Phase | Script | Style | Font | Total gzip bytes |
| --- | ---: | ---: | ---: | ---: |
| Empty catalogue entry | 117,219 | 17,464 | 145,359 | 280,042 |
| Place-value experience | 332,695 | 17,464 | 145,359 | 495,518 |
| Place value minus solve-x | 74,948 | 0 | 0 | 74,948 |
| Load place-value domain pack | 7,530 | 0 | 0 | 7,530 |
| Load selected surface from empty catalogue | 207,946 | 0 | 0 | 207,946 |

The surface activation total is not additive with the 74,948-byte comparison
delta. The former starts from the empty catalogue; the latter removes the
equation infrastructure already present in solve-x. The comparison delta is
the relevant place-value budget boundary.

## Exact comparison delta

| Emitted owner | Gzip bytes |
| --- | ---: |
| `native-katex-scene-compositor` | 27,669 |
| `src/editor/place-value-addition-surface-capability.ts` | 27,544 |
| `place-value-addition-adapter` | 7,394 |
| `operation-presentation-roles` | 2,676 |
| `successor-synthesis-presentation-plan` | 2,507 |
| `identity-fission-executable-program` | 2,435 |
| `symbol-motion-contract` | 1,697 |
| `executable-successor-motif-program-adapter` | 1,223 |
| `playback-clock` | 700 |
| `frame-scheduler` | 604 |
| `equation-font-readiness` | 363 |
| `src/animation/catalog-packs/place-value.ts` | 136 |

The emitted closure falls into four useful ownership groups:

| Ownership group | Gzip bytes | Share |
| --- | ---: | ---: |
| Native KaTeX compositor | 27,669 | 36.9% |
| Place-value surface capability | 27,544 | 36.8% |
| Domain pack and animation adapter | 7,530 | 10.0% |
| Supporting motion/runtime modules | 12,205 | 16.3% |

The compositor and surface capability together account for 55,213 bytes, or
73.7% of the comparison delta. The domain pack is already small; splitting its
136-byte catalogue declaration cannot create meaningful headroom.

## Boundary finding

The production closure currently collapses three different moments into one
surface activation:

1. selected artifact identity and semantic metadata;
2. mountable place-value scaffold and accessible initial state; and
3. native KaTeX measurement, motion planning, and animated paint.

The next slices should make those moments explicit. They must not merely omit
a dynamic child from the accounting model. The scenario should declare every
runtime request required by the observable checkpoint being measured.

- Slice 12 should separate data-only selection and semantic startup from DOM
  and compositor implementation imports.
- Slice 13 should give the heavy renderer one literal, attributable dynamic
  owner and request it only at the first checkpoint that needs animated native
  KaTeX paint.
- Slice 14 should measure both the initial selected checkpoint and the fully
  activated motion checkpoint, then prove existing direct seek, rewind,
  accessibility, endpoint, and visual behavior.

This preserves honest accounting: startup headroom may improve, while the
later motion cost remains visible as its own activation rather than vanishing
from the report.
