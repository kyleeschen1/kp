import {
  formatKpEquationOperationDiscoveryHelp,
  type KpEquationOperationDiscoveryHelpRequest
} from "../src/authoring/equation-operation-discovery-help.ts";

const args = process.argv.slice(2);
const request = parseRequest(args);
console.log(formatKpEquationOperationDiscoveryHelp(request));

function parseRequest(
  args: readonly string[]
): KpEquationOperationDiscoveryHelpRequest {
  const inspectIndex = args.indexOf("--inspect");
  if (inspectIndex >= 0) return {
    kind: "inspect",
    operationOrAlias: args[inspectIndex + 1] ?? ""
  };
  const queryIndex = args.indexOf("--query");
  if (queryIndex >= 0) return {
    kind: "search",
    query: args[queryIndex + 1] ?? ""
  };
  return { kind: "summary" };
}
