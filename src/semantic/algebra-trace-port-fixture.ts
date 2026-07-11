import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type CreateKpAssetSelectorInput,
  type KpAssetBundle,
  type KpAssetSelector,
  type KpSemanticAssetObject
} from "./asset.ts";
import {
  createKpExternalPort,
  type KpExternalPort,
  type KpExternalPortImportResult,
  type KpPortDiagnostic
} from "./asset-port.ts";
import {
  createLinearSolveKpAssetBundle
} from "./linear-solve-asset.ts";

const portId = "port.fixture.algebra-trace.linear-solve";

export interface AlgebraTraceStepFixture {
  readonly id: string;
  readonly latex: string;
  readonly transformationId?: string | undefined;
  readonly rule?: string | undefined;
}

export interface AlgebraTraceFixture {
  readonly id: string;
  readonly title: string;
  readonly steps: readonly AlgebraTraceStepFixture[];
}

export const linearSolveAlgebraTraceFixture: AlgebraTraceFixture = {
  id: "trace.linear-solve",
  title: "Linear solve generated algebra trace",
  steps: [
    {
      id: "trace.linear-solve.step.initial",
      latex: "x + 3 = 7"
    },
    {
      id: "trace.linear-solve.step.after-subtract",
      latex: "x + 3 - 3 = 7 - 3",
      transformationId: "transform.linear-solve.subtract-both-sides-3",
      rule: "subtractBothSides"
    },
    {
      id: "trace.linear-solve.step.left-simplified",
      latex: "x = 7 - 3",
      transformationId: "transform.linear-solve.cancel-left-additive-inverse",
      rule: "cancelAdditiveInverses"
    },
    {
      id: "trace.linear-solve.step.solved",
      latex: "x = 4",
      transformationId: "transform.linear-solve.simplify-right-difference",
      rule: "simplifyConstantDifference"
    }
  ]
};

export function createLinearSolveAlgebraTracePort(): KpExternalPort<AlgebraTraceFixture> {
  return createKpExternalPort({
    id: portId,
    title: "Linear solve algebra trace fixture port",
    sourceSystem: "fixture.algebra-trace",
    version: "0.1.0",
    preservation: "strict",
    importAsset: importLinearSolveAlgebraTrace
  });
}

function importLinearSolveAlgebraTrace(
  trace: AlgebraTraceFixture
): KpExternalPortImportResult {
  const canonical = createLinearSolveKpAssetBundle().bundle;
  const diagnostics = validateTraceShape(trace, canonical);

  return {
    bundle: createImportedLinearSolveBundle(canonical, trace),
    preservation: diagnostics.length === 0 ? "strict" : "lax",
    ...(diagnostics.length === 0 ? {} : { diagnostics })
  };
}

function createImportedLinearSolveBundle(
  canonical: KpAssetBundle,
  trace: AlgebraTraceFixture
): KpAssetBundle {
  return createKpAssetBundle({
    id: canonical.id,
    title: canonical.title,
    objects: canonical.objects.map((object, index) =>
      createImportedObject(
        object,
        trace.steps[index] ?? fallbackStep(trace, index),
        index
      )
    )
  });
}

function createImportedObject(
  object: KpSemanticAssetObject,
  step: AlgebraTraceStepFixture,
  index: number
): KpSemanticAssetObject {
  return createKpSemanticAssetObject({
    id: object.id,
    objectType: object.objectType,
    title: object.title,
    value: object.value,
    selectors: object.selectors.map(copySelectorInput),
    provenance: {
      kind: index === 0 ? "imported" : "transformed",
      sourceIds: [step.id],
      ...(step.transformationId === undefined
        ? {}
        : { transformationId: step.transformationId }),
      portId
    },
    ...(object.metadata === undefined ? {} : { metadata: object.metadata })
  });
}

function validateTraceShape(
  trace: AlgebraTraceFixture,
  canonical: KpAssetBundle
): readonly KpPortDiagnostic[] {
  const diagnostics: KpPortDiagnostic[] = [];

  if (trace.steps.length !== canonical.objects.length) {
    diagnostics.push({
      severity: "warning",
      code: "trace-step-count-mismatch",
      lossKind: "partial",
      message: `Expected ${canonical.objects.length} trace steps but received ${trace.steps.length}.`,
      path: "steps"
    });
  }

  canonical.objects.forEach((object, index) => {
    const step = trace.steps[index];
    const expectedLatex = expectedLatexForObject(object);

    if (
      step !== undefined &&
      expectedLatex !== undefined &&
      step.latex !== expectedLatex
    ) {
      diagnostics.push({
        severity: "warning",
        code: "trace-latex-mismatch",
        lossKind: "partial",
        message: `Trace step ${step.id} latex does not match canonical object ${object.id}.`,
        path: `steps[${index}].latex`
      });
    }
  });

  return diagnostics;
}

function expectedLatexForObject(object: KpSemanticAssetObject): string | undefined {
  if (
    typeof object.value === "object" &&
    object.value !== null &&
    "latex" in object.value &&
    typeof object.value.latex === "string"
  ) {
    return object.value.latex;
  }

  return undefined;
}

function fallbackStep(
  trace: AlgebraTraceFixture,
  index: number
): AlgebraTraceStepFixture {
  return {
    id: `${trace.id}.missing-step-${index}`,
    latex: ""
  };
}

function copySelectorInput(
  selector: KpAssetSelector
): CreateKpAssetSelectorInput {
  return {
    id: selector.id,
    kind: selector.kind,
    ...(selector.label === undefined ? {} : { label: selector.label }),
    ...(selector.summary === undefined ? {} : { summary: selector.summary }),
    ...(selector.metadata === undefined ? {} : { metadata: selector.metadata })
  };
}
