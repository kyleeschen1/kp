import type {
  KpSemanticAnimationCompilerStage,
  KpSemanticAnimationCompilerStageId
} from "./semantic-animation-compiler-stages.ts";
import {
  kpSemanticAnimationCompilerStages
} from "./semantic-animation-compiler-stages.ts";

export type KpSemanticAnimationDependencyLayerId =
  | "semantic"
  | "neutral-animation-domain"
  | "presentation"
  | "rendering";

export type KpSemanticAnimationContractScope =
  | "generic"
  | "equation-domain"
  | "graph-domain"
  | "program-trace-domain"
  | "mixed-domain";

export interface KpSemanticAnimationDependencyLayer {
  readonly id: KpSemanticAnimationDependencyLayerId;
  readonly rank: 0 | 1 | 2 | 3;
  readonly stageIds: readonly KpSemanticAnimationCompilerStageId[];
  readonly mayDependOn: readonly KpSemanticAnimationDependencyLayerId[];
  readonly concreteRendererResources: "forbidden" | "allowed";
  readonly responsibility: string;
}

export interface KpSemanticAnimationPublicSeamContract {
  readonly id: string;
  readonly from: KpSemanticAnimationDependencyLayerId;
  readonly to: KpSemanticAnimationDependencyLayerId;
  readonly producerStageId: KpSemanticAnimationCompilerStageId;
  readonly consumerStageId: KpSemanticAnimationCompilerStageId;
  readonly contracts: readonly {
    readonly representation: string;
    readonly scope: KpSemanticAnimationContractScope;
  }[];
}

export interface KpSemanticAnimationOwnershipMigrationDebt {
  readonly stageId: KpSemanticAnimationCompilerStageId;
  readonly currentSourcePath: string;
  readonly targetLayer: KpSemanticAnimationDependencyLayerId;
  readonly retirementSlice: `s${number}`;
  readonly reason: string;
}

// Authority remains attached to the stage inventory. These layers describe
// dependency direction, so a presentation-owned policy may still be a neutral
// compiler input without granting presentation code ownership of semantics.
export const kpSemanticAnimationDependencyLayers = [
  layer({
    id: "semantic",
    rank: 0,
    stageIds: [
      "domain-state",
      "transformation-instance",
      "operation-resolution",
      "correspondence-lineage"
    ],
    mayDependOn: ["semantic"],
    concreteRendererResources: "forbidden",
    responsibility:
      "Own mathematical identity, transformations, correspondence, and lineage."
  }),
  layer({
    id: "neutral-animation-domain",
    rank: 1,
    stageIds: [
      "presentation-profile",
      "choreography",
      "domain-ir"
    ],
    mayDependOn: ["semantic", "neutral-animation-domain"],
    concreteRendererResources: "forbidden",
    responsibility:
      "Own renderer-neutral policy inputs, choreography, and explicitly scoped domain IR."
  }),
  layer({
    id: "presentation",
    rank: 2,
    stageIds: [
      "motion-plan",
      "sampled-frame",
      "domain-payload"
    ],
    mayDependOn: [
      "semantic",
      "neutral-animation-domain",
      "presentation"
    ],
    concreteRendererResources: "forbidden",
    responsibility:
      "Resolve neutral plans into sampled frames and typed domain payloads."
  }),
  layer({
    id: "rendering",
    rank: 3,
    stageIds: ["renderer-adapter"],
    mayDependOn: [
      "semantic",
      "neutral-animation-domain",
      "presentation",
      "rendering"
    ],
    concreteRendererResources: "allowed",
    responsibility:
      "Adapt typed frames to DOM, KaTeX, SVG, canvas, WebGL, and other concrete output."
  })
] as const satisfies readonly KpSemanticAnimationDependencyLayer[];

export const kpSemanticAnimationPublicSeams = [
  seam({
    id: "seam.semantic-to-neutral-animation",
    from: "semantic",
    to: "neutral-animation-domain",
    producerStageId: "correspondence-lineage",
    consumerStageId: "presentation-profile",
    contracts: [
      { representation: "KpCorrespondenceMap", scope: "generic" },
      { representation: "KpSemanticLineageGraph", scope: "generic" }
    ]
  }),
  seam({
    id: "seam.neutral-animation-to-presentation",
    from: "neutral-animation-domain",
    to: "presentation",
    producerStageId: "domain-ir",
    consumerStageId: "motion-plan",
    contracts: [
      {
        representation: "KpEquationTransitionIr",
        scope: "equation-domain"
      }
    ]
  }),
  seam({
    id: "seam.presentation-to-rendering",
    from: "presentation",
    to: "rendering",
    producerStageId: "domain-payload",
    consumerStageId: "renderer-adapter",
    contracts: [
      {
        representation: "KpEquationSampledFramePayload",
        scope: "equation-domain"
      },
      {
        representation: "KpGraphDiagramSampledFramePayload",
        scope: "graph-domain"
      },
      {
        representation: "KpProgramTraceSampledFramePayload",
        scope: "program-trace-domain"
      },
      {
        representation: "KpSampledFrameEnvelope",
        scope: "generic"
      },
      {
        representation: "KpAnimationRuntimeFrame",
        scope: "generic"
      },
      {
        representation: "KpDerivativeTangentRuntimeFrame",
        scope: "graph-domain"
      },
      {
        representation: "KpProgramTraceFramePreview",
        scope: "program-trace-domain"
      }
    ]
  })
] as const satisfies readonly KpSemanticAnimationPublicSeamContract[];

export const kpSemanticAnimationOwnershipMigrationDebt =
  [] as const satisfies readonly KpSemanticAnimationOwnershipMigrationDebt[];

export function assertKpSemanticAnimationLayerOwnership(input: {
  readonly stages?: readonly KpSemanticAnimationCompilerStage[];
  readonly layers?: readonly KpSemanticAnimationDependencyLayer[];
  readonly seams?: readonly KpSemanticAnimationPublicSeamContract[];
} = {}): void {
  const stages = input.stages ?? kpSemanticAnimationCompilerStages;
  const layers = input.layers ?? kpSemanticAnimationDependencyLayers;
  const seams = input.seams ?? kpSemanticAnimationPublicSeams;
  const stageLayer = new Map<
    KpSemanticAnimationCompilerStageId,
    KpSemanticAnimationDependencyLayer
  >();

  for (const dependencyLayer of layers) {
    for (const stageId of dependencyLayer.stageIds) {
      if (stageLayer.has(stageId)) {
        throw new Error(`Compiler stage ${stageId} has multiple dependency layers.`);
      }
      stageLayer.set(stageId, dependencyLayer);
    }
  }

  for (const compilerStage of stages) {
    const currentLayer = stageLayer.get(compilerStage.id);
    if (currentLayer === undefined) {
      throw new Error(`Compiler stage ${compilerStage.id} lacks a dependency layer.`);
    }
    for (const dependencyId of compilerStage.dependsOn) {
      const dependencyLayer = stageLayer.get(dependencyId);
      if (dependencyLayer === undefined) {
        throw new Error(`Compiler dependency ${dependencyId} lacks a layer.`);
      }
      if (
        dependencyLayer.rank > currentLayer.rank ||
        !currentLayer.mayDependOn.includes(dependencyLayer.id)
      ) {
        throw new Error(
          `Layer ${currentLayer.id} cannot depend on ${dependencyLayer.id}.`
        );
      }
    }
  }

  if (stageLayer.size !== stages.length) {
    throw new Error("Layer ownership includes a stage outside the compiler inventory.");
  }

  for (const publicSeam of seams) {
    const producerLayer = stageLayer.get(publicSeam.producerStageId);
    const consumerLayer = stageLayer.get(publicSeam.consumerStageId);
    if (
      producerLayer?.id !== publicSeam.from ||
      consumerLayer?.id !== publicSeam.to ||
      consumerLayer.rank !== producerLayer.rank + 1
    ) {
      throw new Error(`Public seam ${publicSeam.id} does not join adjacent layers.`);
    }
    if (publicSeam.contracts.length === 0) {
      throw new Error(`Public seam ${publicSeam.id} exports no contracts.`);
    }
    for (const contract of publicSeam.contracts) {
      if (
        contract.scope === "generic" &&
        /^Kp(?:Equation|Derivative|ProgramTrace)/.test(contract.representation)
      ) {
        throw new Error(
          `Domain contract ${contract.representation} cannot claim generic scope.`
        );
      }
    }
  }
}

function layer(
  input: KpSemanticAnimationDependencyLayer
): KpSemanticAnimationDependencyLayer {
  return input;
}

function seam(
  input: KpSemanticAnimationPublicSeamContract
): KpSemanticAnimationPublicSeamContract {
  return input;
}
