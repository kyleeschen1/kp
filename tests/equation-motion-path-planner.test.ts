import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpCollisionSafeTransitTracks,
  kpEquationMotionPathVariantIds,
  planKpEquationMotionPath,
  planKpEquationMotionPathBetweenPoints,
  sampleKpEquationMotionPath,
  sampleKpEquationMotionTrackOpacityProgress,
  sampleKpEquationMotionTrackRect,
  sampleKpEquationMotionTrackPaintRect
} from "../src/rendering/equation-motion-path-planner.ts";
import type {
  KpEquationCollisionTrack
} from "../src/rendering/equation-motion-path-planner.ts";
import type { KpEquationLayoutPlan } from "../src/rendering/equation-layout-plan.ts";

test("path planner evaluates direct, above, below, and around variants", () => {
  const plan = planKpEquationMotionPathBetweenPoints({
    id: "path.all-variants",
    start: { x: 0, y: 0 },
    end: { x: 100, y: 0 }
  });

  assert.deepEqual(
    [...plan.candidates].sort((left, right) =>
      kpEquationMotionPathVariantIds.indexOf(left.variant) -
      kpEquationMotionPathVariantIds.indexOf(right.variant)
    ).map((candidate) => candidate.variant),
    [...kpEquationMotionPathVariantIds]
  );
  assert.equal(plan.selected.variant, "direct");
  assert.equal(plan.selected.travelDistance, 100);
});

test("collision scoring rejects a shorter blocked route", () => {
  const plan = planKpEquationMotionPathBetweenPoints({
    id: "path.around-obstacle",
    start: { x: 0, y: 0 },
    end: { x: 100, y: 0 },
    obstacles: [{ left: 44, top: -6, width: 12, height: 12 }],
    variants: ["direct", "arc-above", "arc-below"],
    clearance: 36,
    moverRadius: 1,
    sampleCount: 40
  });

  assert.ok(plan.candidates.find((candidate) => candidate.variant === "direct")!.collisionCount > 0);
  assert.equal(plan.selected.collisionCount, 0);
  assert.equal(plan.selected.variant, "arc-above");
});

test("reading order and explicit semantic lanes break safe-path ties deterministically", () => {
  const forward = planKpEquationMotionPathBetweenPoints({
    id: "path.forward",
    start: { x: 0, y: 0 },
    end: { x: 100, y: 0 },
    variants: ["arc-below", "arc-above"]
  });
  const backward = planKpEquationMotionPathBetweenPoints({
    id: "path.backward",
    start: { x: 100, y: 0 },
    end: { x: 0, y: 0 },
    variants: ["arc-above", "arc-below"]
  });
  const forced = planKpEquationMotionPathBetweenPoints({
    id: "path.forced",
    start: { x: 0, y: 0 },
    end: { x: 100, y: 0 },
    variants: ["arc-above", "arc-below"],
    preferredVariant: "arc-below"
  });

  assert.equal(forward.selected.variant, "arc-above");
  assert.equal(backward.selected.variant, "arc-below");
  assert.equal(forced.selected.variant, "arc-below");
  assert.deepEqual(
    forced,
    planKpEquationMotionPathBetweenPoints({
      id: "path.forced",
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
      variants: ["arc-above", "arc-below"],
      preferredVariant: "arc-below"
    })
  );
});

test("quadratic sampling clamps progress and preserves exact endpoints", () => {
  const plan = planKpEquationMotionPathBetweenPoints({
    id: "path.sample",
    start: { x: 10, y: 20 },
    end: { x: 90, y: 20 },
    variants: ["arc-above"]
  });

  assert.deepEqual(sampleKpEquationMotionPath(plan.selected, -1), { x: 10, y: 20 });
  assert.deepEqual(sampleKpEquationMotionPath(plan.selected, 1), { x: 90, y: 20 });
  assert.ok(sampleKpEquationMotionPath(plan.selected, 0.5).y < 20);
});

test("curved tracks follow measured paint while reconstructing wrapper offsets", () => {
  const path = planKpEquationMotionPathBetweenPoints({
    id: "path.paint-authority",
    start: { x: 8, y: 13 },
    end: { x: 115, y: 27 },
    variants: ["arc-above"],
    clearance: 18
  }).selected;
  const track = {
    id: "track.paint-authority",
    componentId: "component.paint-authority",
    lifecycle: "merge",
    startRect: { left: 0, top: 0, width: 24, height: 30 },
    endRect: { left: 100, top: 10, width: 32, height: 40 },
    startPaintRect: { left: 3, top: 8, width: 10, height: 10 },
    endPaintRect: { left: 109, top: 22, width: 12, height: 10 },
    motionPath: path
  };

  for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
    const paint = sampleKpEquationMotionTrackPaintRect(track, progress);
    const expected = sampleKpEquationMotionPath(path, progress);
    assert.ok(Math.abs(paint.left + paint.width / 2 - expected.x) < 0.000_001);
    assert.ok(Math.abs(paint.top + paint.height / 2 - expected.y) < 0.000_001);
  }
  assert.deepEqual(
    sampleKpEquationMotionTrackPaintRect(track, 0),
    track.startPaintRect
  );
  assert.deepEqual(
    sampleKpEquationMotionTrackPaintRect(track, 1),
    track.endPaintRect
  );
});

test("layout-plan adapter excludes the moving relation's own destination", () => {
  const layout = layoutPlan();
  const path = planKpEquationMotionPath({
    id: "path.persist-x",
    layoutPlan: layout,
    relationRecordId: "persist.x",
    sampleCount: 40
  });

  assert.equal(path.relationRecordId, "persist.x");
  assert.equal(path.selected.variant, "arc-above");
  assert.equal(path.selected.collisionCount, 0);
});

test("protected transit delays structural paint instead of routing semantics", () => {
  const compilation = compileKpCollisionSafeTransitTracks({
    tracks: [
      track({
        id: "track.context",
        componentId: "component.context",
        lifecycle: "persist",
        startLeft: 45,
        endLeft: 45
      }),
      track({
        id: "track.entering-operator",
        componentId: "component.entering-operator",
        lifecycle: "introduce",
        startLeft: 0,
        endLeft: 100,
        startOpacity: 0,
        endOpacity: 1
      })
    ],
    sampleFrames
  });

  assert.deepEqual(
    compilation.certificate.opacityScheduledTrackIds,
    ["track.entering-operator"]
  );
  assert.deepEqual(compilation.certificate.routedComponentIds, []);
  assert.deepEqual(compilation.certificate.routedTrackIds, []);
  assert.deepEqual(compilation.certificate.rescheduledComponentIds, []);
  assert.equal(compilation.tracks[1]?.opacityStepAt, 0.94);
});

test("protected transit routes one opaque component and preserves endpoints", () => {
  const compilation = compileKpCollisionSafeTransitTracks({
    tracks: [
      track({
        id: "track.forward",
        componentId: "component.forward",
        lifecycle: "persist",
        startLeft: 0,
        endLeft: 100
      }),
      track({
        id: "track.backward",
        componentId: "component.backward",
        lifecycle: "persist",
        startLeft: 100,
        endLeft: 0
      })
    ],
    sampleFrames
  });
  const routed = compilation.tracks.find(({ motionPath }) =>
    motionPath !== undefined
  );

  assert.ok(routed);
  assert.deepEqual(
    sampleKpEquationMotionTrackRect(routed, 0),
    routed.startRect
  );
  assert.deepEqual(
    sampleKpEquationMotionTrackRect(routed, 1),
    routed.endRect
  );
  assert.equal(compilation.certificate.routedComponentIds.length, 1);
  assert.equal(compilation.certificate.routedTrackIds.length, 1);
  assert.equal(routed.motionPathSampling, "planned-curve");
});

test("protected transit routes around a semantic axis continuant", () => {
  const compilation = compileKpCollisionSafeTransitTracks({
    tracks: [
      track({
        id: "track.axis-operator",
        componentId: "component.axis-operator",
        lifecycle: "persist",
        startLeft: 0,
        endLeft: 100,
        motionAxisConstraint: "horizontal"
      }),
      track({
        id: "track.crossing-material",
        componentId: "component.crossing-material",
        lifecycle: "persist",
        startLeft: 100,
        endLeft: 0
      })
    ],
    sampleFrames
  });

  const axis = compilation.tracks.find(({ id }) =>
    id === "track.axis-operator"
  )!;
  const crossing = compilation.tracks.find(({ id }) =>
    id === "track.crossing-material"
  )!;
  assert.equal(axis.motionPath, undefined);
  assert.equal(axis.motionAxisConstraint, "horizontal");
  assert.notEqual(crossing.motionPath, undefined);
});

test("horizontal-axis metadata rejects non-horizontal measured paint", () => {
  const invalid: KpEquationCollisionTrack = {
    id: "track.invalid-horizontal-paint",
    componentId: "component.invalid-horizontal-paint",
    lifecycle: "persist",
    startRect: { left: 0, top: 0, width: 10, height: 10 },
    endRect: { left: 40, top: 8, width: 10, height: 10 },
    startPaintRect: { left: 1, top: 1, width: 8, height: 8 },
    endPaintRect: { left: 41, top: 9, width: 8, height: 8 },
    motionAxisConstraint: "horizontal"
  };

  assert.throws(
    () => sampleKpEquationMotionTrackRect(invalid, 0.5),
    /horizontal-axis.*measured paint/u
  );

  const stalePath: KpEquationCollisionTrack = {
    ...invalid,
    id: "track.stale-horizontal-path",
    endRect: { left: 40, top: 0, width: 10, height: 10 },
    endPaintRect: { left: 41, top: 1, width: 8, height: 8 },
    motionPath: planKpEquationMotionPathBetweenPoints({
      id: "path.stale-horizontal-path",
      start: { x: 25, y: 5 },
      end: { x: 45, y: 5 },
      variants: ["direct"]
    }).selected
  };
  assert.throws(
    () => sampleKpEquationMotionTrackRect(stalePath, 0.5),
    /motion path.*measured paint endpoints/u
  );
});

test("protected transit admits same-component fission contact", () => {
  const compilation = compileKpCollisionSafeTransitTracks({
    tracks: [
      track({
        id: "track.fission-left",
        componentId: "component.shared-material",
        lifecycle: "split",
        startLeft: 0,
        endLeft: 0
      }),
      track({
        id: "track.fission-right",
        componentId: "component.shared-material",
        lifecycle: "split",
        startLeft: 0,
        endLeft: 0
      })
    ],
    sampleFrames
  });

  assert.deepEqual(compilation.certificate.routedComponentIds, []);
  assert.deepEqual(compilation.certificate.routedTrackIds, []);
  assert.deepEqual(compilation.certificate.rescheduledComponentIds, []);
  assert.deepEqual(compilation.certificate.opacityScheduledTrackIds, []);
});

test("protected transit rechecks structural visibility after choosing a route", () => {
  const structural = track({
    id: "track.late-structural",
    componentId: "component.late-structural",
    lifecycle: "introduce",
    startLeft: 180,
    endLeft: 180,
    startOpacity: 0,
    endOpacity: 1
  });
  const compilation = compileKpCollisionSafeTransitTracks({
    tracks: [
      track({
        id: "track.crossing-left",
        componentId: "component.crossing-left",
        lifecycle: "persist",
        startLeft: 0,
        endLeft: 100
      }),
      track({
        id: "track.crossing-right",
        componentId: "component.crossing-right",
        lifecycle: "persist",
        startLeft: 100,
        endLeft: 0
      }),
      structural
    ],
    sampleFrames: (tracks, progress) => {
      const sampled = sampleFrames(tracks, progress);
      const routed = tracks.find(({ lifecycle, motionPath }) =>
        lifecycle === "persist" && motionPath !== undefined
      );
      if (
        routed === undefined ||
        Math.abs(progress - 0.79) > 0.000_001
      ) return sampled;
      const routedFrame = sampled.find(({ trackId }) =>
        trackId === routed.id
      )!;
      return sampled.map((frame) =>
        frame.trackId === structural.id
          ? { ...frame, rect: routedFrame.rect }
          : frame
      );
    }
  });

  assert.deepEqual(
    compilation.certificate.opacityScheduledTrackIds,
    ["track.late-structural"]
  );
  assert.equal(compilation.certificate.routedTrackIds.length, 1);
  assert.equal(
    compilation.tracks.find(({ id }) => id === structural.id)?.opacityStepAt,
    0.94
  );
});

test("protected transit can vacate persistent context before opaque fission", () => {
  const fission = track({
    id: "track.fission",
    componentId: "component.fission",
    lifecycle: "split",
    startLeft: 0,
    endLeft: 0
  });
  const context = {
    ...track({
      id: "track.context-motion",
      componentId: "component.context-motion",
      lifecycle: "persist",
      startLeft: 50,
      endLeft: 120
    }),
    startRect: { left: 50, top: 0, width: 10, height: 10 },
    endRect: { left: 120, top: 0, width: 10, height: 10 }
  };
  const compilation = compileKpCollisionSafeTransitTracks({
    tracks: [fission, context],
    sampleFrames: (tracks, progress) => tracks.map((candidate) => ({
      trackId: candidate.id,
      componentId: candidate.componentId,
      rect: candidate.id === fission.id
        ? {
            left: 100 * Math.sin(Math.PI * progress),
            top: 0,
            width: 10,
            height: 10
          }
        : sampleKpEquationMotionTrackRect(candidate, progress),
      opacity: 1
    }))
  });

  assert.deepEqual(
    compilation.certificate.rescheduledComponentIds,
    ["component.context-motion"]
  );
  assert.deepEqual(compilation.certificate.routedTrackIds, []);
});

test("protected transit sizes thin-rule clearance from the blocking glyph", () => {
  const thinRule = {
    ...track({
      id: "track.thin-rule",
      componentId: "component.thin-rule",
      lifecycle: "split",
      startLeft: 0,
      endLeft: 100
    }),
    startRect: { left: 0, top: 24, width: 12, height: 1 },
    endRect: { left: 100, top: 24, width: 12, height: 1 }
  };
  const tallGlyph = {
    ...track({
      id: "track.tall-glyph",
      componentId: "component.tall-glyph",
      lifecycle: "persist",
      startLeft: 50,
      endLeft: 50
    }),
    startRect: { left: 50, top: 18, width: 10, height: 14 },
    endRect: { left: 50, top: 18, width: 10, height: 14 }
  };
  const compilation = compileKpCollisionSafeTransitTracks({
    tracks: [thinRule, tallGlyph],
    stageOccupancy: {
      measurementIdentity: {
        revision: 1,
        coordinateSpaceId: "test.stage"
      },
      rows: [
        { id: "row.active", rect: { left: 0, top: 10, width: 130, height: 30 } },
        { id: "row.other", rect: { left: 0, top: 65, width: 130, height: 30 } }
      ],
      protectedCorridor: { left: 0, top: 40, width: 130, height: 25 },
      geometryAuthority: "certified-stage-layout"
    },
    sampleFrames
  });

  assert.deepEqual(
    compilation.certificate.routedTrackIds,
    ["track.thin-rule"]
  );
  assert.deepEqual(compilation.certificate.rescheduledComponentIds, []);
});

test("stage occupancy tolerates only subpixel corridor boundary noise", () => {
  const compile = (corridorTop: number) => compileKpCollisionSafeTransitTracks({
    tracks: [],
    stageOccupancy: {
      measurementIdentity: {
        revision: 1,
        coordinateSpaceId: "test.stage"
      },
      rows: [
        { id: "row.active", rect: { left: 0, top: 10, width: 100, height: 30 } }
      ],
      protectedCorridor: {
        left: 0,
        top: corridorTop,
        width: 100,
        height: 10
      },
      geometryAuthority: "certified-stage-layout"
    },
    sampleFrames: () => []
  });

  assert.equal(compile(39.75).certificate.geometryAuthority,
    "certified-stage-layout");
  assert.throws(
    () => compile(39),
    /protected corridor intersects certified row occupancy/
  );
});

function sampleFrames(
  tracks: readonly KpEquationCollisionTrack[],
  progress: number
) {
  return tracks.map((candidate) => {
    const opacityProgress =
      sampleKpEquationMotionTrackOpacityProgress(candidate, progress);
    const startOpacity = candidate.startOpacity ?? 1;
    const endOpacity = candidate.endOpacity ?? 1;
    return {
      trackId: candidate.id,
      componentId: candidate.componentId,
      rect: sampleKpEquationMotionTrackRect(candidate, progress),
      opacity:
        startOpacity + (endOpacity - startOpacity) * opacityProgress
    };
  });
}

function track(input: {
  readonly id: string;
  readonly componentId: string;
  readonly lifecycle: string;
  readonly startLeft: number;
  readonly endLeft: number;
  readonly startOpacity?: number;
  readonly endOpacity?: number;
  readonly motionAxisConstraint?: "horizontal";
}): KpEquationCollisionTrack {
  return {
    id: input.id,
    componentId: input.componentId,
    lifecycle: input.lifecycle,
    startRect: { left: input.startLeft, top: 0, width: 10, height: 10 },
    endRect: { left: input.endLeft, top: 0, width: 10, height: 10 },
    ...(input.motionAxisConstraint === undefined
      ? {}
      : { motionAxisConstraint: input.motionAxisConstraint }),
    ...(input.startOpacity === undefined
      ? {}
      : { startOpacity: input.startOpacity }),
    ...(input.endOpacity === undefined
      ? {}
      : { endOpacity: input.endOpacity })
  };
}

function layoutPlan(): KpEquationLayoutPlan {
  return {
    kind: "equation-layout-plan",
    id: "layout.path-test",
    transitionId: "transition.path-test",
    revision: 0,
    source: { side: "source", tokens: [] },
    target: { side: "target", tokens: [] },
    reservations: [
      {
        id: "destination.persist-x",
        kind: "destination",
        relationRecordId: "persist.x",
        motionId: "target.x",
        bounds: { left: 94, top: -6, width: 12, height: 12 }
      },
      {
        id: "destination.other",
        kind: "destination",
        relationRecordId: "persist.other",
        motionId: "target.other",
        bounds: { left: 44, top: -6, width: 12, height: 12 }
      }
    ],
    waypoints: [
      {
        id: "persist.x.source",
        relationRecordId: "persist.x",
        role: "source",
        ordinal: 0,
        point: { x: 0, y: 0 }
      },
      {
        id: "persist.x.target",
        relationRecordId: "persist.x",
        role: "target",
        ordinal: 2,
        point: { x: 100, y: 0 }
      }
    ],
    geometryPolicy: "measure-once-per-step"
  };
}
