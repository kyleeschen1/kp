import type {
  KpCodeRefactorGenerationDiagnostic
} from "../src/domain-ir/code-refactor-generation-diagnostic.ts";
import {
  validateKpCodeRefactorGenerationRequest,
  type KpCodeRefactorGenerationRequestDiagnostic
} from "../src/domain-ir/code-refactor-generation-request.ts";
import {
  compileKpTypeScriptCodeGeneration,
  type KpTypeScriptCodeGenerationResult
} from "./typescript-code-generation-frontend.ts";

export const KP_TYPESCRIPT_CODE_AUTHORING_SCHEMA =
  "kp.typescript-code-authoring.v1" as const;

type AcceptedGeneration = Extract<
  KpTypeScriptCodeGenerationResult,
  Readonly<{ status: "accepted" }>
>;

type KpTypeScriptCodeAuthoringDiagnostic =
  | KpCodeRefactorGenerationRequestDiagnostic
  | KpCodeRefactorGenerationDiagnostic;

export interface KpTypeScriptCodeAuthoringSnapshot {
  readonly schemaVersion: typeof KP_TYPESCRIPT_CODE_AUTHORING_SCHEMA;
  readonly requestId: string;
  readonly generation: AcceptedGeneration;
}

export type KpTypeScriptCodeAuthoringResult =
  | Readonly<{
      status: "accepted";
      current: KpTypeScriptCodeAuthoringSnapshot;
      diagnostics: readonly [];
    }>
  | Readonly<{
      status: "repair-required";
      requestId?: string;
      diagnostics: readonly KpTypeScriptCodeAuthoringDiagnostic[];
      lastValid?: KpTypeScriptCodeAuthoringSnapshot;
    }>;

export const kpTypeScriptCodeAuthoringDescriptor = deepFreeze({
  schemaVersion: "kp.code-generation-operation-descriptor.v1" as const,
  operationId: "code.typescript.extract-helper" as const,
  language: "typescript" as const,
  intent: "extract-helper" as const,
  aliases: [
    "extract helper",
    "extract shared predicate",
    "replace duplicate rule with function"
  ] as const,
  accepts: "two ordered TypeScript source revisions",
  produces: "verified extract-helper causal operations or typed repairs",
  support: [
    "named function declarations",
    "equivalent repeated binary predicates",
    "one helper declaration",
    "one replacement call per contributing function"
  ] as const,
  rejects: [
    "arbitrary refactors",
    "unequal predicates",
    "ambiguous helper ownership",
    "unsafe binding capture",
    "malformed or ill-typed source"
  ] as const
});

export function compileKpTypeScriptAuthoringInput(
  value: unknown,
  lastValid?: KpTypeScriptCodeAuthoringSnapshot
): KpTypeScriptCodeAuthoringResult {
  const validation = validateKpCodeRefactorGenerationRequest(value);
  if (validation.status !== "accepted") {
    return repair(validation.requestId, validation.diagnostics, lastValid);
  }
  const generation = compileKpTypeScriptCodeGeneration(validation.request);
  if (generation.status !== "accepted") {
    return repair(generation.requestId, generation.diagnostics, lastValid);
  }
  const current = deepFreeze({
    schemaVersion: KP_TYPESCRIPT_CODE_AUTHORING_SCHEMA,
    requestId: generation.requestId,
    generation
  });
  return Object.freeze({
    status: "accepted" as const,
    current,
    diagnostics: Object.freeze([]) as readonly []
  });
}

export interface KpTypeScriptCodeGenerationCliIo {
  readonly readText: (path: string) => Promise<string>;
  readonly writeOutput: (text: string) => void;
  readonly writeError: (text: string) => void;
}

export async function runKpTypeScriptCodeGenerationCli(
  args: readonly string[],
  io: KpTypeScriptCodeGenerationCliIo
): Promise<0 | 2> {
  const path = args[0];
  if (args.length !== 1 || path === undefined) {
    io.writeError("Usage: npm run compile:typescript-code-generation -- <request.json>\n");
    return 2;
  }
  let value: unknown;
  try {
    value = JSON.parse(await io.readText(path));
  } catch (error) {
    io.writeError(`Cannot read TypeScript generation request: ${String(error)}\n`);
    return 2;
  }
  const result = compileKpTypeScriptAuthoringInput(value);
  io.writeOutput(`${JSON.stringify(result, null, 2)}\n`);
  return result.status === "accepted" ? 0 : 2;
}

function repair(
  requestId: string | undefined,
  diagnostics: readonly KpTypeScriptCodeAuthoringDiagnostic[],
  lastValid: KpTypeScriptCodeAuthoringSnapshot | undefined
): KpTypeScriptCodeAuthoringResult {
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
