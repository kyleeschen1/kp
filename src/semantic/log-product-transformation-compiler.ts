import {
  kpCanonicalLogProductContract,
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
  assertCanonicalContract(contract);
  const correspondenceMap: CorrespondenceMap = Object.freeze({
    id: "correspondence.log-product.product-to-sum",
    records: Object.freeze([
      fanOut(
        "application-fission",
        contract,
        "semantic.log-product.wrapper.source",
        [
          "semantic.log-product.wrapper.target-left",
          "semantic.log-product.wrapper.target-right"
        ],
        "One logarithm application derives two ordered target applications."
      ),
      fanOut(
        "operator-fission",
        contract,
        "semantic.log-product.wrapper.source.operator",
        [
          "semantic.log-product.wrapper.target-left.operator",
          "semantic.log-product.wrapper.target-right.operator"
        ],
        "The source ln operator derives both target operators without duplicating identity."
      ),
      fanOut(
        "open-shell-fission",
        contract,
        "semantic.log-product.wrapper.source.open",
        [
          "semantic.log-product.wrapper.target-left.open",
          "semantic.log-product.wrapper.target-right.open"
        ],
        "The source opening delimiter derives one shell per target application."
      ),
      fanOut(
        "close-shell-fission",
        contract,
        "semantic.log-product.wrapper.source.close",
        [
          "semantic.log-product.wrapper.target-left.close",
          "semantic.log-product.wrapper.target-right.close"
        ],
        "The source closing delimiter derives one shell per target application."
      ),
      relate(
        "x-argument-continuity",
        contract,
        "semantic.log-product.variable.x",
        "semantic.log-product.variable.x",
        "The same x becomes the left logarithm argument."
      ),
      relate(
        "y-argument-continuity",
        contract,
        "semantic.log-product.variable.y",
        "semantic.log-product.variable.y",
        "The same y becomes the right logarithm argument."
      ),
      fanOut(
        "product-derives-sum",
        contract,
        "semantic.log-product.product.xy",
        [
          "semantic.log-product.sum.logs",
          "semantic.log-product.connector.plus"
        ],
        "Product structure derives additive structure and its plus connector without glyph identity."
      )
    ] satisfies readonly SelectorCorrespondenceRecord[])
  });
  validateCompiledCorrespondence(contract, correspondenceMap);
  const transformation = Object.freeze(createKpSemanticTransformation({
    id: "transformation.log-product.product-to-sum",
    transformType: "expandLogProductAsSum",
    title: "Expand a logarithm of a product as a sum of logarithms",
    sourceObjectIds: [contract.source.id],
    targetObjectIds: [contract.target.id],
    preserves: ["identity", "value", "role"],
    correspondenceMap,
    assumptions: [...contract.assumptionIds],
    lawRefs: [{
      id: contract.lawId,
      level: "strict",
      summary: "For positive x and y, ln(xy) equals ln(x) plus ln(y)."
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

export const kpCanonicalCompiledLogProductOperation =
  compileKpLogProductOperation();

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

function assertCanonicalContract(contract: KpLogProductContract): void {
  if (
    contract.schemaVersion !== "kp.log-product-contract.v1" ||
    contract.id !== "contract.log-product.product-to-sum" ||
    contract.source.latex !== "\\ln(xy)" ||
    contract.target.latex !== "\\ln(x)+\\ln(y)" ||
    contract.domain.logarithmBase !== "e"
  ) {
    throw new Error("Log-product compilation requires the exact natural-log product contract.");
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
