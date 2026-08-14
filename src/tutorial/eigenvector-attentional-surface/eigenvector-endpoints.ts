import { kpEigenvectorAttentionalFixture } from "./eigenvector-math.ts";

export const kpEigenvectorBeatIds = [
  "most-vectors-turn",
  "watch-the-fan",
  "one-direction-survives",
  "geometry-becomes-equation",
  "name-the-scale-factor",
  "predict-a-multiple",
  "verify-the-multiple",
  "reveal-the-eigenspace",
  "compressed-recall"
] as const;

export type KpEigenvectorBeatId = typeof kpEigenvectorBeatIds[number];

export type KpEigenvectorAttentionalOwner =
  | "passage"
  | "diagram"
  | "equation"
  | "learner"
  | "manipulation"
  | "recall";

export type KpEigenvectorEquationForm =
  | "none"
  | "Av=3v"
  | "Av=lambda-v"
  | "A(2v)=6v"
  | "E3=span-v";

export interface KpEigenvectorEndpoint {
  readonly id: KpEigenvectorBeatId;
  readonly index: number;
  readonly hash: `#${KpEigenvectorBeatId}`;
  readonly attentionalOwner: KpEigenvectorAttentionalOwner;
  readonly primaryObjectIds: readonly string[];
  readonly contextualObjectIds: readonly string[];
  readonly diagram: {
    readonly fanState: "source" | "mapped" | "quiet";
    readonly persistentVectorState: "source" | "mapped" | "scaled-multiple";
    readonly invariantLineVisible: boolean;
  };
  readonly equation: KpEigenvectorEquationForm;
  readonly interaction: "none" | "prediction" | "scalar";
}

const vectorId = kpEigenvectorAttentionalFixture.persistentVector.id;
const transformationId = kpEigenvectorAttentionalFixture.transformation.id;
const eigenspaceId = kpEigenvectorAttentionalFixture.invariantLine.id;
const fanId = "eigenvector-demo/vector/fan";
const relationId = "eigenvector-demo/relation/Av-lambda-v";
const eigenvalueId = "eigenvector-demo/eigenvalue/lambda-3";

const endpoints = [
  endpoint("most-vectors-turn", "passage", [fanId], [transformationId], {
    fanState: "source",
    persistentVectorState: "source",
    invariantLineVisible: false,
    equation: "none",
    interaction: "none"
  }),
  endpoint("watch-the-fan", "diagram", [fanId, transformationId], [], {
    fanState: "mapped",
    persistentVectorState: "mapped",
    invariantLineVisible: false,
    equation: "none",
    interaction: "none"
  }),
  endpoint("one-direction-survives", "diagram", [vectorId], [fanId, transformationId], {
    fanState: "quiet",
    persistentVectorState: "mapped",
    invariantLineVisible: false,
    equation: "none",
    interaction: "none"
  }),
  endpoint("geometry-becomes-equation", "equation", [vectorId, relationId], [transformationId], {
    fanState: "quiet",
    persistentVectorState: "mapped",
    invariantLineVisible: false,
    equation: "Av=3v",
    interaction: "none"
  }),
  endpoint("name-the-scale-factor", "equation", [vectorId, relationId, eigenvalueId], [transformationId], {
    fanState: "quiet",
    persistentVectorState: "mapped",
    invariantLineVisible: false,
    equation: "Av=lambda-v",
    interaction: "none"
  }),
  endpoint("predict-a-multiple", "learner", [vectorId], [relationId, transformationId], {
    fanState: "quiet",
    persistentVectorState: "source",
    invariantLineVisible: false,
    equation: "Av=lambda-v",
    interaction: "prediction"
  }),
  endpoint("verify-the-multiple", "diagram", [vectorId], [relationId, transformationId], {
    fanState: "quiet",
    persistentVectorState: "scaled-multiple",
    invariantLineVisible: false,
    equation: "A(2v)=6v",
    interaction: "none"
  }),
  endpoint("reveal-the-eigenspace", "manipulation", [eigenspaceId, vectorId], [eigenvalueId], {
    fanState: "quiet",
    persistentVectorState: "scaled-multiple",
    invariantLineVisible: true,
    equation: "E3=span-v",
    interaction: "scalar"
  }),
  endpoint("compressed-recall", "recall", [eigenspaceId, eigenvalueId], [vectorId, transformationId], {
    fanState: "quiet",
    persistentVectorState: "mapped",
    invariantLineVisible: true,
    equation: "Av=lambda-v",
    interaction: "none"
  })
] as const satisfies readonly KpEigenvectorEndpoint[];

export const kpEigenvectorEndpoints: readonly KpEigenvectorEndpoint[] = endpoints;

/** Direct projection makes deep links deterministic and never replays prior beats. */
export function projectKpEigenvectorEndpoint(
  beatId: KpEigenvectorBeatId
): KpEigenvectorEndpoint {
  const endpoint = endpoints.find(({ id }) => id === beatId);
  if (endpoint === undefined) {
    throw new Error(`Unknown eigenvector beat ${beatId}.`);
  }
  return endpoint;
}

export function parseKpEigenvectorBeatHash(
  hash: string
): KpEigenvectorBeatId | undefined {
  const candidate = hash.startsWith("#") ? hash.slice(1) : hash;
  return kpEigenvectorBeatIds.find((id) => id === candidate);
}

function endpoint(
  id: KpEigenvectorBeatId,
  attentionalOwner: KpEigenvectorAttentionalOwner,
  primaryObjectIds: readonly string[],
  contextualObjectIds: readonly string[],
  state: KpEigenvectorEndpoint["diagram"] & {
    readonly equation: KpEigenvectorEquationForm;
    readonly interaction: KpEigenvectorEndpoint["interaction"];
  }
): KpEigenvectorEndpoint {
  const index = kpEigenvectorBeatIds.indexOf(id);
  return {
    id,
    index,
    hash: `#${id}`,
    attentionalOwner,
    primaryObjectIds,
    contextualObjectIds,
    diagram: {
      fanState: state.fanState,
      persistentVectorState: state.persistentVectorState,
      invariantLineVisible: state.invariantLineVisible
    },
    equation: state.equation,
    interaction: state.interaction
  };
}
