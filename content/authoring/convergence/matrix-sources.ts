import type { ColumnExample, ColumnReading } from "../../../src/experiments/matrix-column-combinations/model.ts";
import { MatrixColumnGap } from "../../../src/experiments/matrix-column-product/environment.ts";

interface MatrixSource {
  readonly id: string;
  readonly product: ColumnExample["env"]["product"];
  readonly reading?: ColumnReading;
}

/** Discovery contains labels and loaders only. Opening a menu must not construct
 * every example or fetch its explanation. Module loading supplies cache reuse. */
export const matrixSources: readonly {
  readonly id: string;
  readonly title: string;
  readonly load: () => Promise<MatrixSource>;
}[] = Object.freeze([
  ...["signed", "zero", "larger"].map(id => ({ id, title: id, load: async () => {
    const { matrixInputs } = await import("./matrices.ts");
    const source = matrixInputs.find(input => input.id === id);
    if (!source) throw new MatrixColumnGap(`Missing registered matrix input: ${id}.`);
    return source;
  } })),
  { id: "projection-loss", title: "Two different inputs, one output",
    load: async () => (await import("../linear-algebra/projection-loss.ts")).projectionLoss },
  { id: "dependent-columns", title: "Information can disappear without a zero column",
    load: async () => (await import("../linear-algebra/dependent-columns.ts")).dependentColumns }
]);

export async function loadMatrixSource(id: string): Promise<MatrixSource> {
  const descriptor = matrixSources.find(source => source.id === id);
  if (!descriptor) throw new MatrixColumnGap(`Choose a matrix input: ${matrixSources.map(source => source.id).join(", ")}.`);
  const source = await descriptor.load();
  if (source.id !== descriptor.id || (source.reading && source.reading.title !== descriptor.title)) {
    throw new MatrixColumnGap(`Matrix source identity or title differs from its registration: ${id}.`);
  }
  return source;
}
