import {
  createKpFunctionWrapEquationExtensionPack
} from "../src/animation/equation-extension-packs/function-wrap.ts";
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
  const validation = validateKpEquationExtensionPack(
    createKpFunctionWrapEquationExtensionPack()
  );
  if (validation.status !== "valid") {
    throw new Error(validation.diagnostics.map(({ message }) => message).join("\n"));
  }
  const pack = validation.validatedPack.pack;
  const declarations = [
    ...pack.operations.ids.map((id) => declaration(
      "operation",
      id,
      "../animation/equation-extension-packs/function-wrap.ts",
      "kpFunctionWrapOperationRegistration"
    )),
    ...pack.recipes.ids.map((id) => declaration(
      "recipe",
      id,
      "../animation/equation-extension-packs/function-wrap.ts",
      "kpFunctionWrapRecipeRegistration"
    )),
    ...pack.motifs.ids.map((id) => declaration(
      "motif",
      id,
      "../animation/function-wrap-motif.ts",
      "kpFunctionWrapMotifDefinition"
    )),
    ...pack.rendererCapabilities.ids.map((id) => declaration(
      "renderer-capability",
      id,
      "../rendering/native-katex-function-wrap-reception.ts",
      "applyKpNativeKatexFunctionWrapReception"
    )),
    declaration(
      "lazy-pack",
      pack.id,
      "../animation/equation-extension-packs/function-wrap.ts",
      "createKpFunctionWrapEquationExtensionPack"
    )
  ];
  return Object.freeze(declarations);
}

function declaration(
  kind: KpEquationDispatchKind,
  id: string,
  modulePath: string,
  exportName: string
): KpEquationDispatchDeclaration {
  return Object.freeze({ kind, id, modulePath, exportName });
}
