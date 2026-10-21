# Native equation preparation

Scope and authority: [approved investigation](../2026-10-21-native-preparation-investigation.md).
Theseus run `run-contract.kp.native-preparation-v1` owns execution status.

## Finding and repair

The combined tax reader's first-transition window includes logarithm preparation.
Source-mapped sampling attributes substantial cost to native baseline probes,
material-clone construction and clone alignment. These are overlapping stacks,
not additive independent costs. The baseline owner inserted, measured and removed
one marker per glyph, repeatedly flushing layout during a scene observation.

`measureKpNativeKatexBaselines` batches independent text-bearing leaves within
one synchronous observation. Every probe is removed in `finally`, including
partial insertion or failed measurement. Later observations measure afresh.
The scene observer uses this only for glyph baselines; wrapper baselines keep
their original measurement. No cross-frame cache or new renderer authority.

An initial unrestricted batch failed in Chromium, Firefox and WebKit: nested
wrapper probes changed each other's line boxes by roughly 58px in the pressure
fixture. The repair now rejects that optimization whenever any candidate has
children or lacks text, falling back to individual measurements. The executable
browser fixture checks both paths against individual measurements for fractions,
matrices and logarithms, including nested scripts, scaling and font-size changes.
That limitation is part of the implementation, not a caller convention.

## Measurement

Commands:

- `npm run build:bundle -- --sourcemap`
- `npm run audit:architecture-cost -- --browser --tax-only --activation --tax-profile`
- `npm run build:bundle`
- `npm run audit:architecture-cost -- --browser --tax-only --activation --acceptance`

Instrumented first-transition window, 6x CPU throttle, three complete-workflow
samples before and after (local production files, 390×844 DPR1):

| Measure | Before | After baseline batching only |
| --- | --- | --- |
| Layout count | 478 / 444 / 526 | 324 / 306 / 333 |
| Layout time, ms | 139.91 / 103.23 / 113.40 | 105.87 / 62.23 / 69.26 |

Median layout count fell 32.2%; median layout time fell 38.9%. These are
instrumented attribution results, not ordinary latency or phone certification.
Native material cloning remains significant. This repair does not establish that
the first-interaction stall is solved. The post-profile final guard also excludes
empty leaves; observed glyph candidates already contained text.

## Verification checkpoint

- Three baseline unit tests passed: phase ordering, cleanup, fresh measurements,
  scroll anchoring and compound/empty-owner fallback.
- `npm run visual:native-preparation`: three browser engines passed the narrowed
  implementation; the unrestricted attempt failed and was repaired.
- `npm run test:real-katex-glyph-compositor`: 82 passed.
- `npm run test:canonical-equation-renderer`: 33 passed.
- Application TypeScript passed before the final conservative empty-leaf guard;
  final integration verification follows in the contract's verification slice.

An initial sandboxed audit launch failed in Chromium with SIGTRAP. The same
repo-owned command completed outside the sandbox. No browser failures or missing
assets were suppressed. Production timing and final integration results will be
recorded before closeout.

After baseline batching only, ordinary production first-transition maximum RAF gaps at 6x were
482.6 / 315.6 / 216.9 ms before and 267.4 / 367.5 / 216.6 ms after. The ranges
overlap substantially; these three-sample cohorts do not establish a reliable
latency improvement. At 1x neither cohort had a frame gap over 50ms. Initial
reader JavaScript changes from 387,681 to 387,786 gzip bytes (+105); complete
companion activation acceptance passes with no missing assets or browser errors.
Startup readiness is noisy and is not claimed as an improvement from this fix.

Integration exposed three stale logarithm test setups: interruption, readiness
waiting and runtime-failure tests waited for an offscreen deferred stage without
activating its card. They now scroll the card into view as neighboring tests
already do; assertions and production activation behavior are preserved. The
first nine-test selection had six passes and these three setup failures. Its
first Theseus failure receipt used `prepared-selected-cohort` as a shorthand
label, not a literal invocation; the actual command is the selected cohort below.

`npm run visual:focus-deck-input -- --grep 'prepared logarithm|final equation rewrites|automatic exponent|automatic division|disposing an active|arrow.*interrupt|equation edge|previous.*rewrite|native.*failure'`

The first full-suite attempt ran inside the sandbox; server tests could not
listen on loopback (`EPERM`). A focused `node --test server/app.test.ts`
reproduced that environment failure in all six HTTP tests. The full suite must
be rerun outside the sandbox; a focused success will not substitute for it.

## First-mount lifetime repair

During verification, source inspection found a second independent cost:
`applyFrame` creates and calibrates the next native session, then unconditionally
clears the material layer. On first mount there is no predecessor to retire.
The new browser regression observed eight freshly calibrated owners removed and
rebuilt before readiness. Retaining them when `activeTransit` is absent removes
that redundant work; actual operation switches keep retirement and clearing so
generic track IDs cannot retain a preceding operation's paint. Failure cleanup
and disposal still clear their material layer.

The reproduction failed before this repair and passes afterward. All ten tests
in the selected logarithm cohort pass, including next-operation paint, remount,
backward replay, interruption, readiness waiting and runtime failure. This is a
first-mount lifetime correction, not shared paint caching across operations.
Final production measurements follow both repairs together.

The sandboxed full suite completed with 7,337 passes and 14 failures: thirteen
loopback permission failures and one stale generated reachability file count.
`npm run generate:equation-reachability` updates only scanned-file count
5,031 → 5,032 for the added browser fixture; declared roots and callers do not
change. The complete suite is rerunning outside the sandbox.

## Final integration verification

- `npm test`: final clean run, 7,351 passed, zero failures (276.5 seconds).
  Architecture gates pass. Unchanged inference caps pass: core 116,543 types /
  199,075 instantiations; combined 179,856 / 303,956.
- `npm run typecheck`: final application, Node, tests, Svelte and domain checks
  passed, including the first-mount repair.
- `npm run test:browser:native-katex-compositor-conformance`: two real-paint and
  lifecycle tests passed in Chromium.
- `npm run visual:native-preparation`: final leaf/compound baseline geometry
  fixture passed in Chromium, Firefox and WebKit.
- The ten-test logarithm cohort above, with `initial logarithm preparation`
  added to its selection, passes. That initial-owner regression additionally
  passes in all three engines using `--project=firefox --project=webkit` on the
  existing Chromium command.
- `npm run test:equation-reachability`: all twelve generated-root/caller checks
  pass after regenerating the fixture count.

The changed boundaries now prevent redundant first-mount retirement and batch
leaf probe writes before reads. Runtime guards exclude compound/empty owners;
tests pressure geometry, cleanup, fresh observations, and actual compositor
ownership. This does not certify every arbitrary CSS context or eliminate the
remaining cost of computed-style cloning and paint alignment.

## Combined production result

Final source-mapped profile after both repairs, same 6x three-sample cohort:

| Measure | Before | Both repairs |
| --- | --- | --- |
| First-transition layout count | 478 / 444 / 526 | 217 / 339 / 314 |
| First-transition layout time, ms | 139.91 / 103.23 / 113.40 | 55.37 / 65.34 / 70.36 |
| `prepareSurface` sampled inclusive time, ms | 247.11 / 206.98 / 189.79 | 135.87 / 138.38 / 136.59 |
| Material-layer sampled inclusive time, ms | 138.63 / 118.80 / 105.43 | 57.39 / 58.08 / 58.18 |

Median layout count falls 34.3%, layout time 42.4%, sampled preparation 34.0%
and sampled material-layer work 51.1%. Inclusive times overlap and cannot be
summed. The profile window includes native preparation and tax animation; layout
counts vary with scheduling. These are work-attribution measurements, not user
latency claims. Remaining measured work includes computed-style copying, clone
ink/baseline alignment and scene-plan compilation; any follow-on should identify
redundant work in those owners before introducing caching or new loading policy.

The final ordinary production cohort passes complete loading/activation
acceptance. At 6x, maximum first-transition frame gaps are 168.0 / 149.9 / 151.6ms,
versus 482.6 / 315.6 / 216.9ms before. This is encouraging evidence of a visible
improvement, but three local CPU-throttled samples are not a field-performance
guarantee; approximately 150ms stalls remain. At 1x the final maximum gaps are
33.4 / 18.7 / 18.6ms, with none over 50ms. The final initial JavaScript payload is
387,790 gzip bytes (+109 over baseline); no missing assets or browser errors.
Final production closure passes all twelve routes and existing reader budgets
pass unchanged. No compiler, source or payload ceiling was raised.

Outcome: COMPLETE, three contract packages. The two repairs are independently
recoverable commits. Further native clone/alignment optimization is a
recommendation, not another active run. Reproduce the ordinary cohort with
`npm run build:bundle` followed by the acceptance audit above.
