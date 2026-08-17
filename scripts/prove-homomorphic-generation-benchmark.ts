import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { kpHomomorphicCrossoverCallerDeclarations } from
  "../src/animation/homomorphic-crossover-caller-declarations.ts";
import {
  compileEquationIntent,
  listKpEquationIntentSurfaceVocabularies
} from "../src/authoring/compile-equation-intent.ts";
import { kpEquationGenerationPressureFixtures } from
  "../src/authoring/equation-generation-pressure-contract.ts";

const forbiddenRequestField =
  /duration|delay|timing|geometry|coordinate|trajectory|keyframe|renderer|recipe|opacity|scale|translate/i;

export interface KpHomomorphicGenerationBenchmark {
  readonly schemaVersion: "kp.homomorphic-generation-benchmark.v1";
  readonly cases: readonly Readonly<{
    callerId: string;
    operationId: string;
    status: "accepted";
    repairRounds: 0;
    roleCount: number;
    authorityIds: readonly string[];
    marginalSourcePaths: readonly string[];
  }>[];
  readonly directCompilerUsesCallerIds: false;
  readonly presentationInputUsed: false;
  readonly liveModelUsed: false;
}

export function proveKpHomomorphicGenerationBenchmark():
KpHomomorphicGenerationBenchmark {
  const vocabularies = listKpEquationIntentSurfaceVocabularies();
  const cases = kpHomomorphicCrossoverCallerDeclarations.map((declaration) => {
    const vocabulary = vocabularies.find(({ animationId }) =>
      animationId === declaration.callerId
    );
    const fixture = kpEquationGenerationPressureFixtures.find(({ request }) =>
      request.animationId === declaration.callerId
    );
    if (vocabulary === undefined || fixture === undefined) {
      throw new Error(`Missing benchmark input for ${declaration.callerId}.`);
    }
    const request = Object.freeze({
      ...fixture.request,
      operation: Object.freeze({
        operationId: vocabulary.operationId,
        roleBindings: vocabulary.canonicalRoleBindings
      })
    });
    if (forbiddenRequestField.test(JSON.stringify(request))) {
      throw new Error(`${declaration.callerId} contains presentation input.`);
    }
    const result = compileEquationIntent(request);
    if (
      result.status !== "accepted" ||
      result.plan.kind !== "homomorphic-crossover-semantic-motion-plan"
    ) {
      throw new Error(`${declaration.callerId} did not compile directly.`);
    }
    return Object.freeze({
      callerId: declaration.callerId,
      operationId: declaration.semanticMotionOperationId,
      status: "accepted" as const,
      repairRounds: 0 as const,
      roleCount: Object.keys(vocabulary.canonicalRoleBindings).length,
      authorityIds: Object.freeze([
        result.plan.extensionPackId,
        result.plan.operationKind,
        result.plan.recipeId,
        result.plan.semanticAuthorityId,
        result.plan.callerRegistrationId
      ]),
      marginalSourcePaths: Object.freeze([
        "src/animation/homomorphic-crossover-caller-declarations.ts",
        "src/animation/equation-extension-packs/homomorphic-crossover.ts",
        "src/authoring/homomorphic-crossover-authoring.ts",
        declaration.semanticAuthorityId === "law.logarithm.product"
          ? "src/semantic/log-product-semantic-motion.ts"
          : "src/semantic/log-quotient-semantic-motion.ts"
      ])
    });
  });

  const directCompilerSource = readFileSync(
    new URL("../src/authoring/compile-equation-intent.ts", import.meta.url),
    "utf8"
  );
  const embedsCallerId = kpHomomorphicCrossoverCallerDeclarations.some(
    ({ callerId }) => directCompilerSource.includes(callerId)
  );
  if (embedsCallerId) {
    throw new Error("The direct compiler must resolve homomorphic callers from declarations.");
  }
  return Object.freeze({
    schemaVersion: "kp.homomorphic-generation-benchmark.v1" as const,
    cases: Object.freeze(cases),
    directCompilerUsesCallerIds: false as const,
    presentationInputUsed: false as const,
    liveModelUsed: false as const
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  console.log(JSON.stringify(proveKpHomomorphicGenerationBenchmark(), null, 2));
}
