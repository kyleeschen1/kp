import {
  createKpFunctionWrapEquationExtensionPack
} from "../src/animation/equation-extension-packs/function-wrap.ts";
import {
  createKpExponentialHomomorphismEquationExtensionPack
} from
  "../src/animation/equation-extension-packs/exponential-homomorphism.ts";
import {
  createKpHomomorphicCrossoverEquationExtensionPack
} from "../src/animation/equation-extension-packs/homomorphic-crossover.ts";
import {
  validateKpEquationExtensionPack
} from "../src/domain-ir/equation-extension-pack-validator.ts";

export type KpEquationDispatchKind =
  | "operation"
  | "recipe"
  | "motif"
  | "renderer-capability"
  | "lazy-pack";

export interface KpEquationDispatchDeclaration {
  readonly kind: KpEquationDispatchKind;
  readonly id: string;
  readonly modulePath: string;
  readonly exportName: string;
}

export function createKpEquationExtensionDispatchManifest():
readonly KpEquationDispatchDeclaration[] {
  const packs = [
    functionWrapDispatchPack(),
    homomorphicCrossoverDispatchPack(),
    exponentialHomomorphismDispatchPack()
  ];
  return Object.freeze(packs.flatMap(({ createPack, declarations }) => {
    const validation = validateKpEquationExtensionPack(createPack());
    if (validation.status !== "valid") {
      throw new Error(validation.diagnostics
        .map(({ message }) => message).join("\n"));
    }
    const pack = validation.validatedPack.pack;
    const manifestIds = new Set(declarations.map(({ id }) => id));
    const expectedIds = [
      ...pack.operations.ids,
      ...pack.recipes.ids,
      ...pack.motifs.ids,
      ...pack.rendererCapabilities.ids,
      pack.id
    ];
    if (
      manifestIds.size !== declarations.length ||
      expectedIds.some((id) => !manifestIds.has(id))
    ) {
      throw new Error(`Equation dispatch declarations do not close ${pack.id}.`);
    }
    return declarations;
  }));
}

function exponentialHomomorphismDispatchPack() {
  return Object.freeze({
    createPack: createKpExponentialHomomorphismEquationExtensionPack,
    declarations: Object.freeze([
      declaration(
        "operation",
        "operation.equation.exponential-sum-to-product.v1",
        "../animation/equation-extension-packs/exponential-homomorphism.ts",
        "kpExponentialSumToProductOperationRegistration"
      ),
      declaration(
        "operation",
        "operation.equation.exponential-difference-to-quotient.v1",
        "../animation/equation-extension-packs/exponential-homomorphism.ts",
        "kpExponentialDifferenceToQuotientOperationRegistration"
      ),
      declaration(
        "recipe",
        "recipe.equation.exponential-homomorphism.v1",
        "../animation/equation-extension-packs/exponential-homomorphism.ts",
        "kpExponentialHomomorphismRecipeRegistration"
      ),
      declaration(
        "motif",
        "motif.exponential-power-crossover.v1",
        "../animation/exponential-homomorphism-motif.ts",
        "kpExponentialHomomorphismMotifDefinition"
      ),
      declaration(
        "renderer-capability",
        "renderer-capability.equation.exponential-power-crossover.v1",
        "../animation/exponential-homomorphism-motif.ts",
        "kpExponentialPowerCrossoverRendererCapabilityDefinition"
      ),
      declaration(
        "lazy-pack",
        "equation-pack.exponential-homomorphism.v1",
        "../animation/equation-extension-packs/exponential-homomorphism.ts",
        "createKpExponentialHomomorphismEquationExtensionPack"
      )
    ])
  });
}

function functionWrapDispatchPack() {
  return Object.freeze({
    createPack: createKpFunctionWrapEquationExtensionPack,
    declarations: Object.freeze([
      declaration(
        "operation",
        "operation.wrap-function.v1",
        "../animation/equation-extension-packs/function-wrap.ts",
        "kpFunctionWrapOperationRegistration"
      ),
      declaration(
        "recipe",
        "recipe.equation.function-application.v1",
        "../animation/equation-extension-packs/function-wrap.ts",
        "kpFunctionWrapRecipeRegistration"
      ),
      declaration(
        "motif",
        "motif.function-wrap.v1",
        "../animation/function-wrap-motif.ts",
        "kpFunctionWrapMotifDefinition"
      ),
      declaration(
        "renderer-capability",
        "renderer-capability.equation.native-katex.v1",
        "../rendering/native-katex-function-wrap-reception.ts",
        "kpNativeKatexFunctionWrapAdapterDefinition"
      ),
      declaration(
        "lazy-pack",
        "equation-pack.function-wrap.v1",
        "../animation/equation-extension-packs/function-wrap.ts",
        "createKpFunctionWrapEquationExtensionPack"
      )
    ])
  });
}

function homomorphicCrossoverDispatchPack() {
  return Object.freeze({
    createPack: createKpHomomorphicCrossoverEquationExtensionPack,
    declarations: Object.freeze([
      declaration(
        "operation",
        "operation.equation.log-product-decomposition.v1",
        "../animation/equation-extension-packs/homomorphic-crossover.ts",
        "kpLogProductHomomorphicOperationRegistration"
      ),
      declaration(
        "operation",
        "operation.equation.log-quotient-fusion.v1",
        "../animation/equation-extension-packs/homomorphic-crossover.ts",
        "kpLogQuotientHomomorphicOperationRegistration"
      ),
      declaration(
        "recipe",
        "recipe.equation.homomorphic-decomposition.v1",
        "../animation/equation-extension-packs/homomorphic-crossover.ts",
        "kpHomomorphicCrossoverRecipeRegistration"
      ),
      declaration(
        "motif",
        "motif.homomorphic-crossover.v1",
        "../animation/homomorphic-crossover-motif.ts",
        "kpHomomorphicCrossoverMotifDefinition"
      ),
      declaration(
        "renderer-capability",
        "renderer-capability.equation.homomorphic-crossover.v1",
        "../animation/homomorphic-crossover-motif.ts",
        "kpHomomorphicCrossoverRendererCapabilityDefinition"
      ),
      declaration(
        "lazy-pack",
        "equation-pack.homomorphic-crossover.v1",
        "../animation/equation-extension-packs/homomorphic-crossover.ts",
        "createKpHomomorphicCrossoverEquationExtensionPack"
      )
    ])
  });
}

function declaration(
  kind: KpEquationDispatchKind,
  id: string,
  modulePath: string,
  exportName: string
): KpEquationDispatchDeclaration {
  return Object.freeze({ kind, id, modulePath, exportName });
}
