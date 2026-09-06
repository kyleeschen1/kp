import { createKpAuthoredDistributionExplanation } from "./distribution-explanation.ts";
import { readKpAuthoredDistributionOperation, KpAuthoredDistributionOperationError } from "./distribution-operation.ts";
import { createKpFractionCompositionEquationAnimationAsset } from "../../animation/fraction-composition-equation-adapter.ts";
import { createKpAnimationAsset } from "../../animation/asset.ts";
import { createKpAssetBundle, createKpSemanticAssetObject } from "../../semantic/asset.ts";
import { createKpSemanticTransformation } from "../../semantic/asset-transformation.ts";
import { createKpStructuredEquationEndpointSpec } from "../../semantic/structured-equation-endpoint-spec.ts";
import { pinKpSemanticSlotVersion } from "../../semantic-state/pinned-recovery.ts";
import { compileKpGovernedCanonicalConstruction, createKpGovernedCanonicalConstructionRequest,
  planKpGovernedConstructionRepairs, type KpGovernedConstructionRepair } from "../../authoring/canonical-animation-public-api.ts";

export class KpAuthoredDistributionProjectionError extends Error {
  readonly code = "kp.authoring.structural-projection-gap";
  readonly repairs: readonly KpGovernedConstructionRepair[];
  constructor(repairs: readonly KpGovernedConstructionRepair[]) {
    super("The governed distribution projection requires repair; no fallback animation was selected.");
    this.name = "KpAuthoredDistributionProjectionError";
    this.repairs = repairs;
  }
}

/** Bounded fixture integration, not a public arbitrary-equation generator. */
export function createKpAuthoredDistributionProjection(namespace?: string) {
  const data = createKpAuthoredDistributionExplanation(namespace);
  const operation = readKpAuthoredDistributionOperation(data.receipt);
  const application = data.explanation.chain.applications[0]!.application;
  const lower = (candidate: typeof application) => {
    // Value/ID equality is not the local operation capability. Only this
    // explanation's executed application can enter its lowering boundary.
    if (candidate !== application) throw new KpAuthoredDistributionOperationError(
      "kp.authoring.structural-receipt-gap", "Use this explanation's verified distribution application.");
    operation.selection.assertCurrent(candidate.commit.before);
    const { model } = data.authored;
    const equations = [candidate.commit.before, candidate.commit.after].map(snapshot => model.handles.pin(snapshot).equation.read());
    if (JSON.stringify(equations) !== JSON.stringify([operation.source, operation.target])) throw new KpAuthoredDistributionOperationError(
      "kp.authoring.structural-source-gap", "Committed endpoints no longer match the verified operation.");
    const canonical = createKpFractionCompositionEquationAnimationAsset();
    const endpoints = new Map(equations.map(equation => [equation.id, createKpStructuredEquationEndpointSpec(equation)]));
    // Retain the reviewed chain and all presentation contracts. Only the two
    // distribution endpoint values are projected from aggregate-backed truth.
    const bundle = createKpAssetBundle({ ...canonical.bundle, objects: canonical.bundle.objects.map(object => {
      const endpoint = endpoints.get(object.id);
      return endpoint === undefined ? object : createKpSemanticAssetObject({ ...object,
        value: { latex: endpoint.segments.map(segment => segment.latex).join(""), accessibleText: endpoint.accessibleText } });
    }) });
    const transformations = canonical.transformations.map(transformation => transformation.id === operation.transformation.id
      ? createKpSemanticTransformation({ ...transformation, definitionId: operation.definitionId }) : transformation);
    const animation = createKpAnimationAsset({ ...canonical, bundle, transformations });
    const before = pinKpSemanticSlotVersion(candidate.commit.before, model.handles.refs.equation.slotId);
    const after = pinKpSemanticSlotVersion(candidate.commit.after, model.handles.refs.equation.slotId);
    const source = { sourceId: bundle.id, revisionId: `${before.versionId}:${after.versionId}`, operationPacks: operation.operationPacks };
    const objectIds = equations.map(equation => equation.id);
    const operationIds = [operation.transformation.id];
    const request = createKpGovernedCanonicalConstructionRequest({
      schemaVersion: "kp.governed-semantic-authoring-request.v2", id: "request.authoring-structural.distribution",
      source: { kind: "verified-semantic-source", ...source }, approvedObjectIds: objectIds, approvedOperationIds: operationIds,
      explanationPurpose: { kind: "transmit", objectIds, operationIds }, detailLevel: "complete",
      compositionIntent: { kind: "sequence", operationIds }
    });
    const authority = { ...source, animation };
    const repairs = planKpGovernedConstructionRepairs({ request, authority });
    if (repairs.length > 0) throw new KpAuthoredDistributionProjectionError(repairs);
    const governed = compileKpGovernedCanonicalConstruction({ request, authority });
    return Object.freeze({ animation, governed, request, authority, before, after });
  };
  return Object.freeze({ data, application, projection: lower(application), lower });
}
