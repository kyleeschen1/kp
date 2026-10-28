# Reader motion continuity evidence

Scope: [approved delivery](../2026-10-28-reader-motion-continuity.md).
Baseline: `24d7d1f09`; canonical fractional equation reader.

## Continuous progress

The host replaced full-precision scroll progress with integer permilles before
rendering. Attention also received the rounded value. Both now receive continuous
progress; static/checkpoint policy still snaps intentionally, and URL/control
serialization remains unchanged. The existing frame key already preserves exact
progress, so no new cache or animation clock is necessary.

`npm run visual:fractional-linear-equation -- --continuity --baseline --base-url=http://127.0.0.1:8000`
measured the old path; the same command without `--baseline` checks the repaired
path. One-pixel real-scroll samples cover moving interiors of cancellation,
evaluation and denominator cancellation, excluding their authored holds. The
baseline repeats material geometry on 17/44, 18/48 and 17/45 position changes;
the repair repeats none, with exact forward/reverse geometry at all 140 positions.
This is a motion-resolution result, not a presented-FPS claim. The harness observes
material geometry and clipping, excluding native CSS color interpolation.

Fourteen clock/control/attention/frame tests pass, including fractional attention
boundaries. The first continuity probe included intentional cancellation holds;
its range was corrected to the actual moving interval rather than changing the
motif. The first smoke run compared exact scrolling to rounded URL samples and
failed four comparisons near a handoff and a fading introduction. It now compares
scrolling to direct control sampling at the exact physical scroll-derived progress,
retaining exact identity/opacity checks. The original direct URL samples remain.

## Invalidation attribution

The proposed broad document-layout repair was not retained: changing prose height
already preserves preparation in both the fractional and division reader probes.
The source-level suspicion in the earlier review did not demonstrate waste in
those actual layouts. Whole-pool retirement remains when layout is invalidated;
no outer-size heuristic is substituted for internal mathematical geometry.

Known unrelated font-loading events did retire preparation in both readers. Font
readiness now optionally scopes those events to current family declarations in
the equation viewport. Other callers keep the original conservative behavior;
unknown/empty events, disconnected scopes and unusual family syntax invalidate.
Current declarations are checked only on font events, covering families changed
after initial preparation without an extra per-frame scan or font cache.

`npm run visual:fractional-linear-equation -- --invalidation --base-url=http://127.0.0.1:8000`
now retains preparation through prose changes and unrelated fonts, and retires
all prepared layers for a used math font. Baseline unrelated-font retirement was
one layer per reader; now zero. This is avoided-work evidence, not a claim about
how often production pages load unrelated fonts. Unknown events, viewport resize
and disposal retain the existing preparation-pressure safeguards.

## Moving-frame work

The mounted reader now applies native semantic focus only when its focus
revision changes. Native selector/link DOM is stable for this mount; newly
prepared material reads the established native paint. Adjacent preparation is
requested only when transition, layout identity, motion, font or presentation
changes. The existing idle queue retains responsibility for waiting, cancellation
and stale-geometry checks; no second scheduler or cache was added.

`npm run visual:fractional-linear-equation -- --motion-cost --profile --label=before --base-url=http://127.0.0.1:8000`
and the same command with `--label=frame-work` sampled three 1.2-second moving
intervals. Repeat-visit scripting totals in local Chromium were:

| Interval | Normal CPU, before → after | 4× slowdown, before → after |
| --- | --- | --- |
| Cancellation | 78.5 → 61.6 ms | 212.2 → 136.1 ms |
| Evaluation | 104.2 → 84.0 ms | 249.9 → 181.3 ms |
| Denominator | 84.7 → 62.4 ms | 233.4 → 155.1 ms |

These are profiled development diagnostics, not a controlled population estimate
or presented-frame benchmark. Callback p95 remained about 17.2–17.6 ms in both
runs, with no intervals over 33.4 ms. Each sweep changes about 45–48 CSS-pixel
positions, so fewer changing positions than RAF callbacks is expected here.
First-use preparation remains substantially more expensive than warm playback.

A separate experiment captured scroll position once before frame writes. It
did not reduce layout counts (about 89–95 per sweep) or improve scripting, and
was removed. Its first draft failed with an incorrectly scoped variable; that
run is invalid and excluded. The cost probe now also rejects an idle/failed
renderer rather than writing a misleading fast sample. Large changes to material
positioning or preparation are not justified by these small warmed intervals.

Preparation pressure initially sampled before the idle task had run; it now
waits for the observable preparation event under its existing forced idle
budget. The corrected test passes with and without the request guard: four
builds remain four over twelve forward/reverse cycles; resize/font changes
retire all retained layers, and disposal removes them. All 140 one-pixel
continuity samples still change position and reverse exactly.

## Integration

Full typecheck, architecture, 25 runtime-hardening tests, 11 surface-preservation
tests, 17 Chromium reader-conformance checks, the 41-sample fractional smoke,
12 font/preparation checks and 18 computed-style/color checks across three
engines pass. Production build, all twelve route closures/budgets and development
review exclusion pass without budget amendments. The earlier cross-host font-size
parity issue remains recorded in the previous delivery; this pass does not claim
that separate assertion is repaired.

The final unprofiled production operation probe uses the same motion-cost command
with `--label=production --base-url=http://127.0.0.1:8011` and no `--profile`.
The twelve moving sweeps at normal/4× CPU show no callback interval over 33.4 ms;
p95 remains around 17–18 ms. These intervals deliberately exclude entry stalls:
first-use denominator preparation still costs about 225 ms of scripting under
4× slowdown. Real device input, high-refresh displays and presented-frame pacing
remain unproven. Lower measured work and removal of rounded positions do not
justify a promise of universally smooth playback.

## Quiet prose candidate

Local paragraph line height increases from 1.6 to 1.8 without changing font size,
weight or mathematical typography. An annotation is absent until the final
24 CSS pixels of approach to its bottom-aligned reading position, fully present
through its reading/operation hold, then withdrawn over the first 24 pixels of
release. This supersedes the faint always-visible floor and earlier stage-top
crossfade. These optical distances are provisional, local to this exemplar.

The existing layout measurement supplies arrival/hold windows once; normal
scrolling uses one binary lookup and sparse paint updates. Overlapping windows
retain an exact dense fallback. Finite ordered positions and valid holds are
checked at compilation. The change adds no per-frame layout measurements,
timers or mathematical state. Hidden annotations do not intercept pointer input.
Native selection/find reveals the real selected paragraph, keyboard focus keeps
its existing reveal, and removing selection restores scroll-derived presence.
No text copies, hidden DOM or custom search implementation are introduced.

Eight focused projection/scroll tests pass, including sparse/dense parity,
invalid geometry, distant jumps and operation-only controls. The stable
`npm run visual:fractional-linear-equation -- --rising --base-url=http://127.0.0.1:8000`
passes desktop/phone centering, holds, release, reverse, native find, selection
and clearing, font reflow, Read all, reduced motion, print and no-JS reading.
Desktop and phone screenshots were inspected. App/node/test types, rebuilt
production closure/budgets, the 41-sample equation smoke and all 140 continuity
positions pass after this candidate. No budget ceiling changed.

Outcome: HUMAN_CHECKPOINT. All five delivery outcomes are implemented and
checked; the local prose treatment awaits visual judgment before promotion.
Open http://localhost:8000/reader/solve-fractional-linear/, scroll slowly into
and out of “A factor of two enters on each side,” then reverse through a
cancellation. Judge the roomier prose and whether the short arrival/release
window is sufficiently quiet. Also try Cmd+F and Read all in the actual browser;
automated native-find evidence does not certify every browser's find UI.
The performance work is preserved independently of the prose rollback unit.
Next context command: `theseus work context workflow.kp.delivery --mode brief`.
