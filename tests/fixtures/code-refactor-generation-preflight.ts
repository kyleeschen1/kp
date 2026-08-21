export const codeRefactorGenerationPreflight = Object.freeze({
  schemaVersion: "kp.code-refactor-generation-preflight.v1",
  capabilities: Object.freeze([
    Object.freeze({
      language: "typescript",
      capabilityId: "capability.code.typescript-refactoring",
      contractId: "typescript-refactor.free-shipping-threshold",
      contractSchemaVersion: "kp.typescript-free-shipping-refactor.v1",
      semanticSchemaVersion: "kp.typescript-refactor-semantics.v1",
      animationId:
        "animation.programming.typescript-free-shipping-refactor",
      adapterId:
        "adapter.programming.typescript-free-shipping-refactor",
      frontendAuthorityId: "frontend.code.typescript-compiler.v1",
      operationAuthorityId: "operation.code.extract-typescript-helper.v1",
      recipeAuthorityId: "recipe.code.extract-helper.v1",
      corpusAuthorityId: "corpus.code.typescript-refactoring.v1",
      operationSetId: "operations.typescript.free-shipping-threshold",
      transformationIds: Object.freeze([
        "transform.typescript.extract-shared-rule",
        "transform.typescript.replace-cost-call",
        "transform.typescript.replace-message-call",
        "transform.typescript.recompose-program"
      ]),
      lineageId: "lineage.typescript.free-shipping-threshold",
      entityIds: Object.freeze([
        "program.before",
        "function.shipping-cost.before",
        "rule.shipping-cost.before",
        "function.shipping-message.before",
        "rule.shipping-message.before",
        "program.after",
        "function.qualifies.after",
        "rule.qualifies.after",
        "function.shipping-cost.after",
        "call.shipping-cost.after",
        "function.shipping-message.after",
        "call.shipping-message.after"
      ]),
      stageIds: Object.freeze([
        "stage.orient",
        "stage.compare-duplicates",
        "stage.introduce-helper",
        "stage.move-shared-rule",
        "stage.replace-cost-call",
        "stage.replace-message-call",
        "stage.verify-parity"
      ]),
      buildTimeFrontendPath: "scripts/typescript-refactor-frontend.ts",
      prohibitedBrowserImports: Object.freeze(["typescript"])
    }),
    Object.freeze({
      language: "python",
      capabilityId: "capability.code.python-refactoring",
      contractId: "python-refactor.free-shipping-threshold",
      contractSchemaVersion: "kp.python-free-shipping-refactor.v1",
      semanticSchemaVersion: "kp.python-refactor-semantics.v1",
      animationId: "animation.programming.python-free-shipping-refactor",
      adapterId: "adapter.programming.python-free-shipping-refactor",
      frontendAuthorityId: "frontend.code.python-ast.v1",
      operationAuthorityId: "operation.code.extract-python-helper.v1",
      recipeAuthorityId: "recipe.code.extract-helper.v1",
      corpusAuthorityId: "corpus.code.python-refactoring.v1",
      operationSetId: "operations.python.free-shipping-threshold",
      transformationIds: Object.freeze([
        "transform.python.extract-shared-rule",
        "transform.python.replace-cost-call",
        "transform.python.replace-message-call",
        "transform.python.recompose-program"
      ]),
      lineageId: "lineage.python.free-shipping-threshold",
      entityIds: Object.freeze([
        "program.before",
        "function.shipping-cost.before",
        "rule.shipping-cost.before",
        "function.shipping-message.before",
        "rule.shipping-message.before",
        "program.after",
        "function.qualifies.after",
        "rule.qualifies.after",
        "function.shipping-cost.after",
        "call.shipping-cost.after",
        "function.shipping-message.after",
        "call.shipping-message.after"
      ]),
      stageIds: Object.freeze([
        "stage.orient",
        "stage.compare-duplicates",
        "stage.introduce-helper",
        "stage.move-shared-rule",
        "stage.replace-cost-call",
        "stage.replace-message-call",
        "stage.verify-parity"
      ]),
      buildTimeFrontendPath: "scripts/python-refactor-frontend.ts",
      prohibitedBrowserImports: Object.freeze([
        "node:child_process",
        "python",
        "python3"
      ])
    })
  ]),
  expectedReadiness: "Direct",
  expectedFrontendStatus: "matched",
  stableRoute: Object.freeze({ playhead: 0.68 }),
  browserClosureGate: "npm run check:animation-library-bundle-boundary"
} as const);
