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

export interface CreateAlgebraTraceFixturePortInput {
  readonly id: string;
  readonly title: string;
  readonly targetBundle: KpAssetBundle;
  readonly expectedTrace: AlgebraTraceFixture;
  readonly transformationIds?: readonly string[] | undefined;
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
  const canonical = createLinearSolveKpAssetBundle();

  return createAlgebraTraceFixturePort({
    id: portId,
    title: "Linear solve algebra trace fixture port",
    targetBundle: canonical.bundle,
    expectedTrace: linearSolveAlgebraTraceFixture,
    transformationIds: canonical.transformations.map(
      (transformation) => transformation.id
    )
  });
}

export function createAlgebraTraceFixturePort(
  input: CreateAlgebraTraceFixturePortInput
): KpExternalPort<AlgebraTraceFixture> {
  return createKpExternalPort({
    id: input.id,
    title: input.title,
    sourceSystem: "fixture.algebra-trace",
    version: "0.1.0",
    preservation: "strict",
    importAsset: (trace) => importAlgebraTraceFixture(input, trace)
  });
}

function importAlgebraTraceFixture(
  input: CreateAlgebraTraceFixturePortInput,
  trace: AlgebraTraceFixture
): KpExternalPortImportResult {
  const diagnostics = validateTraceShape(trace, input);

  return {
    bundle: createImportedTraceBundle(input.targetBundle, trace, input.id),
    preservation: diagnostics.length === 0 ? "strict" : "lax",
    ...(diagnostics.length === 0 ? {} : { diagnostics })
  };
}

function createImportedTraceBundle(
  targetBundle: KpAssetBundle,
  trace: AlgebraTraceFixture,
  sourcePortId: string
): KpAssetBundle {
  return createKpAssetBundle({
    id: targetBundle.id,
    title: targetBundle.title,
    objects: targetBundle.objects.map((object, index) =>
      createImportedObject(
        object,
        trace.steps[index] ?? fallbackStep(trace, index),
        index,
        sourcePortId
      )
    )
  });
}

function createImportedObject(
  object: KpSemanticAssetObject,
  step: AlgebraTraceStepFixture,
  index: number,
  sourcePortId: string
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
      portId: sourcePortId
    },
    ...(object.metadata === undefined ? {} : { metadata: object.metadata })
  });
}

function validateTraceShape(
  trace: AlgebraTraceFixture,
  input: CreateAlgebraTraceFixturePortInput
): readonly KpPortDiagnostic[] {
  const diagnostics: KpPortDiagnostic[] = [];
  const transformationIds =
    input.transformationIds === undefined
      ? undefined
      : new Set(input.transformationIds);

  if (trace.steps.length !== input.targetBundle.objects.length) {
    diagnostics.push({
      severity: "warning",
      code: "trace-step-count-mismatch",
      lossKind: "partial",
      message: `Expected ${input.targetBundle.objects.length} trace steps but received ${trace.steps.length}.`,
      path: "steps"
    });
  }

  input.targetBundle.objects.forEach((object, index) => {
    const step = trace.steps[index];
    const expectedStep = input.expectedTrace.steps[index];
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

    if (
      step !== undefined &&
      expectedStep !== undefined &&
      step.transformationId !== expectedStep.transformationId
    ) {
      diagnostics.push({
        severity: "warning",
        code: "trace-transformation-mismatch",
        lossKind: "lossy",
        message:
          `Trace step ${step.id} transformation ${formatTraceOptional(step.transformationId)} does not match expected ${formatTraceOptional(expectedStep.transformationId)}.`,
        path: `steps[${index}].transformationId`
      });
    }

    if (
      step !== undefined &&
      expectedStep !== undefined &&
      step.rule !== expectedStep.rule
    ) {
      diagnostics.push({
        severity: "warning",
        code: "trace-rule-mismatch",
        lossKind: "partial",
        message:
          `Trace step ${step.id} rule ${formatTraceOptional(step.rule)} does not match expected ${formatTraceOptional(expectedStep.rule)}.`,
        path: `steps[${index}].rule`
      });
    }

    if (
      step?.transformationId !== undefined &&
      transformationIds !== undefined &&
      !transformationIds.has(step.transformationId)
    ) {
      diagnostics.push({
        severity: "warning",
        code: "trace-transformation-unknown",
        lossKind: "lossy",
        message:
          `Trace step ${step.id} references unknown transformation ${step.transformationId}.`,
        path: `steps[${index}].transformationId`
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

function formatTraceOptional(value: string | undefined): string {
  return value ?? "<none>";
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
