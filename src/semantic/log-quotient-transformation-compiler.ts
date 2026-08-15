import {
  kpCanonicalLogQuotientContract,
  type KpLogQuotientContract
} from "./log-quotient-contract.ts";
import {
  listKpLogQuotientExpressionNodes,
  type KpLogQuotientSemanticId,
  type KpLogQuotientState
} from "./log-quotient-states.ts";
import {
  createKpSemanticTransformation,
  type KpSemanticTransformation
} from "./asset-transformation.ts";
import {
  checkCorrespondenceMapRewindLaw,
  projectCorrespondenceMapForPlayback,
  validateCorrespondenceMap,
  type CorrespondenceMap,
  type SelectorCorrespondencePlaybackRecord,
  type SelectorCorrespondenceRecord
} from "./correspondence.ts";

declare const kpCompiledLogQuotientOperationAuthority: unique symbol;
const compiledOperations = new WeakSet<object>();

export interface KpCompiledLogQuotientOperation {
  readonly schemaVersion: "kp.compiled-log-quotient-operation.v1";
  readonly contract: KpLogQuotientContract;
  readonly transformation: KpSemanticTransformation;
  readonly rewindRecords: readonly SelectorCorrespondencePlaybackRecord[];
  readonly [kpCompiledLogQuotientOperationAuthority]: true;
}

export function compileKpLogQuotientOperation(
  contract: KpLogQuotientContract = kpCanonicalLogQuotientContract
): KpCompiledLogQuotientOperation {
  assertCanonicalContract(contract);
  const records: readonly SelectorCorrespondenceRecord[] = Object.freeze([
    relate(
      "persistent-wrapper",
      contract,
      "semantic.log-quotient.wrapper.persistent",
      "semantic.log-quotient.wrapper.persistent",
      "role-change",
      "The left natural-log application persists while its argument changes from x to the quotient."
    ),
    relate(
      "persistent-operator",
      contract,
      "semantic.log-quotient.wrapper.persistent.operator",
      "semantic.log-quotient.wrapper.persistent.operator",
      "identity",
      "The same ln operator remains visible throughout the quotient rewrite."
    ),
    relate(
      "persistent-open-delimiter",
      contract,
      "semantic.log-quotient.wrapper.persistent.open",
      "semantic.log-quotient.wrapper.persistent.open",
      "role-change",
      "The opening delimiter remains attached to ln while adapting to the quotient argument."
    ),
    relate(
      "persistent-close-delimiter",
      contract,
      "semantic.log-quotient.wrapper.persistent.close",
      "semantic.log-quotient.wrapper.persistent.close",
      "role-change",
      "The closing delimiter remains attached to ln while adapting to the quotient argument."
    ),
    relate(
      "x-to-numerator",
      contract,
      "semantic.log-quotient.variable.x",
      "semantic.log-quotient.variable.x",
      "role-change",
      "The same x moves from the first logarithm argument into numerator position."
    ),
    relate(
      "y-to-denominator",
      contract,
      "semantic.log-quotient.variable.y",
      "semantic.log-quotient.variable.y",
      "role-change",
      "The same y moves from the second logarithm argument into denominator position."
    ),
    Object.freeze({
      id: "correspondence.log-quotient.difference-derives-quotient",
      relation: "fan-in" as const,
      sourceSelectorIds: Object.freeze([
        occurrence(contract.source, "semantic.log-quotient.expression.difference"),
        occurrence(contract.source, "semantic.log-quotient.operator.subtract")
      ]),
      targetSelectorIds: Object.freeze([
        occurrence(contract.target, "semantic.log-quotient.quotient.x-over-y")
      ]),
      summary:
        "The source difference structure and subtraction law derive quotient structure without preserving glyph identity."
    }),
    Object.freeze({
      id: "correspondence.log-quotient.retire-right-wrapper",
      relation: "removal" as const,
      sourceSelectorIds: Object.freeze([
        occurrence(contract.source, "semantic.log-quotient.wrapper.retiring"),
        occurrence(contract.source, "semantic.log-quotient.wrapper.retiring.operator"),
        occurrence(contract.source, "semantic.log-quotient.wrapper.retiring.open"),
        occurrence(contract.source, "semantic.log-quotient.wrapper.retiring.close")
      ]),
      targetSelectorIds: Object.freeze([]),
      summary:
        "The second logarithm shell retires only after y leaves for denominator position."
    }),
    Object.freeze({
      id: "correspondence.log-quotient.introduce-fraction-bar",
      relation: "introduction" as const,
      sourceSelectorIds: Object.freeze([]),
      targetSelectorIds: Object.freeze([
        occurrence(contract.target, "semantic.log-quotient.shell.fraction-bar")
      ]),
      summary:
        "The fraction bar is introduced after numerator and denominator material establish quotient structure."
    })
  ]);
  const correspondenceMap: CorrespondenceMap = Object.freeze({
    id: "correspondence.log-quotient.difference-to-quotient",
    records
  });
  validateCompiledCorrespondence(contract, correspondenceMap);
  const transformation = Object.freeze(createKpSemanticTransformation({
    id: "transformation.log-quotient.difference-to-quotient",
    transformType: "combineLogDifferenceAsQuotient",
    title: "Combine a logarithm difference as one logarithm of a quotient",
    sourceObjectIds: [contract.source.id],
    targetObjectIds: [contract.target.id],
    preserves: ["identity", "value", "role"],
    correspondenceMap,
    assumptions: [...contract.assumptionIds],
    lawRefs: [{
      id: contract.lawId,
      level: "strict",
      summary: "For positive x and y, ln(x) minus ln(y) equals ln(x/y)."
    }]
  }));
  const compiled = Object.freeze({
    schemaVersion: "kp.compiled-log-quotient-operation.v1" as const,
    contract,
    transformation,
    rewindRecords: Object.freeze(
      projectCorrespondenceMapForPlayback(correspondenceMap, "backward")
        .map((record) => Object.freeze({
          ...record,
          fromSelectorIds: Object.freeze([...record.fromSelectorIds]),
          toSelectorIds: Object.freeze([...record.toSelectorIds])
        }))
    )
  }) as KpCompiledLogQuotientOperation;
  compiledOperations.add(compiled);
  return compiled;
}

export function isKpCompiledLogQuotientOperation(
  value: unknown
): value is KpCompiledLogQuotientOperation {
  return typeof value === "object" && value !== null && compiledOperations.has(value);
}

export const kpCanonicalCompiledLogQuotientOperation =
  compileKpLogQuotientOperation();

function relate(
  suffix: string,
  contract: KpLogQuotientContract,
  sourceSemanticId: KpLogQuotientSemanticId,
  targetSemanticId: KpLogQuotientSemanticId,
  relation: "identity" | "role-change",
  summary: string
): SelectorCorrespondenceRecord {
  return Object.freeze({
    id: `correspondence.log-quotient.${suffix}`,
    relation,
    sourceSelectorIds: Object.freeze([
      occurrence(contract.source, sourceSemanticId)
    ]),
    targetSelectorIds: Object.freeze([
      occurrence(contract.target, targetSemanticId)
    ]),
    summary
  });
}

function occurrence(
  state: KpLogQuotientState,
  semanticId: KpLogQuotientSemanticId
): string {
  const occurrences = listKpLogQuotientExpressionNodes(state)
    .filter((node) => node.semanticId === semanticId);
  if (occurrences.length !== 1) {
    throw new Error(
      `Log-quotient semantic identity ${semanticId} must bind exactly one occurrence in ${state.id}.`
    );
  }
  return occurrences[0]!.id;
}

function assertCanonicalContract(contract: KpLogQuotientContract): void {
  if (
    contract.schemaVersion !== "kp.log-quotient-contract.v1" ||
    contract.id !== "contract.log-quotient.difference-to-quotient" ||
    contract.source.id !== "log-quotient.state.difference" ||
    contract.target.id !== "log-quotient.state.quotient" ||
    contract.domain.logarithmBase !== "e"
  ) {
    throw new Error("Log-quotient compilation requires the exact natural-log quotient contract.");
  }
  const requiredAssumptions = [
    "assumption.log-quotient.x-positive",
    "assumption.log-quotient.y-positive",
    "assumption.log-quotient.shared-base",
    "assumption.log-quotient.quotient-positive"
  ];
  if (
    requiredAssumptions.some((id) => !contract.assumptionIds.includes(
      id as KpLogQuotientContract["assumptionIds"][number]
    ))
  ) {
    throw new Error("Log-quotient compilation requires explicit positivity and shared-base authority.");
  }
  for (const pair of contract.materialPolicy.forbiddenIdentityPairs) {
    const source = listKpLogQuotientExpressionNodes(contract.source)
      .find(({ semanticId }) => semanticId === pair.sourceSemanticId);
    const target = listKpLogQuotientExpressionNodes(contract.target)
      .find(({ semanticId }) => semanticId === pair.targetSemanticId);
    if (source === undefined || target === undefined || source.semanticId === target.semanticId) {
      throw new Error("Log-quotient compilation rejects subtraction-to-fraction-bar identity.");
    }
  }
}

function validateCompiledCorrespondence(
  contract: KpLogQuotientContract,
  correspondenceMap: CorrespondenceMap
): void {
  const sourceSelectorIds = listKpLogQuotientExpressionNodes(contract.source)
    .map(({ id }) => id);
  const targetSelectorIds = listKpLogQuotientExpressionNodes(contract.target)
    .map(({ id }) => id);
  const issues = [
    ...validateCorrespondenceMap(correspondenceMap, {
      sourceSelectorIds,
      targetSelectorIds
    }),
    ...checkCorrespondenceMapRewindLaw(correspondenceMap)
  ];
  if (issues.length > 0) {
    throw new Error(issues.map(({ message }) => message).join(" "));
  }
  const rewindRecords = projectCorrespondenceMapForPlayback(
    correspondenceMap,
    "backward"
  );
  assertSameIds(
    rewindRecords.flatMap(({ fromSelectorIds }) => fromSelectorIds),
    targetSelectorIds,
    "rewind source"
  );
  assertSameIds(
    rewindRecords.flatMap(({ toSelectorIds }) => toSelectorIds),
    sourceSelectorIds,
    "rewind target"
  );
}

function assertSameIds(
  actual: readonly string[],
  expected: readonly string[],
  label: string
): void {
  if (
    actual.length !== expected.length ||
    new Set(actual).size !== actual.length ||
    expected.some((id) => !actual.includes(id))
  ) {
    throw new Error(`Log-quotient ${label} must cover its endpoint exactly once.`);
  }
}
