import assert from "node:assert/strict";
import { relative, resolve } from "node:path";
import test from "node:test";

import { build } from "vite";

const repositoryRoot = resolve(import.meta.dirname, "..");
const entrypoints = [
  "public-api",
  "calculus",
  "optics",
  "latex",
  "scene"
] as const;

const forbiddenHostZones = [
  "src/animation/",
  "src/article/",
  "src/domains/",
  "src/editor/",
  "src/integrations/",
  "src/reader/",
  "src/rendering/",
  "src/tutorial/"
] as const;

test("typed math authoring packs retain a framework-neutral bundle closure", async () => {
  const bundles = await Promise.all(entrypoints.map(bundleAuthoringEntrypoint));

  for (const bundle of bundles) {
    for (const moduleId of bundle.moduleIds) {
      assert.equal(
        forbiddenHostZones.some((zone) => moduleId.startsWith(zone)),
        false,
        `${bundle.entrypoint} unexpectedly reaches host module ${moduleId}`
      );
    }
  }
});

test("core authoring tree-shakes optional capability implementations", async () => {
  const bundle = await bundleAuthoringEntrypoint("public-api");
  const optionalModulePaths = [
    "src/math/latex-parser.ts",
    "src/math/latex-to-expression.ts",
    "src/math/latex-tokenizer.ts",
    "src/math/typed-latex-elaborator.ts",
    "src/math/typed-math-scene.ts",
    "src/math/typed-semantic-optics.ts"
  ];

  assert.deepEqual(
    bundle.moduleIds.filter((moduleId) => optionalModulePaths.includes(moduleId)),
    []
  );

  // Calculus currently shares a side-effect-free implementation module with
  // core math, so the supported boundary is its tree-shaken symbol closure.
  const mathExports = bundle.renderedExportsByModule.get(
    "src/math/typed-semantic-math.ts"
  );
  assert.ok(mathExports);
  assert.equal(mathExports.has("deriveKpHessian"), false);
  assert.equal(mathExports.has("deriveKpJacobian"), false);
});

interface AuthoringBundleInspection {
  readonly entrypoint: typeof entrypoints[number];
  readonly moduleIds: readonly string[];
  readonly renderedExportsByModule: ReadonlyMap<string, ReadonlySet<string>>;
}

async function bundleAuthoringEntrypoint(
  entrypoint: typeof entrypoints[number]
): Promise<AuthoringBundleInspection> {
  const result = await build({
    configFile: false,
    logLevel: "silent",
    build: {
      write: false,
      minify: false,
      lib: {
        entry: resolve(
          repositoryRoot,
          `src/math/authoring/${entrypoint}.ts`
        ),
        formats: ["es"]
      }
    }
  });
  const outputs = Array.isArray(result) ? result : [result];
  const moduleEntries = outputs.flatMap((output) =>
    "output" in output
      ? output.output.flatMap((item) =>
        item.type === "chunk" ? Object.entries(item.modules) : []
      )
      : []
  );
  const renderedExportsByModule = new Map<string, ReadonlySet<string>>();

  for (const [moduleId, moduleInfo] of moduleEntries) {
    renderedExportsByModule.set(
      relative(repositoryRoot, moduleId),
      new Set(moduleInfo.renderedExports)
    );
  }

  return Object.freeze({
    entrypoint,
    moduleIds: Object.freeze([...renderedExportsByModule.keys()].sort()),
    renderedExportsByModule
  });
}
