# Continuous derivation drag repair

Approved request: “it's still catching on the edge of substep, then jumps to
the end. I want smooth sliding all the way” (2026-09-15).

The prior Restart-footprint repair remains valid but did not resolve the user's
boundary catch. Address the boundary path itself, not viewport auto-scroll.

## Bounded outcome

For the physics energy/momentum reader at
`/experiments/mechanics-relations/#energy-from-momentum`, direct manipulation
must follow every pointer sample across 3.1–3.3 without endpoint dead zones or
on-demand compositor preparation. The checked physics/scalar sources and
canonical native KaTeX sessions remain authoritative; one reader playhead owns
progress. Preserve accepted motifs, static record, reversible motion, keyboard,
local access, expansion/return and scalar behavior.

One package, `continuous.scrub`: reproduce with per-event pointer/handle
agreement; remove artificial drag plateaus; prepare the bounded checked view's
scenes before enabling its handle; synchronously select prepared scenes; retire
them on view disposal and invalidate measurements on width changes. Do not
promise that preparing an arbitrary long document eagerly is affordable: the
current checked views contain at most five transitions.

Expected evidence: focused position laws, real-browser per-event control and
scene-reuse regression, full reader browser checks and types; build/closure at
integration. Reuse `npm run visual:mechanics-relations`. One reversible commit
for reader preparation/drag mapping plus tests and evidence. Ninety-minute
ceiling including a twenty-minute verification reserve. Stop on an unresolved
renderer/semantic gap; no new renderer, motion, semantic authority, dependencies,
catalogue rollout, viewport auto-scroll or later-loop execution.

Acceptance is continuous control rather than a new aesthetic treatment; do not
require another approval of the already accepted cancellation motif. Report
remaining device/performance uncertainty honestly.

## Result and evidence

The shared reader now prepares its current checked view before enabling the
handle and switches existing native scenes synchronously. Preparation still
uses the canonical session factory; only the active session samples the shared
clock. Disposal retires the bank, and width changes replace it while preserving
the semantic position. This is engine work shared by physics and scalar readers,
not a source-content or motif change.

Three interaction defects were repaired: proportional 5.5% resting plateaus,
asynchronous scene creation on crossing, and stale row measurements after
expanded parent-return controls appeared. The per-event browser regression
observed a 44px jump before the last geometry repair. Gesture-start measurement
now uses fractional document geometry. A half-CSS-pixel endpoint tolerance
handles pointer/layout rounding; it does not expand with prose height. Native
endpoints remain exact without a perceptible proportional sticky region.

The full suite also exposed a visibility/resize race: a temporarily absent
session during rebuilding could trigger initialization at zero. Initialization
now respects preparation ownership. Early full runs failed (six endpoint/old
plateau assertions, then one local-return race); these were repaired, not waived.
A later run was interrupted after a new resize test revealed that its viewport
still left the max-width reader unchanged. The fixture now verifies an actual
width reduction before asserting scene replacement.

Final verification:

- `npm run visual:mechanics-relations`: **30/30 Chromium checks pass**. The new
  regression follows 112 pointer samples forward/backward across fine-step
  boundaries, checks immediate handle agreement, scene reuse, held release,
  and complete scene replacement with preserved position after resizing.
- `node --disable-warning=ExperimentalWarning --test tests/momentum-energy.test.ts tests/scalar-cancellation-reader.test.ts tests/energy-derivation-reuse-boundary.test.ts`:
  **33/33 pass**, including non-proportional endpoint tolerance laws.
- `npm run typecheck`, refreshed `npm run typecheck:tests`,
  `npm run check:architecture`, and `npm run build:bundle`: pass. Build retains
  existing unrelated large-chunk warnings.
- `npm run measure:mechanics-relations-closure -- physics`: initial/all-reachable
  JS/CSS gzip **36,191 / 147,363 bytes**; HTML gzip **21,883 bytes**.
- Same closure command with `scalar`: **33,245 / 145,200 bytes**; HTML gzip
  **8,263 bytes**. JS/CSS increases versus the fluent baseline are 156 and
  154 bytes respectively. These figures exclude fonts/images and are not
  low-powered-device execution or memory benchmarks.

Runtime tradeoff: up to five current-view scenes are retained instead of one;
initial preparation does more work, and crossing performs none of that scene
construction. No new dependency, renderer, clock or universal cache was added.
Arbitrary long documents need a separately measured readiness strategy. Phone,
Safari-specific behavior and viewport auto-scroll remain outside this repair's
claims. Later delivery scope remains parked; Theseus owns completion status.
