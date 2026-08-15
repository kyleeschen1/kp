import type { KpSemanticBranchSchedule } from "./branch-schedule.ts";
import type { KpSemanticTransformation } from "../semantic/asset-transformation.ts";
import type { SelectorCorrespondenceRecord } from "../semantic/correspondence.ts";
import {
  isKpCompiledSymbolMotionContract,
  type KpCompiledSymbolMotionContract
} from "./symbol-motion-contract.ts";

declare const kpEquationOperationChoreographyBrand: unique symbol;

interface KpEquationOperationChoreographyBase {
  readonly schemaVersion: "kp.equation-operation-choreography.v1";
  readonly id: string;
  readonly transformationId: string;
  readonly direction: "forward" | "rewind";
  readonly [kpEquationOperationChoreographyBrand]: true;
}

export interface KpCounterOrbitCancellationChoreography
  extends KpEquationOperationChoreographyBase {
  readonly kind: "counter-orbit-cancellation";
  readonly linearRearrangementKind:
    | "cancel-additive-inverses"
    | "cancel-multiplicative-inverses";
  readonly relationRecordId: string;
  readonly semanticEntityIds: readonly string[];
  readonly cancellationRecipe: "counter-orbit-v1";
  readonly zeroWitnessRecipe: "none";
}

export interface KpSynchronizedBalancedIntroductionChoreography
  extends KpEquationOperationChoreographyBase {
  readonly kind: "synchronized-balanced-introduction";
  readonly linearRearrangementKind: "balanced-introduction";
  readonly semanticEntityIds: readonly string[];
  readonly branchSchedule: KpSemanticBranchSchedule;
  readonly entryWindow?: {
    readonly start: number;
    readonly end: number;
  } | undefined;
}

export interface KpCausalStructuralIntroductionChoreography
  extends KpEquationOperationChoreographyBase {
  readonly kind: "causal-structural-introduction";
  readonly semanticEntityIds: readonly string[];
  readonly entryWindow: {
    readonly start: number;
    readonly end: number;
  };
}

export interface KpCanonicalFunctionWrapChoreography
  extends KpEquationOperationChoreographyBase {
  readonly kind: "canonical-function-wrap";
  readonly canonicalOperationId: "kp.core.wrap";
  readonly branches: readonly {
    readonly id: string;
    readonly sourceArgumentEntityIds: readonly string[];
    readonly targetArgumentEntityIds: readonly string[];
    readonly wrapperEntityIds: readonly string[];
  }[];
  readonly argumentReflowWindow: {
    readonly start: number;
    readonly end: number;
  };
  readonly wrapperEntryWindow: {
    readonly start: number;
    readonly end: number;
  };
}

export interface KpHomomorphicFusionChoreography
  extends KpEquationOperationChoreographyBase {
  readonly kind: "homomorphic-fusion";
  /** This schema remains provisional until the three-operation promotion gate passes. */
  readonly maturity: "candidate";
  readonly canonicalShape: "H(a) o H(b) -> H(a star b)";
  readonly operatorApplicationFusion: KpHomomorphicFusionRelation;
  readonly operatorGlyphFusion: KpHomomorphicFusionRelation;
  readonly argumentTransfers: readonly [
    KpHomomorphicFusionArgumentTransfer,
    KpHomomorphicFusionArgumentTransfer
  ];
  readonly connectorDerivation: KpHomomorphicFusionRelation & {
    readonly forbiddenIdentityPairs: readonly {
      readonly sourceEntityId: string;
      readonly targetEntityId: string;
    }[];
    readonly exitWindow: KpEquationChoreographyWindow;
  };
  readonly sourceEnclosureRetirement: KpHomomorphicFusionRelation & {
    readonly exitWindow: KpEquationChoreographyWindow;
  };
  readonly targetStructureEntries: readonly [
    KpHomomorphicFusionStructuralEntry,
    ...KpHomomorphicFusionStructuralEntry[]
  ];
  readonly operatorFusionWindow: KpEquationChoreographyWindow;
  readonly argumentTransferWindow: KpEquationChoreographyWindow;
}

export interface KpHomomorphicFusionRelation {
  readonly relationRecordId: string;
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
}

export interface KpHomomorphicFusionArgumentTransfer
  extends KpHomomorphicFusionRelation {
  readonly id: string;
  readonly role: "left" | "right";
  readonly route: "arc-above" | "arc-below";
}

export interface KpHomomorphicFusionStructuralEntry
  extends KpHomomorphicFusionRelation {
  readonly entryWindow: KpEquationChoreographyWindow;
}

export interface KpEquationChoreographyWindow {
  readonly start: number;
  readonly end: number;
}

export type KpEquationOperationChoreography =
  | KpCounterOrbitCancellationChoreography
  | KpSynchronizedBalancedIntroductionChoreography
  | KpCausalStructuralIntroductionChoreography
  | KpCanonicalFunctionWrapChoreography
  | KpHomomorphicFusionChoreography;

export function createKpHomomorphicFusionChoreography(input: {
  readonly transformation: KpSemanticTransformation;
  readonly direction: "forward" | "rewind";
  readonly operatorApplicationFusionRecordId: string;
  readonly operatorGlyphFusionRecordId: string;
  readonly argumentTransfers: readonly [
    {
      readonly id: string;
      readonly role: "left";
      readonly relationRecordId: string;
      readonly route: "arc-above";
    },
    {
      readonly id: string;
      readonly role: "right";
      readonly relationRecordId: string;
      readonly route: "arc-below";
    }
  ];
  readonly connectorDerivationRecordId: string;
  readonly forbiddenConnectorIdentityPairs: readonly {
    readonly sourceEntityId: string;
    readonly targetEntityId: string;
  }[];
  readonly sourceEnclosureRetirementRecordId: string;
  readonly targetStructureEntries: readonly [
    {
      readonly relationRecordId: string;
      readonly entryWindow: KpEquationChoreographyWindow;
    },
    ...{
      readonly relationRecordId: string;
      readonly entryWindow: KpEquationChoreographyWindow;
    }[]
  ];
  readonly operatorFusionWindow: KpEquationChoreographyWindow;
  readonly argumentTransferWindow: KpEquationChoreographyWindow;
  readonly connectorRetirementWindow: KpEquationChoreographyWindow;
  readonly sourceRetirementWindow: KpEquationChoreographyWindow;
}): KpHomomorphicFusionChoreography {
  const records = input.transformation.correspondenceMap?.records;
  if (records === undefined) {
    throw new Error("Homomorphic fusion requires correspondence authority.");
  }
  const application = requireRelation(
    records,
    input.operatorApplicationFusionRecordId,
    "fan-in",
    "operator application fusion"
  );
  const operator = requireRelation(
    records,
    input.operatorGlyphFusionRecordId,
    "fan-in",
    "operator glyph fusion"
  );
  for (const [label, record] of [
    ["operator application fusion", application],
    ["operator glyph fusion", operator]
  ] as const) {
    if (record.sourceSelectorIds.length < 2 || record.targetSelectorIds.length !== 1) {
      throw new Error(`${label} requires a many-to-one successor.`);
    }
  }
  const argumentTransfers = input.argumentTransfers.map((transfer) => {
    const record = requireRelation(
      records,
      transfer.relationRecordId,
      "role-change",
      `${transfer.role} argument transfer`
    );
    if (record.sourceSelectorIds.length !== 1 || record.targetSelectorIds.length !== 1) {
      throw new Error("Homomorphic argument transfer must preserve one continuant.");
    }
    return Object.freeze({
      id: transfer.id,
      role: transfer.role,
      route: transfer.route,
      ...relationProjection(record)
    });
  }) as unknown as KpHomomorphicFusionChoreography["argumentTransfers"];
  const connector = requireRelation(
    records,
    input.connectorDerivationRecordId,
    "fan-in",
    "connector derivation"
  );
  const sourceRetirement = requireRelation(
    records,
    input.sourceEnclosureRetirementRecordId,
    "removal",
    "source enclosure retirement"
  );
  const targetStructureEntries = input.targetStructureEntries.map((entry) => {
    const record = requireRelation(
      records,
      entry.relationRecordId,
      "introduction",
      "target structural entry"
    );
    assertUnitWindow(entry.entryWindow, "Homomorphic target structural entry");
    return Object.freeze({
      ...relationProjection(record),
      entryWindow: Object.freeze({ ...entry.entryWindow })
    });
  }) as unknown as KpHomomorphicFusionChoreography["targetStructureEntries"];
  assertUnitWindow(input.operatorFusionWindow, "Homomorphic operator fusion");
  assertUnitWindow(input.argumentTransferWindow, "Homomorphic argument transfer");
  assertUnitWindow(input.connectorRetirementWindow, "Homomorphic connector retirement");
  assertUnitWindow(input.sourceRetirementWindow, "Homomorphic source retirement");
  // A continuant cannot cross still-visible syntax reliably: native math
  // metrics vary by browser and font. Releasing source structure in causal
  // order is semantic authority; collision repair must not invent browser paths.
  if (input.sourceRetirementWindow.end > input.connectorRetirementWindow.start) {
    throw new Error(
      "Homomorphic source enclosures must retire before the connector."
    );
  }
  const firstMaterialTransfer = Math.min(
    input.operatorFusionWindow.start,
    input.argumentTransferWindow.start
  );
  if (input.connectorRetirementWindow.end > firstMaterialTransfer) {
    throw new Error(
      "Homomorphic source connector must retire before material transfers."
    );
  }
  const lastMaterialSettlement = Math.max(
    input.operatorFusionWindow.end,
    input.argumentTransferWindow.end
  );
  const earliestTargetEntry = Math.min(...input.targetStructureEntries.map(
    ({ entryWindow }) => entryWindow.start
  ));
  if (lastMaterialSettlement > earliestTargetEntry) {
    throw new Error(
      "Homomorphic target structure must enter after material transfers settle."
    );
  }
  if (
    input.forbiddenConnectorIdentityPairs.length === 0 ||
    input.forbiddenConnectorIdentityPairs.some(
      ({ sourceEntityId, targetEntityId }) =>
        sourceEntityId.trim() === "" || targetEntityId.trim() === ""
    ) ||
    new Set(input.forbiddenConnectorIdentityPairs.map(
      ({ sourceEntityId, targetEntityId }) =>
        `${sourceEntityId}\u0000${targetEntityId}`
    )).size !== input.forbiddenConnectorIdentityPairs.length
  ) {
    throw new Error(
      "Homomorphic forbidden connector identities require unique non-empty pairs."
    );
  }
  const chosenRecordIds = [
    input.operatorApplicationFusionRecordId,
    input.operatorGlyphFusionRecordId,
    ...input.argumentTransfers.map(({ relationRecordId }) => relationRecordId),
    input.connectorDerivationRecordId,
    input.sourceEnclosureRetirementRecordId,
    ...input.targetStructureEntries.map(({ relationRecordId }) => relationRecordId)
  ];
  requireUniqueNonempty(chosenRecordIds, "Homomorphic choreography relations");
  const knownTargetEntityIds = new Set(records.flatMap(
    ({ targetSelectorIds }) => targetSelectorIds
  ));
  for (const pair of input.forbiddenConnectorIdentityPairs) {
    if (
      !connector.sourceSelectorIds.includes(pair.sourceEntityId) ||
      !knownTargetEntityIds.has(pair.targetEntityId)
    ) {
      throw new Error(
        "A forbidden connector identity must name connector source and target material."
      );
    }
    if (connector.targetSelectorIds.includes(pair.targetEntityId)) {
      throw new Error(
        "A homomorphic connector cannot preserve identity as target structure."
      );
    }
  }
  return Object.freeze({
    schemaVersion: "kp.equation-operation-choreography.v1" as const,
    kind: "homomorphic-fusion" as const,
    maturity: "candidate" as const,
    canonicalShape: "H(a) o H(b) -> H(a star b)" as const,
    id: `operation-choreography.${input.transformation.id}.homomorphic-fusion.${input.direction}`,
    transformationId: input.transformation.id,
    direction: input.direction,
    operatorApplicationFusion: relationProjection(application),
    operatorGlyphFusion: relationProjection(operator),
    argumentTransfers,
    connectorDerivation: Object.freeze({
      ...relationProjection(connector),
      forbiddenIdentityPairs: Object.freeze(
        input.forbiddenConnectorIdentityPairs.map((pair) =>
          Object.freeze({ ...pair })
        )
      ),
      exitWindow: Object.freeze({ ...input.connectorRetirementWindow })
    }),
    sourceEnclosureRetirement: Object.freeze({
      ...relationProjection(sourceRetirement),
      exitWindow: Object.freeze({ ...input.sourceRetirementWindow })
    }),
    targetStructureEntries,
    operatorFusionWindow: Object.freeze({ ...input.operatorFusionWindow }),
    argumentTransferWindow: Object.freeze({ ...input.argumentTransferWindow })
  }) as KpHomomorphicFusionChoreography;
}

export function createKpCanonicalFunctionWrapChoreography(input: {
  readonly contract: KpCompiledSymbolMotionContract;
  readonly motifId: string;
  readonly direction: "forward" | "rewind";
  readonly argumentReflowWindow?: {
    readonly start: number;
    readonly end: number;
  } | undefined;
  readonly wrapperEntryWindow?: {
    readonly start: number;
    readonly end: number;
  } | undefined;
}): KpCanonicalFunctionWrapChoreography {
  if (!isKpCompiledSymbolMotionContract(input.contract)) {
    throw new Error(
      "Canonical function-wrap choreography requires compiled symbol-motion authority."
    );
  }
  const motif = input.contract.canonicalMotifs.find(
    ({ id }) => id === input.motifId
  );
  if (motif?.kind !== "canonical-function-wrap") {
    throw new Error(
      `Symbol-motion contract ${input.contract.id} has no canonical wrap ${input.motifId}.`
    );
  }
  const continuants = new Map(input.contract.continuants.map((rule) => [
    rule.id,
    rule
  ]));
  const branches = motif.branches.map((branch) => {
    const rules = branch.argumentContinuantIds.map((id) => {
      const rule = continuants.get(id);
      if (rule === undefined) {
        throw new Error(
          `Canonical function-wrap branch ${branch.id} lacks continuant ${id}.`
        );
      }
      return rule;
    });
    return Object.freeze({
      id: branch.id,
      sourceArgumentEntityIds: Object.freeze(rules.flatMap(
        ({ sourceEntityIds }) => sourceEntityIds
      )),
      targetArgumentEntityIds: Object.freeze(rules.flatMap(
        ({ targetEntityIds }) => targetEntityIds
      )),
      wrapperEntityIds: Object.freeze([...branch.wrapperEntityIds])
    });
  });
  const argumentReflowWindow = input.argumentReflowWindow ?? {
    start: 0.04,
    end: 0.7
  };
  const wrapperEntryWindow = input.wrapperEntryWindow ?? {
    start: 0.62,
    end: 0.92
  };
  assertUnitWindow(argumentReflowWindow, "Function-wrap argument reflow");
  assertUnitWindow(wrapperEntryWindow, "Function-wrap wrapper entry");
  if (argumentReflowWindow.start >= wrapperEntryWindow.start) {
    throw new Error(
      "Canonical function-wrap arguments must begin reflow before wrappers enter."
    );
  }
  return Object.freeze({
    schemaVersion: "kp.equation-operation-choreography.v1" as const,
    kind: "canonical-function-wrap" as const,
    id: `operation-choreography.${input.contract.transformationId}.canonical-wrap.${input.direction}`,
    transformationId: input.contract.transformationId,
    direction: input.direction,
    canonicalOperationId: motif.canonicalOperationId,
    branches: Object.freeze(branches),
    argumentReflowWindow: Object.freeze({ ...argumentReflowWindow }),
    wrapperEntryWindow: Object.freeze({ ...wrapperEntryWindow })
  }) as KpCanonicalFunctionWrapChoreography;
}

export function createKpCausalStructuralIntroductionChoreography(input: {
  readonly id: string;
  readonly transformationId: string;
  readonly direction: "forward" | "rewind";
  readonly semanticEntityIds: readonly string[];
  readonly entryWindow: { readonly start: number; readonly end: number };
}): KpCausalStructuralIntroductionChoreography {
  if (
    input.id.trim() === "" ||
    input.transformationId.trim() === "" ||
    input.semanticEntityIds.length === 0 ||
    input.semanticEntityIds.some((id) => id.trim() === "") ||
    new Set(input.semanticEntityIds).size !== input.semanticEntityIds.length ||
    !Number.isFinite(input.entryWindow.start) ||
    !Number.isFinite(input.entryWindow.end) ||
    input.entryWindow.start < 0 ||
    input.entryWindow.end > 1 ||
    input.entryWindow.start >= input.entryWindow.end
  ) {
    throw new Error(
      "Causal structural introduction requires unique entities and an increasing unit entry window."
    );
  }
  return Object.freeze({
    schemaVersion: "kp.equation-operation-choreography.v1" as const,
    kind: "causal-structural-introduction" as const,
    id: input.id,
    transformationId: input.transformationId,
    direction: input.direction,
    semanticEntityIds: Object.freeze([...input.semanticEntityIds]),
    entryWindow: Object.freeze({ ...input.entryWindow })
  }) as KpCausalStructuralIntroductionChoreography;
}

function requireRelation(
  records: readonly SelectorCorrespondenceRecord[],
  id: string,
  relation: SelectorCorrespondenceRecord["relation"],
  label: string
): SelectorCorrespondenceRecord {
  const record = records.find((candidate) => candidate.id === id);
  if (record === undefined || record.relation !== relation) {
    throw new Error(
      `Homomorphic ${label} requires ${relation} correspondence ${id}.`
    );
  }
  if (relation === "removal") {
    requireUniqueNonempty(record.sourceSelectorIds, `${label} source`);
    if (record.targetSelectorIds.length !== 0) {
      throw new Error(`Homomorphic ${label} removal cannot own target material.`);
    }
  } else if (relation === "introduction") {
    requireUniqueNonempty(record.targetSelectorIds, `${label} target`);
    if (record.sourceSelectorIds.length !== 0) {
      throw new Error(`Homomorphic ${label} introduction cannot own source material.`);
    }
  } else {
    requireUniqueNonempty(record.sourceSelectorIds, `${label} source`);
    requireUniqueNonempty(record.targetSelectorIds, `${label} target`);
  }
  return record;
}

function relationProjection(
  record: SelectorCorrespondenceRecord
): KpHomomorphicFusionRelation {
  return Object.freeze({
    relationRecordId: record.id,
    sourceEntityIds: Object.freeze([...record.sourceSelectorIds]),
    targetEntityIds: Object.freeze([...record.targetSelectorIds])
  });
}

function requireUniqueNonempty(values: readonly string[], label: string): void {
  if (
    values.length === 0 ||
    values.some((value) => value.trim() === "") ||
    new Set(values).size !== values.length
  ) {
    throw new Error(`${label} requires unique non-empty ids.`);
  }
}

function assertUnitWindow(
  window: { readonly start: number; readonly end: number },
  label: string
): void {
  if (
    !Number.isFinite(window.start) ||
    !Number.isFinite(window.end) ||
    window.start < 0 ||
    window.end > 1 ||
    window.start >= window.end
  ) {
    throw new Error(`${label} requires an increasing unit interval.`);
  }
}
