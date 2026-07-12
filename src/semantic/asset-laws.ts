import {
  reparameterizeKpBehavior,
  sampleKpBehavior,
  sampleKpBehaviorAtProgress,
  type KpBehavior
} from "./asset-behavior.ts";
import {
  validateKpAssetBundle,
  type KpAssetBundle
} from "./asset.ts";
import {
  validateKpTransformationDrillDownHooks,
  type KpTransformationDrillDownHook
} from "./asset-decomposition.ts";
import {
  kpSemanticDiagramForwardPhases,
  kpSemanticDiagramRewindPhases,
  type KpSemanticDiagram
} from "./asset-diagram.ts";
import {
  validateKpSemanticTransformation,
  type KpSemanticTransformation
} from "./asset-transformation.ts";
import {
  runKpExternalPort,
  type KpExternalPort,
  type KpExternalPortRunResult
} from "./asset-port.ts";
import {
  validateKpFlashcardSpec,
  type KpFlashcardSpec,
  type KpFlashcardValidationContext
} from "./asset-flashcard.ts";
import type { KpInterpretation } from "./asset-interpreter.ts";
import type { KpEquationFrame } from "./equation-frame-interpreter.ts";

export interface KpLawFailure {
  readonly path: string;
  readonly message: string;
}

export interface KpLawCheckResult {
  readonly lawId: string;
  readonly passed: boolean;
  readonly failures: readonly KpLawFailure[];
}

export interface KpAssetFixtureReferenceClosureInput {
  readonly bundle: KpAssetBundle;
  readonly transformations: readonly KpSemanticTransformation[];
  readonly diagram: KpSemanticDiagram;
  readonly drillDownHooks: readonly KpTransformationDrillDownHook[];
  readonly flashcards: readonly KpFlashcardSpec[];
  readonly trace?: KpFixtureTraceReferenceClosureInput | undefined;
}

export interface KpFixtureTraceReferenceClosureInput {
  readonly id: string;
  readonly steps: readonly KpFixtureTraceStepReferenceClosureInput[];
}

export interface KpFixtureTraceStepReferenceClosureInput {
  readonly id: string;
  readonly transformationId?: string | undefined;
}

export interface KpRendererFrameSemanticPreservationInput {
  readonly progress: number;
  readonly cardProgress?: number | undefined;
  readonly transitionProgress?: number | undefined;
  readonly equationFrame?: KpRendererEquationMotionFrameReference | undefined;
  readonly semanticFrame?: KpEquationFrame | undefined;
}

export interface KpRendererEquationMotionFrameReference {
  readonly progress: number;
}

export function checkKpBehaviorDeterminism<TFrame>(
  behavior: KpBehavior<TFrame>,
  timesMs: readonly number[]
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];

  timesMs.forEach((timeMs, index) => {
    const first = sampleKpBehavior(behavior, timeMs);
    const second = sampleKpBehavior(behavior, timeMs);

    if (!framesEqual(first, second)) {
      failures.push({
        path: `samples[${index}]`,
        message: `Behavior ${behavior.id} produced different frames for time ${timeMs}.`
      });
    }
  });

  return lawResult("behavior.determinism", failures);
}

export function checkKpBehaviorReparameterization<TFrame>(
  behavior: KpBehavior<TFrame>,
  durationMs: number,
  progressSamples: readonly number[]
): KpLawCheckResult {
  const reparameterized = reparameterizeKpBehavior(behavior, {
    id: `${behavior.id}.reparameterized`,
    durationMs
  });
  const failures: KpLawFailure[] = [];

  progressSamples.forEach((progress, index) => {
    const originalFrame = sampleKpBehaviorAtProgress(behavior, progress);
    const reparameterizedFrame = sampleKpBehaviorAtProgress(
      reparameterized,
      progress
    );

    if (!framesEqual(originalFrame, reparameterizedFrame)) {
      failures.push({
        path: `progressSamples[${index}]`,
        message: `Behavior ${behavior.id} changed semantic frame at progress ${progress}.`
      });
    }
  });

  return lawResult("behavior.reparameterization", failures);
}

export function checkKpDiagramRewindLaw(
  diagram: KpSemanticDiagram
): KpLawCheckResult {
  const forward = kpSemanticDiagramForwardPhases(diagram);
  const expectedRewind = [...forward].reverse();
  const actualRewind = kpSemanticDiagramRewindPhases(diagram);
  const failures: KpLawFailure[] = [];

  if (!framesEqual(actualRewind, expectedRewind)) {
    failures.push({
      path: "rewindPhases",
      message: `Diagram ${diagram.id} rewind phases must be exact reverse forward phases.`
    });
  }

  return lawResult("diagram.rewind", failures);
}

export function checkKpDiagramSequenceAssociativityLaw(
  left: KpSemanticDiagram,
  right: KpSemanticDiagram
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];

  if (!framesEqual(left.sourceObjectIds, right.sourceObjectIds)) {
    failures.push({
      path: "sourceObjectIds",
      message: `Diagram ${left.id} and ${right.id} must have the same source boundary.`
    });
  }

  if (!framesEqual(left.targetObjectIds, right.targetObjectIds)) {
    failures.push({
      path: "targetObjectIds",
      message: `Diagram ${left.id} and ${right.id} must have the same target boundary.`
    });
  }

  if (
    !framesEqual(
      kpSemanticDiagramForwardPhases(left),
      kpSemanticDiagramForwardPhases(right)
    )
  ) {
    failures.push({
      path: "forwardPhases",
      message: `Diagram ${left.id} and ${right.id} must preserve forward phase order under regrouping.`
    });
  }

  return lawResult("diagram.sequence-associativity", failures);
}

export function checkKpAssetFixtureReferenceClosure(
  input: KpAssetFixtureReferenceClosureInput
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];
  const transformationIds = new Set(
    input.transformations.map((transformation) => transformation.id)
  );

  validateKpAssetBundle(input.bundle).forEach((issue) => {
    failures.push({
      path: `bundle.${issue.path}`,
      message: issue.message
    });
  });

  input.transformations.forEach((transformation, index) => {
    validateKpSemanticTransformation(transformation, input.bundle).forEach(
      (issue) => {
        failures.push({
          path: `transformations[${index}].${issue.path}`,
          message: issue.message
        });
      }
    );
  });

  kpSemanticDiagramForwardPhases(input.diagram).forEach((phase, phaseIndex) => {
    phase.forEach((transformationId, transformationIndex) => {
      if (!transformationIds.has(transformationId)) {
        failures.push({
          path: `diagram.forwardPhases[${phaseIndex}][${transformationIndex}]`,
          message:
            `Diagram ${input.diagram.id} references missing transformation ${transformationId}.`
        });
      }
    });
  });

  validateKpTransformationDrillDownHooks(input.drillDownHooks, {
    transformations: input.transformations
  }).forEach((issue) => {
    failures.push({
      path: `drillDownHooks.${issue.path}`,
      message: issue.message
    });
  });

  input.flashcards.forEach((card, index) => {
    validateKpFlashcardSpec(card, {
      bundle: input.bundle,
      transformations: input.transformations
    }).forEach((issue) => {
      failures.push({
        path: `flashcards[${index}].${issue.path}`,
        message: issue.message
      });
    });
  });

  const trace = input.trace;

  trace?.steps.forEach((step, index) => {
    if (
      step.transformationId !== undefined &&
      !transformationIds.has(step.transformationId)
    ) {
      failures.push({
        path: `trace.steps[${index}].transformationId`,
        message:
          `Trace ${trace.id} step ${step.id} references missing transformation ${step.transformationId}.`
      });
    }
  });

  return lawResult("asset-fixture.reference-closure", failures);
}

export function checkKpRendererFrameSemanticPreservation(
  input: KpRendererFrameSemanticPreservationInput
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];
  const semanticFrame = input.semanticFrame;

  if (semanticFrame === undefined) {
    return lawResult("renderer-frame.semantic-preservation", [
      {
        path: "semanticFrame",
        message: "Renderer frame must include a semantic frame."
      }
    ]);
  }

  if (!numbersEqual(input.progress, semanticFrame.progress)) {
    failures.push({
      path: "progress",
      message:
        `Renderer frame progress ${input.progress} does not match semantic frame progress ${semanticFrame.progress}.`
    });
  }

  if (
    input.cardProgress !== undefined &&
    !numbersEqual(input.cardProgress, semanticFrame.progress)
  ) {
    failures.push({
      path: "cardProgress",
      message:
        `Renderer card progress ${input.cardProgress} does not match semantic frame progress ${semanticFrame.progress}.`
    });
  }

  if (
    input.transitionProgress !== undefined &&
    input.equationFrame !== undefined &&
    !numbersEqual(input.equationFrame.progress, input.transitionProgress)
  ) {
    failures.push({
      path: "equationFrame.progress",
      message:
        `Renderer equation motion progress ${input.equationFrame.progress} does not match transition progress ${input.transitionProgress}.`
    });
  }

  const transformationRefIds = semanticFrame.transformationRefs.map(
    (ref) => ref.transformationId
  );

  if (!framesEqual(semanticFrame.activeTransformationIds, transformationRefIds)) {
    failures.push({
      path: "semanticFrame.transformationRefs",
      message:
        `Semantic frame ${semanticFrame.id} active transformations must match transformation refs.`
    });
  }

  // Generated semantic timelines can have more transformations than the reused
  // visual motif; this law preserves the shared parent clock and metadata, not
  // a one-to-one visual-track mapping.
  checkKpEquationFrameSelectorCorrespondenceClosure(semanticFrame).failures.forEach(
    (failure) => {
      failures.push({
        path: `semanticFrame.${failure.path}`,
        message: failure.message
      });
    }
  );

  const inspection = semanticFrame.inspection;

  if (inspection !== undefined) {
    if (!numbersEqual(inspection.progress, semanticFrame.progress)) {
      failures.push({
        path: "semanticFrame.inspection.progress",
        message:
          `Semantic frame ${semanticFrame.id} inspection progress ${inspection.progress} must match frame progress ${semanticFrame.progress}.`
      });
    }

    if (
      inspection.phaseId !== undefined &&
      semanticFrame.activeTransformationIds[0] !== undefined &&
      inspection.phaseId !== semanticFrame.activeTransformationIds[0]
    ) {
      failures.push({
        path: "semanticFrame.inspection.phaseId",
        message:
          `Semantic frame ${semanticFrame.id} inspection phase ${inspection.phaseId} must match active transformation ${semanticFrame.activeTransformationIds[0]}.`
      });
    }

    if (
      !framesEqual(
        inspection.activeTransformationIds,
        semanticFrame.activeTransformationIds
      )
    ) {
      failures.push({
        path: "semanticFrame.inspection.activeTransformationIds",
        message:
          `Semantic frame ${semanticFrame.id} inspection active transformations must match frame active transformations.`
      });
    }

    const selectorIds = semanticFrame.selectorRefs.map((ref) => ref.selectorId);

    if (!framesEqual(inspection.activeSelectorIds, selectorIds)) {
      failures.push({
        path: "semanticFrame.inspection.activeSelectorIds",
        message:
          `Semantic frame ${semanticFrame.id} inspection active selectors must match frame selector refs.`
      });
    }
  }

  return lawResult("renderer-frame.semantic-preservation", failures);
}

export function checkKpPortDeterminism<TInput>(
  port: KpExternalPort<TInput>,
  input: TInput
): KpLawCheckResult {
  const first = runKpExternalPort(port, input);
  const second = runKpExternalPort(port, input);
  const failures: KpLawFailure[] = [];

  if (!framesEqual(first, second)) {
    failures.push({
      path: "runs",
      message: `Port ${port.id} produced different imports for the same input.`
    });
  }

  return lawResult("port.determinism", failures);
}

export function checkKpPortLossDiagnostics(
  result: KpExternalPortRunResult
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];

  if (result.preservation !== "strict" && result.diagnostics.length === 0) {
    failures.push({
      path: "diagnostics",
      message: `Port ${result.portId} must report diagnostics when preservation is ${result.preservation}.`
    });
  }

  result.diagnostics.forEach((diagnostic, index) => {
    if (
      (diagnostic.severity === "warning" || diagnostic.severity === "error") &&
      diagnostic.lossKind === undefined
    ) {
      failures.push({
        path: `diagnostics[${index}].lossKind`,
        message: `Port ${result.portId} diagnostic ${diagnostic.code} must name the loss kind.`
      });
    }
  });

  if (
    result.preservation === "strict" &&
    result.diagnostics.some((diagnostic) => diagnostic.lossKind !== undefined)
  ) {
    failures.push({
      path: "preservation",
      message: `Port ${result.portId} cannot claim strict preservation while reporting loss diagnostics.`
    });
  }

  return lawResult("port.loss-reporting", failures);
}

export function checkKpInterpreterLossDiagnostics(
  interpretation: KpInterpretation<unknown>
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];

  if (
    interpretation.preservation !== "strict" &&
    interpretation.diagnostics.length === 0
  ) {
    failures.push({
      path: "diagnostics",
      message: `Interpreter ${interpretation.interpreterId} must report diagnostics when preservation is ${interpretation.preservation}.`
    });
  }

  interpretation.diagnostics.forEach((diagnostic, index) => {
    if (
      (diagnostic.severity === "warning" || diagnostic.severity === "error") &&
      diagnostic.lossKind === undefined
    ) {
      failures.push({
        path: `diagnostics[${index}].lossKind`,
        message: `Interpreter ${interpretation.interpreterId} diagnostic ${diagnostic.code} must name the loss kind.`
      });
    }
  });

  if (
    interpretation.preservation === "strict" &&
    interpretation.diagnostics.some(
      (diagnostic) => diagnostic.lossKind !== undefined
    )
  ) {
    failures.push({
      path: "preservation",
      message: `Interpreter ${interpretation.interpreterId} cannot claim strict preservation while reporting loss diagnostics.`
    });
  }

  return lawResult("interpreter.loss-reporting", failures);
}

export function checkKpFlashcardReferenceClosure(
  card: KpFlashcardSpec,
  context: KpFlashcardValidationContext
): KpLawCheckResult {
  return lawResult(
    "flashcard.reference-closure",
    validateKpFlashcardSpec(card, context).map((issue) => ({
      path: issue.path,
      message: issue.message
    }))
  );
}

export function checkKpEquationFrameSelectorCorrespondenceClosure(
  frame: KpEquationFrame
): KpLawCheckResult {
  const selectorIds = new Set(
    frame.selectorRefs.map((selectorRef) => selectorRef.selectorId)
  );
  const failures: KpLawFailure[] = [];

  frame.selectorCorrespondenceRefs.forEach((correspondence, index) => {
    if (!selectorIds.has(correspondence.sourceSelectorId)) {
      failures.push({
        path: `selectorCorrespondenceRefs[${index}].sourceSelectorId`,
        message: `Equation frame ${frame.id} correspondence references missing source selector ${correspondence.sourceSelectorId}.`
      });
    }

    if (!selectorIds.has(correspondence.targetSelectorId)) {
      failures.push({
        path: `selectorCorrespondenceRefs[${index}].targetSelectorId`,
        message: `Equation frame ${frame.id} correspondence references missing target selector ${correspondence.targetSelectorId}.`
      });
    }
  });

  return lawResult("equation-frame.selector-correspondence-closure", failures);
}

function lawResult(
  lawId: string,
  failures: readonly KpLawFailure[]
): KpLawCheckResult {
  return {
    lawId,
    passed: failures.length === 0,
    failures: [...failures]
  };
}

function framesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function numbersEqual(left: number, right: number): boolean {
  return Math.abs(left - right) < 1e-9;
}
