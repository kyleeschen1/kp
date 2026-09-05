import type {
  KpDerivedSemanticStateLeafHandle
} from "./authoring-state-handles.ts";
import type {
  KpSemanticStateGroupDescriptor,
  KpSemanticStateMemberMap
} from "./authoring-schema.ts";
import type {
  KpSemanticStateCompositionCohortResolution,
  KpEphemeralSemanticStateCompositionCohortSample
} from "./state-family-composition-cohort-resolver.ts";
import {
  createKpSemanticStateSampleView,
  type KpSemanticStateSampleView
} from "./derived-evaluator.ts";
import type { KpSemanticDerivedGraph } from "./derived-graph.ts";

export interface KpSemanticStateCompositionDerivedEvaluation<Result> {
  readonly schemaVersion:
    "kp.semantic-state-composition-derived-evaluation.v1";
  readonly kind: "semantic-state-composition-derived-evaluation";
  readonly source:
    KpEphemeralSemanticStateCompositionCohortSample["source"];
  readonly target: KpDerivedSemanticStateLeafHandle<Result>;
  readonly view: KpSemanticStateSampleView<Result>;
  readonly value: Result;
}

export interface KpSemanticStateCompositionDerivedEvaluator {
  readonly schemaVersion:
    "kp.semantic-state-composition-derived-evaluator.v1";
  readonly kind: "semantic-state-composition-derived-evaluator";
  readonly graph: KpSemanticDerivedGraph;
  readonly source:
    KpEphemeralSemanticStateCompositionCohortSample["source"];
  evaluate<const Result>(
    target: KpDerivedSemanticStateLeafHandle<Result>
  ): KpSemanticStateCompositionDerivedEvaluation<Result>;
}

export type KpSemanticStateCompositionDerivedEvaluatorErrorCode =
  "persistent-cohort-sample";

export class KpSemanticStateCompositionDerivedEvaluatorError extends Error {
  readonly code: KpSemanticStateCompositionDerivedEvaluatorErrorCode;

  constructor(
    code: KpSemanticStateCompositionDerivedEvaluatorErrorCode,
    message: string
  ) {
    super(message);
    this.name = "KpSemanticStateCompositionDerivedEvaluatorError";
    this.code = code;
  }
}

/**
 * Each evaluate call delegates one requested closure to the current graph's
 * existing request-local memo. The frozen view retains only that completed
 * value, so failures cannot publish partial aggregate-derived state.
 */
export function createKpSemanticStateCompositionDerivedEvaluator<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(input: {
  readonly graph: KpSemanticDerivedGraph;
  readonly resolution: KpSemanticStateCompositionCohortResolution<Root>;
}): KpSemanticStateCompositionDerivedEvaluator {
  if (input.resolution.sample.kind !== "ephemeral-interior") {
    throw new KpSemanticStateCompositionDerivedEvaluatorError(
      "persistent-cohort-sample",
      "Aggregate derived evaluation requires an interior cohort source; settled endpoints retain their existing snapshot evaluation path."
    );
  }
  const source = input.resolution.sample.source;
  return Object.freeze({
    schemaVersion:
      "kp.semantic-state-composition-derived-evaluator.v1" as const,
    kind: "semantic-state-composition-derived-evaluator" as const,
    graph: input.graph,
    source,
    evaluate<const Result>(
      target: KpDerivedSemanticStateLeafHandle<Result>
    ) {
      const view = createKpSemanticStateSampleView({
        graph: input.graph,
        source,
        target
      });
      const value = view.read();
      return Object.freeze({
        schemaVersion:
          "kp.semantic-state-composition-derived-evaluation.v1" as const,
        kind: "semantic-state-composition-derived-evaluation" as const,
        source,
        target,
        view,
        value
      });
    }
  });
}
