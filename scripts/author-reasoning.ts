import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { checkEquationReasoningSource } from "../src/experiments/reusable-reasoning/equation-author-check.ts";
import { createKpReasoningSource } from "../src/experiments/reusable-reasoning/source.ts";
import { createCodeReasoningSource } from "../src/experiments/reusable-reasoning/code-evidence.ts";
import { checkCodeReasoningSource } from "../src/experiments/reusable-reasoning/code-author-check.ts";

export type ReasoningDomain = "equation" | "code";
const repair = (code: string, path: string, expected: string) => ({ status: "repair-gap" as const, diagnostic: { code, path, expected } });

/** A read-only authoring adapter, not another compiler or proof authority. */
export function checkReasoningText(domain: ReasoningDomain, json: string) {
  if (json.length > 100_000) return repair("kp.reasoning.draft-size", "$", "Keep the source under 100,000 characters.");
  if (domain === "equation") {
    return checkEquationReasoningSource(json);
  }
  return checkCodeReasoningSource(json);
}

export function runReasoningAuthoringCli(args: readonly string[]) {
  const [flag, domain, mode, sourcePath, ...extra] = args;
  if (flag !== "--domain" || (domain !== "equation" && domain !== "code") || extra.length ||
    !((mode === "--example" && sourcePath === undefined) || (mode === "--request" && sourcePath))) {
    return repair("kp.reasoning.cli-usage", "$", "Use --domain equation|code followed by --example or --request path|-.");
  }
  if (mode === "--example") return domain === "equation" ? createKpReasoningSource() : createCodeReasoningSource();
  let json: string;
  try { json = readFileSync(sourcePath === "-" ? 0 : resolve(sourcePath!), "utf8"); }
  catch { return repair("kp.reasoning.source-read", "$", "Provide an existing readable source file or JSON on stdin."); }
  return checkReasoningText(domain, json);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = runReasoningAuthoringCli(process.argv.slice(2));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if ("status" in result && result.status === "repair-gap") process.exitCode = 2;
}
