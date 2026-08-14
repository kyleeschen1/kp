export const kpNormalMatrixProofPromptIds = Object.freeze([
  "define-normality",
  "read-left-entry",
  "read-right-entry",
  "connect-normality-to-norms",
  "explain-sparse-column",
  "predict-row-remainder",
  "explain-zero-norm",
  "inherit-normality",
  "reconstruct-proof",
  "why-complex",
  "diagonal-only-trap"
] as const);

export type KpNormalMatrixProofPromptId =
  typeof kpNormalMatrixProofPromptIds[number];
