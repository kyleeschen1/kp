import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  compileEquationIntent,
  listKpEquationIntentSurfaceVocabularies
} from "../src/authoring/compile-equation-intent.ts";
import {
  kpEquationGenerationPressureFixtures
} from "../src/authoring/equation-generation-pressure-contract.ts";
import { collectKpRuntimeImportClosure } from "./runtime-import-closure.ts";

const proofIterations = 20;

export interface KpEquationGenerationBoundaryProof {
  readonly schemaVersion: "kp.equation-generation-boundary-proof.v1";
  readonly cases: readonly Readonly<{
    scenario: string;
    animationId: string;
    operationId: string;
    status: "accepted";
    repairRounds: 0;
    planKind: string;
    meanCompileMs: number;
  }>[];
  readonly boundary: Readonly<{
    entryPoint: "src/authoring/compile-equation-intent.ts";
    publicImport: "direct-only";
    runtimeModuleCount: number;
    runtimeSourceBytes: number;
    forbiddenRuntimeModules: readonly string[];
    broadBarrelModules: readonly string[];
    broadBarrelImporters: readonly string[];
    liveModelUsed: false;
    applicationRuntimeUsed: false;
  }>;
}

export function proveKpEquationGenerationBoundary():
KpEquationGenerationBoundaryProof {
  const vocabularies = listKpEquationIntentSurfaceVocabularies();
  const cases = vocabularies.map((vocabulary) => {
    const fixture = kpEquationGenerationPressureFixtures.find(
      ({ request }) => request.animationId === vocabulary.animationId
    );
    if (fixture === undefined) {
      throw new Error(`Missing pressure fixture for ${vocabulary.animationId}.`);
    }
    const request = {
      ...fixture.request,
      operation: {
        operationId: vocabulary.operationId,
        roleBindings: vocabulary.canonicalRoleBindings
      }
    };
    const startedAt = performance.now();
    const results = Array.from({ length: proofIterations }, () =>
      compileEquationIntent(request)
    );
    const elapsed = performance.now() - startedAt;
    const result = results.at(-1)!;
    if (results.some(({ status }) => status !== "accepted") ||
        result.status !== "accepted") {
      throw new Error(`${fixture.scenario} required a repair through the direct facade.`);
    }
    return Object.freeze({
      scenario: fixture.scenario,
      animationId: vocabulary.animationId,
      operationId: vocabulary.operationId,
      status: "accepted" as const,
      repairRounds: 0 as const,
      planKind: result.plan.kind,
      meanCompileMs: round(elapsed / proofIterations)
    });
  });

  const repositoryRoot = resolve(".");
  const closure = collectKpRuntimeImportClosure(resolve(
    "scripts/compile-equation-intent.ts"
  ));
  const relativeClosure = closure.map((path) => relative(repositoryRoot, path));
  const forbiddenRuntimeModules = relativeClosure.filter((path) =>
    path.startsWith("src/editor/") ||
    path.startsWith("src/rendering/") ||
    path.endsWith(".svelte")
  );
  const broadBarrelModules = relativeClosure.filter((path) =>
    path === "src/index.ts" ||
    path.endsWith("/public-api.ts") ||
    path.endsWith("/index.ts")
  );
  const broadBarrelImporters = closure
    .filter((path) => readFileSync(path, "utf8").includes("domain-ir/public-api.ts"))
    .map((path) => relative(repositoryRoot, path));
  return Object.freeze({
    schemaVersion: "kp.equation-generation-boundary-proof.v1" as const,
    cases: Object.freeze(cases),
    boundary: Object.freeze({
      entryPoint: "src/authoring/compile-equation-intent.ts" as const,
      publicImport: "direct-only" as const,
      runtimeModuleCount: closure.length,
      runtimeSourceBytes: closure.reduce(
        (total, path) => total + Buffer.byteLength(readFileSync(path, "utf8")),
        0
      ),
      forbiddenRuntimeModules: Object.freeze(forbiddenRuntimeModules),
      broadBarrelModules: Object.freeze(broadBarrelModules),
      broadBarrelImporters: Object.freeze(broadBarrelImporters),
      liveModelUsed: false as const,
      applicationRuntimeUsed: false as const
    })
  });
}

function round(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  console.log(JSON.stringify(proveKpEquationGenerationBoundary(), null, 2));
}
