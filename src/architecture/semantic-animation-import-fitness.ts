import {
  kpSemanticAnimationRenderingImportBaseline,
  type KpSemanticAnimationRenderingImportException
} from "./semantic-animation-import-baseline.ts";

export interface KpSemanticAnimationArchitectureSourceFile {
  readonly path: string;
  readonly source: string;
}

export interface KpSemanticAnimationImportFitnessViolation {
  readonly sourceFile: string;
  readonly specifier: string;
  readonly kind:
    | "unapproved-rendering-import"
    | "stale-rendering-import-exception"
    | "duplicate-rendering-import-exception";
  readonly message: string;
}

export function checkKpSemanticAnimationImports(
  files: readonly KpSemanticAnimationArchitectureSourceFile[],
  exceptions: readonly KpSemanticAnimationRenderingImportException[] =
    kpSemanticAnimationRenderingImportBaseline
): readonly KpSemanticAnimationImportFitnessViolation[] {
  const violations: KpSemanticAnimationImportFitnessViolation[] = [];
  const exceptionKeys = new Set<string>();
  const observedKeys = new Set<string>();

  for (const exception of exceptions) {
    const key = importKey(exception.sourcePath, exception.modulePath);
    if (exceptionKeys.has(key)) {
      violations.push({
        sourceFile: exception.sourcePath,
        specifier: exception.modulePath,
        kind: "duplicate-rendering-import-exception",
        message: "Rendering import exception is declared more than once."
      });
    }
    exceptionKeys.add(key);
  }

  for (const file of files) {
    if (!isNeutralSource(file.path)) continue;
    for (const specifier of importSpecifiers(file.source)) {
      if (!isRenderingImport(file.path, specifier)) continue;
      const key = importKey(file.path, specifier);
      observedKeys.add(key);
      if (!exceptionKeys.has(key)) {
        violations.push({
          sourceFile: file.path,
          specifier,
          kind: "unapproved-rendering-import",
          message:
            "Semantic and renderer-neutral animation code may not add rendering dependencies."
        });
      }
    }
  }

  for (const exception of exceptions) {
    const key = importKey(exception.sourcePath, exception.modulePath);
    if (!observedKeys.has(key)) {
      violations.push({
        sourceFile: exception.sourcePath,
        specifier: exception.modulePath,
        kind: "stale-rendering-import-exception",
        message:
          `Frozen exception was removed; delete its ${exception.retirementSlice} baseline entry.`
      });
    }
  }

  return violations.sort((left, right) =>
    left.sourceFile.localeCompare(right.sourceFile) ||
    left.specifier.localeCompare(right.specifier) ||
    left.kind.localeCompare(right.kind)
  );
}

function isNeutralSource(file: string): boolean {
  return file.startsWith("src/semantic/") || file.startsWith("src/animation/");
}

function isRenderingImport(sourceFile: string, specifier: string): boolean {
  if (!specifier.startsWith(".")) return false;
  const target = resolveRelativeModule(sourceFile, specifier);
  return target === "src/rendering" || target.startsWith("src/rendering/");
}

function resolveRelativeModule(sourceFile: string, specifier: string): string {
  const parts = sourceFile.split("/");
  parts.pop();
  for (const part of specifier.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return parts.join("/");
}

function importKey(sourceFile: string, specifier: string): string {
  return `${sourceFile}\u0000${specifier}`;
}

function importSpecifiers(source: string): readonly string[] {
  const patterns = [
    /\bfrom\s+["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\bimport\s+["']([^"']+)["']/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g
  ];
  const specifiers = new Set<string>();
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1];
      if (specifier !== undefined) specifiers.add(specifier);
    }
  }
  return [...specifiers];
}
