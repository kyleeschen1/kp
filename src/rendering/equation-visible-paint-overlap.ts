export type KpEquationVisiblePaintAuthority =
  | "source-native"
  | "target-native"
  | "material";

export interface KpEquationVisiblePaintObservation {
  readonly ownerId: string;
  readonly semanticEntityId?: string | undefined;
  readonly rowId?: string | undefined;
  readonly authority: KpEquationVisiblePaintAuthority;
  readonly rect: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
  readonly opacity: number;
}

export type KpEquationVisiblePaintIntersectionKind =
  | "native-native"
  | "native-material"
  | "material-material";

export interface KpEquationVisiblePaintIntersection {
  readonly kind: KpEquationVisiblePaintIntersectionKind;
  readonly leftOwnerId: string;
  readonly rightOwnerId: string;
  readonly leftSemanticEntityId?: string | undefined;
  readonly rightSemanticEntityId?: string | undefined;
  readonly leftRowId?: string | undefined;
  readonly rightRowId?: string | undefined;
  readonly width: number;
  readonly height: number;
}

export interface KpEquationVisiblePaintOverlapReport {
  readonly kind: "equation-visible-paint-overlap-report";
  readonly progress: number;
  readonly viewportId: string;
  readonly observationCount: number;
  readonly intersections: readonly KpEquationVisiblePaintIntersection[];
}

export type KpEquationVisiblePaintContactReason =
  | "native-handoff"
  | "semantic-fusion"
  | "semantic-fission"
  | "typographic-adjacency";

export interface KpEquationVisiblePaintContactAllowance {
  readonly id: string;
  readonly ownerIds: readonly [string, string];
  readonly reason: KpEquationVisiblePaintContactReason;
  readonly maximumOverlapWidthPx: number;
  readonly maximumOverlapHeightPx: number;
}

export interface KpEquationVisiblePaintContactEvaluation {
  readonly kind: "equation-visible-paint-contact-evaluation";
  readonly passed: boolean;
  readonly allowed: readonly {
    readonly intersection: KpEquationVisiblePaintIntersection;
    readonly allowanceId: string;
    readonly reason: KpEquationVisiblePaintContactReason;
  }[];
  readonly violations: readonly KpEquationVisiblePaintIntersection[];
}

/**
 * Reports geometry only. Semantic contact is classified separately so a
 * handoff or fusion cannot disappear merely because both owners share an id.
 */
export function inspectKpEquationVisiblePaintOverlap(input: {
  readonly progress: number;
  readonly viewportId: string;
  readonly observations: readonly KpEquationVisiblePaintObservation[];
  readonly visibleOpacityThreshold?: number | undefined;
  readonly contactTolerancePx?: number | undefined;
}): KpEquationVisiblePaintOverlapReport {
  const visibleOpacityThreshold =
    finiteUnit(input.visibleOpacityThreshold ?? 0.01, "visible opacity threshold");
  const contactTolerancePx =
    nonNegative(input.contactTolerancePx ?? 0.25, "contact tolerance");
  const progress = finiteUnit(input.progress, "progress");
  if (input.viewportId.trim() === "") {
    throw new Error("Visible paint overlap inspection requires a viewport id.");
  }
  const ownerIds = new Set<string>();
  const visible = input.observations.flatMap((observation) => {
    validateObservation(observation);
    if (ownerIds.has(observation.ownerId)) {
      throw new Error(`Duplicate visible paint owner ${observation.ownerId}.`);
    }
    ownerIds.add(observation.ownerId);
    return observation.opacity <= visibleOpacityThreshold ? [] : [observation];
  });
  const intersections = visible.flatMap((left, leftIndex) =>
    visible.slice(leftIndex + 1).flatMap((right) => {
      const width = Math.min(
        left.rect.left + left.rect.width,
        right.rect.left + right.rect.width
      ) - Math.max(left.rect.left, right.rect.left);
      const height = Math.min(
        left.rect.top + left.rect.height,
        right.rect.top + right.rect.height
      ) - Math.max(left.rect.top, right.rect.top);
      if (width <= contactTolerancePx || height <= contactTolerancePx) return [];
      return [Object.freeze({
        kind: intersectionKind(left.authority, right.authority),
        leftOwnerId: left.ownerId,
        rightOwnerId: right.ownerId,
        ...(left.semanticEntityId === undefined
          ? {}
          : { leftSemanticEntityId: left.semanticEntityId }),
        ...(right.semanticEntityId === undefined
          ? {}
          : { rightSemanticEntityId: right.semanticEntityId }),
        ...(left.rowId === undefined ? {} : { leftRowId: left.rowId }),
        ...(right.rowId === undefined ? {} : { rightRowId: right.rowId }),
        width,
        height
      })];
    })
  );
  return Object.freeze({
    kind: "equation-visible-paint-overlap-report" as const,
    progress,
    viewportId: input.viewportId,
    observationCount: visible.length,
    intersections: Object.freeze(intersections)
  });
}

export function evaluateKpEquationVisiblePaintContact(input: {
  readonly report: KpEquationVisiblePaintOverlapReport;
  readonly allowances: readonly KpEquationVisiblePaintContactAllowance[];
}): KpEquationVisiblePaintContactEvaluation {
  const allowances = new Map<string, KpEquationVisiblePaintContactAllowance>();
  for (const allowance of input.allowances) {
    if (allowance.id.trim() === "") {
      throw new Error("Visible paint contact allowances require ids.");
    }
    const [leftOwnerId, rightOwnerId] = allowance.ownerIds;
    if (leftOwnerId.trim() === "" || rightOwnerId.trim() === "") {
      throw new Error(`${allowance.id} requires two paint owners.`);
    }
    if (leftOwnerId === rightOwnerId) {
      throw new Error(`${allowance.id} cannot allow self-contact.`);
    }
    nonNegative(
      allowance.maximumOverlapWidthPx,
      `${allowance.id} maximum overlap width`
    );
    nonNegative(
      allowance.maximumOverlapHeightPx,
      `${allowance.id} maximum overlap height`
    );
    const key = ownerPairKey(leftOwnerId, rightOwnerId);
    if (allowances.has(key)) {
      throw new Error(
        `Duplicate visible paint contact allowance for ${key}.`
      );
    }
    allowances.set(key, allowance);
  }
  const allowed: KpEquationVisiblePaintContactEvaluation["allowed"][number][] =
    [];
  const violations: KpEquationVisiblePaintIntersection[] = [];
  for (const intersection of input.report.intersections) {
    const allowance = allowances.get(ownerPairKey(
      intersection.leftOwnerId,
      intersection.rightOwnerId
    ));
    if (
      allowance === undefined ||
      intersection.width > allowance.maximumOverlapWidthPx ||
      intersection.height > allowance.maximumOverlapHeightPx
    ) {
      violations.push(intersection);
      continue;
    }
    allowed.push(Object.freeze({
      intersection,
      allowanceId: allowance.id,
      reason: allowance.reason
    }));
  }
  return Object.freeze({
    kind: "equation-visible-paint-contact-evaluation" as const,
    passed: violations.length === 0,
    allowed: Object.freeze(allowed),
    violations: Object.freeze(violations)
  });
}

function ownerPairKey(leftOwnerId: string, rightOwnerId: string): string {
  return [leftOwnerId, rightOwnerId].sort().join("\u0000");
}

function intersectionKind(
  left: KpEquationVisiblePaintAuthority,
  right: KpEquationVisiblePaintAuthority
): KpEquationVisiblePaintIntersectionKind {
  if (left === "material" && right === "material") return "material-material";
  if (left === "material" || right === "material") return "native-material";
  return "native-native";
}

function validateObservation(
  observation: KpEquationVisiblePaintObservation
): void {
  if (observation.ownerId.trim() === "") {
    throw new Error("Visible paint observations require owner ids.");
  }
  for (const [label, value] of Object.entries(observation.rect)) {
    finite(value, `${observation.ownerId} ${label}`);
  }
  nonNegative(observation.rect.width, `${observation.ownerId} width`);
  nonNegative(observation.rect.height, `${observation.ownerId} height`);
  finiteUnit(observation.opacity, `${observation.ownerId} opacity`);
}

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite.`);
  return value;
}

function nonNegative(value: number, label: string): number {
  finite(value, label);
  if (value < 0) throw new RangeError(`${label} must not be negative.`);
  return value;
}

function finiteUnit(value: number, label: string): number {
  finite(value, label);
  if (value < 0 || value > 1) {
    throw new RangeError(`${label} must be between zero and one.`);
  }
  return value;
}
