import {
  checkCorrespondenceMapRewindLaw,
  validateCorrespondenceMap,
  type CorrespondenceMap,
  type SelectorCorrespondenceRecord
} from "./correspondence.ts";
import {
  kpExponentialDifferenceToQuotientLaw,
  kpExponentialSumToProductLaw
} from "./exponential-homomorphism-law.ts";
import {
  KP_POWER_APPLICATION_ENDPOINT_NORMALIZER,
  type KpNormalizedPowerApplicationEndpoint
} from "./power-application-endpoint-normalizer.ts";

export type KpExponentialSumToProductLaw =
  typeof kpExponentialSumToProductLaw;

export type KpExponentialDifferenceToQuotientLaw =
  typeof kpExponentialDifferenceToQuotientLaw;

export type KpExponentialHomomorphismLaw =
  | KpExponentialSumToProductLaw
  | KpExponentialDifferenceToQuotientLaw;

export type KpExponentialOccurrenceRole =
  | "base"
  | "exponent-payload"
  | "power-application"
  | "superscript-region"
  | "combination-root"
  | "combination-connector";

export interface KpExponentialSemanticOccurrence {
  readonly id: string;
  readonly endpoint: "source" | "target";
  readonly role: KpExponentialOccurrenceRole;
  readonly ordinal: number;
  readonly referentId: string;
}

export interface KpExponentialSuccessorCohort {
  readonly id: string;
  readonly relation: "one-to-one-derived" | "one-to-many-derived";
  readonly sourceOccurrenceIds: readonly [string, ...string[]];
  readonly targetOccurrenceIds: readonly [string, ...string[]];
  readonly summary: string;
}

export interface KpExponentialHomomorphismCorrespondenceAuthority {
  readonly schemaVersion:
    "kp.exponential-homomorphism-correspondence-authority.v1";
  readonly kind: "exponential-homomorphism-correspondence-authority";
  readonly id: string;
  readonly lawId: KpExponentialHomomorphismLaw["id"];
  readonly endpointNormalizerId:
    typeof KP_POWER_APPLICATION_ENDPOINT_NORMALIZER;
  readonly source: KpNormalizedPowerApplicationEndpoint;
  readonly occurrences: readonly KpExponentialSemanticOccurrence[];
  readonly sourceOccurrenceIds: readonly string[];
  readonly targetOccurrenceIds: readonly string[];
  readonly correspondenceMap: CorrespondenceMap;
  readonly successorCohorts: readonly KpExponentialSuccessorCohort[];
  readonly forbiddenIdentityPairs: readonly Readonly<{
    sourceOccurrenceId: string;
    targetOccurrenceId: string;
    reason: string;
  }>[];
}

const authorities = new WeakSet<object>();

/**
 * The mint separates semantic referents from paint occurrences. Payloads may
 * persist, while repeated bases and power shells are explicitly derived
 * successors; equal glyphs never grant occurrence identity.
 */
export function compileKpExponentialHomomorphismCorrespondence(input: {
  readonly id: string;
  readonly law?: KpExponentialHomomorphismLaw | undefined;
  readonly source: KpNormalizedPowerApplicationEndpoint;
  readonly baseReferentId: string;
  readonly operandReferentIds: readonly [string, string, ...string[]];
}): KpExponentialHomomorphismCorrespondenceAuthority {
  const law = input.law ?? kpExponentialSumToProductLaw;
  const combination = input.source.superscriptRegion.combination;
  if (
    !isRegisteredExponentialLaw(law) ||
    input.source.authority !== KP_POWER_APPLICATION_ENDPOINT_NORMALIZER ||
    combination.kind !== law.sourceCombination.kind
  ) {
    throw new Error(
      "Exponential correspondence requires a registered power law whose source combination matches the normalized endpoint."
    );
  }
  if (input.operandReferentIds.length !== combination.operands.length) {
    throw new Error(
      "Exponential correspondence requires one authored referent per ordered exponent operand."
    );
  }
  requireUniqueReferents([
    input.baseReferentId,
    ...input.operandReferentIds
  ]);

  const source = createSourceOccurrences(input, law.sourceCombination.kind);
  const target = createTargetOccurrences(input, law.targetCombination.kind);
  const records: SelectorCorrespondenceRecord[] = [
    ...roleChanges("payload", source.payloads, target.payloads),
    fanOut("base", source.base, target.bases),
    fanOut("power-applications", source.application, target.applications),
    fanOut("superscript-regions", source.superscript, target.superscripts),
    ...source.connectors.map((occurrence, index) =>
      removal(`source-connector-${index}`, occurrence)
    ),
    ...target.connectors.map((occurrence, index) =>
      introduction(`target-connector-${index}`, occurrence)
    ),
    removal("source-combination", source.combination),
    introduction("target-combination", target.combination)
  ];
  const correspondenceMap = Object.freeze({
    id: `correspondence.${input.id}`,
    records: Object.freeze(records)
  });
  const sourceOccurrenceIds = source.all.map(({ id }) => id);
  const targetOccurrenceIds = target.all.map(({ id }) => id);
  const issues = [
    ...validateCorrespondenceMap(correspondenceMap, {
      sourceSelectorIds: sourceOccurrenceIds,
      targetSelectorIds: targetOccurrenceIds
    }),
    ...checkCorrespondenceMapRewindLaw(correspondenceMap)
  ];
  if (issues.length > 0) {
    throw new Error(issues.map(({ message }) => message).join(" "));
  }
  const successorCohorts = Object.freeze([
    successor("base", [source.base], target.bases,
      "One base value derives distinct target base occurrences."),
    successor("power-applications", [source.application], target.applications,
      "The source power application derives one target application per payload."),
    successor("superscript-regions", [source.superscript], target.superscripts,
      "The combined superscript derives one target superscript per payload."),
    successor("combination", [source.combination], [target.combination],
      `${law.sourceCombination.kind} exponent structure derives ${law.targetCombination.kind} target structure.`),
    ...source.connectors.map((occurrence, index) => successor(
      `connector-${index}`,
      [occurrence],
      [target.connectors[index]!],
      `A ${law.sourceCombination.kind} connector licenses a ${law.targetCombination.kind} successor without glyph identity.`
    ))
  ]);
  const forbiddenIdentityPairs = Object.freeze([
    Object.freeze({
      sourceOccurrenceId: source.combination.id,
      targetOccurrenceId: target.combination.id,
      reason:
        `The ${law.sourceCombination.kind} structure licenses the target ${law.targetCombination.kind} but is not the same occurrence.`
    }),
    ...source.connectors.map((occurrence, index) => Object.freeze({
      sourceOccurrenceId: occurrence.id,
      targetOccurrenceId: target.connectors[index]!.id,
      reason:
        `A ${law.sourceCombination.kind} connector derives ${law.targetCombination.kind} structure but never becomes its target glyph.`
    }))
  ]);
  const authority = deepFreeze({
    schemaVersion:
      "kp.exponential-homomorphism-correspondence-authority.v1" as const,
    kind: "exponential-homomorphism-correspondence-authority" as const,
    id: input.id,
    lawId: law.id,
    endpointNormalizerId: KP_POWER_APPLICATION_ENDPOINT_NORMALIZER,
    source: input.source,
    occurrences: [...source.all, ...target.all],
    sourceOccurrenceIds,
    targetOccurrenceIds,
    correspondenceMap,
    successorCohorts,
    forbiddenIdentityPairs
  });
  authorities.add(authority);
  return authority;
}

export function isKpExponentialHomomorphismCorrespondenceAuthority(
  value: unknown
): value is KpExponentialHomomorphismCorrespondenceAuthority {
  return typeof value === "object" && value !== null && authorities.has(value);
}

function createSourceOccurrences(input: {
  readonly id: string;
  readonly baseReferentId: string;
  readonly operandReferentIds: readonly [string, string, ...string[]];
}, combinationKind: "sum" | "difference") {
  const base = occurrence(input.id, "source", "base", 0, input.baseReferentId);
  const payloads = input.operandReferentIds.map((referentId, index) =>
    occurrence(input.id, "source", "exponent-payload", index, referentId)
  );
  const application = occurrence(input.id, "source", "power-application", 0,
    `referent.${input.id}.source-power-application`);
  const superscript = occurrence(input.id, "source", "superscript-region", 0,
    `referent.${input.id}.source-superscript-region`);
  const combination = occurrence(input.id, "source", "combination-root", 0,
    `referent.${input.id}.source-${combinationKind}`);
  const connectors = input.operandReferentIds.slice(1).map((_id, index) =>
    occurrence(input.id, "source", "combination-connector", index,
      `referent.${input.id}.source-${combinationKind === "sum" ? "plus" : "minus"}.${index}`)
  );
  return {
    base,
    payloads,
    application,
    superscript,
    combination,
    connectors,
    all: [base, ...payloads, application, superscript, combination, ...connectors]
  };
}

function createTargetOccurrences(input: {
  readonly id: string;
  readonly baseReferentId: string;
  readonly operandReferentIds: readonly [string, string, ...string[]];
}, combinationKind: "product" | "quotient") {
  const bases = input.operandReferentIds.map((_id, index) =>
    occurrence(input.id, "target", "base", index, input.baseReferentId)
  );
  const payloads = input.operandReferentIds.map((referentId, index) =>
    occurrence(input.id, "target", "exponent-payload", index, referentId)
  );
  const applications = input.operandReferentIds.map((_id, index) =>
    occurrence(input.id, "target", "power-application", index,
      `referent.${input.id}.target-power-application.${index}`)
  );
  const superscripts = input.operandReferentIds.map((_id, index) =>
    occurrence(input.id, "target", "superscript-region", index,
      `referent.${input.id}.target-superscript-region.${index}`)
  );
  const combination = occurrence(input.id, "target", "combination-root", 0,
    `referent.${input.id}.target-${combinationKind}`);
  const connectors = input.operandReferentIds.slice(1).map((_id, index) =>
    occurrence(input.id, "target", "combination-connector", index,
      `referent.${input.id}.target-${combinationKind === "product" ? "multiply" : "quotient-bar"}.${index}`)
  );
  return {
    bases,
    payloads,
    applications,
    superscripts,
    combination,
    connectors,
    all: [
      ...bases,
      ...payloads,
      ...applications,
      ...superscripts,
      combination,
      ...connectors
    ]
  };
}

function isRegisteredExponentialLaw(
  law: KpExponentialHomomorphismLaw
): boolean {
  return law === kpExponentialSumToProductLaw ||
    law === kpExponentialDifferenceToQuotientLaw;
}

function occurrence(
  authorityId: string,
  endpoint: "source" | "target",
  role: KpExponentialOccurrenceRole,
  ordinal: number,
  referentId: string
): KpExponentialSemanticOccurrence {
  return Object.freeze({
    id: `occurrence.${authorityId}.${endpoint}.${role}.${ordinal}`,
    endpoint,
    role,
    ordinal,
    referentId
  });
}

function roleChanges(
  suffix: string,
  source: readonly KpExponentialSemanticOccurrence[],
  target: readonly KpExponentialSemanticOccurrence[]
): readonly SelectorCorrespondenceRecord[] {
  if (source.length !== target.length) {
    throw new Error(`${suffix} continuity requires equal ordered cardinality.`);
  }
  return source.map((occurrence, index) => record(
    `${suffix}-${index}`,
    "role-change",
    [occurrence],
    [target[index]!],
    `${occurrence.referentId} persists into target exponent position ${index}.`
  ));
}

function fanOut(
  suffix: string,
  source: KpExponentialSemanticOccurrence,
  target: readonly KpExponentialSemanticOccurrence[]
): SelectorCorrespondenceRecord {
  return record(suffix, "fan-out", [source], target,
    `${source.role} derives ${target.length} distinct target occurrences.`);
}

function removal(
  suffix: string,
  source: KpExponentialSemanticOccurrence
): SelectorCorrespondenceRecord {
  return record(suffix, "removal", [source], [],
    `${source.role} retires while its successor is governed separately.`);
}

function introduction(
  suffix: string,
  target: KpExponentialSemanticOccurrence
): SelectorCorrespondenceRecord {
  return record(suffix, "introduction", [], [target],
    `${target.role} is introduced as derived target structure.`);
}

function record(
  suffix: string,
  relation: SelectorCorrespondenceRecord["relation"],
  source: readonly KpExponentialSemanticOccurrence[],
  target: readonly KpExponentialSemanticOccurrence[],
  summary: string
): SelectorCorrespondenceRecord {
  return Object.freeze({
    id: `correspondence.exponential.${suffix}`,
    relation,
    sourceSelectorIds: Object.freeze(source.map(({ id }) => id)),
    targetSelectorIds: Object.freeze(target.map(({ id }) => id)),
    summary
  });
}

function successor(
  suffix: string,
  source: readonly KpExponentialSemanticOccurrence[],
  target: readonly KpExponentialSemanticOccurrence[],
  summary: string
): KpExponentialSuccessorCohort {
  if (source.length === 0 || target.length === 0) {
    throw new Error(`Successor cohort ${suffix} requires both endpoints.`);
  }
  return Object.freeze({
    id: `successor.exponential.${suffix}`,
    relation: target.length === 1
      ? "one-to-one-derived" as const
      : "one-to-many-derived" as const,
    sourceOccurrenceIds: Object.freeze(source.map(({ id }) => id)) as
      readonly [string, ...string[]],
    targetOccurrenceIds: Object.freeze(target.map(({ id }) => id)) as
      readonly [string, ...string[]],
    summary
  });
}

function requireUniqueReferents(ids: readonly string[]): void {
  if (ids.some((id) => id.trim().length === 0) ||
      new Set(ids).size !== ids.length) {
    throw new Error(
      "Base and exponent payloads require distinct non-empty authored referents."
    );
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
