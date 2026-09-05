import type { KpSemanticSlotId } from "./identity.ts";
import type {
  KpSemanticStateTransitionDeclaration,
  KpSemanticStateTransitionPlan,
  KpSemanticStateTransitionTarget
} from "./state-family-transition.ts";

export type KpSemanticStateTransitionWriteClass =
  | "semantic-write"
  | "discrete-write"
  | "presentation-only";

export interface KpSemanticStateTransitionFootprintEntry {
  readonly schemaVersion: "kp.semantic-state-transition-footprint-entry.v1";
  readonly kind: "semantic-state-transition-footprint-entry";
  readonly writeClass: KpSemanticStateTransitionWriteClass;
  readonly declarationId: string;
  readonly sourceId: string;
  readonly target: KpSemanticStateTransitionTarget;
}

export interface KpSemanticStateTransitionFootprint {
  readonly schemaVersion: "kp.semantic-state-transition-footprint.v1";
  readonly kind: "semantic-state-transition-footprint";
  readonly namespace: string;
  readonly semanticWrites:
    readonly KpSemanticStateTransitionFootprintEntry[];
  readonly discreteWrites:
    readonly KpSemanticStateTransitionFootprintEntry[];
  readonly presentationOnly:
    readonly KpSemanticStateTransitionFootprintEntry[];
  readonly targetIndex: Readonly<
    Partial<Record<KpSemanticSlotId, KpSemanticStateTransitionWriteClass>>
  >;
}

export type KpSemanticStateTransitionFootprintErrorCode =
  | "derived-semantic-write"
  | "duplicate-footprint-target"
  | "foreign-footprint-target";

export class KpSemanticStateTransitionFootprintError extends Error {
  readonly code: KpSemanticStateTransitionFootprintErrorCode;
  readonly declarationId: string;
  readonly targetSlotId: KpSemanticSlotId;

  constructor(input: {
    readonly code: KpSemanticStateTransitionFootprintErrorCode;
    readonly declaration: KpSemanticStateTransitionDeclaration;
    readonly message: string;
  }) {
    super(input.message);
    this.name = "KpSemanticStateTransitionFootprintError";
    this.code = input.code;
    this.declarationId = input.declaration.id;
    this.targetSlotId = input.declaration.target.slotId;
  }
}

export function projectKpSemanticStateTransitionFootprint(
  plan: KpSemanticStateTransitionPlan
): KpSemanticStateTransitionFootprint {
  const semanticWrites: KpSemanticStateTransitionFootprintEntry[] = [];
  const discreteWrites: KpSemanticStateTransitionFootprintEntry[] = [];
  const presentationOnly: KpSemanticStateTransitionFootprintEntry[] = [];
  const seen = new Map<
    KpSemanticSlotId,
    KpSemanticStateTransitionDeclaration
  >();

  for (const declaration of plan.declarations) {
    if (declaration.target.namespace !== plan.namespace) {
      fail(
        "foreign-footprint-target",
        declaration,
        `Transition ${JSON.stringify(declaration.id)} targets schema ${JSON.stringify(declaration.target.namespace)}, not footprint schema ${JSON.stringify(plan.namespace)}.`
      );
    }
    if (declaration.transitionMode !== "presentation-only" &&
      declaration.target.descriptorKind === "derived-value") {
      fail(
        "derived-semantic-write",
        declaration,
        `Transition ${JSON.stringify(declaration.id)} cannot write derived target ${JSON.stringify(declaration.target.encodedPath)}.`
      );
    }

    const prior = seen.get(declaration.target.slotId);
    if (prior !== undefined) {
      if (areExactDeclarationsEqual(prior, declaration)) continue;
      fail(
        "duplicate-footprint-target",
        declaration,
        `Transition target ${JSON.stringify(declaration.target.encodedPath)} has competing footprint owners ${JSON.stringify(prior.id)} and ${JSON.stringify(declaration.id)}.`
      );
    }
    seen.set(declaration.target.slotId, declaration);
    const entry = createEntry(declaration);
    if (entry.writeClass === "semantic-write") {
      semanticWrites.push(entry);
    } else if (entry.writeClass === "discrete-write") {
      discreteWrites.push(entry);
    } else {
      presentationOnly.push(entry);
    }
  }

  const compareEntries = (
    left: KpSemanticStateTransitionFootprintEntry,
    right: KpSemanticStateTransitionFootprintEntry
  ) => left.target.encodedPath.localeCompare(right.target.encodedPath) ||
    left.declarationId.localeCompare(right.declarationId);
  semanticWrites.sort(compareEntries);
  discreteWrites.sort(compareEntries);
  presentationOnly.sort(compareEntries);
  const targetIndex: Partial<
    Record<KpSemanticSlotId, KpSemanticStateTransitionWriteClass>
  > = {};
  for (const entry of [
    ...semanticWrites,
    ...discreteWrites,
    ...presentationOnly
  ]) {
    targetIndex[entry.target.slotId] = entry.writeClass;
  }

  return Object.freeze({
    schemaVersion: "kp.semantic-state-transition-footprint.v1",
    kind: "semantic-state-transition-footprint",
    namespace: plan.namespace,
    semanticWrites: Object.freeze(semanticWrites),
    discreteWrites: Object.freeze(discreteWrites),
    presentationOnly: Object.freeze(presentationOnly),
    targetIndex: Object.freeze(targetIndex)
  });
}

function createEntry(
  declaration: KpSemanticStateTransitionDeclaration
): KpSemanticStateTransitionFootprintEntry {
  const writeClass = declaration.transitionMode === "semantic-interpolation"
    ? "semantic-write"
    : declaration.transitionMode === "discrete"
      ? "discrete-write"
      : "presentation-only";
  return Object.freeze({
    schemaVersion: "kp.semantic-state-transition-footprint-entry.v1",
    kind: "semantic-state-transition-footprint-entry",
    writeClass,
    declarationId: declaration.id,
    sourceId: declaration.source.id,
    target: declaration.target
  });
}

function areExactDeclarationsEqual(
  left: KpSemanticStateTransitionDeclaration,
  right: KpSemanticStateTransitionDeclaration
): boolean {
  return left.id === right.id &&
    left.source.id === right.source.id &&
    left.transitionMode === right.transitionMode &&
    left.target.namespace === right.target.namespace &&
    left.target.slotId === right.target.slotId &&
    left.target.encodedPath === right.target.encodedPath &&
    left.target.descriptorKind === right.target.descriptorKind &&
    left.target.path.length === right.target.path.length &&
    left.target.path.every((segment, index) => segment === right.target.path[index]);
}

function fail(
  code: KpSemanticStateTransitionFootprintErrorCode,
  declaration: KpSemanticStateTransitionDeclaration,
  message: string
): never {
  throw new KpSemanticStateTransitionFootprintError({
    code,
    declaration,
    message
  });
}
