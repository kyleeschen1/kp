import {
  kpSemanticReaderLayers,
  type KpSemanticReaderLayer,
  type KpSemanticReaderLayerId
} from "./semantic-reader-boundaries.ts";

export interface KpSemanticReaderSourceFile {
  readonly path: string;
  readonly source: string;
}

export interface KpSemanticReaderImportViolation {
  readonly sourceFile: string;
  readonly specifier: string;
  readonly sourceLayer: KpSemanticReaderLayerId;
  readonly kind:
    | "cross-layer-deep-import"
    | "dependency-direction"
    | "forbidden-learner-dependency"
    | "build-only-dependency-leak";
  readonly message: string;
}

export function checkKpSemanticReaderImports(
  files: readonly KpSemanticReaderSourceFile[],
  layers: readonly KpSemanticReaderLayer[] = kpSemanticReaderLayers
): readonly KpSemanticReaderImportViolation[] {
  const violations: KpSemanticReaderImportViolation[] = [];

  for (const file of files) {
    const sourceLayer = findLayer(file.path, layers);
    if (sourceLayer === undefined) continue;

    for (const specifier of importSpecifiers(file.source)) {
      const targetFile = specifier.startsWith(".")
        ? resolveRelativeModule(file.path, specifier)
        : specifier;
      if (isForbiddenLearnerDependency(targetFile)) {
        violations.push({
          sourceFile: file.path,
          specifier,
          sourceLayer: sourceLayer.id,
          kind: "forbidden-learner-dependency",
          message: "semantic reader code may not depend on editor or Three.js modules"
        });
        continue;
      }
      if (sourceLayer.id !== "compiler" && isBuildOnlyParserDependency(specifier)) {
        violations.push({
          sourceFile: file.path,
          specifier,
          sourceLayer: sourceLayer.id,
          kind: "build-only-dependency-leak",
          message: "Markdown parser packages are restricted to the build-only compiler layer"
        });
        continue;
      }
      if (!specifier.startsWith(".")) continue;
      const targetLayer = findLayer(targetFile, layers);
      if (targetLayer === undefined || targetLayer.id === sourceLayer.id) continue;

      const allowed = sourceLayer.mayImport as readonly KpSemanticReaderLayerId[];
      if (!allowed.includes(targetLayer.id)) {
        violations.push({
          sourceFile: file.path,
          specifier,
          sourceLayer: sourceLayer.id,
          kind: "dependency-direction",
          message: `${sourceLayer.id} may not import ${targetLayer.id}`
        });
        continue;
      }
      if (targetFile !== targetLayer.publicEntryPoint) {
        violations.push({
          sourceFile: file.path,
          specifier,
          sourceLayer: sourceLayer.id,
          kind: "cross-layer-deep-import",
          message: `${sourceLayer.id} must import ${targetLayer.publicEntryPoint}`
        });
      }
    }
  }

  return violations.sort((left, right) =>
    left.sourceFile.localeCompare(right.sourceFile)
      || left.specifier.localeCompare(right.specifier)
  );
}

function isBuildOnlyParserDependency(specifier: string): boolean {
  return specifier === "mdast-util-from-markdown"
    || specifier.startsWith("mdast-util-from-markdown/")
    || specifier === "mdast"
    || specifier.startsWith("mdast/")
    || specifier === "micromark"
    || specifier.startsWith("micromark/");
}

function findLayer(
  file: string,
  layers: readonly KpSemanticReaderLayer[]
): KpSemanticReaderLayer | undefined {
  return layers.find((layer) => file === layer.root || file.startsWith(`${layer.root}/`));
}

function isForbiddenLearnerDependency(target: string): boolean {
  return target === "three"
    || target.startsWith("three/")
    || target.startsWith("src/editor/")
    || target.includes("/src/editor/")
    || target.includes("graph-webgl-three");
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
