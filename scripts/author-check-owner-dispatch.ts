import { readFileSync } from "node:fs";
import type { SupportedAuthorTask } from "../src/authoring/supported-author-tasks.ts";
import { reportAuthorCheck } from "../src/authoring/author-check-report.ts";
import { inspectAuthorSourceLimits } from "../src/authoring/author-source-limits.ts";
import type { KpAuthorTaskOwners } from "../src/authoring/author-task-owner-contract.ts";

/** Every discoverable task supplies both lazy entrypoints. Adding an owner must
 * not require mirrored switches or import another domain before selection. */
const owners = {
  "matrix.column-combinations": {
    example: async () => (await import("../content/authoring/convergence/matrix-example.ts")).example(),
    check: async (json: string) => {
      const { check } = await import("../src/authoring/matrix-columns/compile.ts");
      const checked = check(json);
      if (checked.status === "repair-gap") return checked;
      const { source, revision, result } = checked.draft;
      return { status: "compiled" as const, source, revision, result, prose: "editorial" as const };
    }
  },
  "calculus.change-propagation": {
    example: () => JSON.parse(readFileSync(new URL("../content/authoring/transfer/stationary-change.json", import.meta.url), "utf8")) as unknown,
    check: async (json: string) => {
      const { compileChangeSource } = await import("../src/tutorial/change-propagation/model.ts");
      const result = compileChangeSource(json);
      if (result.status === "repair-gap") return result;
      // Report mathematical evidence without serializing executable model authority.
      const { source, latex } = result.model;
      return { status: "compiled" as const, source, latex, revision: result.model.revision,
        initial: result.model.sample(source.x, source.h), prose: "editorial" as const };
    }
  },
  "mechanics.momentum-energy": {
    example: async () => (await import("../src/authoring/mechanics-derivation-author-check.ts")).createMechanicsDerivationAuthorExample(),
    check: async (json: string) => (await import("../src/authoring/mechanics-derivation-author-check.ts")).checkMechanicsDerivationAuthorSource(json)
  },
  "equation.fraction-chain": {
    example: async () => (await import("../src/authoring/fraction-chain-example.ts")).createFractionChainAuthorExample(),
    check: async (json: string) => (await import("../src/authoring/fraction-chain-author-check.ts")).checkFractionChainAuthorSource(json)
  },
  "equation.algebra-intuition": {
    example: async () => (await import("../src/authoring/composed-algebra-example-v2.ts")).createKpComposedAlgebraExampleV2(),
    check: async (json: string) => (await import("../src/authoring/composed-algebra-author-check-v2.ts")).checkKpComposedAlgebraAuthorSourceV2(json)
  },
  "equation.composed-algebra": {
    example: async () => (await import("../src/authoring/composed-algebra-example.ts")).createKpComposedAlgebraExample(),
    check: async (json: string) => (await import("../src/authoring/composed-algebra-author-check.ts")).checkKpComposedAlgebraAuthorSource(json)
  },
  "equation.common-factor": {
    example: async () => (await import("../src/authoring/common-factor-example.ts")).createKpCommonFactorExample(),
    check: async (json: string) => (await import("../src/authoring/common-factor-author-check.ts")).checkKpCommonFactorAuthorSource(json)
  },
  "bayes.binary": {
    example: async () => (await import("../src/experiments/bayesian-reasoning/example.ts")).createBayesDraft(),
    check: async (json: string) => (await import("../src/experiments/bayesian-reasoning/author-check.ts")).checkBayesAuthorSource(json)
  },
  "reasoning.equation": {
    example: async () => (await import("../src/experiments/reusable-reasoning/source.ts")).createKpReasoningSource(),
    check: async (json: string) => (await import("../src/experiments/reusable-reasoning/equation-author-check.ts")).checkEquationReasoningSource(json)
  },
  "reasoning.code": {
    example: async () => (await import("../src/experiments/reusable-reasoning/code-source.ts")).createCodeReasoningSource(),
    check: async (json: string) => (await import("../src/experiments/reusable-reasoning/code-author-check.ts")).checkCodeReasoningSource(json)
  },
  "equation.logarithm-base": {
    example: async () => (await import("../src/authoring/equation-series-logarithm-base-source.ts")).createKpEquationSeriesLogarithmBaseDraft(),
    check: async (json: string) => {
      const { compileKpEquationSeriesLogarithmBaseText } = await import("../src/authoring/equation-series-logarithm-base-draft.ts");
      const result = compileKpEquationSeriesLogarithmBaseText(json);
      return result.status === "repair-required" ? { status: "repair-required" as const, repairs: result.repairs }
        : { status: "compiled" as const, request: result.active.request, semantic: result.semantic, checkpointCount: result.active.request.states.length };
    }
  },
  "graph3d.saddle": {
    example: async () => (await import("./gallery-graph-3d-saddle-parameter-request.ts")).kpGalleryGraph3DSaddleParameterRequest,
    check: async (json: string) => {
      const parsed = readJson(json); if (parsed.status === "repair-gap") return parsed;
      const { routeKpCrossDomainGalleryGeneration } = await import("./cross-domain-gallery-generation-router.ts");
      const { kpGalleryGraph3DSaddleParameterFrontend } = await import("./gallery-graph-3d-saddle-parameter-frontend.ts");
      return routeKpCrossDomainGalleryGeneration(parsed.value, [kpGalleryGraph3DSaddleParameterFrontend]);
    }
  },
  "graph2d.supply-tax": {
    example: () => JSON.parse(readFileSync(new URL("../content/authoring/market-round-trip.market.json", import.meta.url), "utf8")) as unknown,
    check: async (json: string) => {
      const parsed = readJson(json); if (parsed.status === "repair-gap") return parsed;
      const { readKpAuthoringMarketSourceBranch } = await import("../src/experiments/authoring-market/authoring-market-source-branch.ts");
      const { createKpAuthoringMarketBuildDiagnostic } = await import("../src/experiments/authoring-market/authoring-market-preview-protocol.ts");
      try { return { status: "compiled" as const, source: readKpAuthoringMarketSourceBranch(parsed.value) }; }
      catch (error) { return { status: "repair-gap" as const, diagnostic: createKpAuthoringMarketBuildDiagnostic(error),
        details: error instanceof Error ? { ...error } : {} }; }
    }
  }
} satisfies KpAuthorTaskOwners;

export async function authorTaskExample(task: SupportedAuthorTask): Promise<unknown> { return owners[task].example(); }
export async function checkAuthorTask(task: SupportedAuthorTask, json: string) {
  const limit = inspectAuthorSourceLimits(json);
  return reportAuthorCheck(task, limit ?? await owners[task].check(json));
}
function readJson(json: string) {
  try { return { status: "parsed" as const, value: JSON.parse(json) as unknown }; }
  catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return { status: "repair-gap" as const, diagnostic: { code: "author.json", path: "$", expected: "Provide valid JSON for the selected task." } };
  }
}
