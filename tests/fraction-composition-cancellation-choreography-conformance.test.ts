import assert from "node:assert/strict";
import test from "node:test";

import {
  createDivideBothSidesEquationAnimationAsset
} from "../src/animation/divide-both-sides-equation-adapter.ts";
import {
  createKpFractionCompositionEquationAnimationAsset
} from "../src/animation/fraction-composition-equation-adapter.ts";
import {
  createFractionalLinearEquationAnimationAsset
} from "../src/animation/fractional-linear-equation-adapter.ts";
import {
  createLinearSolveAnimationAsset
} from "../src/animation/linear-solve-adapter.ts";
import type {
  KpAnimationAsset
} from "../src/animation/asset.ts";
import type {
  KpRegisteredEquationOperationChoreography
} from "../src/animation/balanced-introduction-presentation-plan.ts";
import {
  operationPresentationPlanAuthorityId
} from "../src/animation/operation-presentation-plan-types.ts";
import type {
  KpSemanticTransformation
} from "../src/semantic/asset-transformation.ts";
import {
  compileKpEquationOperationChoreography
} from "../src/reader/renderers/equation-operation-choreography-compiler.ts";
import {
  compileKpCollisionSafeTransitTracks
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

const fractionAnimation =
  createKpFractionCompositionEquationAnimationAsset();
const cancellationTransformations = fractionAnimation.transformations.filter(
  (transformation) => transformation.correspondenceMap?.records.some(
    ({ relation }) => relation === "cancelation"
  )
);

test("every discovered cancellation obeys role-complete forward and rewind laws", () => {
  assert.equal(cancellationTransformations.length, 3);
  for (const transformation of cancellationTransformations) {
    const forward = conformanceCase(
      fractionAnimation,
      transformation,
      "forward"
    );
    const rewind = conformanceCase(
      fractionAnimation,
      transformation,
      "rewind"
    );

    assertRoleRouting(forward);
    assertRoleRouting(rewind);
    assertExactRewind(forward, rewind);
  }
});

test("existing equation cancellations obey the same forward and rewind laws", () => {
  const animations = [
    createLinearSolveAnimationAsset(),
    createFractionalLinearEquationAnimationAsset(),
    createDivideBothSidesEquationAnimationAsset()
  ];
  let covered = 0;
  for (const animation of animations) {
    for (const transformation of animation.transformations.filter(
      (candidate) => candidate.correspondenceMap?.records.some(
        ({ relation }) => relation === "cancelation"
      )
    )) {
      const forward = conformanceCase(
        animation,
        transformation,
        "forward"
      );
      const rewind = conformanceCase(
        animation,
        transformation,
        "rewind"
      );
      assertRoleRouting(forward);
      assertRoleRouting(rewind);
      assertExactRewind(forward, rewind);
      covered += 1;
    }
  }
  assert.equal(covered, 4);
});

type CancellationChoreography = Extract<
  KpRegisteredEquationOperationChoreography,
  { readonly kind: "counter-orbit-cancellation" }
>;

interface ConformanceCase {
  readonly transformation: KpSemanticTransformation;
  readonly direction: "forward" | "rewind";
  readonly choreography: CancellationChoreography;
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly routed: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly entityIdByTrackId: ReadonlyMap<string, string>;
}

function conformanceCase(
  animation: KpAnimationAsset,
  transformation: KpSemanticTransformation,
  direction: "forward" | "rewind"
): ConformanceCase {
  const compiled = compileKpEquationOperationChoreography({
    animation,
    transformation,
    motifKind: "cancelation",
    direction
  });
  assert.equal(compiled?.kind, "counter-orbit-cancellation");
  if (compiled?.kind !== "counter-orbit-cancellation") {
    throw new Error(`Missing cancellation choreography for ${transformation.id}.`);
  }
  const plan = compiled.operationPresentationPlan;
  assert.ok(plan, `${transformation.id} lacks a verified presentation plan.`);
  const records = transformation.correspondenceMap!.records;
  const forwardSourceIds = records.flatMap(({ sourceSelectorIds }) =>
    sourceSelectorIds
  );
  const forwardTargetIds = records.flatMap(({ targetSelectorIds }) =>
    targetSelectorIds
  );
  const sourceIds = direction === "forward"
    ? forwardSourceIds
    : forwardTargetIds;
  const targetIds = direction === "forward"
    ? forwardTargetIds
    : forwardSourceIds;
  const rectByEntityId = roleRects(compiled);
  const source = scene(
    "source",
    sourceIds.map((entityId) =>
      atom("source", entityId, rectByEntityId.get(entityId)!)
    )
  );
  const target = scene(
    "target",
    targetIds.map((entityId) =>
      atom("target", entityId, rectByEntityId.get(entityId)!)
    )
  );
  const sourceByEntityId = new Map(source.atoms.map((paint) => [
    paint.semanticEntityId,
    paint
  ]));
  const targetByEntityId = new Map(target.atoms.map((paint) => [
    paint.semanticEntityId,
    paint
  ]));
  const retiringEntityIds = new Set(plan.roles.bundles
    .filter(({ role }) => role !== "continuant")
    .flatMap(({ semanticEntityIds }) => semanticEntityIds));
  const retiringTracks = [...retiringEntityIds].map((entityId, index) =>
    direction === "forward"
      ? eliminateTrack(sourceByEntityId.get(entityId)!, index)
      : introduceTrack(targetByEntityId.get(entityId)!, index)
  );
  const continuantTracks = records
    .filter(({ relation }) =>
      relation === "identity" || relation === "role-change"
    )
    .flatMap((record, recordIndex) =>
      record.sourceSelectorIds.map((sourceEntityId, entityIndex) => {
        const targetEntityId = record.targetSelectorIds[entityIndex];
        if (targetEntityId === undefined) {
          throw new Error(`Unpaired continuant ${record.id}.`);
        }
        const fromId = direction === "forward"
          ? sourceEntityId
          : targetEntityId;
        const toId = direction === "forward"
          ? targetEntityId
          : sourceEntityId;
        return persistTrack({
          source: sourceByEntityId.get(fromId)!,
          target: targetByEntityId.get(toId)!,
          index: recordIndex * 20 + entityIndex
        });
      })
    );
  const tracks = Object.freeze([...retiringTracks, ...continuantTracks]);
  const routed = applyKpNativeKatexOperationChoreography({
    tracks,
    source,
    target,
    choreography: compiled
  });
  const endpoint = direction === "forward" ? source : target;
  const endpointAtoms = new Map(endpoint.atoms.map((paint) => [
    paint.id,
    paint
  ]));
  const entityIdByTrackId = new Map(routed.map((track) => {
    const atomId = direction === "forward"
      ? track.sourceAtomId
      : track.targetAtomId;
    const entityId = atomId === undefined
      ? undefined
      : endpointAtoms.get(atomId)?.semanticEntityId;
    return [track.id, entityId ?? `continuant.${track.id}`];
  }));
  return {
    transformation,
    direction,
    choreography: compiled,
    tracks,
    routed,
    source,
    target,
    entityIdByTrackId
  };
}

function assertRoleRouting(subject: ConformanceCase): void {
  const plan = subject.choreography.operationPresentationPlan!;
  const trackByEntityId = new Map(subject.routed.map((track) => [
    subject.entityIdByTrackId.get(track.id)!,
    track
  ]));
  const inverseBundles = plan.inverseBundleIds.map((bundleId) =>
    plan.roles.bundles.find(({ id }) => id === bundleId)!
  );
  const orbitVariants: string[] = [];
  const contactCenters = inverseBundles.map((bundle, bundleIndex) => {
    const tracks = bundle.semanticEntityIds.map((entityId) =>
      trackByEntityId.get(entityId)!
    );
    const variants = new Set(tracks.map(({ motionPath }) =>
      motionPath?.variant
    ));
    assert.equal(variants.size, 1);
    orbitVariants[bundleIndex] = [...variants][0]!;
    assertRigidBundle(tracks, subject.direction);
    return center(union(tracks.map((track) =>
      subject.direction === "forward"
        ? track.endPaintRect!
        : track.startPaintRect!
    )));
  });
  assert.ok([
    "arc-above/arc-below",
    "arc-below/arc-above",
    "around-left/around-right",
    "around-right/around-left"
  ].includes(orbitVariants.join("/")));
  assertPointClose(contactCenters[0]!, contactCenters[1]!);

  const collapseTracks = plan.roles.bundles
    .filter(({ role }) => role === "catalyst" || role === "artifact")
    .flatMap(({ semanticEntityIds }) => semanticEntityIds)
    .map((entityId) => trackByEntityId.get(entityId)!);
  assert.ok(collapseTracks.every(({ motionPath }) => motionPath === undefined));
  const protectedTransit = compileKpCollisionSafeTransitTracks({
    tracks: subject.routed,
    sampleFrames: (tracks, progress) =>
      sampleKpNativeKatexSceneTrackFrames(tracks, progress, false)
  });
  assert.ok(protectedTransit.tracks
    .filter(({ lifecycle }) =>
      lifecycle === "introduce" || lifecycle === "eliminate"
    )
    .every(({ opacityScheduleAuthority, opacityStepAt }) =>
      opacityScheduleAuthority === "semantic-choreography" &&
      opacityStepAt === undefined
    ));
  const planEntityIds = new Set(plan.roles.bundles.flatMap(
    ({ semanticEntityIds }) => semanticEntityIds
  ));
  assert.ok(subject.routed
    .filter((track) =>
      planEntityIds.has(subject.entityIdByTrackId.get(track.id)!)
    )
    .every(({ verifiedOperationCohortId }) =>
      verifiedOperationCohortId ===
        operationPresentationPlanAuthorityId(plan)
    ));
  const beforeContact = sampleKpNativeKatexSceneTrackFrames(
    subject.routed,
    subject.direction === "forward" ? 0.64 : 0.36,
    false
  ).filter(({ trackId }) => !trackId.startsWith("track.persist."));
  assert.ok(
    beforeContact.every(({ opacity }) => opacity === 1),
    `${subject.transformation.id} changed opacity before contact.`
  );
  for (const progress of [0, 0.35, 0.55, 0.8, 1]) {
    const frames = sampleKpNativeKatexSceneTrackFrames(
      subject.routed,
      progress,
      false
    );
    const retiring = frames.filter(({ trackId }) =>
      !trackId.startsWith("track.persist.")
    );
    assert.equal(
      new Set(retiring.map(({ opacity }) => opacity)).size,
      1,
      `${subject.transformation.id} ${subject.direction} split its collapse clock.`
    );
  }
  subject.tracks.forEach((track, index) => {
    if (track.lifecycle === "persist") {
      const {
        verifiedOperationCohortId,
        ...routedContinuant
      } = subject.routed[index]!;
      assert.equal(
        verifiedOperationCohortId,
        operationPresentationPlanAuthorityId(plan),
        "Continuants must share the verified operation collision authority."
      );
      assert.deepEqual(
        {
          ...routedContinuant,
          timingGroupId: undefined,
          sampleProgress: undefined
        },
        {
          ...track,
          timingGroupId: undefined,
          sampleProgress: undefined
        },
        "Operation authority must not alter continuant geometry or opacity."
      );
      assert.equal(
        routedContinuant.timingGroupId,
        `${plan.id}.continuants`
      );
      assert.equal(typeof routedContinuant.sampleProgress, "function");
    }
  });
}

function assertExactRewind(
  forward: ConformanceCase,
  rewind: ConformanceCase
): void {
  const forwardByEntityId = sampledByEntityId(forward);
  const rewindByEntityId = sampledByEntityId(rewind);
  for (const progress of [0, 0.17, 0.43, 0.61, 0.86, 1]) {
    const forwardFrames = forwardByEntityId(progress);
    const rewindFrames = rewindByEntityId(1 - progress);
    for (const [entityId, frame] of forwardFrames) {
      const inverse = rewindFrames.get(entityId);
      assert.ok(inverse, `Rewind lost ${entityId}.`);
      assertRectClose(frame.rect, inverse.rect);
      assert.ok(Math.abs(frame.opacity - inverse.opacity) < 1e-9);
    }
  }
}

function sampledByEntityId(subject: ConformanceCase) {
  return (progress: number) => new Map(
    sampleKpNativeKatexSceneTrackFrames(subject.routed, progress, false)
      .filter(({ trackId }) => !trackId.startsWith("track.persist."))
      .map((frame) => [
        subject.entityIdByTrackId.get(frame.trackId)!,
        frame
      ])
  );
}

function roleRects(
  choreography: CancellationChoreography
): ReadonlyMap<string, Rect> {
  const plan = choreography.operationPresentationPlan!;
  const result = new Map<string, Rect>();
  const inverseBundles = plan.inverseBundleIds.map((bundleId) =>
    plan.roles.bundles.find(({ id }) => id === bundleId)!
  );
  inverseBundles.forEach((bundle, bundleIndex) => {
    bundle.semanticEntityIds.forEach((entityId, entityIndex) => {
      result.set(entityId, rect(
        20 + bundleIndex * 96 + entityIndex * 16,
        24
      ));
    });
  });
  plan.roles.bundles
    .filter(({ role }) => role === "catalyst" || role === "artifact")
    .forEach((bundle, bundleIndex) => {
      bundle.semanticEntityIds.forEach((entityId, entityIndex) => {
        result.set(entityId, rect(
          68 + bundleIndex * 12 + entityIndex * 10,
          24
        ));
      });
    });
  plan.roles.bundles
    .filter(({ role }) => role === "continuant")
    .flatMap(({ semanticEntityIds }) => semanticEntityIds)
    .forEach((entityId, index) => {
      if (!result.has(entityId)) {
        result.set(entityId, rect(12 + index * 14, 72));
      }
    });
  return result;
}

function assertRigidBundle(
  tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[],
  direction: "forward" | "rewind"
): void {
  if (tracks.length < 2) return;
  const from = direction === "forward" ? "startPaintRect" : "endPaintRect";
  const to = direction === "forward" ? "endPaintRect" : "startPaintRect";
  for (let index = 1; index < tracks.length; index += 1) {
    const first = tracks[0]!;
    const current = tracks[index]!;
    assert.ok(Math.abs(
      (current[from]!.left - first[from]!.left) -
      (current[to]!.left - first[to]!.left)
    ) < 1e-9);
    assert.ok(Math.abs(
      (current[from]!.top - first[from]!.top) -
      (current[to]!.top - first[to]!.top)
    ) < 1e-9);
  }
}

interface Rect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

function rect(left: number, top: number): Rect {
  return { left, top, width: 12, height: 18 };
}

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
    viewportKey: "conformance"
  };
}

function atom(
  endpoint: "source" | "target",
  semanticEntityId: string,
  bounds: Rect
): KpNativeKatexPaintAtomObservation {
  return {
    kind: "native-katex-paint-atom-observation",
    lifecycle: "renderer-session",
    id: `${endpoint}.${semanticEntityId}`,
    endpoint,
    semanticEntityId,
    presentationGroupId: `group.${semanticEntityId}`,
    paintKind: semanticEntityId.includes("rule") ? "rule" : "glyph",
    visualKey: semanticEntityId,
    sourceElement: {} as HTMLElement,
    rect: bounds,
    styleFingerprint: "conformance",
    zOrder: 0,
    fontRevision: 1
  };
}

function eliminateTrack(
  source: KpNativeKatexPaintAtomObservation,
  index: number
): KpNativeKatexPaintMeasuredSceneTrack {
  return {
    id: `track.eliminate.${index}`,
    componentId: `component.eliminate.${index}`,
    lifecycle: "eliminate",
    sourceAtomId: source.id,
    visualAtomId: source.id,
    paintKind: source.paintKind,
    sizingMode: source.paintKind === "rule" ? "rule-length" : "rect",
    startRect: source.rect,
    endRect: { ...source.rect, top: source.rect.top - 8 },
    startPaintRect: source.rect,
    endPaintRect: { ...source.rect, top: source.rect.top - 8 },
    startOpacity: 1,
    endOpacity: 0
  };
}

function introduceTrack(
  target: KpNativeKatexPaintAtomObservation,
  index: number
): KpNativeKatexPaintMeasuredSceneTrack {
  return {
    id: `track.introduce.${index}`,
    componentId: `component.introduce.${index}`,
    lifecycle: "introduce",
    targetAtomId: target.id,
    visualAtomId: target.id,
    paintKind: target.paintKind,
    sizingMode: target.paintKind === "rule" ? "rule-length" : "rect",
    startRect: { ...target.rect, top: target.rect.top + 8 },
    endRect: target.rect,
    startPaintRect: { ...target.rect, top: target.rect.top + 8 },
    endPaintRect: target.rect,
    startOpacity: 0,
    endOpacity: 1
  };
}

function persistTrack(input: {
  readonly source: KpNativeKatexPaintAtomObservation;
  readonly target: KpNativeKatexPaintAtomObservation;
  readonly index: number;
}): KpNativeKatexPaintMeasuredSceneTrack {
  return {
    id: `track.persist.${input.index}`,
    componentId: `component.persist.${input.index}`,
    lifecycle: "persist",
    sourceAtomId: input.source.id,
    targetAtomId: input.target.id,
    visualAtomId: input.source.id,
    paintKind: input.source.paintKind,
    sizingMode: input.source.paintKind === "rule" ? "rule-length" : "rect",
    startRect: input.source.rect,
    endRect: input.target.rect,
    startPaintRect: input.source.rect,
    endPaintRect: input.target.rect,
    startOpacity: 1,
    endOpacity: 1
  };
}

function union(rects: readonly Rect[]): Rect {
  const left = Math.min(...rects.map((bounds) => bounds.left));
  const top = Math.min(...rects.map((bounds) => bounds.top));
  const right = Math.max(...rects.map((bounds) =>
    bounds.left + bounds.width
  ));
  const bottom = Math.max(...rects.map((bounds) =>
    bounds.top + bounds.height
  ));
  return { left, top, width: right - left, height: bottom - top };
}

function center(bounds: Rect): { readonly x: number; readonly y: number } {
  return {
    x: bounds.left + bounds.width / 2,
    y: bounds.top + bounds.height / 2
  };
}

function assertPointClose(
  left: { readonly x: number; readonly y: number },
  right: { readonly x: number; readonly y: number }
): void {
  assert.ok(Math.abs(left.x - right.x) < 1e-9);
  assert.ok(Math.abs(left.y - right.y) < 1e-9);
}

function assertRectClose(left: Rect, right: Rect): void {
  assert.ok(Math.abs(left.left - right.left) < 1e-9);
  assert.ok(Math.abs(left.top - right.top) < 1e-9);
  assert.ok(Math.abs(left.width - right.width) < 1e-9);
  assert.ok(Math.abs(left.height - right.height) < 1e-9);
}
