import {
  validateKpAnimationGenerationRequest,
  type KpAnimationGenerationRequest
} from "../src/domain-ir/animation-generation-request.ts";
import {
  KP_CODE_GENERATION_ORCHESTRATION_SCHEMA,
  type KpAcceptedCodeGenerationOrchestration,
  type KpCodeGenerationOrchestrationDiagnostic,
  type KpCodeGenerationTargetHandle,
  type KpRejectedCodeGenerationOrchestration
} from "../src/domain-ir/code-generation-orchestration.ts";
import {
  validateKpCodeRefactorGenerationRequest,
  type KpCodeRefactorGenerationRequest,
  type KpCodeRefactorLanguage
} from "../src/domain-ir/code-refactor-generation-request.ts";
import { kpPythonFreeShippingRefactorContract } from
  "../src/semantic/python-free-shipping-refactor-contract.ts";
import { kpTypeScriptFreeShippingRefactorContract } from
  "../src/semantic/typescript-free-shipping-refactor-contract.ts";
import {
  compileKpPythonCodeGeneration,
  type KpPythonCodeGenerationSemanticPlan
} from "./python-code-generation-frontend.ts";
import {
  compileKpTypeScriptCodeGeneration,
  type KpTypeScriptCodeGenerationSemanticPlan
} from "./typescript-code-generation-frontend.ts";

export type KpCodeGenerationSemanticPlan =
  | KpTypeScriptCodeGenerationSemanticPlan
  | KpPythonCodeGenerationSemanticPlan;

export type KpCodeGenerationOrchestrationResult =
  | KpAcceptedCodeGenerationOrchestration<KpCodeGenerationSemanticPlan>
  | KpRejectedCodeGenerationOrchestration;

interface CodeGenerationRoute {
  readonly language: KpCodeRefactorLanguage;
  readonly frontendId: string;
  readonly capabilityId: string;
  readonly animationId: string;
  readonly timelineId: string;
  readonly canonicalBefore: string;
  readonly canonicalAfter: string;
  readonly compile: (
    request: KpCodeRefactorGenerationRequest
  ) => Readonly<{
    status: "accepted";
    semanticPlan: KpCodeGenerationSemanticPlan;
    diagnostics: readonly [];
  }> | Readonly<{
    status: "repair-required";
    diagnostics: readonly import(
      "../src/domain-ir/code-refactor-generation-diagnostic.ts"
    ).KpCodeRefactorGenerationDiagnostic[];
  }>;
}

const routes: readonly CodeGenerationRoute[] = Object.freeze([
  Object.freeze({
    language: "typescript" as const,
    frontendId: "frontend.code.typescript-compiler.v1",
    capabilityId: "capability.code.typescript-refactoring",
    animationId: "animation.programming.typescript-free-shipping-refactor",
    timelineId: "timeline.typescript.free-shipping-threshold",
    canonicalBefore: kpTypeScriptFreeShippingRefactorContract.before.source,
    canonicalAfter: kpTypeScriptFreeShippingRefactorContract.after.source,
    compile: compileKpTypeScriptCodeGeneration
  }),
  Object.freeze({
    language: "python" as const,
    frontendId: "frontend.code.python-ast.v1",
    capabilityId: "capability.code.python-refactoring",
    animationId: "animation.programming.python-free-shipping-refactor",
    timelineId: "timeline.python.free-shipping-threshold",
    canonicalBefore: kpPythonFreeShippingRefactorContract.before.source,
    canonicalAfter: kpPythonFreeShippingRefactorContract.after.source,
    compile: compileKpPythonCodeGeneration
  })
]);

/**
 * Orchestration selects an existing semantic and lifecycle authority. It does
 * not compile motion, sample a clock, render, or pretend a variant request has
 * a canonical artifact that has not yet been generated.
 */
export function orchestrateKpCodeGeneration(
  value: unknown
): KpCodeGenerationOrchestrationResult {
  const envelope = validateKpAnimationGenerationRequest(value);
  if (envelope.status !== "accepted") {
    return rejected(undefined, undefined, envelope.diagnostics);
  }
  const request = envelope.request;
  if (request.domain !== "code" ||
      request.source.kind !== "code.source-revisions" ||
      request.intent.kind !== "code.extract-helper") {
    return rejected(request.requestId, undefined, [routeIssue(
      "$",
      "The code orchestrator accepts only code.source-revisions with code.extract-helper intent.",
      "Route this envelope to its domain-owned orchestrator."
    )]);
  }

  const code = validateKpCodeRefactorGenerationRequest(request.source.input);
  if (code.status !== "accepted") {
    return rejected(request.requestId, code.language, code.diagnostics);
  }
  const route = routes.find(({ language }) => language === code.request.language);
  if (route === undefined || !matchesRoute(request, route)) {
    return rejected(request.requestId, code.request.language, [routeIssue(
      "$.source.frontendId",
      `The envelope does not pin the governed ${code.request.language} frontend and capability.`,
      "Use the language-scoped frontend, capability, and extract-helper operation."
    )]);
  }

  const generation = route.compile(code.request);
  if (generation.status !== "accepted") {
    return rejected(request.requestId, code.request.language,
      generation.diagnostics);
  }
  const target = resolveTarget(code.request, route);
  if (target.status === "semantic-plan-only" &&
      request.expectedOutputs.includes("animation-artifact")) {
    return rejected(request.requestId, code.request.language, [Object.freeze({
      code: "code-generation.artifact-unavailable" as const,
      path: "$.expectedOutputs",
      message: "This valid source variant has a semantic plan but no governed animation artifact.",
      repair: "Request semantic-plan output or add a separately governed artifact compiler."
    })]);
  }

  return deepFreeze({
    schemaVersion: KP_CODE_GENERATION_ORCHESTRATION_SCHEMA,
    status: "accepted" as const,
    requestId: request.requestId,
    language: code.request.language,
    semanticPlan: generation.semanticPlan,
    target,
    diagnostics: [] as const
  });
}

function matchesRoute(
  request: KpAnimationGenerationRequest,
  route: CodeGenerationRoute
): boolean {
  const parameters = request.intent.parameters;
  return request.source.frontendId === route.frontendId &&
    request.capabilityPins.length === 1 &&
    request.capabilityPins[0] === route.capabilityId &&
    isRecord(parameters) &&
    parameters["operation"] === "extract-helper";
}

function resolveTarget(
  request: KpCodeRefactorGenerationRequest,
  route: CodeGenerationRoute
): KpCodeGenerationTargetHandle {
  const [before, after] = request.revisions;
  const canonical = before.sourceText === route.canonicalBefore &&
    after.sourceText === route.canonicalAfter;
  if (!canonical) {
    return Object.freeze({
      status: "semantic-plan-only" as const,
      reason: "generated-semantics-require-governed-artifact-compilation" as const
    });
  }
  return Object.freeze({
    status: "existing-artifact" as const,
    artifactId: route.animationId,
    timelineId: route.timelineId,
    clockAuthority: "canonical-artifact-timeline" as const,
    paintAuthority: "canonical-artifact-renderer" as const
  });
}

function routeIssue(
  path: string,
  message: string,
  repair: string
): KpCodeGenerationOrchestrationDiagnostic {
  return Object.freeze({
    code: "code-generation.orchestration-route-mismatch" as const,
    path,
    message,
    repair
  });
}

function rejected(
  requestId: string | undefined,
  language: KpCodeRefactorLanguage | undefined,
  diagnostics: KpRejectedCodeGenerationOrchestration["diagnostics"]
): KpRejectedCodeGenerationOrchestration {
  return deepFreeze({
    schemaVersion: KP_CODE_GENERATION_ORCHESTRATION_SCHEMA,
    status: "repair-required" as const,
    ...(requestId === undefined ? {} : { requestId }),
    ...(language === undefined ? {} : { language }),
    diagnostics: [...diagnostics]
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
