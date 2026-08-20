import type {
  KpNativeKatexConformanceShapeDescriptor
} from "../support/native-katex-compositor-conformance-schema.ts";

interface KpNativeKatexMatrixCellFixture {
  readonly semanticObjectId: `matrix.cell.${string}`;
  readonly row: number;
  readonly column: number;
  readonly latex: string;
  readonly shapeId: KpNativeKatexConformanceShapeDescriptor["id"];
}

interface KpNativeKatexMatrixConformanceFixture {
  readonly id: `matrix.fixture.${string}`;
  readonly kind: "native-katex-conformance-matrix-fixture";
  readonly latex: string;
  readonly shapeId: KpNativeKatexConformanceShapeDescriptor["id"];
  readonly ownershipMode: "compound-owner" | "persistent-cells";
  readonly cells: readonly KpNativeKatexMatrixCellFixture[];
}

function freezeMatrixFixture(
  fixture: KpNativeKatexMatrixConformanceFixture
): KpNativeKatexMatrixConformanceFixture {
  return Object.freeze({
    ...fixture,
    cells: Object.freeze(fixture.cells.map((cell) => Object.freeze(cell)))
  });
}

export const kpNativeKatexMatrixConformanceFixtures = Object.freeze([
  freezeMatrixFixture({
    id: "matrix.fixture.whole-2x2",
    kind: "native-katex-conformance-matrix-fixture",
    latex: "\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}",
    shapeId: "shape.matrix.whole-2x2",
    ownershipMode: "compound-owner",
    cells: []
  }),
  freezeMatrixFixture({
    id: "matrix.fixture.heterogeneous-2x2",
    kind: "native-katex-conformance-matrix-fixture",
    latex: "\\begin{pmatrix}x&\\frac{1}{2}\\\\g&y^{2}\\end{pmatrix}",
    shapeId: "shape.matrix.heterogeneous-2x2",
    ownershipMode: "persistent-cells",
    cells: [
      {
        semanticObjectId: "matrix.cell.variable-x",
        row: 0,
        column: 0,
        latex: "x",
        shapeId: "shape.italic-x"
      },
      {
        semanticObjectId: "matrix.cell.fraction-half",
        row: 0,
        column: 1,
        latex: "\\frac{1}{2}",
        shapeId: "shape.structure.fraction"
      },
      {
        semanticObjectId: "matrix.cell.descender-g",
        row: 1,
        column: 0,
        latex: "g",
        shapeId: "shape.descender-g"
      },
      {
        semanticObjectId: "matrix.cell.script-y-two",
        row: 1,
        column: 1,
        latex: "y^{2}",
        shapeId: "shape.script.superscript-two"
      }
    ]
  })
]);
