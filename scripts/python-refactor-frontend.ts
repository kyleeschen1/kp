import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export interface KpPythonFrontendDiagnostic {
  readonly code: string;
  readonly category: "error";
  readonly message: string;
  readonly startOffset?: number;
  readonly endOffset?: number;
  readonly start?: { readonly line: number; readonly column: number };
  readonly end?: { readonly line: number; readonly column: number };
}

export interface KpPythonSyntaxRecord {
  readonly id: string;
  readonly kindName: string;
  readonly parentId?: string;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly start: { readonly line: number; readonly column: number };
  readonly end: { readonly line: number; readonly column: number };
  readonly text: string;
}

export interface KpPythonLexicalRecord {
  readonly id: string;
  readonly tokenType: number;
  readonly kindName: string;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly start: { readonly line: number; readonly column: number };
  readonly end: { readonly line: number; readonly column: number };
  readonly text: string;
}

export interface KpPythonFrontendResult {
  readonly schemaVersion: "kp.python-frontend.v1";
  readonly status: "accepted" | "rejected";
  readonly language: "python";
  readonly path: string;
  readonly revisionId: string;
  readonly sourceText: string;
  readonly syntax: readonly KpPythonSyntaxRecord[];
  readonly tokens: readonly KpPythonLexicalRecord[];
  readonly diagnostics: readonly KpPythonFrontendDiagnostic[];
}

export interface CompileKpPythonFrontendInput {
  readonly path: string;
  readonly revisionId: string;
  readonly sourceText: string;
}

const frontendPath = fileURLToPath(new URL("python-refactor-frontend.py", import.meta.url));

/**
 * Python is a build-time evidence producer. Passing source as an argv value
 * avoids a second file authority; the stdlib script parses but never executes
 * it, and browser modules never import this Node wrapper.
 */
export function compileKpPythonFrontend(
  input: CompileKpPythonFrontendInput
): KpPythonFrontendResult {
  assertNonEmpty(input.path, "Python source path");
  assertNonEmpty(input.revisionId, "Python revision id");
  assertNonEmpty(input.sourceText, "Python source text");
  const result = spawnSync("python3", [
    frontendPath,
    "--path", input.path,
    "--revision-id", input.revisionId,
    "--source-text", input.sourceText
  ], {
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024
  });
  if (result.status !== 0) {
    throw new Error(
      `Python frontend failed (${result.status ?? "signal"}): ${result.stderr.trim()}`
    );
  }
  const compiled = JSON.parse(result.stdout) as KpPythonFrontendResult;
  assertFrontendResult(compiled, input);
  return compiled;
}

function assertFrontendResult(
  result: KpPythonFrontendResult,
  input: CompileKpPythonFrontendInput
): void {
  if (
    result.schemaVersion !== "kp.python-frontend.v1" ||
    result.language !== "python" ||
    result.path !== input.path ||
    result.revisionId !== input.revisionId ||
    result.sourceText !== input.sourceText ||
    !Array.isArray(result.syntax) ||
    !Array.isArray(result.tokens) ||
    !Array.isArray(result.diagnostics)
  ) {
    throw new Error("Python frontend returned data outside kp.python-frontend.v1.");
  }
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) throw new Error(`${label} must not be empty.`);
}
