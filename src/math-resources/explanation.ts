import { matrixProduct } from '../math/matrix-product.ts';
import type { KpTypedMatrix } from '../math/typed-semantic-math.ts';
import { invalidResourceFields, MathResourceGap, type MatrixVectorDocument } from './model.ts';

export interface MatrixResourceExplanation {
  readonly product: ReturnType<typeof matrixProduct>;
  readonly sourceResult: KpTypedMatrix<2, 1>;
  readonly sourceRevision: string;
  /** The explanation owner's result is a distinct representation of the
   * existing resource result. Equal text alone never establishes identity. */
  readonly resultCorrespondence: Readonly<{
    sourceResultId: string;
    explanationResultId: string;
    recipe: 'matrix2.vector2@1';
    entries: readonly Readonly<{ row: number; column: 0; sourceEntryId: string; explanationEntryId: string }>[];
  }>;
}

/** One retained product per evaluator, shared by every occurrence. Source
 * revisions can change without numerical changes, so cache the structural
 * product by operand identity and its revision-bearing wrapper separately. */
export function createMatrixResourceExplanationOwner() {
  let product: ReturnType<typeof matrixProduct> | undefined;
  let explanation: MatrixResourceExplanation | undefined;
  let disposed = false, builds = 0;
  return {
    read(document: MatrixVectorDocument, matrix: KpTypedMatrix<2, 2>, vector: KpTypedMatrix<2, 1>, sourceResult: KpTypedMatrix<2, 1>): MatrixResourceExplanation {
      if (disposed) throw new MathResourceGap('owner-closed', document.id, 'This explanation owner is disposed.');
      const invalid = invalidResourceFields(document);
      if (invalid.length) throw new MathResourceGap('invalid-explanation-draft', invalid[0]!,
        'Complete valid source values before explaining the column combination. The prior explanation is unchanged.');
      if (matrix.id !== document.matrix.id || vector.id !== document.vector.id || sourceResult.id !== document.result.id)
        throw new MathResourceGap('explanation-source-mismatch', document.result.id, 'The explanation must use this resource’s admitted operands and result.');
      if (!product || product.left !== matrix || product.right !== vector) {
        product = matrixProduct({ id: `${document.result.id}.columns`, left: matrix, right: vector }); builds++;
      }
      // Include values as well as persisted revision counters: after undo,
      // distinct subsequent edits may legitimately reuse the same counter.
      const sourceRevision = JSON.stringify([document.id, document.result.id, document.result.recipe,
        document.matrix.id, document.matrix.revision, document.matrix.entries,
        document.vector.id, document.vector.revision, document.vector.entries]);
      if (explanation?.product === product && explanation.sourceResult === sourceResult && explanation.sourceRevision === sourceRevision) return explanation;
      explanation = Object.freeze({ product, sourceResult, sourceRevision,
        resultCorrespondence: Object.freeze({ sourceResultId: sourceResult.id, explanationResultId: product.result.id,
          recipe: document.result.recipe, entries: Object.freeze(sourceResult.rows.map((row, index) => Object.freeze({
            row: index, column: 0 as const, sourceEntryId: row[0]!.id, explanationEntryId: product!.cell(index, 0).result.id
          }))) }) });
      return explanation;
    },
    inspect: () => ({ builds, retainedProducts: product ? 1 : 0, disposed }),
    dispose() { disposed = true; product = undefined; explanation = undefined; }
  };
}
