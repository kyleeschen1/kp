import {
  KP_FINITE_BINDER_VOCABULARY_AUTHORITY,
  createKpFiniteBinderSemanticId,
  defineKpFiniteBinderSource,
  type KpFiniteBinderSource
} from "../domain-ir/finite-binder-vocabulary.ts";

export const KP_FINITE_SUM_ENDPOINT_NORMALIZER =
  "normalizer.equation.finite-binder-expansion.v1" as const;

export interface KpNormalizedFiniteSumSourceEndpoint {
  readonly schemaVersion: "kp.normalized-finite-sum-source.v1";
  readonly kind: "normalized-finite-sum-source";
  readonly authority: typeof KP_FINITE_SUM_ENDPOINT_NORMALIZER;
  readonly rawLatex: string;
  readonly semantic: KpFiniteBinderSource;
}

export interface KpNormalizedFiniteSumTargetTerm {
  readonly role: "expanded-body-term";
  readonly ordinal: number;
  readonly rawLatex: string;
  readonly bodySymbol: string;
  readonly indexValue: number;
}

export interface KpNormalizedFiniteSumTargetEndpoint {
  readonly schemaVersion: "kp.normalized-finite-sum-target.v1";
  readonly kind: "normalized-finite-sum-target";
  readonly authority: typeof KP_FINITE_SUM_ENDPOINT_NORMALIZER;
  readonly rawLatex: string;
  readonly terms: readonly [
    KpNormalizedFiniteSumTargetTerm,
    ...KpNormalizedFiniteSumTargetTerm[]
  ];
  readonly connectors: readonly Readonly<{
    role: "additive-connector";
    ordinal: number;
    rawLatex: "+";
  }>[];
}

export type KpFiniteSumEndpointNormalizationResult<Endpoint> =
  | Readonly<{ status: "normalized"; endpoint: Endpoint }>
  | Readonly<{
      status: "unsupported-shape";
      diagnostic: Readonly<{
        code: "finite-sum-endpoint.unsupported-shape";
        latex: string;
        message: string;
        repair: string;
      }>;
    }>;

const boundedSumPattern =
  /^\s*\\sum_\{\s*([A-Za-z])\s*=\s*(-?\d+)\s*\}\^\{\s*(-?\d+)\s*\}\s*([A-Za-z])_(?:\{\s*([A-Za-z])\s*\}|([A-Za-z]))\s*$/u;
const expandedTermPattern =
  /^\s*([A-Za-z])_(?:\{\s*(-?\d+)\s*\}|(-?\d+))\s*$/u;

/**
 * The normalizer deliberately accepts only the finite one-reference shape
 * proved by this tranche. A visible large operator is not enough evidence for
 * binder scope, a finite range, or a lawful expansion.
 */
export function normalizeKpFiniteSumSourceEndpoint(
  latex: string
): KpFiniteSumEndpointNormalizationResult<KpNormalizedFiniteSumSourceEndpoint> {
  const match = boundedSumPattern.exec(latex);
  if (match === null) {
    return unsupported(latex,
      "Expected \\sum_{i=m}^{n} a_i with explicit integer bounds and one direct binder reference.");
  }
  const [, binderSymbol, lowerText, upperText, bodySymbol,
    bracedReference, bareReference] = match;
  if (binderSymbol === undefined || lowerText === undefined ||
      upperText === undefined || bodySymbol === undefined) {
    return unsupported(latex, "The bounded sum is missing a required role.");
  }
  const referenceSymbol = bracedReference ?? bareReference;
  if (referenceSymbol !== binderSymbol) {
    return unsupported(latex,
      `Body reference ${referenceSymbol ?? "<missing>"} does not name binder ${binderSymbol}.`);
  }
  const lower = Number(lowerText);
  const upper = Number(upperText);
  const namespace = `sum.${bodySymbol.toLowerCase()}_${binderSymbol.toLowerCase()}`;
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
      operator: "sum"
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
        .replace(/^\s*\\sum_\{[^}]+\}\^\{[^}]+\}\s*/u, "")
        .trim(),
      references: [{
        id: createKpFiniteBinderSemanticId(`${namespace}.body.reference`),
        role: "bound-reference",
        symbol: referenceSymbol,
        bindsTo: binderId
      }]
    }
  });
  return normalized({
    schemaVersion: "kp.normalized-finite-sum-source.v1",
    kind: "normalized-finite-sum-source",
    authority: KP_FINITE_SUM_ENDPOINT_NORMALIZER,
    rawLatex: latex,
    semantic
  });
}

export function normalizeKpFiniteSumTargetEndpoint(
  latex: string
): KpFiniteSumEndpointNormalizationResult<KpNormalizedFiniteSumTargetEndpoint> {
  const pieces = latex.split("+");
  if (pieces.length === 0) {
    return unsupported(latex, "Expected one or more indexed target terms.");
  }
  const terms: KpNormalizedFiniteSumTargetTerm[] = [];
  let expectedSymbol: string | undefined;
  for (const [ordinal, piece] of pieces.entries()) {
    const match = expandedTermPattern.exec(piece);
    if (match === null) {
      return unsupported(latex,
        "Expanded targets must contain only indexed body terms joined by +.");
    }
    const [, bodySymbol, bracedIndex, bareIndex] = match;
    if (bodySymbol === undefined) {
      return unsupported(latex, "An expanded target term lacks a body symbol.");
    }
    if (expectedSymbol !== undefined && bodySymbol !== expectedSymbol) {
      return unsupported(latex,
        "All expanded target terms must instantiate the same body template.");
    }
    expectedSymbol = bodySymbol;
    terms.push(Object.freeze({
      role: "expanded-body-term" as const,
      ordinal,
      rawLatex: piece.trim(),
      bodySymbol,
      indexValue: Number(bracedIndex ?? bareIndex)
    }));
  }
  const [first, ...rest] = terms;
  if (first === undefined) {
    return unsupported(latex, "Expected at least one expanded target term.");
  }
  return normalized({
    schemaVersion: "kp.normalized-finite-sum-target.v1",
    kind: "normalized-finite-sum-target",
    authority: KP_FINITE_SUM_ENDPOINT_NORMALIZER,
    rawLatex: latex,
    terms: Object.freeze([first, ...rest]),
    connectors: Object.freeze(rest.map((_term, ordinal) => Object.freeze({
      role: "additive-connector" as const,
      ordinal,
      rawLatex: "+" as const
    })))
  });
}

function integerIdPart(value: number): string {
  return value < 0 ? `neg-${Math.abs(value)}` : String(value);
}

function normalized<Endpoint>(
  endpoint: Endpoint
): KpFiniteSumEndpointNormalizationResult<Endpoint> {
  return deepFreeze({ status: "normalized" as const, endpoint });
}

function unsupported<Endpoint>(
  latex: string,
  message: string
): KpFiniteSumEndpointNormalizationResult<Endpoint> {
  return deepFreeze({
    status: "unsupported-shape" as const,
    diagnostic: {
      code: "finite-sum-endpoint.unsupported-shape" as const,
      latex,
      message,
      repair:
        "Provide one explicit finite sum or its direct ordered expansion; compose other rewrites before selecting this capability."
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
