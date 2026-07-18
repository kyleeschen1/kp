import type {
  KpAnimationSaliencePlan,
  KpAnimationSalienceIntent
} from "../animation/salience-plan.ts";
import type { KpCrossViewCorrespondenceMap } from "./cross-view-correspondence.ts";

export interface KpCrossViewAttentionTransmission {
  readonly id: string;
  readonly correspondenceId: string;
  readonly salienceIntentId: string;
  readonly releaseMemberId: string;
  readonly receiveMemberId: string;
}

export interface KpCrossViewAttentionPlan {
  readonly id: string;
  readonly salience: KpAnimationSaliencePlan;
  readonly transmissions: readonly KpCrossViewAttentionTransmission[];
}

export function compileKpCrossViewAttentionPlan(input: {
  readonly id: string;
  readonly map: KpCrossViewCorrespondenceMap;
  readonly correspondenceIds: readonly string[];
}): KpCrossViewAttentionPlan {
  const members = new Map(input.map.members.map((member) => [member.id, member]));
  const correspondences = new Map(
    input.map.correspondences.map((correspondence) => [
      correspondence.id,
      correspondence
    ])
  );
  const transmissions = input.correspondenceIds.map(
    (correspondenceId, index): KpCrossViewAttentionTransmission => {
      const correspondence = correspondences.get(correspondenceId);
      if (correspondence === undefined) {
        throw new Error(`Unknown cross-view correspondence ${correspondenceId}.`);
      }
      if (
        !members.has(correspondence.sourceMemberId) ||
        !members.has(correspondence.targetMemberId)
      ) {
        throw new Error(`Cross-view correspondence ${correspondenceId} is not closed.`);
      }
      return {
        id: `${input.id}.transmission.${index}`,
        correspondenceId,
        salienceIntentId: `${input.id}.intent.${index}`,
        releaseMemberId: correspondence.sourceMemberId,
        receiveMemberId: correspondence.targetMemberId
      };
    }
  );
  const intents: KpAnimationSalienceIntent[] = transmissions.map(
    (transmission) => {
      const correspondence = correspondences.get(transmission.correspondenceId)!;
      return {
        id: transmission.salienceIntentId,
        kind: "transmit",
        sourceEntityIds: [members.get(transmission.releaseMemberId)!.selectorId],
        targetEntityIds: [members.get(transmission.receiveMemberId)!.selectorId],
        summary: correspondence.summary
      };
    }
  );

  return {
    id: input.id,
    salience: {
      id: `${input.id}.salience`,
      kind: "animation-salience-plan",
      intents
    },
    transmissions
  };
}
