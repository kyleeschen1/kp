import { kpEigenvectorAttentionalFixture } from "./eigenvector-math.ts";

export type KpEigenvectorPredictionChoiceId =
  | "maps-to-6v"
  | "maps-to-3v"
  | "changes-direction";

export interface KpEigenvectorPredictionChoice {
  readonly id: KpEigenvectorPredictionChoiceId;
  readonly label: string;
  readonly destination: readonly [number, number];
}

export interface KpEigenvectorPrediction {
  readonly id: "eigenvector-demo/prediction/scalar-multiple";
  readonly semanticObjectId: "eigenvector-demo/vector/v";
  readonly prompt: string;
  readonly source: readonly [number, number];
  readonly choices: readonly KpEigenvectorPredictionChoice[];
  readonly correctChoiceId: "maps-to-6v";
}

export interface KpEigenvectorPredictionResult {
  readonly choiceId: KpEigenvectorPredictionChoiceId;
  readonly correct: boolean;
  readonly feedback: string;
  readonly revealBeatId: "verify-the-multiple" | undefined;
}

const fixture = kpEigenvectorAttentionalFixture;

export const kpEigenvectorPrediction: KpEigenvectorPrediction = {
  id: "eigenvector-demo/prediction/scalar-multiple",
  semanticObjectId: "eigenvector-demo/vector/v",
  prompt: "If A sends v to 3v, where must it send 2v?",
  source: fixture.prediction.source,
  choices: [
    { id: "maps-to-6v", label: "6v", destination: fixture.prediction.image },
    { id: "maps-to-3v", label: "3v", destination: fixture.persistentVector.image },
    { id: "changes-direction", label: "a new direction", destination: [4, 2] }
  ],
  correctChoiceId: "maps-to-6v"
};

export function evaluateKpEigenvectorPrediction(
  choiceId: KpEigenvectorPredictionChoiceId
): KpEigenvectorPredictionResult {
  const correct = choiceId === kpEigenvectorPrediction.correctChoiceId;
  return {
    choiceId,
    correct,
    feedback: correct
      ? "Yes. Linearity makes A(2v) = 2Av = 6v."
      : "Keep the scalar outside: A(2v) = 2Av.",
    revealBeatId: correct ? "verify-the-multiple" : undefined
  };
}
