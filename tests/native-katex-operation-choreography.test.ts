import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFractionCompositionEquationAnimationAsset
} from "../src/animation/fraction-composition-equation-adapter.ts";
import {
  createKpCausalStructuralIntroductionChoreography
} from "../src/animation/equation-operation-choreography.ts";
import {
  createKpFunctionWrapReceptionPlan
} from "../src/animation/function-wrap-reception.ts";
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
  applyKpNativeKatexFunctionWrapReception,
  kpNativeKatexFunctionWrapReceptionStyle
} from "../src/rendering/native-katex-function-wrap-reception.ts";
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

test("function-wrap enclosures arrive outside and oversized before settling natively", () => {
  const open = atom("target", "target.wrap.open", 40);
  const close = atom("target", "target.wrap.close", 80);
  const target = scene("target", [open, close]);
  const tracks = applyKpNativeKatexFunctionWrapReception({
    source: scene("source", []),
    target,
    tracks: [introducedTrack(open, 0), introducedTrack(close, 1)],
    plan: createKpFunctionWrapReceptionPlan({
      id: "function-wrap-reception.test",
      direction: "forward",
      branches: [{
        id: "branch.test",
        argumentEntityIds: ["target.argument"],
        syntaxEntityIds: ["target.wrap", "target.wrap.operator"],
        enclosureEntityRoles: [
          { entityId: "target.wrap.open", side: "leading" },
          { entityId: "target.wrap.close", side: "trailing" }
        ]
      }]
    }),
    entryWindow: { start: 0.42, end: 0.7 }
  });
  const [openTrack, closeTrack] = tracks;
  assert.ok(openTrack?.startPaintRect);
  assert.ok(closeTrack?.startPaintRect);
  assert.ok(openTrack.startPaintRect.left < open.rect.left);
  assert.ok(closeTrack.startPaintRect.left > close.rect.left);
  assert.equal(
    openTrack.startPaintRect.height,
    open.rect.height * kpNativeKatexFunctionWrapReceptionStyle.initialScale
  );
  assert.equal(
    closeTrack.startPaintRect.height,
    close.rect.height * kpNativeKatexFunctionWrapReceptionStyle.initialScale
  );
  assert.equal(openTrack.timingGroupId, closeTrack.timingGroupId);
  const settled = sampleKpNativeKatexSceneTrackFrames(tracks, 1, false);
  assert.deepEqual(settled.map(({ rect }) => rect), [open.rect, close.rect]);
});

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
  assert.ok(synchronized.every(({ opacityScheduleAuthority }) =>
    opacityScheduleAuthority === "semantic-choreography"
  ));
  assert.equal(new Set(entering.map(({ opacity }) => opacity)).size, 1);
  assert.ok(entering.every(({ opacity }) => opacity > 0 && opacity < 1));
});

test("causal structural introduction grows a fraction rule instead of popping it", () => {
  const ruleAtom = {
    ...atom("target", "solved.right", 40),
    paintKind: "rule" as const,
    rect: { left: 40, top: 28, width: 48, height: 1 }
  };
  const target = scene("target", [ruleAtom]);
  const tracks = applyKpNativeKatexOperationChoreography({
    source: scene("source", []),
    target,
    tracks: [introducedTrack(ruleAtom, 0)],
    choreography: createKpCausalStructuralIntroductionChoreography({
      id: "operation-choreography.test.structural-entry",
      transformationId: "transformation.test.divide",
      direction: "forward",
      semanticEntityIds: ["solved.right"],
      entryWindow: { start: 0.62, end: 0.9 }
    })
  });
  const [track] = tracks;
  assert.ok(track);
  assert.equal(track.startRect.width, 1);
  assert.equal(track.startPaintRect?.width, 1);
  assert.equal(track.opacityScheduleAuthority, "semantic-choreography");
  const [midpoint] = sampleKpNativeKatexSceneTrackFrames(
    tracks,
    0.76,
    false
  );
  assert.ok(midpoint);
  assert.ok(midpoint.rect.width > 0 && midpoint.rect.width < ruleAtom.rect.width);
  assert.ok(midpoint.opacity > 0 && midpoint.opacity < 1);
});

test("counter-orbit certificate authors opposite paths through shared contact", () => {
  const transformation = animation.transformations.find(({ id }) =>
    id === "fraction-solve.step.cancel-additive-inverses"
  )!;
  const choreography = compileKpEquationOperationChoreography({
    animation,
    transformation,
    motifKind: "cancelation",
    direction: "forward"
  });
  assert.equal(choreography?.kind, "counter-orbit-cancellation");
  if (choreography?.kind !== "counter-orbit-cancellation") return;
  const presentation = choreography.operationPresentationPlan;
  assert.ok(presentation);

  const inverseBundles = presentation.inverseBundleIds.map((bundleId) =>
    presentation.roles.bundles.find(({ id }) => id === bundleId)!
  );
  const source = scene("source", inverseBundles.flatMap(
    (bundle, bundleIndex) => bundle.semanticEntityIds.map(
      (entityId, entityIndex) =>
        atom(
          "source",
          entityId,
          10 + bundleIndex * 72 + entityIndex * 16,
          20
        )
    )
  ));
  const target = scene(
    "target",
    presentation.roles.bundles
      .filter(({ role }) => role === "continuant")
      .flatMap(({ semanticEntityIds }) => semanticEntityIds)
      .map((entityId, index) => atom("target", entityId, index * 18))
  );
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
    ["arc-above", "arc-above", "arc-below", "arc-below"]
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
    Math.sign(midpoint[2]!.rect.top - tracks[2]!.startRect.top)
  );
  assert.ok(Math.abs(
    (midpoint[1]!.rect.left - midpoint[0]!.rect.left) -
    (tracks[1]!.startRect.left - tracks[0]!.startRect.left)
  ) < 1e-9);
  assert.ok(Math.abs(
    (midpoint[3]!.rect.left - midpoint[2]!.rect.left) -
    (tracks[3]!.startRect.left - tracks[2]!.startRect.left)
  ) < 1e-9);
  assert.ok(settled.every(({ opacity }) => opacity === 0));
  assert.deepEqual(
    sampleKpNativeKatexSceneTrackFrames(orbiting, 0.55, false),
    midpoint
  );
});

test("role-complete cancellation retires catalysts and artifacts without orbiting them", () => {
  const transformation = animation.transformations.find(({ id }) =>
    id === "fraction-solve.step.cancel-denominator"
  )!;
  const choreography = compileKpEquationOperationChoreography({
    animation,
    transformation,
    motifKind: "cancelation",
    direction: "forward"
  });
  assert.equal(choreography?.kind, "counter-orbit-cancellation");
  if (choreography?.kind !== "counter-orbit-cancellation") return;
  const presentation = choreography.operationPresentationPlan!;
  const movingBundles = presentation.roles.bundles.filter(
    ({ role }) => role !== "continuant"
  );
  const source = scene(
    "source",
    movingBundles.flatMap(({ semanticEntityIds }, bundleIndex) =>
      semanticEntityIds.map((entityId, entityIndex) =>
        atom("source", entityId, 10 + bundleIndex * 28 + entityIndex * 12)
      )
    )
  );
  const target = scene(
    "target",
    presentation.roles.bundles
      .filter(({ role }) => role === "continuant")
      .flatMap(({ semanticEntityIds }) => semanticEntityIds)
      .map((entityId, index) => atom("target", entityId, index * 18))
  );
  const tracks = source.atoms.map((sourceAtom, index) =>
    eliminatedTrack(sourceAtom, index)
  );
  const routed = applyKpNativeKatexOperationChoreography({
    tracks,
    source,
    target,
    choreography
  });
  const roleByEntityId = new Map(presentation.roles.bundles.flatMap((bundle) =>
    bundle.semanticEntityIds.map((entityId) => [entityId, bundle.role] as const)
  ));
  const routedByEntityId = new Map(routed.map((track) => [
    source.atoms.find(({ id }) => id === track.sourceAtomId)!.semanticEntityId,
    track
  ]));

  for (const [entityId, role] of roleByEntityId) {
    if (role === "continuant") continue;
    const track = routedByEntityId.get(entityId)!;
    if (role === "source-material") {
      assert.ok(
        track.motionPath?.variant === "arc-above" ||
        track.motionPath?.variant === "arc-below"
      );
      continue;
    }
    assert.equal(track.motionPath, undefined);
    const midpoint = sampleKpNativeKatexSceneTrackFrames(
      [track],
      0.55,
      false
    )[0]!;
    assert.deepEqual(midpoint.rect, track.startRect);
    assert.equal(midpoint.opacity, 1);
    assert.equal(
      sampleKpNativeKatexSceneTrackFrames([track], 0.9, false)[0]!.opacity,
      0
    );
  }
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
