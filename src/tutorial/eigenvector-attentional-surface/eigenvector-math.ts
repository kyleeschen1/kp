export type KpEigenvectorPoint = readonly [number, number];
export type KpEigenvectorMatrix = readonly [
  readonly [number, number],
  readonly [number, number]
];

export interface KpEigenvectorAttentionalFixture {
  readonly transformation: {
    readonly id: "eigenvector-demo/transformation/A";
    readonly label: "A";
    readonly matrix: KpEigenvectorMatrix;
  };
  readonly persistentVector: {
    readonly id: "eigenvector-demo/vector/v";
    readonly label: "v";
    readonly coordinates: KpEigenvectorPoint;
    readonly image: KpEigenvectorPoint;
    readonly eigenvalue: 3;
  };
  readonly fan: readonly {
    readonly id: string;
    readonly coordinates: KpEigenvectorPoint;
    readonly image: KpEigenvectorPoint;
  }[];
  readonly invariantLine: {
    readonly id: "eigenvector-demo/eigenspace/lambda-3";
    readonly generatorId: "eigenvector-demo/vector/v";
    readonly eigenvalue: 3;
  };
  readonly prediction: {
    readonly scalar: 2;
    readonly source: KpEigenvectorPoint;
    readonly image: KpEigenvectorPoint;
  };
}

const transformation: KpEigenvectorMatrix = [[2, 1], [1, 2]];
const persistentVector: KpEigenvectorPoint = [1, 1];

const fanSources = [
  [-1.25, 0.35],
  [-0.7, 1.05],
  [0.3, 1.15],
  persistentVector,
  [1.2, 0.35],
  [1.05, -0.6],
  [0.35, -1.05]
] as const satisfies readonly KpEigenvectorPoint[];

export const kpEigenvectorAttentionalFixture: KpEigenvectorAttentionalFixture = {
  transformation: {
    id: "eigenvector-demo/transformation/A",
    label: "A",
    matrix: transformation
  },
  persistentVector: {
    id: "eigenvector-demo/vector/v",
    label: "v",
    coordinates: persistentVector,
    image: applyKpEigenvectorMatrix(transformation, persistentVector),
    eigenvalue: 3
  },
  fan: fanSources.map((coordinates, index) => ({
    id: index === 3
      ? "eigenvector-demo/vector/v"
      : `eigenvector-demo/vector/fan-${index + 1}`,
    coordinates,
    image: applyKpEigenvectorMatrix(transformation, coordinates)
  })),
  invariantLine: {
    id: "eigenvector-demo/eigenspace/lambda-3",
    generatorId: "eigenvector-demo/vector/v",
    eigenvalue: 3
  },
  prediction: {
    scalar: 2,
    source: scaleKpEigenvectorPoint(persistentVector, 2),
    image: scaleKpEigenvectorPoint(
      applyKpEigenvectorMatrix(transformation, persistentVector),
      2
    )
  }
};

export function applyKpEigenvectorMatrix(
  matrix: KpEigenvectorMatrix,
  point: KpEigenvectorPoint
): KpEigenvectorPoint {
  return [
    matrix[0][0] * point[0] + matrix[0][1] * point[1],
    matrix[1][0] * point[0] + matrix[1][1] * point[1]
  ];
}

export function scaleKpEigenvectorPoint(
  point: KpEigenvectorPoint,
  scalar: number
): KpEigenvectorPoint {
  return [point[0] * scalar, point[1] * scalar];
}

export function isKpEigenvectorFor(
  matrix: KpEigenvectorMatrix,
  point: KpEigenvectorPoint,
  eigenvalue: number
): boolean {
  if (point[0] === 0 && point[1] === 0) {
    return false;
  }
  return pointsEqual(
    applyKpEigenvectorMatrix(matrix, point),
    scaleKpEigenvectorPoint(point, eigenvalue)
  );
}

export function isInKpLambdaThreeEigenspace(
  point: KpEigenvectorPoint
): boolean {
  return point[0] === point[1];
}

function pointsEqual(
  left: KpEigenvectorPoint,
  right: KpEigenvectorPoint
): boolean {
  return left.every((coordinate, index) =>
    Math.abs(coordinate - right[index]!) < Number.EPSILON * 16
  );
}
