import type { KpLispLambdaApplicationRuntimeFrame } from "../../animation/lisp-lambda-application-runtime-frame.ts";
import type { KpLispBotanicalPresentationPlan } from "../../animation/lisp-botanical-presentation-plan.ts";
import type { KpLispLessonMotionBlockId } from "./lisp-function-application-motion-blocks.ts";

export type KpLispLessonSalienceState = "target" | "context" | "attenuated";

export interface KpLispLessonSalienceProjection {
  readonly activePassageId: string;
  readonly contextPassageIds: readonly string[];
  readonly targetNodeIds: readonly string[];
  readonly contextNodeIds: readonly string[];
  readonly targetMaterialIds: readonly string[];
  readonly attenuation: number;
}

export function projectKpLispLessonSalience(input: {
  readonly frame: KpLispLambdaApplicationRuntimeFrame;
  readonly plan: KpLispBotanicalPresentationPlan;
  readonly activeBlockId: KpLispLessonMotionBlockId;
}): KpLispLessonSalienceProjection {
  const targetNodeIds = input.plan.nodes
    .filter(({ selectorId }) => input.frame.activeSelectorIds.includes(selectorId))
    .map(({ id }) => id);
  if (targetNodeIds.length === 0) {
    throw new Error(`Lisp salience has no target for stage ${input.frame.stage}.`);
  }

  const [activePassageId, contextPassageId] = passages(input);
  const projection = {
    activePassageId,
    contextPassageIds: Object.freeze([contextPassageId]),
    targetNodeIds: Object.freeze(targetNodeIds),
    contextNodeIds: Object.freeze(contextNodes(input.frame.stage)),
    targetMaterialIds: Object.freeze(targetMaterials(input.frame.stage)),
    attenuation: 0.58
  } as const;
  validateProjection(input.plan, projection);
  return Object.freeze(projection);
}

export function resolveKpLispSalienceState(input: {
  readonly id: string;
  readonly targets: readonly string[];
  readonly context: readonly string[];
}): KpLispLessonSalienceState {
  if (input.targets.includes(input.id)) return "target";
  if (input.context.includes(input.id)) return "context";
  return "attenuated";
}

function passages(input: {
  readonly frame: KpLispLambdaApplicationRuntimeFrame;
  readonly activeBlockId: KpLispLessonMotionBlockId;
}): readonly [string, string] {
  if (input.activeBlockId === "bind-and-reconstruct") {
    return input.frame.progress >= 0.74
      ? ["binding-after", "binding-before"]
      : ["binding-before", "binding-after"];
  }
  return input.frame.stage === "settle"
    ? ["evaluation-after", "evaluation-before"]
    : ["evaluation-before", "evaluation-after"];
}

function contextNodes(
  stage: KpLispLambdaApplicationRuntimeFrame["stage"]
): readonly string[] {
  switch (stage) {
    case "read": return ["botanical.lambda", "botanical.argument"];
    case "bind": return ["botanical.reference"];
    case "substitute": return ["botanical.reference", "botanical.lambda"];
    case "evaluate":
    case "settle": return ["botanical.reconstructed"];
  }
}

function targetMaterials(
  stage: KpLispLambdaApplicationRuntimeFrame["stage"]
): readonly string[] {
  switch (stage) {
    case "read": return ["material.lambda-shell"];
    case "bind": return ["material.argument"];
    case "substitute": return [
      "material.plus",
      "material.argument",
      "material.literal",
      "material.lambda-shell"
    ];
    case "evaluate":
    case "settle": return ["material.result"];
  }
}

function validateProjection(
  plan: KpLispBotanicalPresentationPlan,
  projection: KpLispLessonSalienceProjection
): void {
  const nodeIds = new Set(plan.nodes.map(({ id }) => id));
  for (const id of [...projection.targetNodeIds, ...projection.contextNodeIds]) {
    if (!nodeIds.has(id)) throw new Error(`Lisp salience names unknown node ${id}.`);
  }
  const materialIds = new Set(plan.paths.flatMap(({ materialIds: ids }) => ids));
  for (const id of projection.targetMaterialIds) {
    if (!materialIds.has(id)) throw new Error(`Lisp salience names unknown material ${id}.`);
  }
}
