export interface KpPresentationPoint {
  readonly x: number;
  readonly y: number;
}

export interface KpPresentationRect extends KpPresentationPoint {
  readonly width: number;
  readonly height: number;
}

export interface KpPresentationGroupMemberContract {
  readonly memberId: string;
  readonly semanticEntityId: string;
  readonly nativeOrder: number;
}

export interface KpPresentationGroupContract {
  readonly id: string;
  readonly kind: "presentation-group";
  readonly members: readonly KpPresentationGroupMemberContract[];
  readonly settlementAnchorMemberId: string;
  readonly nativeOwnerId: string;
  readonly cohesionLockProgress: number;
}

export type KpPresentationGroupExemptionReason =
  | "independent-targets"
  | "nonvisual-structure"
  | "single-member-target";

export interface KpPresentationGroupExemption {
  readonly id: string;
  readonly kind: "presentation-group-exemption";
  readonly semanticEntityIds: readonly string[];
  readonly reason: KpPresentationGroupExemptionReason;
  readonly rationale: string;
}

export type KpPresentationGroupDeclaration =
  | KpPresentationGroupContract
  | KpPresentationGroupExemption;

export interface KpCompoundTargetDescriptor {
  readonly id: string;
  readonly nativeOwnerId: string;
  readonly memberBindings: readonly {
    readonly memberId: string;
    readonly semanticEntityId: string;
    readonly correspondenceOrder: number;
  }[];
  readonly cohesionLockProgress?: number | undefined;
  readonly exemption?: {
    readonly reason: KpPresentationGroupExemptionReason;
    readonly rationale: string;
  } | undefined;
}

export interface KpPresentationMemberObservation {
  readonly memberId: string;
  readonly rect: KpPresentationRect;
  readonly opacity: number;
}

export interface KpPresentationInkObservation {
  readonly rect: KpPresentationRect;
  readonly coverage: number;
}

export interface KpPresentationOwnerObservation {
  readonly groupId: string;
  readonly ownerId: string;
  readonly progress: number;
  readonly members: readonly KpPresentationMemberObservation[];
  readonly ink?: KpPresentationInkObservation | undefined;
}

export interface KpPresentationContinuityBudget {
  readonly positionPx: number;
  readonly sizePx: number;
  readonly velocityPxPerProgress: number;
  readonly opacity: number;
}

export const kpDefaultPresentationContinuityBudget:
  KpPresentationContinuityBudget = {
    positionPx: 0.5,
    sizePx: 0.5,
    velocityPxPerProgress: 1,
    opacity: 0.01
  };

export function compileKpCompoundTargetDeclarations(
  descriptors: readonly KpCompoundTargetDescriptor[]
): readonly KpPresentationGroupDeclaration[] {
  return descriptors.map((descriptor) => {
    const members = [...descriptor.memberBindings]
      .sort((left, right) =>
        left.correspondenceOrder - right.correspondenceOrder ||
        left.semanticEntityId.localeCompare(right.semanticEntityId))
      .map((member, nativeOrder) => ({
        memberId: member.memberId,
        semanticEntityId: member.semanticEntityId,
        nativeOrder
      }));
    if (descriptor.exemption !== undefined) {
      return {
        id: descriptor.id,
        kind: "presentation-group-exemption",
        semanticEntityIds: members.map((member) => member.semanticEntityId),
        reason: descriptor.exemption.reason,
        rationale: requireText(descriptor.exemption.rationale, "exemption rationale")
      };
    }
    if (members.length < 2) {
      throw new Error(
        `Compound target ${descriptor.id} needs at least two members or a typed exemption.`
      );
    }
    const cohesionLockProgress = descriptor.cohesionLockProgress ?? 0.72;
    if (!(cohesionLockProgress >= 0 && cohesionLockProgress <= 1)) {
      throw new Error(`Compound target ${descriptor.id} has an invalid cohesion lock.`);
    }
    return {
      id: descriptor.id,
      kind: "presentation-group",
      members,
      settlementAnchorMemberId: members[0]!.memberId,
      nativeOwnerId: requireText(descriptor.nativeOwnerId, "native owner"),
      cohesionLockProgress
    };
  });
}

function requireText(value: string, label: string): string {
  if (value.trim().length === 0) throw new Error(`Presentation group requires ${label}.`);
  return value;
}
