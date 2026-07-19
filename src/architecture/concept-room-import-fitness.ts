import {
  kpConceptRoomBoundaries,
  type KpConceptRoomBoundary,
  type KpConceptRoomBoundaryId
} from "./concept-room-boundaries.ts";

export interface KpArchitectureSourceFile {
  readonly path: string;
  readonly source: string;
}

export interface KpArchitectureImportViolation {
  readonly sourceFile: string;
  readonly specifier: string;
  readonly sourceBoundary: KpConceptRoomBoundaryId;
  readonly targetBoundary: KpConceptRoomBoundaryId;
  readonly kind: "dependency-direction" | "cross-boundary-deep-import";
  readonly message: string;
}

export function checkKpConceptRoomImports(
  files: readonly KpArchitectureSourceFile[],
  boundaries: readonly KpConceptRoomBoundary[] = kpConceptRoomBoundaries
): readonly KpArchitectureImportViolation[] {
  const violations: KpArchitectureImportViolation[] = [];

  for (const file of files) {
    const sourceBoundary = findBoundary(file.path, boundaries);
    if (sourceBoundary === undefined) continue;

    for (const specifier of importSpecifiers(file.source)) {
      if (!specifier.startsWith(".")) continue;
      const targetFile = resolveRelativeModule(file.path, specifier);
      const targetBoundary = findBoundary(targetFile, boundaries);
      if (targetBoundary === undefined || targetBoundary.id === sourceBoundary.id) continue;

      const allowedImports = sourceBoundary.mayImport as readonly KpConceptRoomBoundaryId[];
      if (!allowedImports.includes(targetBoundary.id)) {
        violations.push({
          sourceFile: file.path,
          specifier,
          sourceBoundary: sourceBoundary.id,
          targetBoundary: targetBoundary.id,
          kind: "dependency-direction",
          message: `${sourceBoundary.id} may not import ${targetBoundary.id}`
        });
        continue;
      }

      if (targetFile !== targetBoundary.publicEntryPoint) {
        violations.push({
          sourceFile: file.path,
          specifier,
          sourceBoundary: sourceBoundary.id,
          targetBoundary: targetBoundary.id,
          kind: "cross-boundary-deep-import",
          message: `${sourceBoundary.id} must import ${targetBoundary.publicEntryPoint}`
        });
      }
    }
  }

  return violations.sort((left, right) =>
    left.sourceFile.localeCompare(right.sourceFile) || left.specifier.localeCompare(right.specifier)
  );
}

function findBoundary(
  file: string,
  boundaries: readonly KpConceptRoomBoundary[]
): KpConceptRoomBoundary | undefined {
  return boundaries.find((boundary) => file === boundary.root || file.startsWith(`${boundary.root}/`));
}

function importSpecifiers(source: string): readonly string[] {
  const patterns = [
    /\bfrom\s+["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\bimport\s+["']([^"']+)["']/g
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

function resolveRelativeModule(sourceFile: string, specifier: string): string {
  const sourceParts = sourceFile.split("/");
  sourceParts.pop();
  for (const part of specifier.split("/")) {
    if (part === "." || part === "") continue;
    if (part === "..") sourceParts.pop();
    else sourceParts.push(part);
  }
  return sourceParts.join("/");
}

