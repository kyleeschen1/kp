import type { KpSemanticScene } from "../semantic/semantic-scene-protocol.ts";

interface KpSalienceIntentBase {
  readonly id: string;
  readonly summary: string;
}

export type KpAnimationSalienceIntent =
  | (KpSalienceIntentBase & {
      readonly kind: "notice";
      readonly targetEntityIds: readonly string[];
    })
  | (KpSalienceIntentBase & {
      readonly kind: "compare";
      readonly leftEntityIds: readonly string[];
      readonly rightEntityIds: readonly string[];
    })
  | (KpSalienceIntentBase & {
      readonly kind: "transmit";
      readonly sourceEntityIds: readonly string[];
      readonly targetEntityIds: readonly string[];
    })
  | (KpSalienceIntentBase & {
      readonly kind: "predict" | "question";
      readonly targetEntityIds: readonly string[];
      readonly prompt: string;
    })
  | (KpSalienceIntentBase & {
      readonly kind: "reveal";
      readonly targetEntityIds: readonly string[];
      readonly disclosureId: string;
    })
  | (KpSalienceIntentBase & {
      readonly kind: "supporting-context";
      readonly contextEntityIds: readonly string[];
      readonly supportsIntentIds: readonly string[];
    });

export interface KpAnimationSaliencePlan {
  readonly id: string;
  readonly kind: "animation-salience-plan";
  readonly intents: readonly KpAnimationSalienceIntent[];
}

export interface KpAnimationSaliencePlanIssue {
  readonly path: string;
  readonly message: string;
}

export function createKpAnimationSaliencePlan(input: {
  readonly id: string;
  readonly intents: readonly KpAnimationSalienceIntent[];
  readonly scenes: readonly KpSemanticScene[];
}): KpAnimationSaliencePlan {
  const plan: KpAnimationSaliencePlan = {
    id: input.id,
    kind: "animation-salience-plan",
    intents: input.intents.map(cloneIntent)
  };
  const issues = validateKpAnimationSaliencePlan(plan, input.scenes);
  if (issues.length > 0) throw new Error(`${issues[0]!.path}: ${issues[0]!.message}`);
  return plan;
}

export function validateKpAnimationSaliencePlan(
  plan: KpAnimationSaliencePlan,
  scenes: readonly KpSemanticScene[]
): readonly KpAnimationSaliencePlanIssue[] {
  const issues: KpAnimationSaliencePlanIssue[] = [];
  const entityIds = new Set(scenes.flatMap((scene) =>
    scene.registry.entities.map((entity) => entity.id)
  ));
  const intentIds = new Set<string>();
  plan.intents.forEach((intent, index) => {
    const path = `intents[${index}]`;
    if (intentIds.has(intent.id)) {
      issues.push({ path: `${path}.id`, message: `Duplicate salience intent ${intent.id}.` });
    }
    intentIds.add(intent.id);
    requireText(intent.id, `${path}.id`, issues);
    requireText(intent.summary, `${path}.summary`, issues);
    entityRefs(intent).forEach((entityId) => {
      if (!entityIds.has(entityId)) {
        issues.push({ path, message: `Salience intent ${intent.id} references missing entity ${entityId}.` });
      }
    });
    validateIntentShape(intent, path, issues);
  });
  plan.intents.forEach((intent, index) => {
    if (intent.kind !== "supporting-context") return;
    intent.supportsIntentIds.forEach((intentId) => {
      if (!intentIds.has(intentId) || intentId === intent.id) {
        issues.push({
          path: `intents[${index}].supportsIntentIds`,
          message: `Supporting context ${intent.id} references invalid intent ${intentId}.`
        });
      }
    });
  });
  rejectLowLevelInstructions(plan, issues);
  return issues;
}

function validateIntentShape(
  intent: KpAnimationSalienceIntent,
  path: string,
  issues: KpAnimationSaliencePlanIssue[]
): void {
  switch (intent.kind) {
    case "notice":
      requireIds(intent.targetEntityIds, `${path}.targetEntityIds`, issues);
      return;
    case "compare":
      requireIds(intent.leftEntityIds, `${path}.leftEntityIds`, issues);
      requireIds(intent.rightEntityIds, `${path}.rightEntityIds`, issues);
      return;
    case "transmit":
      requireIds(intent.sourceEntityIds, `${path}.sourceEntityIds`, issues);
      requireIds(intent.targetEntityIds, `${path}.targetEntityIds`, issues);
      return;
    case "predict":
    case "question":
      requireIds(intent.targetEntityIds, `${path}.targetEntityIds`, issues);
      requireText(intent.prompt, `${path}.prompt`, issues);
      return;
    case "reveal":
      requireIds(intent.targetEntityIds, `${path}.targetEntityIds`, issues);
      requireText(intent.disclosureId, `${path}.disclosureId`, issues);
      return;
    case "supporting-context":
      requireIds(intent.contextEntityIds, `${path}.contextEntityIds`, issues);
      requireIds(intent.supportsIntentIds, `${path}.supportsIntentIds`, issues);
      return;
  }
}

function entityRefs(intent: KpAnimationSalienceIntent): readonly string[] {
  switch (intent.kind) {
    case "notice":
    case "predict":
    case "question":
    case "reveal":
      return intent.targetEntityIds;
    case "compare":
      return [...intent.leftEntityIds, ...intent.rightEntityIds];
    case "transmit":
      return [...intent.sourceEntityIds, ...intent.targetEntityIds];
    case "supporting-context":
      return intent.contextEntityIds;
  }
}

function cloneIntent(intent: KpAnimationSalienceIntent): KpAnimationSalienceIntent {
  switch (intent.kind) {
    case "notice":
    case "predict":
    case "question":
    case "reveal":
      return { ...intent, targetEntityIds: [...intent.targetEntityIds] };
    case "compare":
      return { ...intent, leftEntityIds: [...intent.leftEntityIds], rightEntityIds: [...intent.rightEntityIds] };
    case "transmit":
      return { ...intent, sourceEntityIds: [...intent.sourceEntityIds], targetEntityIds: [...intent.targetEntityIds] };
    case "supporting-context":
      return { ...intent, contextEntityIds: [...intent.contextEntityIds], supportsIntentIds: [...intent.supportsIntentIds] };
  }
}

function rejectLowLevelInstructions(
  value: unknown,
  issues: KpAnimationSaliencePlanIssue[],
  path = "$"
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectLowLevelInstructions(item, issues, `${path}[${index}]`));
    return;
  }
  if (typeof value !== "object" || value === null) return;
  Object.entries(value).forEach(([key, child]) => {
    if (/^(timing|durationMs|delayMs|startMs|endMs|x|y|coordinates?|path|keyframes?|trajectory|svg|dom)$/i.test(key)) {
      issues.push({ path: `${path}.${key}`, message: `Low-level salience instruction ${key} is not allowed.` });
    }
    rejectLowLevelInstructions(child, issues, `${path}.${key}`);
  });
}

function requireIds(
  ids: readonly string[],
  path: string,
  issues: KpAnimationSaliencePlanIssue[]
): void {
  if (ids.length === 0) issues.push({ path, message: `${path} must not be empty.` });
  ids.forEach((id, index) => requireText(id, `${path}[${index}]`, issues));
}

function requireText(
  value: string,
  path: string,
  issues: KpAnimationSaliencePlanIssue[]
): void {
  if (value.trim().length === 0) issues.push({ path, message: `${path} must not be empty.` });
}
