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
