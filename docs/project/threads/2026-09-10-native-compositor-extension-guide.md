# Native KaTeX extension integration

Status: implemented participation seam; final promotion/release status belongs
to `run-contract.kp.compositor-extension-occupancy-v2`, not this guide.

## Required path

1. Resolve semantic identities and operation-owned presentation through existing
   verified authoring/operation APIs. Hosts do not author geometry or select an
   unrelated motif. Unsupported work remains a repair gap.
2. Observe source and target native endpoints in one measured stage. Preserve
   native element identity, font/style revision and viewport coordinates. Reuse
   only compatible measured plans; invalidate and reobserve at the owning host.
3. Issue `createKpNativeKatexSceneContribution` with the complete stable material
   participant IDs. Its sampler returns measured frames, or passes raw frames
   through an issued material realization inside that same sample. Registration
   geometry is unscaled ink; `expectedPaintRect` is final transformed/clipped
   paint. A layout rectangle is not substitute ink evidence.
4. Assemble contributions with the actual remaining, routed measured tracks via
   `createKpNativeKatexSceneAssembly`. Use the assembly's frozen tracks and exact
   instance at ready-plan and renderer construction. Occupancy comes from the
   actual sampled frames; no independent occupancy callback or copied audit.
5. Preserve motif-specific ownership/handoff laws and native endpoints. Publish
   contribution inspection only for an assembly containing that exact issued
   contribution. Readiness includes contribution-owned motion even when all
   ordinary tracks are static.

Both construction boundaries mark `supplementalMaterialOwners` as `never` and
reject old runtime input before invoking it. Canonical compilation assembles
every nonempty successor plan set and the factoring contribution. The certified
ink-knot wrapper detects its already-integrated realization and cannot apply a
second optical transform after inspection. Do not restore a compatibility
callback or mutate extension paint after its inspected realization.

## Responsibility map

| Owner | Responsibility |
| --- | --- |
| `native-katex-scene-contribution.ts` | Issued sampler/realization, exact participant set, required measured frames, measured-context identity |
| `native-katex-scene-assembly.ts` | Final routed scene, immutable track snapshot, joint diagnostic audit, exact assembly authentication |
| `native-katex-factoring-choreography.ts` | Accepted compound grouping, arcs, fusion and contribution binding |
| `native-katex-successor-synthesis.ts` | Default evaluation/identity programs and their actual successor material |
| `native-katex-contributor-fusion-sampling.ts` | Shared pure optical poses for the retained ink-knot treatment |
| `native-katex-operation-evaluation-contributor-fusion.ts` | Certified optical realization and existing DOM adapter |
| `native-katex-scene-compositor.ts` | Canonical assembly, rendering, readiness and native/material lifecycle |

## Evidence and limits

| Mechanism | Executed representative and evidence |
| --- | --- |
| Whole-compound factoring | Primary and opposite-orientation product through the real canonical reader; measured native/material seams, unique owners, preserved arcs/fusion, exact reverse |
| Certified ink-knot evaluation | Same two chains, distinct contributor/result ownership topology; endpoint ink residual below 0.1 px, contraction, exclusive handoff, nonblank clipped-kernel raster |
| Default evaluation and identity transfer | Exact-fraction fission/fusion, common-denominator timeline and place-value mount through canonical compilation; opacity, readiness and lifecycle pressure, not equivalent raster certification of every paint class |

Stable commands:

```
npm run test:compositor-extensions
node --disable-warning=ExperimentalWarning --test tests/native-katex-successor-continuity.test.ts
npm run test:canonical-equation-renderer
npm run visual:composed-algebra
npm run visual:exact-fraction-quantity -- --grep 'identity fission|identity fusion'
npm run visual:common-denominator-pressure -- --grep 'pressure caller stays complete|font and viewport'
npm run visual:place-value-addition -- --grep 'mounts lazily'
```

Run the scope-specific Chromium canary during changes; use the supported-browser
cohort at promotion. New paint mechanisms need an actual bounded representative,
not a larger inventory manifest. Keep complete source/runtime/inference consumer
accounting and the existing gates; budget repairs follow the recorded policy.

The [assurance boundary](2026-09-10-compositor-extension-assurance.md) explicitly
separates finite contact samples from runtime frame invariants. This does not
certify every glyph spelling, SVG-path successor, clipping topology, browser
race or arbitrary callback's determinism. Standalone material-layer mounts are
not canonical-compositor extensions and are not claimed as inspected assemblies.
Ordinary native typography/structural paint retains its existing authority.
Full evidence and observed corrections are in the
[mechanism record](2026-09-10-compositor-extension-mechanism-baseline.md) and
[owner inventory](2026-09-10-compositor-extension-owner-inventory.md).
