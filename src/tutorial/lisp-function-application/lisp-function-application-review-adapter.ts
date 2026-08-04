import {
  compileKpLispDwellTimeline,
  defineKpLispInternalTuning,
  KP_LISP_AUTHORED_DWELL_BEATS,
  sampleKpLispDwellTimeline,
  type KpLispInternalTuningProjection
} from "../../animation/lisp-s-expression-timing.ts";
import { writeKpTutorialReviewEvidence } from
  "../../dev-review/tutorial-review-evidence.ts";
import type { KpLispLambdaApplicationAsset } from
  "../../semantic/lisp-lambda-application-asset.ts";
import type { KpLispLessonMotionBlockId } from
  "./lisp-function-application-motion-blocks.ts";

export const kpLispLessonReviewThemeId =
  "theme.kp.lesson.lisp-paper-v1" as const;

export interface KpLispLessonReviewProjection {
  readonly checkpointId: string;
  readonly checkpointClass:
    | "major-transition"
    | "major-hold"
    | "minor-transition"
    | "minor-hold";
  readonly expression: {
    readonly expressionId: string;
    readonly operation: string;
    readonly syntaxPath: readonly string[];
    readonly depth: number;
    readonly sourceIdentityIds: readonly string[];
    readonly destinationIdentityIds: readonly string[];
  };
  readonly themeId: typeof kpLispLessonReviewThemeId;
  readonly tuning: Readonly<Record<string, string>>;
}

export interface KpLispLessonReviewAdapter {
  readonly project: (input: {
    readonly activeBlockId: KpLispLessonMotionBlockId;
    readonly localProgress: number;
  }) => KpLispLessonReviewProjection;
}

export function createKpLispLessonReviewAdapter(input: {
  readonly root: HTMLElement;
  readonly source: KpLispLambdaApplicationAsset;
  readonly tuning?: KpLispInternalTuningProjection | undefined;
}): KpLispLessonReviewAdapter {
  const tuning = input.tuning ?? defineKpLispInternalTuning();
  const timelines = new Map<KpLispLessonMotionBlockId, ReturnType<
    typeof compileKpLispDwellTimeline
  >>(["structure", "application", "evaluation"].map((blockId) => [
    blockId as KpLispLessonMotionBlockId,
    compileKpLispDwellTimeline(
      KP_LISP_AUTHORED_DWELL_BEATS.filter(({ block }) => block === blockId),
      tuning
    )
  ]));

  return Object.freeze({
    project: (projectInput: {
      readonly activeBlockId: KpLispLessonMotionBlockId;
      readonly localProgress: number;
    }) => {
      const { activeBlockId, localProgress } = projectInput;
      const timeline = timelines.get(activeBlockId)!;
      const sample = sampleKpLispDwellTimeline(timeline, localProgress);
      const checkpoint = timeline.checkpoints.find(({ id }) =>
        id === sample.checkpointId
      )!;
      const projection = Object.freeze({
        checkpointId: sample.checkpointId,
        checkpointClass:
          `${checkpoint.dwellKind}-${sample.phase === "dwell" ? "hold" : "transition"}`,
        expression: expressionEvidence(input.source, sample.checkpointId),
        themeId: kpLispLessonReviewThemeId,
        tuning: Object.freeze(Object.fromEntries(
          Object.entries(tuning.values).map(([key, value]) => [key, String(value)])
        ))
      }) as KpLispLessonReviewProjection;
      writeKpTutorialReviewEvidence(input.root, {
        expression: projection.expression,
        checkpointClass: projection.checkpointClass,
        themeId: projection.themeId,
        tuning: projection.tuning
      });
      return projection;
    }
  });
}

function expressionEvidence(
  source: KpLispLambdaApplicationAsset,
  checkpointId: string
): KpLispLessonReviewProjection["expression"] {
  const evaluation = source.fixture.evaluation;
  const semantic = source.fixture.semantic;
  const application = semantic.root.id;
  const argument = semantic.environments[0]!.entries[0]!.valueExpressionId;
  const binding = semantic.bindings[0]!;
  const destination = semantic.destinations[0]!;
  const path = (...ids: string[]) => Object.freeze(ids);
  const evidence = (
    expressionId: string,
    operation: string,
    syntaxPath: readonly string[],
    sourceIdentityIds: readonly string[],
    destinationIdentityIds: readonly string[]
  ): KpLispLessonReviewProjection["expression"] => Object.freeze({
    expressionId,
    operation,
    syntaxPath,
    depth: Math.max(0, syntaxPath.length - 1),
    sourceIdentityIds: Object.freeze([...sourceIdentityIds]),
    destinationIdentityIds: Object.freeze([...destinationIdentityIds])
  });

  switch (checkpointId) {
    case "source-readable":
      return evidence(application, "activate", path(application),
        [application], [application]);
    case "leaf-forms-folded":
      return evidence("expr.body", "fold",
        path(application, "expr.lambda", "expr.body"),
        ["occurrence.plus", binding.referenceOccurrenceIds[0]!, "occurrence.body.one"],
        ["expr.body"]);
    case "lambda-form-folded":
      return evidence("expr.lambda", "fold",
        path(application, "expr.lambda"),
        ["expr.parameters", "expr.body"], ["expr.lambda"]);
    case "application-folded":
      return evidence(application, "fold", path(application),
        ["expr.lambda", argument], [application]);
    case "source-restored":
      return evidence(application, "unfold", path(application),
        [application], ["expr.lambda", argument]);
    case "binding-ready":
    case "parameter-bound":
      return evidence("expr.parameters", "bind",
        path(application, "expr.lambda", "expr.parameters"),
        [evaluation.bindingId, argument], [binding.binderOccurrenceId]);
    case "body-propagated":
      return evidence(destination.parentExpressionId, "propagate",
        path(application, "expr.lambda", destination.parentExpressionId,
          destination.referenceOccurrenceId),
        [evaluation.bindingId, argument],
        [evaluation.destinationId, destination.referenceOccurrenceId]);
    case "body-reconstructed":
      return evidence(evaluation.reconstructed.id, "reconstruct",
        path(application, "expr.lambda", destination.parentExpressionId),
        [destination.parentExpressionId, argument],
        [evaluation.reconstructed.id, ...evaluation.reconstructed.occurrenceIds]);
    case "reduction-ready":
    case "inputs-gathered":
      return evidence(evaluation.reconstructed.id, "reduce",
        path(evaluation.reconstructed.id),
        [...evaluation.reconstructed.occurrenceIds],
        [evaluation.result.id]);
    case "result-settled":
      return evidence(evaluation.result.id, "reduce",
        path(evaluation.result.id),
        [...evaluation.result.derivedFromExpressionIds],
        [evaluation.result.id]);
    default:
      throw new Error(`Unsupported Lisp review checkpoint ${checkpointId}.`);
  }
}
