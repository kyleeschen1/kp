# Accepted algebra native preparation

Scope: [approved investigation](../2026-10-21-algebra-preparation-investigation.md).
The accepted four-state source, compiler, native compositor, readiness policy and
choreography remain unchanged. No endpoints were omitted or deferred.

## Diagnosis and repair

`npm run visual:algebra-preparation -- --profile --label=baseline` profiles a
minified production reader with local hidden source maps. The ordinary command
without `--profile` serves the exact immutable edition. Both use three fresh
Chromium contexts at 390 × 844, DPR 1; ordinary samples include 1× and 6× CPU
multipliers. The profiler has no deployed entrypoint or reader instrumentation.

Native paint geometry repeatedly inserted, measured and removed a baseline probe
for each glyph. A compound subtree and track endpoint set therefore forced many
separate layouts. Repeated references to one endpoint atom also repeated its
measurement in the same synchronous operation.

The existing paint-geometry owner now captures untouched line boxes first, then
batches independent leaf probes and removes them in `finally`. Nested wrappers,
empty text and duplicate elements retain independent measurement. Track geometry
measures each referenced atom once per synchronous endpoint pass; authored paint
rectangles still take precedence. There is no cross-frame, font, style, layout or
session cache. Computed-style cloning remains unchanged.

The invariant is that a native observation returns the same measured paint and
leaves the source DOM untouched, including after a failed measurement. Browser
regressions compare independent and batched ink across nested fractions, scripts,
radicals, matrices, changed font sizes and transformed stages. They also pressure
duplicate leaves, failed probe cleanup, repeated track references, authored
rectangles and a fresh observation after font changes. Real canonical compositor
and algebra-reader cohorts separately exercise the complete paint lifecycle;
the geometry fixtures alone do not certify it.

## Measurements

Baseline ordinary 6× samples: layout counts **1232/1232/1232**, layout milliseconds
**381.79/380.85/401.11**, observed readiness **2028.3/2120.5/2180.9ms**.
Baseline 1× readiness: **325.0/299.9/313.3ms**.

Subtree batching alone reduced layout counts to 1096. An initial cohort overlapped
browser verification and was discarded for timing conclusions. A quieter rerun
gave 6× readiness **1951.2/1952.8/1915.6ms**. The final track-endpoint batching
cohort gave counts **800/800/800**, layout milliseconds **307.49/290.87/322.88**,
and readiness **2022.4/1904.5/1937.8ms**. Its 1× readiness was
**438.0/296.8/292.0ms**, including a slow first sample.

Final ordinary rerun after heavy verification stopped:
`npm run visual:algebra-preparation -- --label=final`:

| Metric | Baseline median | Final median |
| --- | ---: | ---: |
| 1× observed readiness | 313.3ms | 275.2ms |
| 6× observed readiness | 2120.5ms | 1858.1ms |
| 6× layout time | 381.79ms | 280.68ms |
| 6× layout count | 1232 | 800 |

Final 1× readiness samples: **449.0/274.6/275.2ms**; final 6× samples:
**1858.1/1737.7/1941.8ms**. Final 6× layout times:
**280.68/273.19/303.19ms**. Median observed readiness is about 12% lower in both
cohorts, with a slower first 1× sample. This is a modest local startup improvement,
not a 35% faster-reader claim or a statistical performance guarantee.

Instrumented native `prepare` inclusive samples fell from
**1676.15/1545.09/1494.29ms** to **1352.76/1191.10/1245.05ms**: median down about
**19%**. Layout count fell about **35%**. Inclusive profile rows overlap and
cannot be added. Ordinary timings include automation overhead, local HTTP,
uncompressed resources and browser warmup effects. These few diagnostic samples
do not establish field latency or phone performance.

Remaining work is substantial: computed-style cloning is still the largest
named self-time contributor (roughly 196–212ms in the 6× instrumented cohort),
followed by text ink measurement and remaining clone alignment. This repair
does not make native startup free or establish many-card amortization. A future
investigation should measure clone construction before adopting broader caches
or changing activation policy.

## Verification

The complete production reader changes from **1,409,843 raw / 370,031 gzip** JS
bytes to **1,410,745 raw / 370,261 gzip**: +902 raw / +230 gzip, with the same
384 modules and 35 chunks. The complete editor is 1,521,149 raw / 402,329 gzip.
Whole-and-parts interactive closure is 2,675,377 raw / 1,266,478 gzip bytes,
109 files plus a 13,106-byte manifest. Static output is byte-identical. These
sum-of-file gzip figures are estimates, not measured HTTP transfer.
`npm run measure:algebra-editions` passes all unchanged ceilings.

The new immutable edition is
`tmp/codex/composed-algebra-editions/8f650f08072e9e3ab7ac1c24fcf011013737db30f76ba73b0227cb3d2c26227a/index.html`.
Its source revision is unchanged; the prior immutable edition remains intact.

Checks passed:

- `npm run visual:native-preparation`: 6/6 across Chromium, Firefox and WebKit.
- `npm run test:real-katex-glyph-compositor`: 82/82.
- `npm run test:canonical-equation-renderer`: 33/33.
- `npm run test:browser:native-katex-compositor-conformance`: both actual-paint
  and lifecycle checks pass on the reusable canonical page.
- `npm run visual:algebra-editions`: 25 pass, two intentional non-Chromium
  timing-only skips. The full four-state and five-state reader cohorts run in
  all three engines. Timing diagnostics run during broad checks are not used
  for performance comparisons.
- `npm run typecheck`: app, Node, tests, Svelte and domains pass.
- `npm run build:bundle`: passes; pre-existing large application chunks remain.
- `npm test`: **7,385 pass**, zero failures or skips; architecture and inference
  gates pass before the complete deterministic suite.

No budget ceilings changed. No learner testing, visual redesign or cross-card
cache was introduced. The implementation checkpoint is `e9b171015`; final
measurement and control-record closeout follow in the same feature branch.

Outcome: **COMPLETE**, all three packages in
`run-contract.kp.algebra-preparation-v1` complete. Theseus validates 1,225 nodes;
no active run remains. Next-session entry is `theseus plan run`; retrieve this
investigation with `theseus work context task.kp.algebra-preparation --mode working`.
The handoff still reports two unrelated historical source-reference gaps and a
thin queue; this run did not alter them or create new autonomous scope.
