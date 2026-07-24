import type {
  KpCancellationPresentationIntent
} from "../semantic/cancellation-presentation-intent.ts";

export type KpEquationCancellationPresentationRecipe =
  | "native-handoff-v1"
  | "witnessed-annihilation-v1"
  | "counter-orbit-v1";

export interface KpCancellationMeasuredTopology {
  readonly sourceCount: number;
  readonly sourceBaselines: "shared" | "distinct";
}

export interface KpCancellationPresentationResolutionInput {
  readonly intent: KpCancellationPresentationIntent;
  readonly topology: KpCancellationMeasuredTopology;
}

export type KpCancellationPresentationResolution =
  | {
      readonly kind: "resolved";
      readonly recipe: KpEquationCancellationPresentationRecipe;
    }
  | {
      readonly kind: "repair-source-topology";
      readonly issue: "incomplete-cancellation-source-set";
      readonly minimumSourceCount: 2;
    }
  | {
      readonly kind: "repair-intent";
      readonly issue: "distinct-baselines-require-two-axis-contact";
      readonly repairedIntent: KpCancellationPresentationIntent;
    }
  | {
      readonly kind: "manual-review";
      readonly issue: "no-supported-cancellation-recipe";
    };

export type KpCancellationPresentationResolver = (
  input: KpCancellationPresentationResolutionInput
) => KpCancellationPresentationResolution;
