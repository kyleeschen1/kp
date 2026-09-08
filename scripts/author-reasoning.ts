import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createReasoningAuthoringSession } from "../src/experiments/reusable-reasoning/authoring.ts";
import { createKpReasoningSource } from "../src/experiments/reusable-reasoning/source.ts";
import { createKpAuthoredDistributionProjection } from "../src/experiments/authoring-structural/distribution-projection.ts";
import { bindCodeReasoningEvidence, createCodeReasoningSource, KpCodeReasoningRepairGap } from "../src/experiments/reusable-reasoning/code-evidence.ts";

export type ReasoningDomain = "equation" | "code";
const repair = (code: string, path: string, expected: string) => ({ status: "repair-gap" as const, diagnostic: { code, path, expected } });

/** A read-only authoring adapter, not another compiler or proof authority. */
export function checkReasoningText(domain: ReasoningDomain, json: string) {
  if (json.length > 100_000) return repair("kp.reasoning.draft-size", "$", "Keep the source under 100,000 characters.");
  if (domain === "equation") {
    const session = createReasoningAuthoringSession(createKpAuthoredDistributionProjection().projection.animationCandidate);
    const result = session.apply(json);
    if (result.status === "repair-gap") return repair(result.diagnostic.code, result.diagnostic.path, result.diagnostic.expected);
    const { evidence, prompts } = result.current;
    return { status: "compiled" as const, domain, source: evidence.source, revisionId: evidence.revisionId,
      checkpointCount: evidence.source.reason.operationIds.length + 1, promptCount: prompts.length,
      editorialStatus: "editorial" as const };
  }
  try {
    const evidence = bindCodeReasoningEvidence(JSON.parse(json));
    return { status: "compiled" as const, domain, source: evidence.source, revisionId: evidence.revisionId,
      checkpointCount: evidence.context.steps.length, checkpointKind: evidence.context.checkpointKind,
      assumptions: evidence.context.assumptions, editorialStatus: evidence.context.editorialStatus };
  } catch (error) {
    if (error instanceof KpCodeReasoningRepairGap) return repair(error.code, error.path, error.expected);
    if (error instanceof SyntaxError) return repair("kp.reasoning.json", "$", "Provide valid JSON.");
    throw error;
  }
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
