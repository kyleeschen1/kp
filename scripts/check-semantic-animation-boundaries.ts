import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import {
  checkKpSemanticAnimationImports
} from "../src/architecture/semantic-animation-import-fitness.ts";
import {
  kpSemanticAnimationRenderingImportBaseline
} from "../src/architecture/semantic-animation-import-baseline.ts";
import {
  kpSemanticAnimationCompatibilityLedger
} from "../src/architecture/semantic-animation-compatibility-ledger.ts";
import {
  checkKpCatalogPackPurity,
  checkKpCompatibilityClassification,
  checkKpRuntimeAuthorityClassification
} from "../src/architecture/pre-expansion-health.ts";
import {
  kpRuntimeAuthorityInventory
} from "../src/architecture/runtime-authority-inventory.ts";

const projectRoot = process.cwd();
const roots = ["src/semantic", "src/animation"] as const;
const sourceFiles = roots.flatMap((root) =>
  collectTypeScriptFiles(join(projectRoot, root)).map((path) => ({
    path: relative(projectRoot, path),
    source: readFileSync(path, "utf8")
  }))
);
const violations = checkKpSemanticAnimationImports(sourceFiles);
const compatibilityViolations = kpSemanticAnimationCompatibilityLedger.flatMap(
  (entry) => {
    const references = [
      entry.owner,
      ...entry.authors,
      ...entry.consumers,
      ...entry.replacementEvidence,
      ...entry.sunsetEvidence
    ];
    return references.flatMap((reference) => {
      const path = join(projectRoot, reference.path);
      try {
        return readFileSync(path, "utf8").includes(reference.evidence)
          ? []
          : [
              `${entry.id}: ${reference.path} lacks status evidence ` +
              `${reference.evidence}.`
            ];
      } catch {
        return [`${entry.id}: missing status evidence ${reference.path}.`];
      }
    });
  }
);
const catalogPackFiles = collectTypeScriptFiles(
  join(projectRoot, "src/animation/catalog-packs")
).map((path) => ({
  path: relative(projectRoot, path),
  source: readFileSync(path, "utf8")
}));
const healthViolations = [
  ...checkKpRuntimeAuthorityClassification(kpRuntimeAuthorityInventory),
  ...checkKpCatalogPackPurity(catalogPackFiles),
  ...checkKpCompatibilityClassification(kpSemanticAnimationCompatibilityLedger)
];

if (
  violations.length > 0 || compatibilityViolations.length > 0 ||
  healthViolations.length > 0
) {
  for (const violation of violations) {
    console.error(
      `${violation.kind}: ${violation.sourceFile} -> ` +
      `${violation.specifier}: ${violation.message}`
    );
  }
  for (const violation of compatibilityViolations) {
    console.error(`compatibility-status: ${violation}`);
  }
  for (const violation of healthViolations) {
    console.error(`pre-expansion-health: ${violation}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `semantic-animation architecture gate passed ` +
    `(${sourceFiles.length} files, ` +
    `${kpSemanticAnimationRenderingImportBaseline.length} frozen exceptions, ` +
    `${kpSemanticAnimationCompatibilityLedger.length} classified compatibility paths)`
  );
}

function collectTypeScriptFiles(root: string): readonly string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return collectTypeScriptFiles(path);
    return entry.isFile() && entry.name.endsWith(".ts") ? [path] : [];
  });
}
