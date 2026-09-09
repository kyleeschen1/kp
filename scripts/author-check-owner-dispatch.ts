import { readFileSync } from "node:fs";
import type { SupportedAuthorTask } from "../src/authoring/supported-author-tasks.ts";
import { reportAuthorCheck } from "../src/authoring/author-check-report.ts";
import { inspectAuthorSourceLimits } from "../src/authoring/author-source-limits.ts";

/** Fixed lazy routes, not input-selected modules or a second generation router. */
export async function authorTaskExample(task: SupportedAuthorTask): Promise<unknown> {
  switch (task) {
    case "bayes.binary": return (await import("../src/experiments/bayesian-reasoning/draft.ts")).createBayesDraft();
    case "equation.logarithm-base": return (await import("../src/authoring/equation-series-logarithm-base-draft.ts")).createKpEquationSeriesLogarithmBaseDraft();
    case "reasoning.equation": return (await import("../src/experiments/reusable-reasoning/source.ts")).createKpReasoningSource();
    case "reasoning.code": return (await import("../src/experiments/reusable-reasoning/code-evidence.ts")).createCodeReasoningSource();
    case "graph3d.saddle": return (await import("./gallery-graph-3d-saddle-parameter-frontend.ts")).kpGalleryGraph3DSaddleParameterRequest;
    case "graph2d.supply-tax": return JSON.parse(readFileSync(new URL("../content/authoring/market-round-trip.market.json", import.meta.url), "utf8"));
  }
}

export async function checkAuthorTask(task: SupportedAuthorTask, json: string) {
  const limit = inspectAuthorSourceLimits(json);
  if (limit) return reportAuthorCheck(task, limit);
  if (task === "bayes.binary") {
    const { checkBayesAuthorSource } = await import("../src/experiments/bayesian-reasoning/author-check.ts");
    return reportAuthorCheck(task, checkBayesAuthorSource(json));
  }
  if (task === "reasoning.equation") {
    const { checkEquationReasoningSource } = await import("../src/experiments/reusable-reasoning/equation-author-check.ts");
    return reportAuthorCheck(task, checkEquationReasoningSource(json));
  }
  if (task === "reasoning.code") {
    const { checkCodeReasoningSource } = await import("../src/experiments/reusable-reasoning/code-author-check.ts");
    return reportAuthorCheck(task, checkCodeReasoningSource(json));
  }
  if (task === "equation.logarithm-base") {
    const { compileKpEquationSeriesLogarithmBaseText } = await import("../src/authoring/equation-series-logarithm-base-draft.ts");
    const result = compileKpEquationSeriesLogarithmBaseText(json);
    if (result.status === "repair-required") return reportAuthorCheck(task, { status: "repair-required" as const, repairs: result.repairs });
    return reportAuthorCheck(task, { status: "compiled" as const, request: result.active.request,
      semantic: result.semantic, checkpointCount: result.active.request.states.length });
  }
  let value: unknown;
  try { value = JSON.parse(json); }
  catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return reportAuthorCheck(task, { status: "repair-gap" as const,
      diagnostic: { code: "author.json", path: "$", expected: "Provide valid JSON for the selected task." } });
  }
  switch (task) {
    case "graph3d.saddle": {
      const { routeKpCrossDomainGalleryGeneration } = await import("./cross-domain-gallery-generation-router.ts");
      const { kpGalleryGraph3DSaddleParameterFrontend } = await import("./gallery-graph-3d-saddle-parameter-frontend.ts");
      return reportAuthorCheck(task, routeKpCrossDomainGalleryGeneration(value, [kpGalleryGraph3DSaddleParameterFrontend]));
    }
    case "graph2d.supply-tax": {
      const { readKpAuthoringMarketSourceBranch } = await import("../src/experiments/authoring-market/authoring-market-source-branch.ts");
      const { createKpAuthoringMarketBuildDiagnostic } = await import("../src/experiments/authoring-market/authoring-market-preview-protocol.ts");
      try {
        const source = readKpAuthoringMarketSourceBranch(value);
        return reportAuthorCheck(task, { status: "compiled" as const, source });
      } catch (error) {
        return reportAuthorCheck(task, { status: "repair-gap" as const, diagnostic: createKpAuthoringMarketBuildDiagnostic(error),
          details: error instanceof Error ? { ...error } : {} });
      }
    }
  }
}
