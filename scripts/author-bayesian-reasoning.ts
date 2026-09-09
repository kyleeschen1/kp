import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { checkBayesAuthorSource } from "../src/experiments/bayesian-reasoning/author-check.ts";
import { createUrnBayesDraft } from "../src/experiments/bayesian-reasoning/urn-source.ts";

/** Read-only CLI: renderer preparation and publication remain separate steps. */
export function runBayesAuthoringCli(args: readonly string[]) {
  if (args.length === 1 && args[0] === "--example") return createBayesDraft();
  if (args.length === 2 && args[0] === "--example" && args[1] === "urn") return createUrnBayesDraft();
  if (args.length !== 2 || args[0] !== "--request") return { status: "repair-gap", diagnostic: {
    code: "probability.cli", path: "$", expected: "Use --example or --request path|- (stdin)." } };
  let json: string;
  try { json = readFileSync(args[1] === "-" ? 0 : resolve(args[1]!), "utf8"); }
  catch { return { status: "repair-gap", diagnostic: { code: "probability.cli", path: "$", expected: "Provide a readable file or stdin." } }; }
  return checkBayesAuthorSource(json);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = runBayesAuthoringCli(process.argv.slice(2));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if ("status" in result && result.status === "repair-gap") process.exitCode = 2;
}
