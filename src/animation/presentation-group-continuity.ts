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

export interface KpPresentationGroupGeometrySnapshot {
  readonly groupId: string;
  readonly ownerId: string;
  readonly progress: number;
  readonly anchorMemberId: string;
  readonly memberLocalRects: readonly {
    readonly memberId: string;
    readonly rect: KpPresentationRect;
  }[];
  readonly adjacentEdgeGaps: readonly {
    readonly leadingMemberId: string;
    readonly trailingMemberId: string;
    readonly horizontalPx: number;
    readonly verticalPx: number;
  }[];
}

export interface KpPresentationContinuityBudget {
  readonly positionPx: number;
  readonly sizePx: number;
  readonly velocityPxPerProgress: number;
  readonly opacity: number;
}

export interface KpPresentationContinuityIssue {
  readonly kind:
    | "missing-member"
    | "relative-position"
    | "relative-size"
    | "adjacent-gap"
    | "ink-bounds"
    | "ink-coverage"
    | "relative-velocity"
    | "endpoint";
  readonly memberId?: string | undefined;
  readonly residual: number;
  readonly budget: number;
  readonly message: string;
}

export const kpDefaultPresentationContinuityBudget:
  KpPresentationContinuityBudget = {
    positionPx: 0.5,
    sizePx: 0.5,
    velocityPxPerProgress: 1,
    opacity: 0.01
  };

export function observeKpMeasuredInk(
  rects: readonly KpPresentationRect[]
): KpPresentationInkObservation | undefined {
  if (rects.length === 0) return undefined;
  const rect = unionRects(rects);
  const area = rect.width * rect.height;
  const coveredArea = rects.reduce(
    (total, current) => total + current.width * current.height,
    0
  );
  return { rect, coverage: area === 0 ? 0 : Math.min(1, coveredArea / area) };
}

export function observeKpRasterInk(input: {
  readonly origin: KpPresentationPoint;
  readonly width: number;
  readonly height: number;
  readonly alpha: ArrayLike<number>;
  readonly alphaThreshold?: number | undefined;
}): KpPresentationInkObservation | undefined {
  if (input.alpha.length !== input.width * input.height) {
    throw new Error("Raster ink alpha length must match its dimensions.");
  }
  const threshold = input.alphaThreshold ?? 1;
  let left = input.width;
  let top = input.height;
  let right = -1;
  let bottom = -1;
  let covered = 0;
  for (let y = 0; y < input.height; y += 1) {
    for (let x = 0; x < input.width; x += 1) {
      if ((input.alpha[y * input.width + x] ?? 0) < threshold) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
      covered += 1;
    }
  }
  if (right < left || bottom < top) return undefined;
  const width = right - left + 1;
  const height = bottom - top + 1;
  return {
    rect: {
      x: input.origin.x + left,
      y: input.origin.y + top,
      width,
      height
    },
    coverage: covered / (width * height)
  };
}

export function observeKpCompositeInk(
  observations: readonly (KpPresentationInkObservation | undefined)[]
): KpPresentationInkObservation | undefined {
  const visible = observations.filter(
    (observation): observation is KpPresentationInkObservation =>
      observation !== undefined
  );
  if (visible.length === 0) return undefined;
  const rect = unionRects(visible.map((observation) => observation.rect));
  const weightedInk = visible.reduce(
    (total, observation) =>
      total +
      observation.rect.width *
        observation.rect.height *
        observation.coverage,
    0
  );
  return {
    rect,
    coverage: Math.min(1, weightedInk / (rect.width * rect.height))
  };
}

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

export function snapshotKpPresentationGroupGeometry(input: {
  readonly contract: KpPresentationGroupContract;
  readonly observation: KpPresentationOwnerObservation;
}): KpPresentationGroupGeometrySnapshot {
  if (input.observation.groupId !== input.contract.id) {
    throw new Error("Presentation observation must identify its group contract.");
  }
  const byId = new Map(
    input.observation.members.map((member) => [member.memberId, member] as const)
  );
  const ordered = [...input.contract.members]
    .sort((left, right) => left.nativeOrder - right.nativeOrder)
    .map((member) => {
      const observation = byId.get(member.memberId);
      if (observation === undefined) {
        throw new Error(`Missing presentation member ${member.memberId}.`);
      }
      return observation;
    });
  const anchor = byId.get(input.contract.settlementAnchorMemberId);
  if (anchor === undefined) {
    throw new Error("Presentation settlement anchor was not observed.");
  }
  return {
    groupId: input.contract.id,
    ownerId: input.observation.ownerId,
    progress: input.observation.progress,
    anchorMemberId: anchor.memberId,
    memberLocalRects: ordered.map((member) => ({
      memberId: member.memberId,
      rect: {
        x: member.rect.x - anchor.rect.x,
        y: member.rect.y - anchor.rect.y,
        width: member.rect.width,
        height: member.rect.height
      }
    })),
    adjacentEdgeGaps: ordered.slice(0, -1).map((leading, index) => {
      const trailing = ordered[index + 1]!;
      return {
        leadingMemberId: leading.memberId,
        trailingMemberId: trailing.memberId,
        horizontalPx:
          trailing.rect.x - (leading.rect.x + leading.rect.width),
        verticalPx: trailing.rect.y - leading.rect.y
      };
    })
  };
}

export function evaluateKpIntraOwnerContinuity(input: {
  readonly actual: KpPresentationGroupGeometrySnapshot;
  readonly native: KpPresentationGroupGeometrySnapshot;
  readonly budget?: KpPresentationContinuityBudget | undefined;
}): readonly KpPresentationContinuityIssue[] {
  const budget = input.budget ?? kpDefaultPresentationContinuityBudget;
  const issues: KpPresentationContinuityIssue[] = [];
  const nativeById = new Map(
    input.native.memberLocalRects.map((member) => [member.memberId, member.rect])
  );
  for (const member of input.actual.memberLocalRects) {
    const expected = nativeById.get(member.memberId);
    if (expected === undefined) {
      issues.push({
        kind: "missing-member",
        memberId: member.memberId,
        residual: Number.POSITIVE_INFINITY,
        budget: 0,
        message: `Native presentation is missing ${member.memberId}.`
      });
      continue;
    }
    const positionResidual = Math.max(
      Math.abs(member.rect.x - expected.x),
      Math.abs(member.rect.y - expected.y)
    );
    if (positionResidual > budget.positionPx) {
      issues.push({
        kind: "relative-position",
        memberId: member.memberId,
        residual: positionResidual,
        budget: budget.positionPx,
        message: `${member.memberId} has not reached its native-local position.`
      });
    }
    const sizeResidual = Math.max(
      Math.abs(member.rect.width - expected.width),
      Math.abs(member.rect.height - expected.height)
    );
    if (sizeResidual > budget.sizePx) {
      issues.push({
        kind: "relative-size",
        memberId: member.memberId,
        residual: sizeResidual,
        budget: budget.sizePx,
        message: `${member.memberId} has not reached its native size.`
      });
    }
  }
  input.actual.adjacentEdgeGaps.forEach((gap, index) => {
    const expected = input.native.adjacentEdgeGaps[index];
    const residual = expected === undefined
      ? Number.POSITIVE_INFINITY
      : Math.max(
          Math.abs(gap.horizontalPx - expected.horizontalPx),
          Math.abs(gap.verticalPx - expected.verticalPx)
        );
    if (residual > budget.positionPx) {
      issues.push({
        kind: "adjacent-gap",
        memberId: `${gap.leadingMemberId}:${gap.trailingMemberId}`,
        residual,
        budget: budget.positionPx,
        message: "Adjacent members have not reached their native edge gap."
      });
    }
  });
  return issues;
}

export function evaluateKpInterOwnerEquivalence(input: {
  readonly outgoing: KpPresentationOwnerObservation;
  readonly incoming: KpPresentationOwnerObservation;
  readonly contract: KpPresentationGroupContract;
  readonly budget?: KpPresentationContinuityBudget | undefined;
}): readonly KpPresentationContinuityIssue[] {
  const budget = input.budget ?? kpDefaultPresentationContinuityBudget;
  const issues = [...evaluateKpIntraOwnerContinuity({
    actual: snapshotKpPresentationGroupGeometry({
      contract: input.contract,
      observation: input.outgoing
    }),
    native: snapshotKpPresentationGroupGeometry({
      contract: input.contract,
      observation: input.incoming
    }),
    budget
  })];
  if (input.outgoing.ink === undefined || input.incoming.ink === undefined) {
    issues.push({
      kind: "ink-bounds",
      residual: Number.POSITIVE_INFINITY,
      budget: budget.positionPx,
      message: "Both presentation owners must expose rendered ink."
    });
    return issues;
  }
  const boundsResidual = Math.max(
    Math.abs(input.outgoing.ink.rect.x - input.incoming.ink.rect.x),
    Math.abs(input.outgoing.ink.rect.y - input.incoming.ink.rect.y),
    Math.abs(input.outgoing.ink.rect.width - input.incoming.ink.rect.width),
    Math.abs(input.outgoing.ink.rect.height - input.incoming.ink.rect.height)
  );
  if (boundsResidual > Math.max(budget.positionPx, budget.sizePx)) {
    issues.push({
      kind: "ink-bounds",
      residual: boundsResidual,
      budget: Math.max(budget.positionPx, budget.sizePx),
      message: "Outgoing and incoming rendered ink bounds are not equivalent."
    });
  }
  const coverageResidual = Math.abs(
    input.outgoing.ink.coverage - input.incoming.ink.coverage
  );
  if (coverageResidual > budget.opacity) {
    issues.push({
      kind: "ink-coverage",
      residual: coverageResidual,
      budget: budget.opacity,
      message: "Outgoing and incoming rendered ink coverage is not equivalent."
    });
  }
  return issues;
}

function requireText(value: string, label: string): string {
  if (value.trim().length === 0) throw new Error(`Presentation group requires ${label}.`);
  return value;
}

function unionRects(rects: readonly KpPresentationRect[]): KpPresentationRect {
  const left = Math.min(...rects.map((rect) => rect.x));
  const top = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}
