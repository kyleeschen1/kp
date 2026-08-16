import { listKpExpressionNodes } from "./expression-node-protocol.ts";
import {
  kpLogProductExpressionProtocol
} from "./log-product-expression-protocol.ts";
import {
  kpLogProductAnimationId,
  kpMultiFactorLogProductAnimationId,
  type KpLogProductAnimationId
} from "./log-product-ids.ts";

export type KpLogProductStateId = `log-product.state.${string}`;
export type KpLogProductSemanticId = `semantic.log-product.${string}`;

interface KpLogProductNodeBase {
  readonly id: string;
  readonly semanticId: KpLogProductSemanticId;
}

export type KpLogProductExpressionNode =
  | KpLogProductSymbolNode
  | KpLogProductFunctionOperatorNode
  | KpLogProductDelimiterNode
  | KpLogProductPlusNode
  | KpLogProductNaturalLogNode
  | KpLogProductProductNode
  | KpLogProductSumNode;

export interface KpLogProductSymbolNode extends KpLogProductNodeBase {
  readonly kind: "symbol";
  readonly name: string;
}

export interface KpLogProductFunctionOperatorNode extends KpLogProductNodeBase {
  readonly kind: "function-operator";
  readonly name: "ln";
}

export interface KpLogProductDelimiterNode extends KpLogProductNodeBase {
  readonly kind: "delimiter";
  readonly value: "(" | ")";
}

export interface KpLogProductPlusNode extends KpLogProductNodeBase {
  readonly kind: "plus-operator";
  readonly value: "+";
}

export interface KpLogProductNaturalLogNode extends KpLogProductNodeBase {
  readonly kind: "natural-log";
  readonly operator: KpLogProductFunctionOperatorNode;
  readonly enclosure: readonly [
    KpLogProductDelimiterNode,
    KpLogProductDelimiterNode
  ];
  readonly argument: KpLogProductExpressionNode;
}

export interface KpLogProductProductNode extends KpLogProductNodeBase {
  readonly kind: "implicit-product";
  readonly factors: readonly [
    KpLogProductExpressionNode,
    KpLogProductExpressionNode,
    ...KpLogProductExpressionNode[]
  ];
}

export interface KpLogProductSumNode extends KpLogProductNodeBase {
  readonly kind: "sum";
  readonly terms: readonly [
    KpLogProductExpressionNode,
    KpLogProductExpressionNode,
    ...KpLogProductExpressionNode[]
  ];
  readonly connectors: readonly KpLogProductPlusNode[];
}

export interface KpLogProductState {
  readonly id: KpLogProductStateId;
  readonly kind: "log-of-product" | "sum-of-logs";
  readonly latex: string;
  readonly accessibleText: string;
  readonly root: KpLogProductExpressionNode;
}

export interface KpLogProductWrapperSemanticIds {
  readonly application: KpLogProductSemanticId;
  readonly operator: KpLogProductSemanticId;
  readonly open: KpLogProductSemanticId;
  readonly close: KpLogProductSemanticId;
}

export interface KpLogProductFactorDescriptor {
  readonly ordinal: number;
  readonly name: string;
  readonly semanticId: KpLogProductSemanticId;
  readonly sourceOccurrenceId: string;
  readonly targetOccurrenceId: string;
  readonly targetWrapper: KpLogProductWrapperSemanticIds;
  readonly targetWrapperOccurrenceId: string;
}

export interface KpLogProductFamily {
  readonly id: string;
  readonly animationId: KpLogProductAnimationId;
  readonly factors: readonly [
    KpLogProductFactorDescriptor,
    KpLogProductFactorDescriptor,
    ...KpLogProductFactorDescriptor[]
  ];
  readonly sourceWrapper: KpLogProductWrapperSemanticIds;
  readonly sourceProductSemanticId: KpLogProductSemanticId;
  readonly targetSumSemanticId: KpLogProductSemanticId;
  readonly connectorSemanticIds: readonly KpLogProductSemanticId[];
  readonly states: readonly [KpLogProductState, KpLogProductState];
}

const canonicalFamily = createKpLogProductFamily({
  id: "family.log-product.xy",
  animationId: kpLogProductAnimationId,
  factorNames: ["x", "y"],
  legacyBinaryIds: true
});

const multiFactorFamily = createKpLogProductFamily({
  id: "family.log-product.xyz",
  animationId: kpMultiFactorLogProductAnimationId,
  factorNames: ["x", "y", "z"]
});

export const kpCanonicalLogProductFamily = canonicalFamily;
export const kpMultiFactorLogProductFamily = multiFactorFamily;
export const kpLogProductFamilies: readonly KpLogProductFamily[] = Object.freeze([
  canonicalFamily,
  multiFactorFamily
]);
export const kpCanonicalLogProductStates = canonicalFamily.states;
export const kpMultiFactorLogProductStates = multiFactorFamily.states;

export function listKpLogProductExpressionNodes(
  state: KpLogProductState
): readonly KpLogProductExpressionNode[] {
  return listKpExpressionNodes(state.root, kpLogProductExpressionProtocol);
}

function symbol(
  id: string,
  name: string,
  semanticId: KpLogProductSemanticId
): KpLogProductSymbolNode {
  return Object.freeze({
    id,
    semanticId,
    kind: "symbol",
    name
  });
}

function naturalLog(
  id: string,
  semanticIds: KpLogProductWrapperSemanticIds,
  argument: KpLogProductExpressionNode
): KpLogProductNaturalLogNode {
  return Object.freeze({
    id,
    semanticId: semanticIds.application,
    kind: "natural-log",
    operator: Object.freeze({
      id: `${id}.operator`,
      semanticId: semanticIds.operator,
      kind: "function-operator" as const,
      name: "ln" as const
    }),
    enclosure: Object.freeze([
      Object.freeze({
        id: `${id}.open`,
        semanticId: semanticIds.open,
        kind: "delimiter" as const,
        value: "(" as const
      }),
      Object.freeze({
        id: `${id}.close`,
        semanticId: semanticIds.close,
        kind: "delimiter" as const,
        value: ")" as const
      })
    ] as const),
    argument
  });
}

function product(
  id: string,
  semanticId: KpLogProductSemanticId,
  factors: readonly [
    KpLogProductExpressionNode,
    KpLogProductExpressionNode,
    ...KpLogProductExpressionNode[]
  ]
): KpLogProductProductNode {
  return Object.freeze({
    id,
    semanticId,
    kind: "implicit-product",
    factors: Object.freeze([...factors]) as KpLogProductProductNode["factors"]
  });
}

function sum(
  id: string,
  semanticId: KpLogProductSemanticId,
  terms: readonly [
    KpLogProductExpressionNode,
    KpLogProductExpressionNode,
    ...KpLogProductExpressionNode[]
  ],
  connectorSemanticIds: readonly KpLogProductSemanticId[]
): KpLogProductSumNode {
  if (connectorSemanticIds.length !== terms.length - 1) {
    throw new Error("A log-product sum requires one connector between each ordered term.");
  }
  return Object.freeze({
    id,
    semanticId,
    kind: "sum",
    terms: Object.freeze([...terms]) as KpLogProductSumNode["terms"],
    connectors: Object.freeze(connectorSemanticIds.map((connectorSemanticId, index) =>
      Object.freeze({
        id: connectorSemanticIds.length === 1
          ? `${id}.plus`
          : `${id}.plus.${index}`,
        semanticId: connectorSemanticId,
        kind: "plus-operator" as const,
        value: "+" as const
      })
    ))
  });
}

function createKpLogProductFamily(input: {
  readonly id: string;
  readonly animationId: KpLogProductAnimationId;
  readonly factorNames: readonly [string, string, ...string[]];
  readonly legacyBinaryIds?: boolean;
}): KpLogProductFamily {
  const familyKey = input.factorNames.join("");
  const semanticPrefix = input.legacyBinaryIds === true
    ? "semantic.log-product"
    : `semantic.log-product.${familyKey}`;
  const sourcePrefix = input.legacyBinaryIds === true ? "source" : `source.${familyKey}`;
  const targetPrefix = input.legacyBinaryIds === true ? "target" : `target.${familyKey}`;
  const sourceWrapper = wrapperSemanticIds(semanticId(`${semanticPrefix}.wrapper.source`));
  const factors = input.factorNames.map((name, ordinal) => {
    const position = input.legacyBinaryIds === true
      ? ordinal === 0 ? "left" : "right"
      : `term-${ordinal + 1}`;
    const targetWrapperOccurrenceId = `${targetPrefix}.${position}.log`;
    return Object.freeze({
      ordinal,
      name,
      semanticId: `semantic.log-product.variable.${name}` as const,
      sourceOccurrenceId: `${sourcePrefix}.product.${name}`,
      targetOccurrenceId: `${targetPrefix}.${position}.argument.${name}`,
      targetWrapper: wrapperSemanticIds(semanticId(`${semanticPrefix}.wrapper.target-${position}`)),
      targetWrapperOccurrenceId
    });
  }) as unknown as KpLogProductFamily["factors"];
  const sourceProductSemanticId = semanticId(`${semanticPrefix}.product.${familyKey}`);
  const targetSumSemanticId = semanticId(`${semanticPrefix}.sum.logs`);
  const connectorSemanticIds = Object.freeze(input.factorNames.slice(1).map((_, index) =>
    semanticId(
      input.legacyBinaryIds === true
        ? `${semanticPrefix}.connector.plus`
        : `${semanticPrefix}.connector.plus.${index}`
    )
  ));
  const sourceRoot = naturalLog(
    `${sourcePrefix}.log`,
    sourceWrapper,
    product(
      `${sourcePrefix}.product`,
      sourceProductSemanticId,
      factors.map((factor) => symbol(
        factor.sourceOccurrenceId,
        factor.name,
        factor.semanticId
      )) as unknown as KpLogProductProductNode["factors"]
    )
  );
  const targetTerms = factors.map((factor) => naturalLog(
    factor.targetWrapperOccurrenceId,
    factor.targetWrapper,
    symbol(factor.targetOccurrenceId, factor.name, factor.semanticId)
  )) as unknown as KpLogProductSumNode["terms"];
  const sourceStateId = input.legacyBinaryIds === true
    ? "log-product.state.product" as const
    : `log-product.state.product.${familyKey}` as const;
  const targetStateId = input.legacyBinaryIds === true
    ? "log-product.state.sum" as const
    : `log-product.state.sum.${familyKey}` as const;
  const source: KpLogProductState = Object.freeze({
    id: sourceStateId,
    kind: "log-of-product",
    latex: `\\ln(${input.factorNames.join("")})`,
    accessibleText: `natural log of ${input.factorNames.join(" times ")}`,
    root: sourceRoot
  });
  const target: KpLogProductState = Object.freeze({
    id: targetStateId,
    kind: "sum-of-logs",
    latex: input.factorNames.map((name) => `\\ln(${name})`).join("+"),
    accessibleText: input.factorNames.map((name) => `natural log of ${name}`).join(" plus "),
    root: sum(
      `${targetPrefix}.sum`,
      targetSumSemanticId,
      targetTerms,
      connectorSemanticIds
    )
  });
  return Object.freeze({
    id: input.id,
    animationId: input.animationId,
    factors,
    sourceWrapper,
    sourceProductSemanticId,
    targetSumSemanticId,
    connectorSemanticIds,
    states: Object.freeze([source, target] as const)
  });
}

function wrapperSemanticIds(
  application: KpLogProductSemanticId
): KpLogProductWrapperSemanticIds {
  return Object.freeze({
    application,
    operator: `${application}.operator`,
    open: `${application}.open`,
    close: `${application}.close`
  });
}

function semanticId(value: string): KpLogProductSemanticId {
  if (!value.startsWith("semantic.log-product.")) {
    throw new Error(`Invalid log-product semantic id ${value}.`);
  }
  return value as KpLogProductSemanticId;
}
