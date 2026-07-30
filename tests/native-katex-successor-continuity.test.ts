import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpRegisteredSuccessorSynthesisPresentation
} from "../src/animation/successor-synthesis-presentation-plan.ts";
import type {
  KpSuccessorSynthesisBinding
} from "../src/animation/successor-synthesis.ts";
import {
  kpOpaqueGatherAndRecognizeRecognitionProgress
} from "../src/animation/successor-synthesis.ts";
import {
  compileKpNativeKatexSuccessorSynthesisScenePlans,
  kpNativeKatexSuccessorTargetSettlementProgress,
  sampleKpNativeKatexSuccessorSynthesisScenePlans
} from "../src/rendering/native-katex-successor-synthesis.ts";
import type {
  KpNativeKatexPaintAtomObservation,
  KpNativeKatexRenderedSceneObservation
} from "../src/rendering/native-katex-rendered-scene.ts";

const ownerDocument = {};
const stage = { ownerDocument } as HTMLElement;
const root = { ownerDocument } as HTMLElement;
const sourceElement = { ownerDocument } as HTMLElement;

const binding: KpSuccessorSynthesisBinding = {
  id: "successor.test.one-plus-two",
  relationRecordId: "relation.test.one-plus-two",
  authority: {
    operationId: "kp.arithmetic.add",
    bindingId: "binding.test.one-plus-two"
  },
  sourceAnnotations: [
    {
      id: "operand.one",
      semanticRole: "addend",
      selectorIds: ["selector.one"],
      contribution: "material-input",
      propagationRank: 0
    },
    {
      id: "operator.plus",
      semanticRole: "addition-operator",
      selectorIds: ["selector.plus"],
      contribution: "catalyst",
      propagationRank: 1
    },
    {
      id: "operand.two",
      semanticRole: "addend",
      selectorIds: ["selector.two"],
      contribution: "material-input",
      propagationRank: 2
    }
  ],
  targetAnnotations: [{
    id: "result.three",
    semanticRole: "evaluated-sum",
    selectorIds: ["selector.three"],
    propagationRank: 0
  }],
  lineages: [{
    id: "lineage.one-plus-two",
    sourceAnnotationIds: ["operand.one", "operand.two"],
    targetAnnotationIds: ["result.three"]
  }]
};

test("native successor renderer co-presents opaque contributors and result", () => {
  const compilation = compileKpRegisteredSuccessorSynthesisPresentation({
    transformationId: "transform.test.one-plus-two",
    transformationKind: "simplifyConstantSum",
    binding
  });
  assert.equal(compilation.status, "compiled");
  if (compilation.status !== "compiled") return;
  const registeredBinding = {
    ...binding,
    operationPresentationPlan: compilation.operationPresentationPlan,
    paintContinuityPlan: compilation.paintContinuityPlan,
    continuityProgram: compilation.continuityProgram
  };
  const plans = compileKpNativeKatexSuccessorSynthesisScenePlans({
    source: scene("source", [
      atom("source.one", "selector.one", 10, 20),
      atom("source.plus", "selector.plus", 28, 20),
      atom("source.two", "selector.two", 46, 20)
    ]),
    target: scene("target", [
      atom("target.three", "selector.three", 28, 20)
    ]),
    intents: [{
      binding: registeredBinding,
      direction: "forward",
      motion: "full"
    }]
  });

  assert.equal(plans[0]?.continuityAuthority.kind, "verified");
  assert.equal(
    plans[0]?.motifRealization.kind,
    "opaque-gather-and-recognize-v1"
  );
  if (
    plans[0]?.motifRealization.kind ===
      "opaque-gather-and-recognize-v1"
  ) {
    assert.ok(
      plans[0].motifRealization.sourceTravelPx >=
        plans[0].motifRealization.minimumSourceTravelPx
    );
    assert.equal(
      plans[0].motifRealization.targetEmergence,
      "geometry-with-continuous-source-co-presence"
    );
  }
  const gathered = sampleKpNativeKatexSuccessorSynthesisScenePlans({
    plans,
    progress: 0.58
  });
  const before = sampleKpNativeKatexSuccessorSynthesisScenePlans({
    plans,
    progress: kpOpaqueGatherAndRecognizeRecognitionProgress - 0.001
  });
  const at = sampleKpNativeKatexSuccessorSynthesisScenePlans({
    plans,
    progress: kpOpaqueGatherAndRecognizeRecognitionProgress
  });
  const after = sampleKpNativeKatexSuccessorSynthesisScenePlans({
    plans,
    progress: kpOpaqueGatherAndRecognizeRecognitionProgress + 0.001
  });

  assert.ok(materialSources(gathered).every((owner) =>
    scale(owner.transform) > 0.6
  ));
  assert.ok(catalysts(gathered).every((owner) =>
    scale(owner.transform) > 0
  ));
  assert.ok(materialSources(before).every((owner) => scale(owner.transform) > 0));
  assert.ok(targets(before).every((owner) => scale(owner.transform) === 0));
  assert.ok(materialSources(at).every((owner) => scale(owner.transform) > 0));
  assert.ok(targets(at).every((owner) => scale(owner.transform) === 0));
  assert.ok(materialSources(after).every((owner) => scale(owner.transform) > 0));
  assert.ok(targets(after).every((owner) => scale(owner.transform) > 0));
  assert.ok(targets(before).every((owner) => owner.opacity === 0));
  assert.ok(targets(after).every((owner) => owner.opacity === 1));
  assert.ok(materialSources(after).every((owner) => owner.opacity === 1));
  assert.ok(catalysts(after).every((owner) =>
    owner.semanticContacts?.every(({ reason }) =>
      reason === "semantic-evaluation"
    ) === true
  ));
});

test("native successor renderer settles exact endpoints without binary policy", () => {
  const compilation = compileKpRegisteredSuccessorSynthesisPresentation({
    transformationId: "transform.test.one-plus-two",
    transformationKind: "simplifyConstantSum",
    binding
  });
  assert.equal(compilation.status, "compiled");
  if (compilation.status !== "compiled") return;
  const plans = compileKpNativeKatexSuccessorSynthesisScenePlans({
    source: scene("source", [
      atom("source.one", "selector.one", 10, 20),
      atom("source.plus", "selector.plus", 28, 20),
      atom("source.two", "selector.two", 46, 20)
    ]),
    target: scene("target", [
      atom("target.three", "selector.three", 28, 20)
    ]),
    intents: [{
      binding: {
        ...binding,
        operationPresentationPlan: compilation.operationPresentationPlan,
        paintContinuityPlan: compilation.paintContinuityPlan,
        continuityProgram: compilation.continuityProgram
      },
      direction: "forward",
      motion: "full"
    }]
  });
  const start = sampleKpNativeKatexSuccessorSynthesisScenePlans({
    plans,
    progress: 0
  });
  const end = sampleKpNativeKatexSuccessorSynthesisScenePlans({
    plans,
    progress: 1
  });
  const settledMaterial = sampleKpNativeKatexSuccessorSynthesisScenePlans({
    plans,
    progress: kpNativeKatexSuccessorTargetSettlementProgress
  });
  const oneMinusEpsilon =
    sampleKpNativeKatexSuccessorSynthesisScenePlans({
      plans,
      progress: 0.999
    });

  assert.ok(materialSources(start).every((owner) => scale(owner.transform) === 1));
  assert.ok(targets(start).every((owner) => scale(owner.transform) === 0));
  assert.ok(materialSources(end).every((owner) => scale(owner.transform) === 0));
  assert.ok(targets(end).every((owner) => scale(owner.transform) === 1));
  assert.ok(targets(end).every((owner) => owner.transform ===
    "translate(0px, 0px) scale(1)"));
  const paintPose = (
    owners: ReturnType<typeof targets>
  ) => owners.map((owner) => ({
    endpointPaintAtomId: owner.endpointPaintAtomId,
    rect: owner.rect,
    expectedPaintRect: owner.expectedPaintRect,
    opacity: owner.opacity,
    transform: owner.transform
  }));
  assert.deepEqual(
    paintPose(targets(settledMaterial)),
    paintPose(targets(oneMinusEpsilon))
  );
  assert.deepEqual(
    paintPose(targets(oneMinusEpsilon)),
    paintPose(targets(end))
  );
});

function scene(
  endpoint: "source" | "target",
  atoms: readonly KpNativeKatexPaintAtomObservation[]
): KpNativeKatexRenderedSceneObservation {
  return {
    kind: "native-katex-rendered-scene-observation",
    lifecycle: "renderer-session",
    endpoint,
    stage,
    root,
    atoms,
    groups: [],
    fontRevision: 1,
    viewportKey: "test"
  };
}

function atom(
  id: string,
  semanticEntityId: string,
  left: number,
  top: number
): KpNativeKatexPaintAtomObservation {
  return {
    kind: "native-katex-paint-atom-observation",
    lifecycle: "renderer-session",
    id,
    endpoint: id.startsWith("source.") ? "source" : "target",
    semanticEntityId,
    presentationGroupId: `group.${id}`,
    paintKind: "glyph",
    visualKey: id,
    sourceElement,
    rect: { left, top, width: 10, height: 16 },
    styleFingerprint: "KaTeX_Main|400|24px",
    zOrder: 0,
    fontRevision: 1
  };
}

function materialSources(
  owners: ReturnType<typeof sampleKpNativeKatexSuccessorSynthesisScenePlans>
) {
  return owners.filter(({ fragmentRole }) =>
    fragmentRole === "successor-source:material-input"
  );
}

function targets(
  owners: ReturnType<typeof sampleKpNativeKatexSuccessorSynthesisScenePlans>
) {
  return owners.filter(({ fragmentRole }) =>
    fragmentRole === "successor-target:result"
  );
}

function catalysts(
  owners: ReturnType<typeof sampleKpNativeKatexSuccessorSynthesisScenePlans>
) {
  return owners.filter(({ fragmentRole }) =>
    fragmentRole === "successor-source:catalyst"
  );
}

function scale(transform: string): number {
  const match = /scale\(([-.\d]+)\)/.exec(transform);
  assert.ok(match);
  return Number(match[1]);
}
