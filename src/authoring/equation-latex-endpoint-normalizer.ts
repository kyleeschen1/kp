import {
  parseLatexEquation,
  type ParsedLatexEquation
} from "../math/equation-classifier.ts";
import {
  LatexParseError,
  parseLatexExpression,
  type ParsedLatexExpression
} from "../math/latex-parser.ts";
import type {
  KpEquationTransformSeriesRequest,
  KpEquationTransformSeriesState
} from "./equation-transform-series-request.ts";

export const KP_EQUATION_LATEX_ENDPOINT_NORMALIZER =
  "normalizer.equation.native-latex.v1" as const;

export const KP_EQUATION_LOGARITHM_BASE_SYNTAX_NORMALIZER =
  "normalizer.equation.logarithm-base-syntax.v1" as const;

export type KpNormalizedLatexEndpoint =
  | Readonly<{
      kind: "expression";
      expression: ParsedLatexExpression;
    }>
  | Readonly<{
      kind: "relation";
      relation: "equals";
      equation: ParsedLatexEquation;
    }>;

export interface KpNormalizedEquationTransformSeriesState {
  readonly id: string;
  readonly index: number;
  readonly latex: string;
  readonly narration?: string | undefined;
  readonly authority: typeof KP_EQUATION_LATEX_ENDPOINT_NORMALIZER;
  readonly syntaxAuthorityIds?: readonly [
    typeof KP_EQUATION_LOGARITHM_BASE_SYNTAX_NORMALIZER
  ] | undefined;
  readonly endpoint: KpNormalizedLatexEndpoint;
}

export interface KpEquationLatexEndpointDiagnostic {
  readonly code: "equation-series.endpoint.unsupported-syntax";
  readonly stateId: string;
  readonly stateIndex: number;
  readonly latex: string;
  readonly message: string;
  readonly repair: string;
  readonly offset?: number | undefined;
  readonly expected?: string | undefined;
}

export type KpEquationLatexEndpointNormalizationResult =
  | Readonly<{
      status: "normalized";
      states: readonly KpNormalizedEquationTransformSeriesState[];
      diagnostics: readonly [];
    }>
  | Readonly<{
      status: "unsupported-syntax";
      states: readonly KpNormalizedEquationTransformSeriesState[];
      diagnostics: readonly KpEquationLatexEndpointDiagnostic[];
    }>;

/**
 * Converts only notation the shared parser already understands. Unsupported
 * syntax stays visible as a typed authoring gap instead of becoming guessed
 * semantic identity or generic text tokens.
 */
export function normalizeKpEquationTransformSeriesEndpoints(
  request: KpEquationTransformSeriesRequest
): KpEquationLatexEndpointNormalizationResult {
  const states: KpNormalizedEquationTransformSeriesState[] = [];
  const diagnostics: KpEquationLatexEndpointDiagnostic[] = [];

  request.states.forEach((state, index) => {
    try {
      const endpoint = parseEndpoint(state.latex);
      states.push(deepFreeze({
        id: state.id,
        index,
        latex: state.latex,
        ...(state.narration === undefined ? {} : { narration: state.narration }),
        authority: KP_EQUATION_LATEX_ENDPOINT_NORMALIZER,
        ...(endpointContainsExplicitBaseLog(endpoint)
          ? { syntaxAuthorityIds: [
              KP_EQUATION_LOGARITHM_BASE_SYNTAX_NORMALIZER
            ] as const }
          : {}),
        endpoint
      }));
    } catch (error) {
      diagnostics.push(diagnosticFor(state, index, error));
    }
  });

  if (diagnostics.length > 0) {
    return deepFreeze({
      status: "unsupported-syntax" as const,
      states,
      diagnostics
    });
  }

  return deepFreeze({
    status: "normalized" as const,
    states,
    diagnostics: [] as readonly []
  });
}

function endpointContainsExplicitBaseLog(
  endpoint: KpNormalizedLatexEndpoint
): boolean {
  return endpoint.kind === "expression"
    ? expressionContainsExplicitBaseLog(endpoint.expression)
    : expressionContainsExplicitBaseLog(endpoint.equation.left) ||
      expressionContainsExplicitBaseLog(endpoint.equation.right);
}

function expressionContainsExplicitBaseLog(
  expression: ParsedLatexExpression
): boolean {
  switch (expression.kind) {
    case "number":
    case "identifier":
      return false;
    case "unary":
      return expressionContainsExplicitBaseLog(expression.value);
    case "binary":
      return expressionContainsExplicitBaseLog(expression.left) ||
        expressionContainsExplicitBaseLog(expression.right);
    case "call":
      return expression.name === "log" ||
        expressionContainsExplicitBaseLog(expression.argument);
  }
}

function parseEndpoint(latex: string): KpNormalizedLatexEndpoint {
  try {
    return {
      kind: "relation",
      relation: "equals",
      equation: parseLatexEquation(latex)
    };
  } catch (error) {
    // A missing relation is the expected branch for a plain expression.
    if (!(error instanceof LatexParseError && error.expected === "=")) {
      throw error;
    }
  }

  return {
    kind: "expression",
    expression: parseLatexExpression(latex)
  };
}

function diagnosticFor(
  state: KpEquationTransformSeriesState,
  stateIndex: number,
  error: unknown
): KpEquationLatexEndpointDiagnostic {
  const detail = error instanceof Error ? error.message : String(error);
  return deepFreeze({
    code: "equation-series.endpoint.unsupported-syntax" as const,
    stateId: state.id,
    stateIndex,
    latex: state.latex,
    message: `Could not normalize ${state.id}: ${detail}`,
    repair: "Use supported native LaTeX or add a bounded parser capability before resolving this adjacency.",
    ...(error instanceof LatexParseError
      ? { offset: error.offset, expected: error.expected }
      : {})
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
