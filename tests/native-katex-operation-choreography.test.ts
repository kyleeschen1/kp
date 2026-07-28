import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFractionCompositionEquationAnimationAsset
} from "../src/animation/fraction-composition-equation-adapter.ts";
import {
  compileKpEquationOperationChoreography
} from "../src/reader/renderers/equation-operation-choreography-compiler.ts";
import {
  compileKpCollisionSafeTransitTracks,
  sampleKpEquationMotionTrackRect,
  sampleKpEquationMotionTrackOpacityProgress,
  type KpEquationCollisionTrack
} from "../src/rendering/equation-motion-path-planner.ts";
import {
  applyKpNativeKatexOperationChoreography
} from "../src/rendering/native-katex-operation-choreography.ts";
import {
  sampleKpNativeKatexSceneTrackFrames
} from "../src/rendering/native-katex-scene-track-sampling.ts";
import type {
  KpNativeKatexPaintMeasuredSceneTrack
} from "../src/rendering/native-katex-scene-compositor.ts";
import type {
  KpNativeKatexPaintAtomObservation,
  KpNativeKatexRenderedSceneObservation
} from "../src/rendering/native-katex-rendered-scene.ts";

const animation = createKpFractionCompositionEquationAnimationAsset();

test("balanced branch certificate synchronizes every introduced paint atom", () => {
  const transformation = animation.transformations[7]!;
  const choreography = compileKpEquationOperationChoreography({
    animation,
    transformation,
    motifKind: "append-after-shift",
    direction: "forward"
  });
  assert.equal(choreography?.kind, "synchronized-balanced-introduction");
  if (choreography?.kind !== "synchronized-balanced-introduction") return;

  const target = scene(
    "target",
    choreography.semanticEntityIds.map((entityId, index) =>
      atom("target", entityId, index * 24)
    )
  );
  const source = scene("source", []);
  const tracks = target.atoms.map((targetAtom, index) =>
    introducedTrack(targetAtom, index)
  );
  const synchronized = applyKpNativeKatexOperationChoreography({
    tracks,
    source,
    target,
    choreography
  });
  const entering = sampleKpNativeKatexSceneTrackFrames(
    synchronized,
    0.52,
    false
  );

  assert.equal(
    new Set(synchronized.map(({ timingGroupId }) => timingGroupId)).size,
    1
  );
  assert.equal(new Set(entering.map(({ opacity }) => opacity)).size, 1);
  assert.ok(entering.every(({ opacity }) => opacity > 0 && opacity < 1));
});

test("counter-orbit certificate authors opposite paths through shared contact", () => {
  const transformation = animation.transformations[11]!;
  const choreography = compileKpEquationOperationChoreography({
    animation,
    transformation,
    motifKind: "cancelation",
    direction: "forward"
  });
  assert.equal(choreography?.kind, "counter-orbit-cancellation");
  if (choreography?.kind !== "counter-orbit-cancellation") return;

  const source = scene("source", [
    atom("source", choreography.semanticEntityIds[0]!, 10, 8),
    atom("source", choreography.semanticEntityIds[1]!, 58, 34)
  ]);
  const target = scene("target", []);
  const tracks = source.atoms.map((sourceAtom, index) =>
    eliminatedTrack(sourceAtom, index)
  );
  const orbiting = applyKpNativeKatexOperationChoreography({
    tracks,
    source,
    target,
    choreography
  });
  const midpoint = sampleKpNativeKatexSceneTrackFrames(orbiting, 0.55, false);
  const settled = sampleKpNativeKatexSceneTrackFrames(orbiting, 0.9, false);

  assert.deepEqual(
    orbiting.map(({ motionPath }) => motionPath?.variant),
    ["arc-above", "arc-below"]
  );
  assert.equal(
    new Set(orbiting.map(({ intentionalContactGroupId }) =>
      intentionalContactGroupId
    )).size,
    1
  );
  assert.ok(midpoint.every(({ opacity }) => opacity === 1));
  assert.notEqual(
    Math.sign(midpoint[0]!.rect.top - tracks[0]!.startRect.top),
    Math.sign(midpoint[1]!.rect.top - tracks[1]!.startRect.top)
  );
  assert.ok(settled.every(({ opacity }) => opacity === 0));
  assert.deepEqual(
    sampleKpNativeKatexSceneTrackFrames(orbiting, 0.55, false),
    midpoint
  );
});

test("generic collision repair retimes a certified introduction cohort atomically", () => {
  const syncId = "operation-choreography.test.together";
  const tracks: readonly KpEquationCollisionTrack[] = [
    {
      id: "track.blocker",
      componentId: "component.blocker",
      lifecycle: "persist",
      startRect: { left: 0, top: 0, width: 20, height: 20 },
      endRect: { left: 0, top: 0, width: 20, height: 20 },
      startOpacity: 1,
      endOpacity: 1
    },
    {
      id: "track.lhs.three",
      componentId: "component.lhs.three",
      lifecycle: "introduce",
      startRect: { left: 0, top: 0, width: 10, height: 20 },
      endRect: { left: 40, top: 0, width: 10, height: 20 },
      startOpacity: 0,
      endOpacity: 1,
      timingGroupId: syncId
    },
    {
      id: "track.rhs.three",
      componentId: "component.rhs.three",
      lifecycle: "introduce",
      startRect: { left: 100, top: 0, width: 10, height: 20 },
      endRect: { left: 140, top: 0, width: 10, height: 20 },
      startOpacity: 0,
      endOpacity: 1,
      timingGroupId: syncId
    }
  ];
  const compilation = compileKpCollisionSafeTransitTracks({
    tracks,
    sampleFrames: (candidateTracks, progress) =>
      candidateTracks.map((track) => ({
        trackId: track.id,
        componentId: track.componentId,
        rect: sampleKpEquationMotionTrackRect(track, progress),
        opacity:
          (track.startOpacity ?? 1) +
          ((track.endOpacity ?? 1) - (track.startOpacity ?? 1)) *
            sampleKpEquationMotionTrackOpacityProgress(track, progress)
      }))
  });

  assert.deepEqual(
    compilation.certificate.opacityScheduledTrackIds,
    ["track.lhs.three", "track.rhs.three"]
  );
  assert.deepEqual(
    compilation.tracks
      .filter(({ timingGroupId }) => timingGroupId === syncId)
      .map(({ opacityStepAt }) => opacityStepAt),
    [0.94, 0.94]
  );
});

function scene(
  endpoint: "source" | "target",
  atoms: readonly KpNativeKatexPaintAtomObservation[]
): KpNativeKatexRenderedSceneObservation {
  const element = {} as HTMLElement;
  return {
    kind: "native-katex-rendered-scene-observation",
    lifecycle: "renderer-session",
    endpoint,
    stage: element,
    root: element,
    atoms,
    groups: [],
    fontRevision: 1,
    viewportKey: "test"
  };
}

function atom(
  endpoint: "source" | "target",
  semanticEntityId: string,
  left: number,
  top = 20
): KpNativeKatexPaintAtomObservation {
  return {
    kind: "native-katex-paint-atom-observation",
    lifecycle: "renderer-session",
    id: `${endpoint}.${semanticEntityId}`,
    endpoint,
    semanticEntityId,
    presentationGroupId: `group.${semanticEntityId}`,
    paintKind: "glyph",
    visualKey: semanticEntityId,
    sourceElement: {} as HTMLElement,
    rect: { left, top, width: 12, height: 18 },
    styleFingerprint: "test",
    zOrder: 0,
    fontRevision: 1
  };
}

function introducedTrack(
  target: KpNativeKatexPaintAtomObservation,
  index: number
): KpNativeKatexPaintMeasuredSceneTrack {
  return {
    id: `track.introduce.${index}`,
    componentId: `component.introduce.${index}`,
    lifecycle: "introduce",
    sourceAtomId: target.id,
    targetAtomId: target.id,
    visualAtomId: target.id,
    paintKind: target.paintKind,
    sizingMode: "rect",
    startRect: { ...target.rect, top: target.rect.top + 8 },
    endRect: target.rect,
    startPaintRect: { ...target.rect, top: target.rect.top + 8 },
    endPaintRect: target.rect,
    startOpacity: 0,
    endOpacity: 1
  };
}

function eliminatedTrack(
  source: KpNativeKatexPaintAtomObservation,
  index: number
): KpNativeKatexPaintMeasuredSceneTrack {
  return {
    id: `track.eliminate.${index}`,
    componentId: `component.eliminate.${index}`,
    lifecycle: "eliminate",
    sourceAtomId: source.id,
    targetAtomId: source.id,
    visualAtomId: source.id,
    paintKind: source.paintKind,
    sizingMode: "rect",
    startRect: source.rect,
    endRect: { ...source.rect, top: source.rect.top - 8 },
    startPaintRect: source.rect,
    endPaintRect: { ...source.rect, top: source.rect.top - 8 },
    startOpacity: 1,
    endOpacity: 0
  };
}
