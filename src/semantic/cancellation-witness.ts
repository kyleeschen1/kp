import type { KpAssetBundle } from "./asset.ts";
import type { KpSemanticTransformation } from "./asset-transformation.ts";
import type { KpCanonicalOperationRegistry } from "./canonical-operation-registry-types.ts";
import {
  cancellationOperationAuthority
} from "./cancellation-operation-authority.ts";

export type KpCancellationWitnessId =
  | "witness.additive-identity.zero"
  | "witness.multiplicative-identity.one";

export interface KpCancellationWitnessDescriptor {
  readonly id: KpCancellationWitnessId;
  readonly identityKind: "additive" | "multiplicative";
  readonly semanticValue: {
    readonly kind: "integer";
    readonly integer: 0 | 1;
    readonly latex: "0" | "1";
    readonly spoken: "zero" | "one";
  };
  readonly lawId: string;
}

export const kpCancellationWitnessDescriptors:
  readonly KpCancellationWitnessDescriptor[] = [
    {
      id: "witness.additive-identity.zero",
      identityKind: "additive",
      semanticValue: {
        kind: "integer",
        integer: 0,
        latex: "0",
        spoken: "zero"
      },
      lawId: "law.algebra.cancel-additive-inverses"
    },
    {
      id: "witness.multiplicative-identity.one",
      identityKind: "multiplicative",
      semanticValue: {
        kind: "integer",
        integer: 1,
        latex: "1",
        spoken: "one"
      },
      lawId: "law.algebra.cancel-multiplicative-inverses"
    }
  ];

export interface KpCancellationWitnessSlot {
  readonly id: string;
  readonly ownerObjectId: string;
  readonly placement: "cancelled-source-span";
  readonly sourceSelectorIds: readonly string[];
  readonly survivorAnchorSelectorIds: readonly string[];
}

export interface KpCancellationWitness {
  readonly kind: "cancellation-witness";
  readonly id: string;
  readonly descriptorId: KpCancellationWitnessId;
  readonly operationId: string;
  readonly transformationId: string;
  readonly correspondenceRecordId: string;
  readonly identityKind: KpCancellationWitnessDescriptor["identityKind"];
  readonly semanticValue: KpCancellationWitnessDescriptor["semanticValue"];
  readonly authority: {
    readonly operationContractAuthorityId: string;
    readonly lawId: string;
  };
  readonly slot: KpCancellationWitnessSlot;
  readonly presentation: {
    readonly mode: "presentation-controlled-transient";
    readonly requiredOrdering: readonly [
      "after-contact",
      "before-survivor-compaction"
    ];
  };
}

export type KpCancellationWitnessIssueCode =
  | "undeclared-witness"
  | "invalid-cancellation-record"
  | "mixed-slot-owners"
  | "slot-source-mismatch"
  | "invalid-slot-anchor"
  | "invented-value"
  | "invalid-presentation-authority";

export interface KpCancellationWitnessIssue {
  readonly code: KpCancellationWitnessIssueCode;
  readonly path: string;
  readonly message: string;
}

export function deriveKpCancellationWitness(input: {
  readonly operationId: string;
  readonly transformation: KpSemanticTransformation;
  readonly bundle: KpAssetBundle;
  readonly cancellationRecordId: string;
  readonly slotId: string;
  readonly survivorAnchorSelectorIds: readonly string[];
  readonly registry?: KpCanonicalOperationRegistry | undefined;
}): KpCancellationWitness {
  const registryEntry = input.registry?.entries.find((candidate) =>
    candidate.id === input.operationId
  );
  const defaultAuthority = input.registry === undefined
    ? cancellationOperationAuthority(input.operationId)
    : undefined;
  if (registryEntry === undefined && defaultAuthority === undefined) {
    throw new Error(`Unknown cancellation operation ${input.operationId}.`);
  }
  const sourceTransformType = registryEntry?.sourceTransformType ??
    defaultAuthority!.sourceTransformType;
  if (
    sourceTransformType !== undefined &&
    sourceTransformType !== input.transformation.transformType
  ) {
    throw new Error(
      `Cancellation operation ${input.operationId} does not authorize transform ${input.transformation.transformType}.`
    );
  }
  const descriptor = witnessDescriptorForContract(
    input.operationId,
    registryEntry?.contract.witnessIds ?? [defaultAuthority!.witnessId]
  );
  const record = input.transformation.correspondenceMap?.records.find(
    (candidate) => candidate.id === input.cancellationRecordId
  );
  if (record === undefined || record.relation !== "cancelation") {
    throw new Error(
      `Cancellation witness requires cancelation record ${input.cancellationRecordId}.`
    );
  }
  if (record.sourceSelectorIds.length < 2 || record.targetSelectorIds.length > 0) {
    throw new Error(
      `Cancellation record ${record.id} must remove at least two source selectors and no targets.`
    );
  }
  const selectorOwners = selectorOwnerMap(input.bundle);
  const sourceOwnerIds = new Set(record.sourceSelectorIds.map((selectorId) =>
    requiredOwner(selectorOwners, selectorId)
  ));
  if (sourceOwnerIds.size !== 1) {
    throw new Error(
      `Cancellation record ${record.id} spans multiple algebraic slot owners.`
    );
  }
  const ownerObjectId = [...sourceOwnerIds][0]!;
  input.survivorAnchorSelectorIds.forEach((selectorId) => {
    if (requiredOwner(selectorOwners, selectorId) !== ownerObjectId) {
      throw new Error(
        `Cancellation slot anchor ${selectorId} is not owned by ${ownerObjectId}.`
      );
    }
    if (record.sourceSelectorIds.includes(selectorId)) {
      throw new Error(
        `Cancellation slot anchor ${selectorId} cannot also be canceled material.`
      );
    }
  });
  const witness: KpCancellationWitness = {
    kind: "cancellation-witness",
    id: `${input.transformation.id}.${record.id}.${descriptor.id}`,
    descriptorId: descriptor.id,
    operationId: input.operationId,
    transformationId: input.transformation.id,
    correspondenceRecordId: record.id,
    identityKind: descriptor.identityKind,
    semanticValue: { ...descriptor.semanticValue },
    authority: {
      operationContractAuthorityId:
        registryEntry === undefined
          ? `${defaultAuthority!.authority.kind}:${defaultAuthority!.authority.refId}`
          : `${registryEntry.contract.authority.kind}:${registryEntry.contract.authority.refId}`,
      lawId: descriptor.lawId
    },
    slot: {
      id: input.slotId,
      ownerObjectId,
      placement: "cancelled-source-span",
      sourceSelectorIds: [...record.sourceSelectorIds],
      survivorAnchorSelectorIds: [...input.survivorAnchorSelectorIds]
    },
    presentation: {
      mode: "presentation-controlled-transient",
      requiredOrdering: ["after-contact", "before-survivor-compaction"]
    }
  };
  const issues = validateKpCancellationWitness({
    witness,
    declaredWitnessIds: registryEntry?.contract.witnessIds ?? [defaultAuthority!.witnessId],
    cancellationSourceSelectorIds: record.sourceSelectorIds,
    selectorOwners
  });
  if (issues.length > 0) throw new Error(`${issues[0]!.path}: ${issues[0]!.message}`);
  return witness;
}

export function validateKpCancellationWitness(input: {
  readonly witness: KpCancellationWitness;
  readonly declaredWitnessIds: readonly string[];
  readonly cancellationSourceSelectorIds: readonly string[];
  readonly selectorOwners: Readonly<Record<string, string>>;
}): readonly KpCancellationWitnessIssue[] {
  const issues: KpCancellationWitnessIssue[] = [];
  const descriptor = kpCancellationWitnessDescriptors.find(
    (candidate) => candidate.id === input.witness.descriptorId
  );
  if (!input.declaredWitnessIds.includes(input.witness.descriptorId)) {
    issue(issues, "undeclared-witness", "descriptorId", "The operation contract does not declare this witness.");
  }
  if (
    descriptor === undefined ||
    descriptor.semanticValue.integer !== input.witness.semanticValue.integer ||
    descriptor.semanticValue.latex !== input.witness.semanticValue.latex
  ) {
    issue(issues, "invented-value", "semanticValue", "Witness value is not the value declared by its semantic descriptor.");
  }
  const expectedSources = [...new Set(input.cancellationSourceSelectorIds)].sort();
  const actualSources = [...new Set(input.witness.slot.sourceSelectorIds)].sort();
  if (
    expectedSources.length !== actualSources.length ||
    expectedSources.some((id, index) => id !== actualSources[index])
  ) {
    issue(issues, "slot-source-mismatch", "slot.sourceSelectorIds", "Witness slot must occupy the complete canceled source span.");
  }
  const sourceOwners = new Set(actualSources.map((id) => input.selectorOwners[id]));
  if (
    sourceOwners.size !== 1 ||
    sourceOwners.has(undefined) ||
    !sourceOwners.has(input.witness.slot.ownerObjectId)
  ) {
    issue(issues, "mixed-slot-owners", "slot.ownerObjectId", "Witness slot must have the same owner as every canceled source selector.");
  }
  input.witness.slot.survivorAnchorSelectorIds.forEach((id, index) => {
    if (
      input.selectorOwners[id] !== input.witness.slot.ownerObjectId ||
      actualSources.includes(id)
    ) {
      issue(issues, "invalid-slot-anchor", `slot.survivorAnchorSelectorIds[${index}]`, "Witness anchors must be uncanceled selectors owned by the same expression.");
    }
  });
  if (
    input.witness.presentation.mode !== "presentation-controlled-transient" ||
    input.witness.presentation.requiredOrdering[0] !== "after-contact" ||
    input.witness.presentation.requiredOrdering[1] !== "before-survivor-compaction"
  ) {
    issue(issues, "invalid-presentation-authority", "presentation", "Presentation may style or omit the witness but cannot change its value, slot, or causal ordering.");
  }
  return issues;
}

export function cancellationWitnessDescriptor(
  id: KpCancellationWitnessId
): KpCancellationWitnessDescriptor {
  const descriptor = kpCancellationWitnessDescriptors.find(
    (candidate) => candidate.id === id
  );
  if (descriptor === undefined) throw new Error(`Unknown cancellation witness ${id}.`);
  return descriptor;
}

function witnessDescriptorForContract(
  operationId: string,
  witnessIds: readonly string[]
): KpCancellationWitnessDescriptor {
  const descriptors = witnessIds.flatMap((id) => {
    const descriptor = kpCancellationWitnessDescriptors.find(
      (candidate) => candidate.id === id
    );
    return descriptor === undefined ? [] : [descriptor];
  });
  if (descriptors.length !== 1) {
    throw new Error(
      `Cancellation operation ${operationId} must declare exactly one supported identity witness.`
    );
  }
  return descriptors[0]!;
}

function selectorOwnerMap(bundle: KpAssetBundle): Readonly<Record<string, string>> {
  return Object.fromEntries(bundle.objects.flatMap((object) =>
    object.selectors.map((selector) => [selector.id, object.id] as const)
  ));
}

function requiredOwner(
  owners: Readonly<Record<string, string>>,
  selectorId: string
): string {
  const owner = owners[selectorId];
  if (owner === undefined) throw new Error(`Unknown cancellation selector ${selectorId}.`);
  return owner;
}

function issue(
  issues: KpCancellationWitnessIssue[],
  code: KpCancellationWitnessIssueCode,
  path: string,
  message: string
): void {
  issues.push({ code, path, message });
}
