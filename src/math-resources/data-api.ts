// Data admission is needed before a notebook selects a family. Keep its
// imports independent of the optional evaluator and semantic-state runtime.
export { createMatrixVectorDocument, readMatrixVectorDocument, editMatrixVectorDocument,
  editOccurrenceExtent, invalidResourceFields, parseResourceNumber, MathResourceGap, matrixFields, vectorFields,
  type MatrixResource, type VectorResource, type ProductResource, type MatrixVectorDocument,
  type MathOccurrence, type MatrixField, type VectorField, type ResourceEdit, type Vector2 } from './model.ts';
