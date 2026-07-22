import {
  createFractionalLinearCertifiedTransferProjection
} from "../../semantic/fractional-linear-certified-transfer.ts";
import { kpFractionalLinearCertifiedTransferProxyRecordId } from "../../semantic/fractional-linear-certified-transfer-contract.ts";
import type {
  KpReaderEquationMaterialPlan,
  KpReaderEquationMaterialOwnerPlan
} from "./equation-material-plan.ts";

const transformationId = "transform.fractional-linear.project-certified-transfer";

/** Rendering joins two proof-backed lifecycle owners; semantic correspondence
 * remains removal plus introduction and therefore never asserts identity. */
export function projectKpCertifiedTransferMaterialPlan(
  plan: KpReaderEquationMaterialPlan
): KpReaderEquationMaterialPlan {
  const projection = createFractionalLinearCertifiedTransferProjection();
  return {
    ...plan,
    transitions: plan.transitions.map((transition) => {
      if (transition.transitionId !== transformationId) return transition;
      const denominator = ownerForSelector(
        transition.owners,
        `anchor.${projection.denominatorProxy.sourceSelectorId}`
      );
      const multiplier = ownerForSelector(
        transition.owners,
        `anchor.${projection.denominatorProxy.bridgeSelectorId}`
      );
      const proxy: KpReaderEquationMaterialOwnerPlan = {
        id: `material-owner.${kpFractionalLinearCertifiedTransferProxyRecordId}`,
        transitionId: transformationId,
        relationRecordId: kpFractionalLinearCertifiedTransferProxyRecordId,
        relation: "artifact",
        lifecycle: "role-change",
        continuity: "source-target",
        sourceAnchorIds: [...denominator.sourceAnchorIds],
        targetAnchorIds: [...multiplier.targetAnchorIds],
        seedAnchorId: denominator.seedAnchorId,
        focused: denominator.focused || multiplier.focused
      };
      return {
        ...transition,
        owners: [
          ...transition.owners.filter((owner) =>
            owner.id !== denominator.id && owner.id !== multiplier.id
          ),
          proxy
        ]
      };
    })
  };
}

function ownerForSelector(
  owners: readonly KpReaderEquationMaterialOwnerPlan[],
  anchorId: string
): KpReaderEquationMaterialOwnerPlan {
  const owner = owners.find((candidate) =>
    candidate.sourceAnchorIds.includes(anchorId) ||
    candidate.targetAnchorIds.includes(anchorId)
  );
  if (owner === undefined) {
    throw new Error(`Certified transfer material projection is missing ${anchorId}.`);
  }
  return owner;
}
