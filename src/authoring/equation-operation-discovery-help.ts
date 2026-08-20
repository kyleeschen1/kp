import {
  createKpEquationOperationDiscoveryApi,
  type KpEquationOperationDiscoveryApi
} from "./equation-operation-discovery-api.ts";

export type KpEquationOperationDiscoveryHelpRequest =
  | Readonly<{ readonly kind: "summary" }>
  | Readonly<{ readonly kind: "search"; readonly query: string }>
  | Readonly<{ readonly kind: "inspect"; readonly operationOrAlias: string }>;

export function formatKpEquationOperationDiscoveryHelp(
  request: KpEquationOperationDiscoveryHelpRequest,
  api: KpEquationOperationDiscoveryApi =
    createKpEquationOperationDiscoveryApi()
): string {
  if (request.kind === "summary") return [
    `KP equation operations: ${api.list().length} available`,
    "Search: npm run discover:equation-operations -- --query \"remove additive zero\"",
    "Inspect: npm run discover:equation-operations -- --inspect \"drop + 0\""
  ].join("\n");
  if (request.kind === "search") {
    const entries = api.list(request.query);
    return entries.length === 0
      ? `No equation operations match ${JSON.stringify(request.query)}.`
      : entries.map((entry) =>
          `${entry.operationId}\t${entry.friendlyName}\t${entry.meaning}`
        ).join("\n");
  }
  const result = api.inspect(request.operationOrAlias);
  if (result.status === "unknown") {
    return `Unknown equation operation ${JSON.stringify(
      request.operationOrAlias
    )}.`;
  }
  return [
    result.capability.friendlyName,
    `id: ${result.capability.operationId}`,
    `resolved: ${result.resolution}`,
    `meaning: ${result.capability.meaning}`,
    `aliases: ${result.capability.aliases.join(", ")}`,
    `requires: ${result.capability.requiredEvidenceIds.join(", ")}`,
    `example: ${result.capability.positiveExamples[0]}`,
    `not: ${result.capability.counterexamples[0]}`
  ].join("\n");
}
