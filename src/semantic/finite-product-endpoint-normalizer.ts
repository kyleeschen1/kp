import {
  KP_FINITE_BINDER_VOCABULARY_AUTHORITY,
  createKpFiniteBinderSemanticId,
  defineKpFiniteBinderSource,
  type KpFiniteBinderSource
} from "../domain-ir/finite-binder-vocabulary.ts";

export const KP_FINITE_PRODUCT_ENDPOINT_NORMALIZER =
  "normalizer.equation.finite-product-pressure.v1" as const;

export interface KpNormalizedFiniteProductSourceEndpoint {
  readonly schemaVersion: "kp.normalized-finite-product-source.v1";
  readonly kind: "normalized-finite-product-source";
  readonly authority: typeof KP_FINITE_PRODUCT_ENDPOINT_NORMALIZER;
  readonly rawLatex: string;
  readonly semantic: KpFiniteBinderSource;
}

export interface KpNormalizedFiniteProductTargetFactor {
  readonly role: "expanded-body-factor";
  readonly ordinal: number;
  readonly rawLatex: string;
  readonly bodySymbol: string;
  readonly indexValue: number;
}

export interface KpNormalizedFiniteProductTargetAdjacency {
  readonly role: "implicit-multiplicative-adjacency";
  readonly ordinal: number;
  readonly betweenFactorOrdinals: readonly [number, number];
  readonly rawLatex: "";
}

export interface KpNormalizedFiniteProductTargetEndpoint {
  readonly schemaVersion: "kp.normalized-finite-product-target.v1";
  readonly kind: "normalized-finite-product-target";
  readonly authority: typeof KP_FINITE_PRODUCT_ENDPOINT_NORMALIZER;
  readonly rawLatex: string;
  readonly factors: readonly [
    KpNormalizedFiniteProductTargetFactor,
    ...KpNormalizedFiniteProductTargetFactor[]
  ];
  readonly adjacencies: readonly KpNormalizedFiniteProductTargetAdjacency[];
}

export type KpFiniteProductEndpointNormalizationResult<Endpoint> =
  | Readonly<{ status: "normalized"; endpoint: Endpoint }>
  | Readonly<{
      status: "unsupported-shape";
      diagnostic: Readonly<{
        code: "finite-product-endpoint.unsupported-shape";
        latex: string;
        message: string;
        repair: string;
      }>;
    }>;

const boundedProductPattern =
  /^\s*\\prod_\{\s*([A-Za-z])\s*=\s*(-?\d+)\s*\}\^\{\s*(-?\d+)\s*\}\s*([A-Za-z])_(?:\{\s*([A-Za-z])\s*\}|([A-Za-z]))\s*$/u;
const expandedFactorPattern =
  /\s*([A-Za-z])_(?:\{\s*(-?\d+)\s*\}|(-?\d+))/uy;

/**
 * Product pressure intentionally owns a second narrow endpoint grammar. The
 * later promotion slice may extract only the structure proven common with the
 * approved sum; product adjacency is not additive connector paint.
 */
export function normalizeKpFiniteProductSourceEndpoint(
  latex: string
): KpFiniteProductEndpointNormalizationResult<
  KpNormalizedFiniteProductSourceEndpoint
> {
  const match = boundedProductPattern.exec(latex);
  if (match === null) {
    return unsupported(latex,
      "Expected \\prod_{k=m}^{n} x_k with explicit integer bounds and one direct binder reference.");
  }
  const [, binderSymbol, lowerText, upperText, bodySymbol,
    bracedReference, bareReference] = match;
  if (binderSymbol === undefined || lowerText === undefined ||
      upperText === undefined || bodySymbol === undefined) {
    return unsupported(latex, "The bounded product is missing a required role.");
  }
  const referenceSymbol = bracedReference ?? bareReference;
  if (referenceSymbol !== binderSymbol) {
    return unsupported(latex,
      `Body reference ${referenceSymbol ?? "<missing>"} does not name binder ${binderSymbol}.`);
  }
  const lower = Number(lowerText);
  const upper = Number(upperText);
  if (!Number.isSafeInteger(lower) || !Number.isSafeInteger(upper)) {
    return unsupported(latex, "Finite product bounds must be safe integers.");
  }
  const namespace =
    `product.${bodySymbol.toLowerCase()}_${binderSymbol.toLowerCase()}`;
  const binderId = createKpFiniteBinderSemanticId(
    `${namespace}.binder.${binderSymbol.toLowerCase()}`
  );
  const semantic = defineKpFiniteBinderSource({
    schemaVersion: "kp.finite-binder-source.v1",
    kind: "finite-binder-source",
    authority: KP_FINITE_BINDER_VOCABULARY_AUTHORITY,
    id: createKpFiniteBinderSemanticId(`${namespace}.source`),
    operator: {
      id: createKpFiniteBinderSemanticId(`${namespace}.operator`),
      role: "operator",
      operator: "product"
    },
    binder: { id: binderId, role: "binder-declaration", symbol: binderSymbol },
    lowerBound: {
      id: createKpFiniteBinderSemanticId(
        `${namespace}.lower.${integerIdPart(lower)}`
      ),
      role: "lower-bound",
      value: lower
    },
    upperBound: {
      id: createKpFiniteBinderSemanticId(
        `${namespace}.upper.${integerIdPart(upper)}`
      ),
      role: "upper-bound",
      value: upper
    },
    body: {
      id: createKpFiniteBinderSemanticId(`${namespace}.body`),
      role: "body-template",
      sourceLatex: latex.slice(match.index, match.index + match[0].length)
        .replace(/^\s*\\prod_\{[^}]+\}\^\{[^}]+\}\s*/u, "")
        .trim(),
      freeSymbols: [bodySymbol],
      references: [{
        id: createKpFiniteBinderSemanticId(`${namespace}.body.reference`),
        role: "bound-reference",
        symbol: referenceSymbol,
        bindsTo: binderId
      }]
    }
  });
  return normalized({
    schemaVersion: "kp.normalized-finite-product-source.v1",
    kind: "normalized-finite-product-source",
    authority: KP_FINITE_PRODUCT_ENDPOINT_NORMALIZER,
    rawLatex: latex,
    semantic
  });
}

export function normalizeKpFiniteProductTargetEndpoint(
  latex: string
): KpFiniteProductEndpointNormalizationResult<
  KpNormalizedFiniteProductTargetEndpoint
> {
  const expression = latex.trim();
  const factors: KpNormalizedFiniteProductTargetFactor[] = [];
  let expectedSymbol: string | undefined;
  let cursor = 0;
  while (cursor < expression.length) {
    expandedFactorPattern.lastIndex = cursor;
    const match = expandedFactorPattern.exec(expression);
    if (match === null || match.index !== cursor) {
      return unsupported(latex,
        "Expanded products must contain only adjacent indexed body factors.");
    }
    const [, bodySymbol, bracedIndex, bareIndex] = match;
    const indexValue = Number(bracedIndex ?? bareIndex);
    if (!Number.isSafeInteger(indexValue)) {
      return unsupported(latex,
        "Expanded target indices must be safe integers.");
    }
    if (bodySymbol === undefined) {
      return unsupported(latex, "An expanded target factor lacks a body symbol.");
    }
    if (expectedSymbol !== undefined && bodySymbol !== expectedSymbol) {
      return unsupported(latex,
        "All expanded target factors must instantiate the same body template.");
    }
    expectedSymbol = bodySymbol;
    factors.push(Object.freeze({
      role: "expanded-body-factor" as const,
      ordinal: factors.length,
      rawLatex: match[0].trim(),
      bodySymbol,
      indexValue
    }));
    cursor = expandedFactorPattern.lastIndex;
  }
  const [first, ...rest] = factors;
  if (first === undefined) {
    return unsupported(latex, "Expected at least one indexed target factor.");
  }
  return normalized({
    schemaVersion: "kp.normalized-finite-product-target.v1",
    kind: "normalized-finite-product-target",
    authority: KP_FINITE_PRODUCT_ENDPOINT_NORMALIZER,
    rawLatex: latex,
    factors: Object.freeze([first, ...rest]),
    adjacencies: Object.freeze(rest.map((_factor, ordinal) => Object.freeze({
      role: "implicit-multiplicative-adjacency" as const,
      ordinal,
      betweenFactorOrdinals: [ordinal, ordinal + 1] as const,
      rawLatex: "" as const
    })))
  });
}

function integerIdPart(value: number): string {
  return value < 0 ? `neg-${Math.abs(value)}` : String(value);
}

function normalized<Endpoint>(
  endpoint: Endpoint
): KpFiniteProductEndpointNormalizationResult<Endpoint> {
  return deepFreeze({ status: "normalized" as const, endpoint });
}

function unsupported<Endpoint>(
  latex: string,
  message: string
): KpFiniteProductEndpointNormalizationResult<Endpoint> {
  return deepFreeze({
    status: "unsupported-shape" as const,
    diagnostic: {
      code: "finite-product-endpoint.unsupported-shape" as const,
      latex,
      message,
      repair:
        "Provide one explicit finite product or its direct ordered factor expansion; compose other rewrites before selecting this capability."
    }
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
