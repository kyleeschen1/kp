import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpCarrierPreservingSimplificationRecipe,
  type KpCarrierPreservingSimplificationRecipe
} from "../src/animation/carrier-preserving-simplification-recipe.ts";
import {
  resolveKpOperationEvaluationFamilyCandidate
} from "../src/animation/operation-evaluation-family-profile.ts";
import {
  bindKpNativeKatexCarrierPreservingSimplification,
  projectKpNativeKatexCarrierPose
} from "../src/rendering/native-katex-carrier-preserving-simplification-binding.ts";
import {
  compileKpNativeKatexCarrierPreservingSimplificationMotion
} from "../src/rendering/native-katex-carrier-preserving-simplification-motion.ts";
import {
  kpNativeKatexCarrierPreservingSimplificationOpticalProfile
} from "../src/rendering/native-katex-carrier-preserving-simplification-profile.ts";
import {
  assertKpNativeKatexCarrierEndpointRevisions,
  certifyKpNativeKatexCarrierSettlement
} from "../src/rendering/native-katex-carrier-preserving-simplification-settlement.ts";
import {
  sampleKpNativeKatexSceneTrackFrames
} from "../src/rendering/native-katex-scene-track-sampling.ts";
import {
  kpCanonicalCarrierPreservingSimplificationNativeEndpoints
} from "../src/rendering/carrier-preserving-simplification-native-endpoints.ts";
import {
  createKpNativeKatexRenderedEndpointHandle,
  createKpNativeKatexRenderedSceneObservation,
  type KpNativeKatexPaintAtomObservation
} from "../src/rendering/native-katex-rendered-scene.ts";
import {
  createKpTwoTimesOneCarrierEvidenceCandidate,
  createKpTwoTimesOneCarrierExemplar,
  kpTwoTimesOneCarrierSelectorIds
} from "../src/semantic/carrier-preserving-simplification-exemplar.ts";
import {
  verifyKpCarrierPreservingSimplificationEvidence
} from "../src/semantic/carrier-preserving-simplification-evidence.ts";

const ownerDocument = { defaultView: null };
const stage = { ownerDocument } as HTMLElement;
const root = { ownerDocument } as HTMLElement;

test("canonical semantic states compile to annotated Native KaTeX endpoints", () => {
  const [source, target] =
    kpCanonicalCarrierPreservingSimplificationNativeEndpoints;
  assert.equal(source.annotated.rawLatex, "2 \\times 1");
  assert.equal(target.annotated.rawLatex, "2");
  assert.deepEqual(source.nodes.map(({ selectorId, role }) => ({
    selectorId,
    role
  })), [{
    selectorId: kpTwoTimesOneCarrierSelectorIds.sourceCarrier,
    role: "carrier"
  }, {
    selectorId: kpTwoTimesOneCarrierSelectorIds.sourceOperator,
    role: "removed-operator"
  }, {
    selectorId: kpTwoTimesOneCarrierSelectorIds.sourceIdentityWitness,
    role: "identity-witness"
  }]);
  assert.match(source.nativeHtmlAndMathml, /class="katex-html"/u);
  assert.match(target.nativeHtmlAndMathml, /class="katex-mathml"/u);
});

test("measured endpoint binding projects exact carrier ink without DOM reads", () => {
  const recipe = canonicalRecipe();
  const sourceHandle = handle("source", recipe, [
    owner(kpTwoTimesOneCarrierSelectorIds.sourceCarrier,
      { left: 10, top: 20, width: 12, height: 24 }, 39),
    owner(kpTwoTimesOneCarrierSelectorIds.sourceOperator,
      { left: 26, top: 20, width: 10, height: 24 }, 39),
    owner(kpTwoTimesOneCarrierSelectorIds.sourceIdentityWitness,
      { left: 40, top: 20, width: 10, height: 24 }, 39)
  ]);
  const targetHandle = handle("target", recipe, [
    owner(kpTwoTimesOneCarrierSelectorIds.targetCarrier,
      { left: 42, top: 26, width: 12, height: 24 }, 45)
  ]);
  const binding = bindKpNativeKatexCarrierPreservingSimplification({
    recipe,
    sourceHandle,
    targetHandle
  });

  assert.equal(binding.carrier.source.selectorRef,
    kpTwoTimesOneCarrierSelectorIds.sourceCarrier);
  assert.equal(binding.carrier.target.selectorRef,
    kpTwoTimesOneCarrierSelectorIds.targetCarrier);
  assert.deepEqual(binding.removedSyntaxCohort.map(({ selectorRef }) =>
    selectorRef), [
    kpTwoTimesOneCarrierSelectorIds.sourceOperator,
    kpTwoTimesOneCarrierSelectorIds.sourceIdentityWitness
  ]);
  assert.deepEqual(projectKpNativeKatexCarrierPose({
    binding,
    progress: 0
  }), {
    progress: 0,
    rect: { left: 10, top: 20, width: 12, height: 24 },
    baselineY: 39
  });
  assert.deepEqual(projectKpNativeKatexCarrierPose({
    binding,
    progress: 1
  }), {
    progress: 1,
    rect: { left: 42, top: 26, width: 12, height: 24 },
    baselineY: 45
  });
  assert.throws(() => JSON.stringify(binding), /cannot enter durable state/);
});

test("equal glyph paint cannot counterfeit a target carrier selector", () => {
  const recipe = canonicalRecipe();
  const sourceHandle = handle("source", recipe, [
    owner(kpTwoTimesOneCarrierSelectorIds.sourceCarrier,
      { left: 10, top: 20, width: 12, height: 24 }, 39),
    owner(kpTwoTimesOneCarrierSelectorIds.sourceOperator,
      { left: 26, top: 20, width: 10, height: 24 }, 39),
    owner(kpTwoTimesOneCarrierSelectorIds.sourceIdentityWitness,
      { left: 40, top: 20, width: 10, height: 24 }, 39)
  ]);
  const forgedTargetHandle = handle("target", recipe, [
    owner("selector.forged-equal-two",
      { left: 42, top: 26, width: 12, height: 24 }, 45)
  ]);
  assert.throws(() => bindKpNativeKatexCarrierPreservingSimplification({
    recipe,
    sourceHandle,
    targetHandle: forgedTargetHandle
  }), /expected one measured owner.*target.*carrier/u);
});

test("motion has one opaque carrier and one synchronized removal cohort", () => {
  const recipe = canonicalRecipe();
  const binding = bindKpNativeKatexCarrierPreservingSimplification({
    recipe,
    sourceHandle: handle("source", recipe, [
      owner(kpTwoTimesOneCarrierSelectorIds.sourceCarrier,
        { left: 10, top: 20, width: 12, height: 24 }, 39),
      owner(kpTwoTimesOneCarrierSelectorIds.sourceOperator,
        { left: 26, top: 20, width: 10, height: 24 }, 39),
      owner(kpTwoTimesOneCarrierSelectorIds.sourceIdentityWitness,
        { left: 40, top: 20, width: 10, height: 24 }, 39)
    ]),
    targetHandle: handle("target", recipe, [
      owner(kpTwoTimesOneCarrierSelectorIds.targetCarrier,
        { left: 42, top: 26, width: 12, height: 24 }, 45)
    ])
  });
  const motion = compileKpNativeKatexCarrierPreservingSimplificationMotion({
    binding
  });
  const tracks = motion.rendererPlan.tracks;
  const carrier = tracks.find(({ id }) => id === motion.carrierTrackId);
  const removed = tracks.filter(({ id }) =>
    motion.removedSyntaxTrackIds.includes(id)
  );

  assert.equal(tracks.length, 3);
  assert.equal(carrier?.lifecycle, "persist");
  assert.equal(carrier?.sampleMaterialScale, undefined);
  assert.deepEqual(removed.map(({ lifecycle }) => lifecycle), [
    "eliminate",
    "eliminate"
  ]);
  assert.equal(new Set(removed.map(({ timingGroupId }) => timingGroupId)).size, 1);
  assert.equal(
    new Set(removed.map(({ intentionalContactGroupId }) =>
      intentionalContactGroupId
    )).size,
    1
  );
  assert.ok(removed[0]?.intentionalContactGroupId);
  assert.equal(carrier?.intentionalContactGroupId, undefined);
  assert.equal(removed[0]?.verifiedOperationCohortId, undefined);
  const scale =
    kpNativeKatexCarrierPreservingSimplificationOpticalProfile
      .removedSyntaxRecognition.minimumScale;
  const recognitionCenters = removed.map(({ endRect, endPaintRect }) => {
    const ownerCenter = {
      x: endRect.left + endRect.width / 2,
      y: endRect.top + endRect.height / 2
    };
    return {
      x: ownerCenter.x + scale * (
        endPaintRect.left + endPaintRect.width / 2 - ownerCenter.x
      ),
      y: ownerCenter.y + scale * (
        endPaintRect.top + endPaintRect.height / 2 - ownerCenter.y
      )
    };
  });
  assert.ok(recognitionCenters[0]!.x < recognitionCenters[1]!.x);
  const sourceCohortLeft = Math.min(...binding.removedSyntaxCohort.map(
    ({ rect }) => rect.left
  ));
  const sourceCohortRight = Math.max(...binding.removedSyntaxCohort.map(
    ({ rect }) => rect.left + rect.width
  ));
  const recognitionCenterX = (
    recognitionCenters[0]!.x + recognitionCenters[1]!.x
  ) / 2;
  assert.ok(
    Math.abs(
      recognitionCenterX - (sourceCohortLeft + sourceCohortRight) / 2
    ) < 1e-9
  );
  removed.forEach((track, index) => {
    const sourceOwner = binding.removedSyntaxCohort[index]!;
    const endOwnerCenterY = track.endRect.top + track.endRect.height / 2;
    const translatedBaseline = sourceOwner.baselineY +
      track.endRect.top - track.startRect.top;
    const scaledBaseline = endOwnerCenterY +
      scale * (translatedBaseline - endOwnerCenterY);
    assert.equal(scaledBaseline, binding.carrier.source.baselineY);
  });
  const middle = sampleKpNativeKatexSceneTrackFrames(tracks, 0.36, false);
  const early = sampleKpNativeKatexSceneTrackFrames(tracks, 0.2, false);
  const carrierFrame = middle.find(({ trackId }) =>
    trackId === motion.carrierTrackId
  );
  const removedFrames = middle.filter(({ trackId }) =>
    motion.removedSyntaxTrackIds.includes(trackId)
  );
  assert.equal(carrierFrame?.opacity, 1);
  assert.equal(carrierFrame?.materialScale, undefined);
  assert.equal(removedFrames.length, 2);
  assert.equal(removedFrames[0]?.opacity, removedFrames[1]?.opacity);
  assert.equal(removedFrames[0]?.materialScale, removedFrames[1]?.materialScale);
  assert.deepEqual(early.filter(({ trackId }) =>
    motion.removedSyntaxTrackIds.includes(trackId)
  ).map(({ opacity }) => opacity), [1, 1]);
  assert.equal(
    tracks.some(({ lifecycle }) =>
      lifecycle === "merge" || lifecycle === "split" ||
      lifecycle === "introduce"
    ),
    false
  );
  assert.throws(() => JSON.stringify(motion), /cannot enter durable state/);

  const settlement = certifyKpNativeKatexCarrierSettlement(motion);
  assert.equal(settlement.carrierTrackId, motion.carrierTrackId);
  assert.equal(settlement.targetSelectorRef,
    kpTwoTimesOneCarrierSelectorIds.targetCarrier);
  assert.deepEqual(settlement.targetRect,
    binding.carrier.target.rect);
  assert.equal(settlement.targetBaselineY,
    binding.carrier.target.baselineY);
  assert.equal(settlement.nativeOwnerAtCompletion, "target-native");
  assert.throws(() => JSON.stringify(settlement), /cannot enter durable state/);

  const current = {
    source: binding.sourceHandle.revision,
    target: binding.targetHandle.revision
  };
  assert.doesNotThrow(() => assertKpNativeKatexCarrierEndpointRevisions({
    plan: motion,
    current
  }));
  assert.throws(() => assertKpNativeKatexCarrierEndpointRevisions({
    plan: motion,
    current: {
      ...current,
      source: { ...current.source, fontRevision: 4 }
    }
  }), /stale-font/);
  assert.throws(() => assertKpNativeKatexCarrierEndpointRevisions({
    plan: motion,
    current: {
      ...current,
      target: { ...current.target, viewportKey: "target:phone:font-3" }
    }
  }), /stale-viewport/);
});

interface OwnerFixture {
  readonly selectorRef: string;
  readonly rect: { readonly left: number; readonly top: number;
    readonly width: number; readonly height: number };
  readonly baselineY: number;
}

function owner(
  selectorRef: string,
  rect: OwnerFixture["rect"],
  baselineY: number
): OwnerFixture {
  return { selectorRef, rect, baselineY };
}

function handle(
  side: "source" | "target",
  recipe: KpCarrierPreservingSimplificationRecipe,
  owners: readonly OwnerFixture[]
) {
  const endpointId = side === "source"
    ? recipe.endpointRefs.sourceObjectId
    : recipe.endpointRefs.targetObjectId;
  const endpointGroupId = `group.${endpointId}`;
  const atoms = owners.map((entry, index) => atom(side, entry, index));
  const sourceElement = unreadableElement();
  return createKpNativeKatexRenderedEndpointHandle({
    observation: createKpNativeKatexRenderedSceneObservation({
      endpoint: side,
      stage,
      root,
      atoms,
      groups: [{
        id: endpointGroupId,
        semanticEntityId: endpointId,
        atomIds: atoms.map(({ id }) => id),
        rect: union(owners.map(({ rect }) => rect)),
        sourceElement,
        styleFingerprint: "font-family:KaTeX_Main",
        baselineY: owners[0]?.baselineY ?? 0
      }, ...owners.map((entry, index) => ({
        id: `group.${side}.${entry.selectorRef}`,
        semanticEntityId: entry.selectorRef,
        parentGroupId: endpointGroupId,
        atomIds: [atoms[index]!.id],
        rect: entry.rect,
        sourceElement,
        styleFingerprint: "font-family:KaTeX_Main",
        baselineY: entry.baselineY
      }))],
      fontRevision: 3,
      viewportKey: `${side}:wide:font-3`
    })
  });
}

function atom(
  side: "source" | "target",
  ownerFixture: OwnerFixture,
  index: number
): KpNativeKatexPaintAtomObservation {
  return {
    kind: "native-katex-paint-atom-observation",
    lifecycle: "renderer-session",
    id: `${side}.paint.glyph.${index}`,
    endpoint: side,
    semanticEntityId: ownerFixture.selectorRef,
    presentationGroupId: `group.${side}.${ownerFixture.selectorRef}`,
    paintKind: "glyph",
    paintMeasurement: "atomic-text",
    visualKey: index === 0 ? "glyph:2" : `glyph:${index}`,
    sourceElement: unreadableElement(),
    rect: ownerFixture.rect,
    baselineY: ownerFixture.baselineY,
    styleFingerprint: "font-family:KaTeX_Main",
    zOrder: index,
    fontRevision: 3
  };
}

function unreadableElement(): HTMLElement {
  return {
    ownerDocument,
    getBoundingClientRect(): never {
      throw new Error("carrier binding remeasured native DOM");
    }
  } as unknown as HTMLElement;
}

function union(rects: readonly OwnerFixture["rect"][]) {
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}

function canonicalRecipe(): KpCarrierPreservingSimplificationRecipe {
  const exemplar = createKpTwoTimesOneCarrierExemplar();
  const verification = verifyKpCarrierPreservingSimplificationEvidence({
    candidate: createKpTwoTimesOneCarrierEvidenceCandidate(),
    bundle: exemplar.bundle,
    transformation: exemplar.transformation
  });
  assert.equal(verification.status, "verified");
  if (verification.status !== "verified") throw new Error("invalid fixture");
  const compilation = compileKpCarrierPreservingSimplificationRecipe(
    resolveKpOperationEvaluationFamilyCandidate({
      family: "carrier-preserving-simplification",
      handoff: "persistent-carrier-transfer",
      transformationKind: "simplifyMultiplicativeIdentity",
      evidence: verification.evidence
    })
  );
  assert.equal(compilation.status, "compiled");
  if (compilation.status !== "compiled") throw new Error("invalid recipe");
  return compilation.recipe;
}
