import type {
  KpCodeRefactorGenerationDiagnostic
} from "../src/domain-ir/code-refactor-generation-diagnostic.ts";
import {
  validateKpCodeRefactorGenerationRequest,
  type KpCodeRefactorGenerationRequestDiagnostic
} from "../src/domain-ir/code-refactor-generation-request.ts";
import { KP_PYTHON_EXTRACT_HELPER_AUTHORING_AUTHORITY } from
  "../src/domain-ir/code-extract-helper-authorities.ts";
import {
  compileKpPythonCodeGeneration,
  type KpPythonCodeGenerationResult
} from "./python-code-generation-frontend.ts";

export const KP_PYTHON_CODE_AUTHORING_SCHEMA =
  "kp.python-code-authoring.v1" as const;

type AcceptedGeneration = Extract<
  KpPythonCodeGenerationResult,
  Readonly<{ status: "accepted" }>
>;

type KpPythonCodeAuthoringDiagnostic =
  | KpCodeRefactorGenerationRequestDiagnostic
  | KpCodeRefactorGenerationDiagnostic;

export interface KpPythonCodeAuthoringSnapshot {
  readonly schemaVersion: typeof KP_PYTHON_CODE_AUTHORING_SCHEMA;
  readonly requestId: string;
  readonly generation: AcceptedGeneration;
}

export type KpPythonCodeAuthoringResult =
  | Readonly<{
      status: "accepted";
      current: KpPythonCodeAuthoringSnapshot;
      diagnostics: readonly [];
    }>
  | Readonly<{
      status: "repair-required";
      requestId?: string;
      diagnostics: readonly KpPythonCodeAuthoringDiagnostic[];
      lastValid?: KpPythonCodeAuthoringSnapshot;
    }>;

export const kpPythonCodeAuthoringDescriptor = deepFreeze({
  schemaVersion: "kp.code-generation-operation-descriptor.v1" as const,
  authoringAuthorityId: KP_PYTHON_EXTRACT_HELPER_AUTHORING_AUTHORITY,
  operationId: "code.python.extract-helper" as const,
  language: "python" as const,
  intent: "extract-helper" as const,
  aliases: [
    "extract helper",
    "extract shared predicate",
    "replace duplicate rule with function"
  ] as const,
  accepts: "two ordered Python source revisions",
  produces: "verified extract-helper causal operations or typed repairs",
  support: [
    "named function definitions",
    "equivalent repeated comparison or Boolean predicates",
    "preserved positional bindings and annotations",
    "one helper definition",
    "one replacement call per contributing function"
  ] as const,
  rejects: [
    "arbitrary refactors",
    "unequal predicates",
    "ambiguous helper ownership",
    "unsafe binding or annotation changes",
    "variadic or keyword-call extraction",
    "malformed source"
  ] as const,
  positiveExamples: [
    "Two Python functions repeat total >= 50; extract qualifies_for_free_shipping(total).",
    "Two annotated functions repeat total >= 50 and active with exact indentation preserved."
  ] as const,
  counterexamples: [
    "The two functions use total >= 50 and total > 50, so the predicates are not equivalent.",
    "The helper changes total: int to total: str or callers pass the wrong binding."
  ] as const
});

export function compileKpPythonAuthoringInput(
  value: unknown,
  lastValid?: KpPythonCodeAuthoringSnapshot
): KpPythonCodeAuthoringResult {
  const validation = validateKpCodeRefactorGenerationRequest(value);
  if (validation.status !== "accepted") {
    return repair(validation.requestId, validation.diagnostics, lastValid);
  }
  const generation = compileKpPythonCodeGeneration(validation.request);
  if (generation.status !== "accepted") {
    return repair(generation.requestId, generation.diagnostics, lastValid);
  }
  const current = deepFreeze({
    schemaVersion: KP_PYTHON_CODE_AUTHORING_SCHEMA,
    requestId: generation.requestId,
    generation
  });
  return Object.freeze({
    status: "accepted" as const,
    current,
    diagnostics: Object.freeze([]) as readonly []
  });
}

export interface KpPythonCodeGenerationCliIo {
  readonly readText: (path: string) => Promise<string>;
  readonly writeOutput: (text: string) => void;
  readonly writeError: (text: string) => void;
}

export async function runKpPythonCodeGenerationCli(
  args: readonly string[],
  io: KpPythonCodeGenerationCliIo
): Promise<0 | 2> {
  const path = args[0];
  if (args.length !== 1 || path === undefined) {
    io.writeError("Usage: npm run compile:python-code-generation -- <request.json>\n");
    return 2;
  }
  let value: unknown;
  try {
    value = JSON.parse(await io.readText(path));
  } catch (error) {
    io.writeError(`Cannot read Python generation request: ${String(error)}\n`);
    return 2;
  }
  const result = compileKpPythonAuthoringInput(value);
  io.writeOutput(`${JSON.stringify(result, null, 2)}\n`);
  return result.status === "accepted" ? 0 : 2;
}

function repair(
  requestId: string | undefined,
  diagnostics: readonly KpPythonCodeAuthoringDiagnostic[],
  lastValid: KpPythonCodeAuthoringSnapshot | undefined
): KpPythonCodeAuthoringResult {
  return deepFreeze({
    status: "repair-required" as const,
    ...(requestId === undefined ? {} : { requestId }),
    diagnostics: [...diagnostics],
    ...(lastValid === undefined ? {} : { lastValid })
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
