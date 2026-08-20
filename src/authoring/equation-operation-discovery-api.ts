import generatedCatalog from
  "./equation-operation-discovery-catalog.generated.json" with {
    type: "json"
  };
import {
  normalizeKpEquationOperationAlias,
  type KpEquationOperationDiscoveryCatalog,
  type KpEquationOperationDiscoveryCatalogEntry
} from "./equation-operation-discovery-catalog.ts";

export interface KpEquationOperationNarrowingRule {
  readonly id: string;
  readonly operationId: string;
  readonly reason: string;
  readonly matches: (input: {
    readonly sourceLatex: string;
    readonly targetLatex: string;
  }) => boolean;
}

export interface KpEquationOperationCandidate {
  readonly operationId: string;
  readonly friendlyName: string;
  readonly reason: string;
  readonly requiredEvidenceIds: readonly string[];
}

export type KpEquationOperationInspection =
  | Readonly<{
      readonly status: "resolved";
      readonly requested: string;
      readonly normalizedAlias: string;
      readonly resolution: "canonical" | "alias";
      readonly capability: KpEquationOperationDiscoveryCatalogEntry;
    }>
  | Readonly<{
      readonly status: "unknown";
      readonly requested: string;
      readonly normalizedAlias: string;
    }>;

export type KpEquationOperationNarrowingResult =
  | Readonly<{
      readonly status: "narrowed";
      readonly adjacencies: readonly Readonly<{
        readonly index: number;
        readonly fromStateId: string;
        readonly toStateId: string;
        readonly candidates: readonly KpEquationOperationCandidate[];
      }>[];
    }>
  | Readonly<{
      readonly status: "invalid-request";
      readonly diagnostics: readonly string[];
    }>;

export interface KpEquationOperationDiscoveryApi {
  readonly schemaVersion: "kp.equation-operation-discovery-api.v1";
  readonly list: (query?: string) =>
    readonly KpEquationOperationDiscoveryCatalogEntry[];
  readonly inspect: (operationOrAlias: string) =>
    KpEquationOperationInspection;
  readonly narrow: (input: {
    readonly states: readonly Readonly<{
      readonly id: string;
      readonly latex: string;
    }>[];
  }) => KpEquationOperationNarrowingResult;
}

const defaultRules = Object.freeze([
  rule({
    id: "rule.equation.remove-additive-identity.v1",
    operationId: "kp.semantic-motion.absorb-additive-identity",
    reason:
      "One additive-identity token can be removed while the surrounding notation remains textually stable.",
    matches: ({ sourceLatex, targetLatex }) =>
      removeAdditiveIdentity(normalizeLatex(sourceLatex)) ===
        normalizeLatex(targetLatex)
  }),
  rule({
    id: "rule.equation.remove-multiplicative-identity.v1",
    operationId: "kp.semantic-motion.absorb-multiplicative-identity",
    reason:
      "One multiplicative-identity token can be removed while the surrounding notation remains textually stable.",
    matches: ({ sourceLatex, targetLatex }) =>
      removeMultiplicativeIdentity(normalizeLatex(sourceLatex)) ===
        normalizeLatex(targetLatex)
  }),
  rule({
    id: "rule.equation.evaluate-constant-product.v1",
    operationId: "kp.algebra.simplify-constant-product",
    reason: "Two explicit numeric factors evaluate to the authored numeric result.",
    matches: ({ sourceLatex, targetLatex }) =>
      isConstantProduct(normalizeLatex(sourceLatex), normalizeLatex(targetLatex))
  })
]);

/**
 * The default API reads generated plain data and pure narrowing rules. Tool
 * clients therefore do not load semantic registries, Svelte, DOM, or renderers.
 */
export function createKpEquationOperationDiscoveryApi(input: {
  readonly catalog?: KpEquationOperationDiscoveryCatalog | undefined;
  readonly rules?: readonly KpEquationOperationNarrowingRule[] | undefined;
} = {}): KpEquationOperationDiscoveryApi {
  const catalog = input.catalog ??
    (generatedCatalog as KpEquationOperationDiscoveryCatalog);
  const rules = input.rules ?? defaultRules;
  const entriesById = new Map(catalog.entries.map((entry) =>
    [entry.operationId, entry] as const
  ));
  const aliasOwners = new Map(catalog.aliases.map(({ alias, operationId }) =>
    [alias, operationId] as const
  ));
  const orderById = new Map(catalog.entries.map((entry, index) =>
    [entry.operationId, index] as const
  ));
  const ruleIds = new Set<string>();
  rules.forEach((candidate) => {
    if (ruleIds.has(candidate.id)) {
      throw new Error(`Duplicate equation discovery rule ${candidate.id}.`);
    }
    ruleIds.add(candidate.id);
    if (!entriesById.has(candidate.operationId)) {
      throw new Error(
        `Equation discovery rule ${candidate.id} targets unknown operation ` +
        `${candidate.operationId}.`
      );
    }
  });

  const inspect = (requested: string): KpEquationOperationInspection => {
    const normalizedAlias = normalizeKpEquationOperationAlias(requested);
    const operationId = aliasOwners.get(normalizedAlias);
    const capability = operationId === undefined
      ? undefined
      : entriesById.get(operationId);
    if (capability === undefined) return Object.freeze({
      status: "unknown" as const,
      requested,
      normalizedAlias
    });
    return Object.freeze({
      status: "resolved" as const,
      requested,
      normalizedAlias,
      resolution: normalizedAlias ===
        normalizeKpEquationOperationAlias(capability.operationId)
        ? "canonical" as const
        : "alias" as const,
      capability
    });
  };

  return Object.freeze({
    schemaVersion: "kp.equation-operation-discovery-api.v1" as const,
    list: (query = "") => {
      const terms = normalizeKpEquationOperationAlias(query)
        .split(" ")
        .filter(Boolean);
      if (terms.length === 0) return catalog.entries;
      return Object.freeze(catalog.entries.filter((entry) => {
        const haystack = normalizeKpEquationOperationAlias([
          entry.operationId,
          entry.friendlyName,
          entry.meaning,
          ...entry.aliases
        ].join(" "));
        return terms.every((term) => haystack.includes(term));
      }));
    },
    inspect,
    narrow: ({ states }: {
      readonly states: readonly Readonly<{
        readonly id: string;
        readonly latex: string;
      }>[];
    }): KpEquationOperationNarrowingResult => {
      const diagnostics = validateStates(states);
      if (diagnostics.length > 0) return Object.freeze({
        status: "invalid-request" as const,
        diagnostics: Object.freeze(diagnostics)
      });
      return Object.freeze({
        status: "narrowed" as const,
        adjacencies: Object.freeze(states.slice(0, -1).map((source, index) => {
          const target = states[index + 1]!;
          const candidates = rules
            .filter((candidate) => candidate.matches({
              sourceLatex: source.latex,
              targetLatex: target.latex
            }))
            .map((candidate): KpEquationOperationCandidate => {
              const entry = entriesById.get(candidate.operationId)!;
              return Object.freeze({
                operationId: candidate.operationId,
                friendlyName: entry.friendlyName,
                reason: candidate.reason,
                requiredEvidenceIds: entry.requiredEvidenceIds
              });
            })
            .sort((left, right) =>
              orderById.get(left.operationId)! -
              orderById.get(right.operationId)!
            );
          return Object.freeze({
            index,
            fromStateId: source.id,
            toStateId: target.id,
            candidates: Object.freeze(candidates)
          });
        }))
      });
    }
  });
}

function rule(
  input: KpEquationOperationNarrowingRule
): KpEquationOperationNarrowingRule {
  return Object.freeze({ ...input });
}

function validateStates(
  states: readonly Readonly<{ readonly id: string; readonly latex: string }>[]
): string[] {
  const diagnostics: string[] = [];
  if (states.length < 2) diagnostics.push(
    "Discovery requires at least two ordered LaTeX states."
  );
  const ids = new Set<string>();
  states.forEach((state, index) => {
    if (state.id.trim().length === 0 || state.latex.trim().length === 0) {
      diagnostics.push(`State ${index} requires non-empty id and LaTeX.`);
    }
    if (ids.has(state.id)) diagnostics.push(`Duplicate state id ${state.id}.`);
    ids.add(state.id);
  });
  return diagnostics;
}

function normalizeLatex(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\\(?:left|right)/gu, "")
    .replace(/\\(?:cdot|times)/gu, "*")
    .replaceAll("×", "*")
    .replace(/\s+/gu, "");
}

function removeAdditiveIdentity(source: string): string | undefined {
  const right = source.replace(/\+0(?==|$)/u, "");
  if (right !== source) return right;
  const left = source.replace(/^0\+/u, "");
  return left === source ? undefined : left;
}

function removeMultiplicativeIdentity(source: string): string | undefined {
  const right = source.replace(/\*1(?==|$)/u, "");
  if (right !== source) return right;
  const left = source.replace(/^1\*/u, "");
  return left === source ? undefined : left;
}

function isConstantProduct(source: string, target: string): boolean {
  const match = /^(-?\d+(?:\.\d+)?)\*(-?\d+(?:\.\d+)?)$/u.exec(source);
  if (match === null) return false;
  const left = Number(match[1]);
  const right = Number(match[2]);
  const result = Number(target);
  return Number.isFinite(left) && Number.isFinite(right) &&
    Number.isFinite(result) && Object.is(left * right, result);
}
