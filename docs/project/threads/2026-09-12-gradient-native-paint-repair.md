# Native paint submission repair

Canonical surface-contour stage now remembers its last successfully painted
runtime frame. Its mount-owned scene authority, sampled camera progress and all
resolved visual roles determine native redraw. Level/prose/overlay changes still
update their own outputs without rebuilding an identical Three scene. Failed
hydration does not become a successful paint receipt. No shared renderer cache,
new clock, alternative geometry or visual simplification was introduced.

The existing shader browser check now counts actual WebGL draws: continuous
comparison samples change overlay paint without submitting the unchanged native
surface; camera changes and reverse restoration both submit new native paint.
All 14 gradient review checks, seven surface model/stage checks and full types
passed. Source Apply, original surface caller, enlarged type, exact return and
reduced motion remain covered.

Matched `visual:architecture-cost -- --gradient-only --profile` runs (mapped
production build, three contexts per rate) show 6x first-transition script
740/754/669 ms versus 1293/1341/1294 ms; comparison 668/687/677 ms versus
1470/1488/1519 ms. Median reductions: approximately 43% and 55%. Each observation
spans two seconds, including settled time, rather than reporting per-frame CPU.
Active p50 is now about 16.7 ms and p95 17.5–17.6 ms in all six instrumented
6x phases. Ordinary timing cohorts are recorded separately in the adjacent JSON.

DOM projection is now the larger remaining application owner. Native rebuilding
still occurs when the surface genuinely changes: this repair does not claim
general retained-mode Three geometry or physical-device certification. Next
bounded work is invalidation/lifecycle, followed by ordinary-build acceptance.
