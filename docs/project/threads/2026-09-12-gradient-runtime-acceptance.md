# Gradient runtime acceptance and remaining 3D cost

The approved bounded optimization achieves material repeated improvement without
changing accepted motion or semantics. This is not a uniform 60-fps claim.

Run the ordinary `npm run build:gradient-contour`, then
`npm run visual:architecture-cost -- --gradient-only --runtime --acceptance`.
The new runtime option reuses the profiling probe with the profiler disabled and
does not load source maps. It adds the genuine `magnitude` → `contour` camera
transition, so acceptance cannot report only the cheap stationary-surface case.
All six requested-byte cohorts and 24 idle/first/comparison/camera probes passed
without page errors. No compiler or other browser check ran concurrently.

| 6x CPU, three fresh contexts | First transition | Comparison | Camera transition |
| --- | --- | --- | --- |
| Script ms over two-second observation | 382 / 392 / 273 | 269 / 328 / 278 | 1177 / 1177 / 1177 |
| Median frame interval, range | about 16.7 ms | about 16.7 ms | 33.7–49 ms |
| p95 frame interval, range | about 17.6 ms | 17.5–17.6 ms | 67.1–84.2 ms |

The original matching first-step audit used 1280–1310 ms of script with p95
51–67 ms. The ordinary initial first-step cohort now has p95 about 17.5 ms and
no intervals over 50 ms in all three runs. Separate phase probes support that
improvement; do not conflate their post-seek windows with startup measurements.
Idle remains inexpensive. At 1x all four phases have p95 about 17.4–17.6 ms.

Retained deterministic regression checks count actual WebGL submissions and
contour DOM mutations, require invalidation for changing camera/level/attention,
and verify reverse/disposed behavior. These fail on redundant work directly;
we did not introduce a hardware-sensitive universal timing gate or raise a
performance ceiling to make this result pass. Existing loading ceilings pass.

Preservation: all 15 gradient review cases have executed successfully across the
preceding slice and new lifecycle case; nine representative cases passed across
Chromium, Firefox and WebKit. These cover the canonical lesson/controls, original
surface-contour caller and cache/disposal behavior. Production Apply/WebGL/exact
return, full types and both audit-helper unit checks pass.

## Explicit residual and next decision

The native 3D camera/flattening transition remains too costly on the 6x probe.
It still rebuilds scene geometry for genuinely changed native frames. The audit
did not previously measure that beat, so no before/after camera speedup is
claimed. It is a remaining performance limitation, not a newly observed visual
regression or evidence that the stationary repair failed.

A future bounded renderer repair should pressure retained geometry/material
updates with both the original surface-contour and gradient callers, retaining
source/target-native endpoints, shader lifetime and camera/overlay alignment.
Do not build a universal cache or simplify the visual to hide the cost. This
is an explicit low-power release limitation; do not certify phones, sustained
mobile GPU performance or real Safari history gestures from this desktop cohort.
The current readiness loop continues to semantic and ownership repairs; the
measured camera limitation remains visible in closeout and the mechanics handoff.
