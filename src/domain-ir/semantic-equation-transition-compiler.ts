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
  type KpCanonicalOperationExecutionResult,
  type KpTransformationDefinitionBindings
} from "../semantic/transformation-definition-binding.ts";
import { validateCorrespondenceMap } from "../semantic/correspondence.ts";
import {
  createKpEquationTransitionIr,
  type KpEquationTransitionIr,
  type KpEquationTransitionIrState
} from "./equation-transition-ir.ts";
import {
  adaptKpSemanticTransitionGapToLegacyFade,
  createKpSemanticTransitionGap,
  type KpLegacyEquationFadeFallback,
  type KpSemanticTransitionGap,
  type KpSemanticTransitionGapReason
} from "../semantic/semantic-transition-gap.ts";

export interface CompileKpSemanticEquationTransitionInput {
  readonly transformation: KpSemanticTransformation;
  readonly bundle: KpAssetBundle;
  readonly definition?: KpSemanticTransformationDefinition | undefined;
  readonly definitionBindings?: KpTransformationDefinitionBindings | undefined;
  readonly operationExecution?: KpCanonicalOperationExecutionResult | undefined;
  readonly unsupportedPolicy?: "typed-gap" | "legacy-fade" | undefined;
}

export type KpSemanticEquationTransitionCompileDiagnosticCode =
  | "semantic-transition.invalid-reference"
  | "semantic-transition.object-without-latex"
  | "semantic-transition.invalid-correspondence"
  | "semantic-transition.missing-definition-binding"
  | "semantic-transition.no-correspondence"
  | "semantic-transition.incomplete-lifecycle"
  | "semantic-transition.compile-failed";

export interface KpSemanticEquationTransitionCompileDiagnostic {
  readonly code: KpSemanticEquationTransitionCompileDiagnosticCode;
  readonly severity: "warning" | "error";
  readonly message: string;
}

export interface KpSemanticEquationTransitionCompileResult {
  readonly status: "semantic" | "gap" | "fallback";
  readonly ir?: KpEquationTransitionIr | undefined;
  readonly diagnostics: readonly KpSemanticEquationTransitionCompileDiagnostic[];
  readonly gap?: KpSemanticTransitionGap | undefined;
  readonly fallback?: KpLegacyEquationFadeFallback | undefined;
}

export function compileKpSemanticEquationTransitionResult(
  input: CompileKpSemanticEquationTransitionInput
): KpSemanticEquationTransitionCompileResult {
  let ir: KpEquationTransitionIr;
  try {
    ir = compileKpSemanticEquationTransition(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const diagnostic = compileFailureDiagnostic(message);
    return unsupportedResult(input, undefined, [diagnostic]);
  }

  if (ir.correspondenceMap.records.length === 0) {
    const diagnostic: KpSemanticEquationTransitionCompileDiagnostic = {
      code: "semantic-transition.no-correspondence",
      severity: "warning",
      message:
        `Transformation ${input.transformation.id} has no selector correspondence; semantic token motion is unavailable.`
    };
    return unsupportedResult(input, ir, [diagnostic]);
  }

  const lifecycleIssues = validateCorrespondenceMap(ir.correspondenceMap, {
    sourceSelectorIds: ir.source.flatMap((state) =>
      state.selectors
        .filter((selector) => selector.kind === "semantic")
        .map((selector) => selector.id)
    ),
    targetSelectorIds: ir.target.flatMap((state) =>
      state.selectors
        .filter((selector) => selector.kind === "semantic")
        .map((selector) => selector.id)
    )
  });
  if (lifecycleIssues.length > 0) {
    return unsupportedResult(input, ir, lifecycleIssues.map((issue) => ({
      code: "semantic-transition.incomplete-lifecycle",
      severity: "warning",
      message: issue.message
    })));
  }

  return { status: "semantic", ir, diagnostics: [] };
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
  if (input.operationExecution !== undefined) {
    if (input.operationExecution.transformationId !== input.transformation.id) {
      throw new Error(
        `Canonical operation execution ${input.operationExecution.transformationId} does not match transformation ${input.transformation.id}.`
      );
    }
    return input.operationExecution.correspondenceMap;
  }
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

function unsupportedResult(
  input: CompileKpSemanticEquationTransitionInput,
  ir: KpEquationTransitionIr | undefined,
  diagnostics: readonly KpSemanticEquationTransitionCompileDiagnostic[]
): KpSemanticEquationTransitionCompileResult {
  const gap = createKpSemanticTransitionGap({
    transformationId: input.transformation.id,
    reason: gapReason(diagnostics[0]?.code),
    diagnostics
  });
  if (input.unsupportedPolicy === "typed-gap") {
    return {
      status: "gap",
      ...(ir === undefined ? {} : { ir }),
      diagnostics,
      gap
    };
  }
  return {
    status: "fallback",
    ...(ir === undefined ? {} : { ir }),
    diagnostics,
    gap,
    fallback: adaptKpSemanticTransitionGapToLegacyFade(gap)
  };
}

function gapReason(
  code: KpSemanticEquationTransitionCompileDiagnosticCode | undefined
): KpSemanticTransitionGapReason {
  switch (code) {
    case "semantic-transition.no-correspondence":
      return "missing-correspondence";
    case "semantic-transition.incomplete-lifecycle":
      return "incomplete-lifecycle";
    case "semantic-transition.missing-definition-binding":
      return "missing-definition-binding";
    case "semantic-transition.invalid-reference":
    case "semantic-transition.object-without-latex":
      return "invalid-reference";
    case "semantic-transition.invalid-correspondence":
      return "invalid-correspondence";
    case "semantic-transition.compile-failed":
    case undefined:
      return "compile-failed";
  }
}

function compileFailureDiagnostic(
  message: string
): KpSemanticEquationTransitionCompileDiagnostic {
  if (message.includes("selector role binding") || message.includes("definition bindings")) {
    return {
      code: "semantic-transition.missing-definition-binding",
      severity: "error",
      message
    };
  }
  if (message.includes("does not expose non-empty LaTeX")) {
    return {
      code: "semantic-transition.object-without-latex",
      severity: "error",
      message
    };
  }
  // Correspondence diagnostics also mention missing references, so the
  // narrower repair category must win before the general reference matcher.
  if (message.includes("invalid correspondence") || message.includes("correspondence references")) {
    return {
      code: "semantic-transition.invalid-correspondence",
      severity: "error",
      message
    };
  }
  if (message.includes("references missing") || message.includes("missing source object") || message.includes("missing target object")) {
    return {
      code: "semantic-transition.invalid-reference",
      severity: "error",
      message
    };
  }
  return {
    code: "semantic-transition.compile-failed",
    severity: "error",
    message
  };
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
      // Hierarchical equation states may expose different semantic units to
      // adjacent transformations (for example, a whole term while grouping,
      // then its coefficient and variable while collecting). The native DOM
      // stays identical; only the active lineage namespace changes.
      selectors: object.selectors
        .filter((selector) =>
          selectorAppliesToTransformation(selector, transformationId)
        )
        .map((selector) => ({
        id: selector.id,
        kind: selector.kind === "artifact"
          ? "artifact" as const
          : selector.kind === "annotation"
            ? "annotation" as const
            : "semantic" as const,
        semanticKind: selector.kind,
        ...(selector.label === undefined ? {} : { label: selector.label })
        }))
    };
  });
}

function selectorAppliesToTransformation(
  selector: KpSemanticAssetObject["selectors"][number],
  transformationId: string
): boolean {
  const scope = selector.metadata?.["activeTransformationIds"];
  if (scope === undefined) return true;
  if (typeof scope !== "string" || scope.trim() === "") {
    throw new Error(
      `Selector ${selector.id} has invalid active transformation scope.`
    );
  }
  return scope.split(",").includes(transformationId);
}

function equationLatex(object: KpSemanticAssetObject): string | undefined {
  if (!isRecord(object.value)) return undefined;
  const latex = object.value["latex"];
  return typeof latex === "string" && latex.trim().length > 0 ? latex : undefined;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null;
}
