import type { KpLawCheckLevel } from "./asset-transformation.ts";

export type KpInterpreterTarget =
  | "dashboard"
  | "flashcard"
  | "frame-sequence"
  | "katex-dom"
  | "static-step"
  | "webgl"
  | "custom";

export type KpInterpreterDiagnosticSeverity =
  | "info"
  | "warning"
  | "error";

export type KpInterpreterLossKind =
  | "composition"
  | "geometry"
  | "identity"
  | "provenance"
  | "renderer-binding"
  | "selector-correspondence"
  | "timing"
  | "unsupported";

export interface KpInterpreterDiagnostic {
  readonly severity: KpInterpreterDiagnosticSeverity;
  readonly code: string;
  readonly message: string;
  readonly lossKind?: KpInterpreterLossKind | undefined;
  readonly path?: string | undefined;
}

export interface KpInterpreterResultInput<TOutput> {
  readonly output: TOutput;
  readonly preservation?: KpLawCheckLevel | undefined;
  readonly diagnostics?: readonly KpInterpreterDiagnostic[] | undefined;
}

export interface KpInterpretation<TOutput> {
  readonly interpreterId: string;
  readonly target: KpInterpreterTarget;
  readonly inputKind: string;
  readonly preservation: KpLawCheckLevel;
  readonly output: TOutput;
  readonly diagnostics: readonly KpInterpreterDiagnostic[];
}

export interface KpInterpreter<TInput, TOutput> {
  readonly id: string;
  readonly target: KpInterpreterTarget;
  readonly inputKind: string;
  readonly preservation: KpLawCheckLevel;
  interpret(input: TInput): KpInterpreterResultInput<TOutput>;
}

export interface CreateKpInterpreterInput<TInput, TOutput> {
  readonly id: string;
  readonly target: KpInterpreterTarget;
  readonly inputKind: string;
  readonly preservation: KpLawCheckLevel;
  readonly interpret: (input: TInput) => KpInterpreterResultInput<TOutput>;
}

export function createKpInterpreter<TInput, TOutput>(
  input: CreateKpInterpreterInput<TInput, TOutput>
): KpInterpreter<TInput, TOutput> {
  assertNonEmpty(input.id, "Interpreter id");
  assertNonEmpty(input.target, `Interpreter ${input.id} target`);
  assertNonEmpty(input.inputKind, `Interpreter ${input.id} inputKind`);

  return {
    id: input.id,
    target: input.target,
    inputKind: input.inputKind,
    preservation: input.preservation,
    interpret: input.interpret
  };
}

export function runKpInterpreter<TInput, TOutput>(
  interpreter: KpInterpreter<TInput, TOutput>,
  input: TInput
): KpInterpretation<TOutput> {
  const result = interpreter.interpret(input);

  return {
    interpreterId: interpreter.id,
    target: interpreter.target,
    inputKind: interpreter.inputKind,
    preservation: result.preservation ?? interpreter.preservation,
    output: result.output,
    diagnostics: (result.diagnostics ?? []).map((diagnostic) => ({
      severity: diagnostic.severity,
      code: diagnostic.code,
      message: diagnostic.message,
      ...(diagnostic.lossKind === undefined
        ? {}
        : { lossKind: diagnostic.lossKind }),
      ...(diagnostic.path === undefined ? {} : { path: diagnostic.path })
    }))
  };
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
