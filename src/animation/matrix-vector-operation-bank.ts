import type { KpAnimationAsset } from "./asset.ts";
import {
  createKpMatrixVectorCompositionChoreography
} from "./matrix-vector-composition-choreography.ts";

export interface KpMatrixVectorOperationBankContribution {
  readonly id: string;
  readonly columnIndex: number;
  readonly matrixSelectorId: string;
  readonly vectorSelectorId: string;
  readonly matrixValue: number;
  readonly vectorValue: number;
  readonly product: number;
}

export interface KpMatrixVectorOperationBankRow {
  readonly id: string;
  readonly semanticIndex: number;
  readonly intermediateObjectId: string;
  readonly resultSelectorId: string;
  readonly rowLatex: string;
  readonly contributions: readonly KpMatrixVectorOperationBankContribution[];
  readonly result: number;
  readonly fold: {
    readonly topology: "products-gather-collapse";
    readonly phases: readonly ["products", "gather", "coordinate"];
  };
}

export interface KpMatrixVectorOperationBankContract {
  readonly id: string;
  readonly kind: "matrix-vector-operation-bank";
  readonly transformationId: string;
  readonly inputPolicy: {
    readonly persistence: "persistent-reference";
    readonly depletion: false;
    readonly metaphor: "information-flow-not-fluid";
  };
  readonly traversalPolicy: "row-ranked";
  readonly columnMeaning: "contribution-index";
  readonly outputMeaning: "row-coordinate";
  readonly rows: readonly KpMatrixVectorOperationBankRow[];
}

/**
 * Derives a presentation contract from authored row intermediates. Renderers
 * may arrange this bank, but cannot invent products, totals, or input motion.
 */
export function createKpMatrixVectorOperationBankContract(
  animation: KpAnimationAsset
): KpMatrixVectorOperationBankContract {
  const choreography = createKpMatrixVectorCompositionChoreography(animation);
  return {
    id: `operation-bank.${choreography.transformationId}`,
    kind: "matrix-vector-operation-bank",
    transformationId: choreography.transformationId,
    inputPolicy: {
      persistence: "persistent-reference",
      depletion: false,
      metaphor: "information-flow-not-fluid"
    },
    traversalPolicy: "row-ranked",
    columnMeaning: "contribution-index",
    outputMeaning: "row-coordinate",
    rows: choreography.rows.map((row) => ({
      id: `${choreography.transformationId}.operation-bank.row.${row.semanticIndex}`,
      semanticIndex: row.semanticIndex,
      intermediateObjectId: row.intermediateObjectId,
      resultSelectorId: row.resultSelectorId,
      rowLatex: row.rowLatex,
      contributions: row.rowValues.map((matrixValue, columnIndex) => {
        const vectorValue = row.vectorValues[columnIndex];
        const matrixSelectorId = row.matrixSelectorIds[columnIndex];
        const vectorSelectorId = row.vectorSelectorIds[columnIndex];
        if (
          vectorValue === undefined ||
          matrixSelectorId === undefined ||
          vectorSelectorId === undefined
        ) {
          throw new Error(
            `Matrix-vector row ${row.semanticIndex} contribution ${columnIndex} is incomplete.`
          );
        }
        return {
          id: `${choreography.transformationId}.operation-bank.row.${row.semanticIndex}.contribution.${columnIndex}`,
          columnIndex,
          matrixSelectorId,
          vectorSelectorId,
          matrixValue,
          vectorValue,
          product: matrixValue * vectorValue
        };
      }),
      result: row.result,
      fold: {
        topology: "products-gather-collapse",
        phases: ["products", "gather", "coordinate"]
      }
    }))
  };
}
