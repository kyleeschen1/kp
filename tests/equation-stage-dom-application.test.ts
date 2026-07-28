import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  compileKpReaderEquationMaterialPlan,
  measureKpReaderAppliedEquationStageLayoutSnapshot,
  projectKpReaderEquationRenderPlan,
  type KpReaderEquationMaterialPlan
} from "../src/reader/renderers/public-api.ts";
import {
  applyKpCertifiedEquationStageLayout,
  certifyKpTwoRowEquationStageLayout,
  compileKpMeasuredEquationStageInput,
  createKpEquationStageMeasurementIdentity,
  type KpCertifiedEquationStageLayout,
  type KpEquationStageEnvelopeDefinition,
  type KpEquationStageEnvelopeObservation
} from "../src/reader/runtime/equation-stage-layout.ts";

const identity = createKpEquationStageMeasurementIdentity({
  revision: 13,
  coordinateSpaceId: "fixture.dom-application"
});

test("DOM application is absolute, complete, and idempotent", () => {
  const { certificate, elements } = fixture();
  const rows = certificate.rows.map((row) => ({
    rowId: row.id,
    members: row.envelopeIds.flatMap((envelopeId) => {
      const envelope = certificate.measuredInput.envelopes.find(
        ({ id }) => id === envelopeId
      )!;
      return envelope.memberOwnerIds.map((ownerId) => ({
        ownerId,
        element: elements.get(ownerId)!
      }));
    })
  }));
  const first = applyKpCertifiedEquationStageLayout({
    certificate,
    measurementIdentity: identity,
    rows
  });
  const translations = [...elements.values()].map(
    (element) => element.style.translate
  );
  const second = applyKpCertifiedEquationStageLayout({
    certificate,
    measurementIdentity: identity,
    rows
  });

  assert.equal(first.executionState, "applied");
  assert.equal(first.certificate, certificate);
  assert.deepEqual(first.appliedRowIds, ["row.source", "row.target"]);
  assert.deepEqual(
    [...first.appliedNativeMemberIds].sort(),
    ["source.a", "target.a"]
  );
  assert.deepEqual(
    [...elements.values()].map((element) => element.style.translate),
    translations
  );
  assert.equal(second.applicationId, first.applicationId);
  assert.ok([...elements.values()].every((element) =>
    element.dataset["kpEquationStageLayoutAuthority"] === "applied-v1"
  ));
});

test("DOM application serializes subpixel residuals as valid CSS dimensions", () => {
  const { certificate, elements } = fixture();
  const residualCertificate = {
    ...certificate,
    rows: certificate.rows.map((row, index) => ({
      ...row,
      translateX: index === 0
        ? 116.45364856562225
        : -Number.EPSILON,
      translateY: index === 0
        ? -48.01333454184624
        : Number.EPSILON
    }))
  };

  applyKpCertifiedEquationStageLayout({
    certificate: residualCertificate,
    measurementIdentity: identity,
    rows: residualCertificate.rows.map((row) => ({
      rowId: row.id,
      members: row.envelopeIds.flatMap((envelopeId) =>
        residualCertificate.measuredInput.envelopes.find(
          ({ id }) => id === envelopeId
        )!.memberOwnerIds.map((ownerId) => ({
          ownerId,
          element: elements.get(ownerId)!
        }))
      )
    }))
  });

  assert.deepEqual(
    [...elements.values()].map(({ style }) => style.translate),
    ["116.454px -48.013px", "0.000px 0.000px"]
  );
});

test("DOM application rejects stale, partial, duplicate, and foreign authority", () => {
  const { certificate, elements } = fixture();
  const source = elements.get("source.a")!;
  const target = elements.get("target.a")!;
  const rows = [
    {
      rowId: "row.source",
      members: [{ ownerId: "source.a", element: source }]
    },
    {
      rowId: "row.target",
      members: [{ ownerId: "target.a", element: target }]
    }
  ];

  assert.throws(
    () => applyKpCertifiedEquationStageLayout({
      certificate,
      measurementIdentity: { ...identity, revision: identity.revision + 1 },
      rows
    }),
    /measurement identity mismatch/
  );
  assert.throws(
    () => applyKpCertifiedEquationStageLayout({
      certificate,
      measurementIdentity: identity,
      rows: rows.slice(0, 1)
    }),
    /every certified row exactly once/
  );
  assert.throws(
    () => applyKpCertifiedEquationStageLayout({
      certificate,
      measurementIdentity: identity,
      rows: [
        rows[0]!,
        {
          rowId: "row.target",
          members: [{ ownerId: "target.a", element: source }]
        }
      ]
    }),
    /repeats native element/
  );
  source.style.translate = "4px 0px";
  assert.throws(
    () => applyKpCertifiedEquationStageLayout({
      certificate,
      measurementIdentity: identity,
      rows
    }),
    /already owns CSS translation/
  );
});

test("applied proof gates paint measurement after native row transforms", () => {
  const plan = materialPlan();
  const transition = plan.transitions[0]!;
  const sourceIds = transition.anchors
    .filter(({ side }) => side === "source")
    .map(({ id }) => id);
  const targetIds = transition.anchors
    .filter(({ side }) => side === "target")
    .map(({ id }) => id);
  const certificate = certificateFor({
    transitionId: transition.transitionId,
    sourceIds,
    targetIds
  });
  const elements = new Map(transition.anchors.map((anchor, index) => {
    const element = fakeElement(
      anchor.id,
      120 + index * 12,
      60,
      10,
      20
    );
    return [anchor.id, element] as const;
  }));
  const applied = applyKpCertifiedEquationStageLayout({
    certificate,
    measurementIdentity: identity,
    rows: [
      {
        rowId: "row.source",
        members: sourceIds.map((ownerId) => ({
          ownerId,
          element: elements.get(ownerId)!
        }))
      },
      {
        rowId: "row.target",
        members: targetIds.map((ownerId) => ({
          ownerId,
          element: elements.get(ownerId)!
        }))
      }
    ]
  });
  const measurementRoot = fakeMeasurementRoot([...elements.values()]);
  const snapshot = measureKpReaderAppliedEquationStageLayoutSnapshot({
    materialPlan: plan,
    transitionId: transition.transitionId,
    measurementRoot,
    revision: identity.revision,
    coordinateSpaceId: identity.coordinateSpaceId,
    appliedStageLayout: applied
  });
  const sourceTop = snapshot.anchors.find(({ side }) => side === "source")!
    .rect.top;
  const targetTop = snapshot.anchors.find(({ side }) => side === "target")!
    .rect.top;

  assert.ok(targetTop > sourceTop);
  assert.throws(
    () => measureKpReaderAppliedEquationStageLayoutSnapshot({
      materialPlan: plan,
      transitionId: transition.transitionId,
      measurementRoot,
      revision: identity.revision + 1,
      coordinateSpaceId: identity.coordinateSpaceId,
      appliedStageLayout: applied
    }),
    /measurement identity mismatch/
  );
});

function fixture(): {
  readonly certificate: KpCertifiedEquationStageLayout;
  readonly elements: ReadonlyMap<string, HTMLElement>;
} {
  return {
    certificate: certificateFor({
      transitionId: "transition.dom-application",
      sourceIds: ["source.a"],
      targetIds: ["target.a"]
    }),
    elements: new Map([
      ["source.a", fakeElement("source.a", 10, 10, 30, 20)],
      ["target.a", fakeElement("target.a", 70, 10, 30, 20)]
    ])
  };
}

function certificateFor(input: {
  readonly transitionId: string;
  readonly sourceIds: readonly string[];
  readonly targetIds: readonly string[];
}): KpCertifiedEquationStageLayout {
  const intent = {
    nodeId: input.transitionId,
    policy: "semantic-two-row-stage" as const,
    rows: [
      {
        id: "row.source",
        role: "source",
        envelopeIds: ["envelope.source"]
      },
      {
        id: "row.target",
        role: "target",
        envelopeIds: ["envelope.target"]
      }
    ]
  };
  const definitions: KpEquationStageEnvelopeDefinition[] = [
    {
      id: "envelope.source",
      transitionId: input.transitionId,
      endpointObjectId: "endpoint.source",
      memberOwnerIds: input.sourceIds
    },
    {
      id: "envelope.target",
      transitionId: input.transitionId,
      endpointObjectId: "endpoint.target",
      memberOwnerIds: input.targetIds
    }
  ];
  const observations: KpEquationStageEnvelopeObservation[] = [
    {
      ...definitions[0]!,
      rect: { left: 10, top: 10, width: 90, height: 20 },
      baselineY: 26,
      emSizePx: 16,
      measurementIdentity: identity
    },
    {
      ...definitions[1]!,
      rect: { left: 60, top: 10, width: 120, height: 20 },
      baselineY: 26,
      emSizePx: 16,
      measurementIdentity: identity
    }
  ];
  return certifyKpTwoRowEquationStageLayout(
    compileKpMeasuredEquationStageInput({
      intent,
      measurementIdentity: identity,
      definitions,
      observations
    })
  );
}

function materialPlan(): KpReaderEquationMaterialPlan {
  const animation = createLinearSolveAnimationAsset();
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: "runtime.reader.applied-layout",
    animation,
    progress: 0.5
  });
  return compileKpReaderEquationMaterialPlan(
    projectKpReaderEquationRenderPlan({ animation, runtimeFrame })
  );
}

function fakeElement(
  anchorId: string,
  left: number,
  top: number,
  width: number,
  height: number
): HTMLElement {
  const style = { translate: "" };
  const dataset: DOMStringMap = {
    kpReaderEquationAnchorId: anchorId
  };
  return {
    dataset,
    style,
    isConnected: true,
    getBoundingClientRect() {
      const [x = 0, y = 0] = style.translate
        .split(" ")
        .map((value) => Number.parseFloat(value) || 0);
      return {
        left: left + x,
        top: top + y,
        width,
        height,
        right: left + x + width,
        bottom: top + y + height,
        x: left + x,
        y: top + y,
        toJSON: () => ({})
      };
    }
  } as unknown as HTMLElement;
}

function fakeMeasurementRoot(elements: readonly HTMLElement[]): HTMLElement {
  return {
    dataset: { kpReaderEquationMeasurement: "true" },
    getAttribute: (name: string) => name === "aria-hidden" ? "true" : null,
    getBoundingClientRect: () => ({
      left: 100,
      top: 40,
      width: 400,
      height: 180,
      right: 500,
      bottom: 220,
      x: 100,
      y: 40,
      toJSON: () => ({})
    }),
    querySelectorAll: () => elements
  } as unknown as HTMLElement;
}
