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
