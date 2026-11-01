import type { KpAnimationAsset } from "../../animation/asset.ts";
import type { KpStructuredEquationAnnotatedEndpoint } from "../../rendering/structured-equation-selector-annotated-latex.ts";
import { bindKpStructuredEquationSemanticEnvelopes } from "../../rendering/structured-equation-semantic-envelopes.ts";
import { applyKpSemanticEnvelopeEquationStageLayout } from "./semantic-envelope-stage-layout.ts";
import { defineKpCanonicalEquationLessonDescriptor } from "./equation-lesson-descriptor.ts";
import type { KpEquationStageLayoutIntent } from "../runtime/public-api.ts";
import type { KpReaderEquationStageLayoutCompiler } from "./equation-lesson-descriptor.ts";

/** Issued algebra endpoints own native selectors and layout in every host. */
export function algebraNativeDescriptor(animation: KpAnimationAsset, endpoints: readonly KpStructuredEquationAnnotatedEndpoint[]) {
  return defineKpCanonicalEquationLessonDescriptor({
    id: "authored-common-factor", createAnimation: () => animation, compactTranscriptAvailable: true,
    bindStructuralAnchors: ({ root, state }: { root: HTMLElement; state: { id: string } }) => {
      const endpoint = endpoints.find(e => e.stateId === state.id);
      if (!endpoint) throw new Error("Unknown algebra native endpoint.");
      bindKpStructuredEquationSemanticEnvelopes({ root, endpoint, envelopeIds: endpoint.groupEnvelopes.map(e => e.id), realization: "virtual" });
    },
    stageLayoutCompiler: { apply: (input: Parameters<KpReaderEquationStageLayoutCompiler["apply"]>[0]) => applyKpSemanticEnvelopeEquationStageLayout({ ...input,
      endpoints: endpoints.map(e => ({ objectId: e.stateId, groupEnvelopes: e.groupEnvelopes })),
      envelopeDataKey: "kpEquationStageEnvelopeId", memberDataKey: "kpEquationStageMemberId", envelopeObservation: "member-paint-union", diagnosticLabel: "Authored algebra" }) },
    createStageLayoutIntent: (): KpEquationStageLayoutIntent => ({ executionState: "intent", geometryAuthority: "native-measurement", operationSpecificCoordinates: false,
      phases: animation.transformations.map(operation => ({ nodeId: operation.id, policy: "single-row", rows: [{ id: "row.common-factor.expression", role: "expression",
        envelopeIds: endpoints.filter(e => [...operation.sourceObjectIds, ...operation.targetObjectIds].includes(e.stateId)).flatMap(e => e.groupEnvelopes.map(g => g.id)) }] })) })
  });
}
