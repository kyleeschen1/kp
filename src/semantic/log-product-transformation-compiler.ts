import {
  kpCanonicalLogProductContract,
  kpLogProductContracts,
  type KpLogProductContract
} from "./log-product-contract.ts";
import {
  listKpLogProductExpressionNodes,
  type KpLogProductSemanticId,
  type KpLogProductState
} from "./log-product-states.ts";
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

declare const kpCompiledLogProductOperationAuthority: unique symbol;
const compiledOperations = new WeakSet<object>();

export interface KpCompiledLogProductOperation {
  readonly schemaVersion: "kp.compiled-log-product-operation.v1";
  readonly contract: KpLogProductContract;
  readonly transformation: KpSemanticTransformation;
  readonly rewindRecords: readonly SelectorCorrespondencePlaybackRecord[];
  readonly [kpCompiledLogProductOperationAuthority]: true;
}

export function compileKpLogProductOperation(
  contract: KpLogProductContract = kpCanonicalLogProductContract
): KpCompiledLogProductOperation {
  assertContract(contract);
  const { family } = contract;
  const correspondenceMap: CorrespondenceMap = Object.freeze({
    id: `correspondence.log-product.${factorKey(contract)}-to-sum`,
    records: Object.freeze([
      fanOut(
        "application-fission",
        contract,
        family.sourceWrapper.application,
        family.factors.map(({ targetWrapper }) => targetWrapper.application),
        "One logarithm application derives one ordered target application per factor."
      ),
      fanOut(
        "operator-fission",
        contract,
        family.sourceWrapper.operator,
        family.factors.map(({ targetWrapper }) => targetWrapper.operator),
        "The source ln operator derives every target operator without duplicating identity."
      ),
      fanOut(
        "open-shell-fission",
        contract,
        family.sourceWrapper.open,
        family.factors.map(({ targetWrapper }) => targetWrapper.open),
        "The source opening delimiter derives one shell per target application."
      ),
      fanOut(
        "close-shell-fission",
        contract,
        family.sourceWrapper.close,
        family.factors.map(({ targetWrapper }) => targetWrapper.close),
        "The source closing delimiter derives one shell per target application."
      ),
      ...family.factors.map((factor) => relate(
        `${factor.name}-argument-continuity`,
        contract,
        factor.semanticId,
        factor.semanticId,
        `The same ${factor.name} becomes target logarithm argument ${factor.ordinal + 1}.`
      )),
      fanOut(
        "product-derives-sum",
        contract,
        family.sourceProductSemanticId,
        [family.targetSumSemanticId, ...family.connectorSemanticIds],
        "Product structure derives additive structure and its connectors without glyph identity."
      )
    ] satisfies readonly SelectorCorrespondenceRecord[])
  });
  validateCompiledCorrespondence(contract, correspondenceMap);
  const transformation = Object.freeze(createKpSemanticTransformation({
    id: `transformation.log-product.${factorKey(contract)}-to-sum`,
    transformType: "expandLogProductAsSum",
    title: "Expand a logarithm of a product as a sum of logarithms",
    sourceObjectIds: [contract.source.id],
    targetObjectIds: [contract.target.id],
    // Identity is preserved only by factor continuants. Every wrapper branch
    // is a derived successor governed by one-to-many correspondence.
    preserves: ["identity", "value", "role"],
    correspondenceMap,
    assumptions: [...contract.assumptionIds],
    lawRefs: [{
      id: contract.lawId,
      level: "strict",
      summary:
        `For positive ${contract.family.factors.map(({ name }) => name).join(", ")}, ` +
        "the logarithm of their product equals the sum of their logarithms."
    }]
  }));
  const compiled = Object.freeze({
    schemaVersion: "kp.compiled-log-product-operation.v1" as const,
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
  }) as KpCompiledLogProductOperation;
  compiledOperations.add(compiled);
  return compiled;
}

export function isKpCompiledLogProductOperation(
  value: unknown
): value is KpCompiledLogProductOperation {
  return typeof value === "object" && value !== null && compiledOperations.has(value);
}

export const kpLogProductCompiledOperations: readonly KpCompiledLogProductOperation[] = Object.freeze(
  kpLogProductContracts.map(compileKpLogProductOperation)
);
export const kpCanonicalCompiledLogProductOperation =
  kpLogProductCompiledOperations[0]!;
export const kpMultiFactorCompiledLogProductOperation =
  kpLogProductCompiledOperations[1]!;

function relate(
  suffix: string,
  contract: KpLogProductContract,
  sourceSemanticId: KpLogProductSemanticId,
  targetSemanticId: KpLogProductSemanticId,
  summary: string
): SelectorCorrespondenceRecord {
  return Object.freeze({
    id: `correspondence.log-product.${suffix}`,
    relation: "role-change" as const,
    sourceSelectorIds: Object.freeze([
      occurrence(contract.source, sourceSemanticId)
    ]),
    targetSelectorIds: Object.freeze([
      occurrence(contract.target, targetSemanticId)
    ]),
    summary
  });
}

function fanOut(
  suffix: string,
  contract: KpLogProductContract,
  sourceSemanticId: KpLogProductSemanticId,
  targetSemanticIds: readonly KpLogProductSemanticId[],
  summary: string
): SelectorCorrespondenceRecord {
  return Object.freeze({
    id: `correspondence.log-product.${suffix}`,
    relation: "fan-out" as const,
    sourceSelectorIds: Object.freeze([
      occurrence(contract.source, sourceSemanticId)
    ]),
    targetSelectorIds: Object.freeze(targetSemanticIds.map((semanticId) =>
      occurrence(contract.target, semanticId)
    )),
    summary
  });
}

function occurrence(
  state: KpLogProductState,
  semanticId: KpLogProductSemanticId
): string {
  const matches = listKpLogProductExpressionNodes(state).filter(
    (node) => node.semanticId === semanticId
  );
  if (matches.length !== 1) {
    throw new Error(`${semanticId} must bind exactly one ${state.id} occurrence.`);
  }
  return matches[0]!.id;
}

function assertContract(contract: KpLogProductContract): void {
  if (
    contract.schemaVersion !== "kp.log-product-contract.v1" ||
    contract.source !== contract.family.states[0] ||
    contract.target !== contract.family.states[1] ||
    contract.domain.logarithmBase !== "e"
  ) {
    throw new Error("Log-product compilation requires an authoritative natural-log product contract.");
  }
}

function validateCompiledCorrespondence(
  contract: KpLogProductContract,
  correspondenceMap: CorrespondenceMap
): void {
  const sourceSelectorIds = listKpLogProductExpressionNodes(contract.source)
    .map(({ id }) => id);
  const targetSelectorIds = listKpLogProductExpressionNodes(contract.target)
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
  assertSameIds(
    projectCorrespondenceMapForPlayback(correspondenceMap, "backward")
      .flatMap(({ fromSelectorIds }) => fromSelectorIds),
    targetSelectorIds,
    "rewind source"
  );
  assertSameIds(
    projectCorrespondenceMapForPlayback(correspondenceMap, "backward")
      .flatMap(({ toSelectorIds }) => toSelectorIds),
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
    throw new Error(`Log-product ${label} must cover its endpoint exactly once.`);
  }
}

function factorKey(contract: KpLogProductContract): string {
  return contract.family.factors.map(({ name }) => name).join("");
}
