import {
  kpEigenvectorAttentionalFixture,
  type KpEigenvectorPoint
} from "./eigenvector-math.ts";
import {
  projectKpEigenvectorEndpoint,
  type KpEigenvectorBeatId
} from "./eigenvector-endpoints.ts";

export interface KpEigenvectorDiagramVector {
  readonly id: string;
  readonly semanticObjectId: string;
  readonly role: "context" | "persistent" | "scalar-multiple";
  readonly source: KpEigenvectorPoint;
  readonly target: KpEigenvectorPoint;
  readonly displayed: KpEigenvectorPoint;
  readonly directionChanged: boolean;
}

export interface KpEigenvectorDiagramEndpoint {
  readonly beatId: KpEigenvectorBeatId;
  readonly transformationId: string;
  readonly vectors: readonly KpEigenvectorDiagramVector[];
  readonly invariantLine: {
    readonly semanticObjectId: string;
    readonly visible: boolean;
    readonly from: KpEigenvectorPoint;
    readonly to: KpEigenvectorPoint;
  };
}

export function projectKpEigenvectorDiagramEndpoint(
  beatId: KpEigenvectorBeatId
): KpEigenvectorDiagramEndpoint {
  const endpoint = projectKpEigenvectorEndpoint(beatId);
  const fixture = kpEigenvectorAttentionalFixture;
  const vectors = endpoint.diagram.persistentVectorState === "scaled-multiple"
    ? [scalarMultipleVector(endpoint.diagram.persistentVectorState)]
    : fixture.fan.map(({ id, coordinates, image }) => {
        const persistent = id === fixture.persistentVector.id;
        const displayed = endpoint.diagram.fanState === "source"
          ? coordinates
          : image;
        return {
          id: `diagram.${id}`,
          semanticObjectId: persistent
            ? fixture.persistentVector.id
            : "eigenvector-demo/vector/fan",
          role: persistent ? "persistent" : "context",
          source: coordinates,
          target: image,
          displayed,
          directionChanged: changesDirection(coordinates, image)
        } satisfies KpEigenvectorDiagramVector;
      });

  return {
    beatId,
    transformationId: fixture.transformation.id,
    vectors,
    invariantLine: {
      semanticObjectId: fixture.invariantLine.id,
      visible: endpoint.diagram.invariantLineVisible,
      from: [-3.4, -3.4],
      to: [3.4, 3.4]
    }
  };
}

function scalarMultipleVector(
  state: "scaled-multiple"
): KpEigenvectorDiagramVector {
  const fixture = kpEigenvectorAttentionalFixture;
  return {
    id: "diagram.eigenvector-demo/vector/2v",
    semanticObjectId: fixture.persistentVector.id,
    role: "scalar-multiple",
    source: fixture.prediction.source,
    target: fixture.prediction.image,
    displayed: state === "scaled-multiple"
      ? fixture.prediction.image
      : fixture.prediction.source,
    directionChanged: false
  };
}

function changesDirection(
  source: KpEigenvectorPoint,
  target: KpEigenvectorPoint
): boolean {
  return Math.abs(source[0] * target[1] - source[1] * target[0]) > 1e-10;
}
