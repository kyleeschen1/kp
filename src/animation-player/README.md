# Bounded animation players

Import from `public-api.ts`. The existing prepared saddle-parameter player and
the saddle-section player share retained geometry, the Graph3D projector and
the WebGL lease owner. Neither imports an experiment, editor or application.
This is an internal library boundary, not a published universal player API.

## Saddle section

```ts
const admitted = readSaddleSectionSource(json);
if (admitted.status === "repair-required") {
  showRepair(admitted.code, admitted.message);
} else {
  const prepared = prepareSaddleSection(admitted.value);
  const player = mountSaddleSection(host, { section: prepared });
  player.play("forward"); // inspect the section in its x/z plane
  player.play("rewind");  // return to this occurrence's saved camera
  // On unmount:
  player.dispose();
}
```

The source is `{ kind: "kp.saddle-section.v1", id, denominator, y }`:
z=(x²−y²)/denominator, denominator in [4,8], y in [−3,3]. The stable id identifies
the authored source. Prepared values copy and freeze it and carry private runtime
registration. Unknown fields, invalid numbers and other surfaces return typed
repair results. Preparation and playback reject forged prepared values.

Each mount owns an independent camera and inspection clock. `seek` pauses and
sets absolute inspection in [0,1]; arbitrary seek/reversal uses the same frame
projection. `setCamera(azimuth,elevation)` saves a spatial camera and returns to
inspection zero. `updateSource(prepareSaddleSection(next))` pauses and preserves
the view; the source id must remain the same. A different identity needs a new
mount. Updating one occurrence does not broadcast to others: source subscription
and revision distribution are host responsibilities and are not implemented here.

`snapshot()` exposes source, saved view, status and the resolved mathematical
frame. Serialize source and view, then admit both on reload. View state has
`inspection`, `azimuth`, `elevation`; elevation is bounded to ±75°. Preparation
never persists GPU objects, DOM, observers or scheduling handles.

The host supplies a positive-sized element, controls and optional `SaddleColors`.
Resize observation owns viewport measurements; animation frames update uniforms
and native labels. Hidden/offscreen occurrences pause. Reduced motion or missing
WebGL settles requested endpoints directly. A missing/lost context shows the same
section through a static SVG projection; it does not simulate a shaded surface.
Explicit disposal/remount retries graphics acquisition and releases the old lease.
Two active WebGL leases remain the existing limit; contexts are not shared.

Reference: `/experiments/saddle-section-reference/`. The two copies have independent
controls and URL state. `npm run test:saddle-section`, `npm run visual:saddle-section`
and `npm run measure:saddle-section` check admission/lifecycle, the actual host and
its complete production closure. Review scope and remaining judgment live in
`docs/project/reviews/2026-11-27-saddle-section-reuse.md`.
