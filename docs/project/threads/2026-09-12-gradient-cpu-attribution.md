# Gradient CPU attribution

The production cohort uses the accepted gradient host, checked authoring/model,
surface-contour stage and Graph3D runtime. No product motion changed here.
The stable architecture audit now supports `--profile`, using local source maps
and Chrome's sampling profiler separately from ordinary frame measurements.
Node's built-in source-map reader adds no runtime or package dependency.

Reproduce: `npm run build:gradient-contour -- --sourcemap`, then
`npm run visual:architecture-cost -- --gradient-only --profile`.
Restore the ordinary build before byte acceptance. See the adjacent JSON for
18 phase profiles, six ordinary timing cohorts and environment details.

Findings across three fresh contexts per rate:
- Idle: effectively no application script, layout or style work; about 16.7 ms
  median frame intervals at both rates. This is not an idle animation-loop bug.
- At 6x, first-transition script totals are 1293–1341 ms in the two-second
  observation; comparison totals are 1470–1519 ms. Active median intervals range
  from about 17 to 34 ms, with p95 about 34–51 ms in these instrumented runs.
- Comparison's stage projection accounts for about 1191–1258 ms inclusive;
  WebGL frame submission about 898–982 ms, of which scene construction alone
  accounts for 302–335 ms. DOM stage projection contributes 272–285 ms.
- Source confirms that every submitted frame rebuilds the Three scene and
  camera, samples graph surfaces, then disposes the previous scene. The earlier
  shader-retention repair prevents shader eviction but not this object churn.
- DOM projection also repeats geometry/selector work; layout contributes
  55–74 ms at 6x. It is measurable but not the dominant script owner.

Next repair should first avoid rendering when the stage's actual paint inputs
have not changed, and retain invalidation for camera, level, presence and
attention. This is narrower than introducing a universal scene cache. If active
paint still dominates, use the same profile to justify a bounded renderer repair.
No timing, geometry, pedagogical or semantic simplification is authorized.

Inclusive samples overlap and must not be added. The harness contributes RAF
sampling/native work; named application stacks and the stationary control
separate those from product activity. These are desktop CPU sensitivity probes,
not physical phone/GPU certification. One output capture was truncated; the
complete repeated run exited successfully and supplies the recorded evidence.
Profiler aggregation unit and full TypeScript checks passed.
