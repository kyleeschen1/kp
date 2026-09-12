# Stage invalidation and lifecycle

The shared surface-contour stage now skips repeated DOM geometry and fit-audit
scheduling for an equal projection. Equality covers every projection and entity
state field through exhaustive mapped-type checks: new fields require an explicit
decision. A mount-owned snapshot prevents a retained mutable input alias from
invalidating the comparison itself. Native paint remains under its own narrower
frame comparison from the preceding repair.

True layout inputs stay live: the existing fit-audit observer also watches the
plot and axis-label dimensions; font readiness and later font loading reproject
responsive axis labels and measure fit. No second clock, observer registry or
offscreen policy was added. Existing host visibility and independent-reading
logic already pauses time, so idle profiling did not justify another scheduler.
The native header remains projected before the gradient host's overlay label,
preserving exact reverse restoration rather than caching host-owned prose.

Disposed stage sessions ignore subsequent projections and release their existing
renderer and fit observer. Font listeners are removed; queued callbacks check
disposal. Browser execution verifies ten equal samples cause no contour path
mutation, mutation of the retained input still repaints, and dispose twice plus
later projection/font events leave DOM unchanged. Unit checks vary every scalar
and entity presence/attention input in both directions.

Verification: 14 existing gradient review checks, the new lifecycle browser
check, ten surface/fit unit checks, ordinary production build/browser and full
types passed. The subsequently added browser test gets a scoped test-type check.
Gradient requested-byte acceptance passed in all six cohorts. Those timing
samples overlapped a compiler check and are not final performance evidence;
runtime acceptance will use isolated ordinary-build first/later/idle probes.

Limit: changing native geometry still rebuilds the underlying Three scene. This
bounded owner repair does not certify generic mutable scene graphs or introduce
a universal renderer cache. Real-device history gestures remain unmeasured.
