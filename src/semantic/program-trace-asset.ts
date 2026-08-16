import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type CreateKpAssetSelectorInput,
  type KpAssetBundle
} from "./asset.ts";
import {
  createKpBehavior,
  type KpBehavior
} from "./asset-behavior.ts";
import {
  createKpSemanticDiagramSequence,
  createKpTransformationDiagramLeaf,
  type KpSemanticDiagramSequence
} from "./asset-diagram.ts";
import {
  createKpSemanticTransformation,
  type KpSemanticTransformation
} from "./asset-transformation.ts";
import type {
  SourceFileObject,
  SourceRangeSelector
} from "./source-file.ts";
import {
  createSourceRangeProvenance
} from "./source-file.ts";
import {
  createAdditionProgrammingExecutionTraceFixture
} from "../domain-ir/programming-addition-trace-fixture.ts";
import type {
  KpProgrammingExecutionTraceFrame,
  KpProgrammingExecutionTraceStep
} from "../domain-ir/programming-execution-trace.ts";

export interface ProgramTraceKpAsset {
  readonly sourceFixtureId: "fixture.programming.add.execution-trace";
  readonly bundle: KpAssetBundle;
  readonly transformations: readonly KpSemanticTransformation[];
  readonly diagram: KpSemanticDiagramSequence;
  readonly behavior: KpBehavior<KpProgrammingExecutionTraceFrame>;
}

export function createAdditionProgramTraceKpAsset(): ProgramTraceKpAsset {
  const fixture = createAdditionProgrammingExecutionTraceFixture();
  const bundle = createKpAssetBundle({
    id: "asset.programming.add.execution-trace",
    title: "Addition execution trace",
    objects: [
      createKpSemanticAssetObject({
        id: fixture.sourceFile.id,
        objectType: "source-file",
        title: fixture.sourceFile.label,
        value: fixture.sourceFile,
        selectors: fixture.selectors.map((selector) =>
          sourceRangeSelectorInput(fixture.sourceFile, selector)
        ),
        provenance: {
          kind: "authored",
          sourceIds: [fixture.id],
          summary: "Source file for the addition execution trace fixture."
        }
      }),
      ...fixture.trace.steps.map((step) =>
        createKpSemanticAssetObject({
          id: executionStepObjectId(step.stepId),
          objectType: "execution-step",
          title: step.summary ?? step.stepId,
          value: executionStepValue(step),
          selectors: executionStepSelectors(step),
          provenance: {
            kind: "imported",
            sourceIds: [step.stepId],
            summary: "Execution step supplied by the deterministic trace fixture."
          }
        })
      )
    ]
  });
  const transformations = createProgramTraceTransformations(
    fixture.sourceFile.id,
    fixture.trace.steps
  );
  const diagram = createKpSemanticDiagramSequence({
    id: "diagram.programming.add.execution-trace",
    title: "Addition execution trace sequence",
    children: transformations.map(createKpTransformationDiagramLeaf)
  });
  const behavior = createKpBehavior({
    id: "behavior.programming.add.execution-trace",
    durationMs: 1200,
    sample: ({ progress }) => fixture.sample(progress)
  });

  return {
    sourceFixtureId: fixture.id,
    bundle,
    transformations,
    diagram,
    behavior
  };
}

function createProgramTraceTransformations(
  sourceFileId: string,
  steps: readonly KpProgrammingExecutionTraceStep[]
): readonly KpSemanticTransformation[] {
  return steps.map((step, index) =>
    createKpSemanticTransformation({
      id: executionStepTransformationId(step.stepId),
      transformType: "advanceExecutionTrace",
      title: step.summary ?? `Advance execution trace to ${step.stepId}`,
      sourceObjectIds: [
        index === 0
          ? sourceFileId
          : executionStepObjectId(steps[index - 1]!.stepId)
      ],
      targetObjectIds: [executionStepObjectId(step.stepId)],
      preserves: ["structure"],
      assumptions: [
        "Execution trace step order is supplied by a deterministic fixture."
      ]
    })
  );
}

function executionStepValue(step: KpProgrammingExecutionTraceStep) {
  return {
    stepId: step.stepId,
    kind: step.kind,
    progress: step.progress,
    selectorIds: [...step.selectorIds],
    stack: step.stack.map((frame) => ({ ...frame })),
    locals: step.locals.map((local) => ({ ...local })),
    output: [...(step.output ?? [])],
    ...(step.summary === undefined ? {} : { summary: step.summary })
  };
}

function sourceRangeSelectorInput(
  sourceFile: SourceFileObject,
  selector: SourceRangeSelector
): CreateKpAssetSelectorInput {
  const provenance = createSourceRangeProvenance(sourceFile, selector);

  return {
    id: selector.id,
    kind: selector.kind,
    ...(selector.summary === undefined ? {} : { label: selector.summary }),
    metadata: {
      startLine: selector.start.line,
      startColumn: selector.start.column,
      endLine: selector.end.line,
      endColumn: selector.end.column,
      sourceFileId: provenance.sourceFileId,
      sourceRangeProvenanceId: provenance.id,
      ...(provenance.revisionId === undefined
        ? {}
        : { sourceRevisionId: provenance.revisionId }),
      sourceTextHash: provenance.textHash
    }
  };
}

function executionStepSelectors(
  step: KpProgrammingExecutionTraceStep
): readonly CreateKpAssetSelectorInput[] {
  const stepObjectId = executionStepObjectId(step.stepId);

  return [
    {
      id: `${stepObjectId}.kind`,
      kind: "execution-kind",
      label: step.kind
    },
    ...step.selectorIds.map((selectorId) => ({
      id: `${stepObjectId}.active.${selectorId}`,
      kind: "active-source-range",
      label: selectorId
    }))
  ];
}

function executionStepObjectId(stepId: string): string {
  return stepId.replace(/^step\./, "execution-step.");
}

function executionStepTransformationId(stepId: string): string {
  return stepId.replace(/^step\./, "transform.");
}
