import type {
  KpAssetBundle,
  KpSemanticAssetObject
} from "../semantic/asset.ts";
import {
  normalizeKpSemanticTransformationCorrespondence,
  validateKpSemanticTransformation,
  type KpSemanticTransformation,
  type KpSemanticTransformationDefinition
} from "../semantic/asset-transformation.ts";
import {
  bindKpTransformationDefinitionCorrespondence,
  type KpTransformationDefinitionBindings
} from "../semantic/transformation-definition-binding.ts";
import {
  createKpEquationTransitionIr,
  type KpEquationTransitionIr,
  type KpEquationTransitionIrState
} from "./equation-transition-ir.ts";

export interface CompileKpSemanticEquationTransitionInput {
  readonly transformation: KpSemanticTransformation;
  readonly bundle: KpAssetBundle;
  readonly definition?: KpSemanticTransformationDefinition | undefined;
  readonly definitionBindings?: KpTransformationDefinitionBindings | undefined;
}

export function compileKpSemanticEquationTransition(
  input: CompileKpSemanticEquationTransitionInput
): KpEquationTransitionIr {
  const validationIssues = validateKpSemanticTransformation(
    input.transformation,
    input.bundle
  );
  if (validationIssues.length > 0) {
    throw new Error(
      `Cannot compile semantic equation transformation ${input.transformation.id}: ${validationIssues[0]!.message}`
    );
  }

  return createKpEquationTransitionIr({
    id: `equation-transition.${input.transformation.id}`,
    transformationId: input.transformation.id,
    transformType: input.transformation.transformType,
    title: input.transformation.title,
    source: compileEquationStates(
      input.transformation.id,
      "source",
      input.transformation.sourceObjectIds,
      input.bundle
    ),
    target: compileEquationStates(
      input.transformation.id,
      "target",
      input.transformation.targetObjectIds,
      input.bundle
    ),
    correspondenceMap: correspondenceMapForCompilation(input)
  });
}

function correspondenceMapForCompilation(
  input: CompileKpSemanticEquationTransitionInput
) {
  const directMap = normalizeKpSemanticTransformationCorrespondence(
    input.transformation
  );
  if (directMap.records.length > 0) return directMap;
  if (input.definition === undefined && input.definitionBindings === undefined) {
    return directMap;
  }
  if (input.definition === undefined || input.definitionBindings === undefined) {
    throw new Error(
      `Cannot compile semantic equation transformation ${input.transformation.id}: definition and definition bindings must be supplied together.`
    );
  }
  return bindKpTransformationDefinitionCorrespondence({
    transformation: input.transformation,
    definition: input.definition,
    bindings: input.definitionBindings
  });
}

function compileEquationStates(
  transformationId: string,
  side: "source" | "target",
  objectIds: readonly string[],
  bundle: KpAssetBundle
): readonly KpEquationTransitionIrState[] {
  return objectIds.map((objectId) => {
    const object = bundle.objects.find((candidate) => candidate.id === objectId);
    if (object === undefined) {
      throw new Error(
        `Cannot compile semantic equation transformation ${transformationId}: missing ${side} object ${objectId}.`
      );
    }
    const latex = equationLatex(object);
    if (latex === undefined) {
      throw new Error(
        `Cannot compile semantic equation transformation ${transformationId}: ${side} object ${objectId} does not expose non-empty LaTeX.`
      );
    }
    return {
      objectId: object.id,
      latex,
      selectors: object.selectors.map((selector) => ({
        id: selector.id,
        kind: "semantic" as const,
        semanticKind: selector.kind,
        ...(selector.label === undefined ? {} : { label: selector.label })
      }))
    };
  });
}

function equationLatex(object: KpSemanticAssetObject): string | undefined {
  if (!isRecord(object.value)) return undefined;
  const latex = object.value["latex"];
  return typeof latex === "string" && latex.trim().length > 0 ? latex : undefined;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null;
}
