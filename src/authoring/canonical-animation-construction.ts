import type { KpCanonicalOperationPackPin } from "../semantic/canonical-operation-pack.ts";
import {
  validateCorrespondenceMap,
  type SelectorCorrespondenceRelationId
} from "../semantic/correspondence.ts";
import {
  findKpForbiddenPresentationAuthority
} from "./presentation-authority-firewall.ts";

export const kpCanonicalAnimationConstructionSchemaVersion =
  "kp.canonical-animation-construction.v1" as const;

export interface KpCanonicalConstructionObjectRef {
  readonly objectId: string;
  readonly entityIds: readonly string[];
  readonly expressionIds: readonly string[];
}

export interface KpCanonicalConstructionLineageRef {
  readonly id: string;
  readonly relation: SelectorCorrespondenceRelationId;
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
}

export interface KpCanonicalConstructionOperationRef {
  readonly stepId: string;
  readonly transformationId: string;
  readonly definitionId: string;
  readonly sourceObjectIds: readonly string[];
  readonly targetObjectIds: readonly string[];
  readonly roleBindings: Readonly<Record<string, readonly string[]>>;
  readonly lineage: readonly KpCanonicalConstructionLineageRef[];
}

export interface KpCanonicalConstructionExplanationIntent {
  readonly id: string;
  readonly kind: "notice" | "compare" | "transmit" | "cause";
  readonly operationStepIds: readonly string[];
  readonly entityIds: readonly string[];
  readonly detail: "summary" | "key-steps" | "complete";
}

export interface KpCanonicalConstructionComposition {
  readonly id: string;
  readonly kind: "sequence" | "parallel" | "compound";
  readonly operationStepIds: readonly string[];
}

export interface KpCanonicalConstructionCheckpoint {
  readonly id: string;
  readonly kind: "source" | "operation" | "target" | "verification";
  readonly afterOperationStepIds: readonly string[];
  readonly objectIds: readonly string[];
  readonly focusEntityIds: readonly string[];
}

/**
 * This is the shared human/model construction seam, so it carries only
 * verified semantic references and pedagogical intent. Presentation and
 * renderer state are deliberately compiled later by their existing owners.
 */
export interface KpCanonicalAnimationConstructionInput {
  readonly id: string;
  readonly title: string;
  readonly semanticSource: {
    readonly sourceId: string;
    readonly revisionId: string;
    readonly operationPacks: readonly KpCanonicalOperationPackPin[];
  };
  readonly objects: readonly KpCanonicalConstructionObjectRef[];
  readonly operations: readonly KpCanonicalConstructionOperationRef[];
  readonly explanationIntents: readonly KpCanonicalConstructionExplanationIntent[];
  readonly composition: KpCanonicalConstructionComposition;
  readonly checkpoints: readonly KpCanonicalConstructionCheckpoint[];
}

export interface KpCanonicalAnimationConstructionArtifact
  extends KpCanonicalAnimationConstructionInput {
  readonly kind: "canonical-animation-construction";
  readonly schemaVersion: typeof kpCanonicalAnimationConstructionSchemaVersion;
}

export interface KpCanonicalAnimationConstructionIssue {
  readonly path: string;
  readonly code:
    | "construction.required"
    | "construction.duplicate"
    | "construction.reference"
    | "construction.totality"
    | "construction.unsafe-authority";
  readonly message: string;
}

export function validateKpCanonicalAnimationConstruction(
  input: KpCanonicalAnimationConstructionInput
): readonly KpCanonicalAnimationConstructionIssue[] {
  const issues: KpCanonicalAnimationConstructionIssue[] = [];
  findKpForbiddenPresentationAuthority(input).forEach((firewallIssue) => {
    issues.push(issue(
      "construction.unsafe-authority",
      firewallIssue.path,
      firewallIssue.message
    ));
  });
  requireText(input.id, "$.id", issues);
  requireText(input.title, "$.title", issues);
  requireText(input.semanticSource.sourceId, "$.semanticSource.sourceId", issues);
  requireText(
    input.semanticSource.revisionId,
    "$.semanticSource.revisionId",
    issues
  );
  if (input.semanticSource.operationPacks.length === 0) {
    issues.push(issue(
      "construction.required",
      "$.semanticSource.operationPacks",
      "At least one exact operation-pack pin is required."
    ));
  }
  unique(
    input.semanticSource.operationPacks.map(({ packId }) => packId),
    "$.semanticSource.operationPacks",
    issues
  );
  input.semanticSource.operationPacks.forEach((pin, index) => {
    requireText(
      pin.packId,
      `$.semanticSource.operationPacks[${index}].packId`,
      issues
    );
    requireText(
      pin.version,
      `$.semanticSource.operationPacks[${index}].version`,
      issues
    );
  });

  if (input.objects.length === 0) {
    issues.push(issue(
      "construction.required",
      "$.objects",
      "At least one verified semantic object reference is required."
    ));
  }
  if (input.operations.length === 0) {
    issues.push(issue(
      "construction.required",
      "$.operations",
      "At least one registered operation reference is required."
    ));
  }
  if (input.explanationIntents.length === 0) {
    issues.push(issue(
      "construction.required",
      "$.explanationIntents",
      "At least one pedagogical explanation intent is required."
    ));
  }
  unique(input.objects.map(({ objectId }) => objectId), "$.objects", issues);
  unique(
    input.objects.flatMap(({ entityIds }) => entityIds),
    "$.objects.entityIds",
    issues
  );
  unique(
    input.objects.flatMap(({ expressionIds }) => expressionIds),
    "$.objects.expressionIds",
    issues
  );
  unique(input.operations.map(({ stepId }) => stepId), "$.operations", issues);
  unique(
    input.operations.map(({ transformationId }) => transformationId),
    "$.operations",
    issues
  );
  unique(
    input.explanationIntents.map(({ id }) => id),
    "$.explanationIntents",
    issues
  );
  unique(input.checkpoints.map(({ id }) => id), "$.checkpoints", issues);

  const objectIds = new Set(input.objects.map(({ objectId }) => objectId));
  const entityIds = new Set(input.objects.flatMap(({ entityIds }) => entityIds));
  const operationStepIds = new Set(input.operations.map(({ stepId }) => stepId));
  input.objects.forEach((object, index) => {
    const path = `$.objects[${index}]`;
    requireText(object.objectId, `${path}.objectId`, issues);
    requireNonEmptyUniqueText(object.entityIds, `${path}.entityIds`, issues);
    requireNonEmptyUniqueText(
      object.expressionIds,
      `${path}.expressionIds`,
      issues
    );
  });

  input.operations.forEach((operation, index) => {
    const path = `$.operations[${index}]`;
    requireText(operation.stepId, `${path}.stepId`, issues);
    requireText(
      operation.transformationId,
      `${path}.transformationId`,
      issues
    );
    requireText(operation.definitionId, `${path}.definitionId`, issues);
    requireNonEmptyUniqueText(
      operation.sourceObjectIds,
      `${path}.sourceObjectIds`,
      issues
    );
    requireNonEmptyUniqueText(
      operation.targetObjectIds,
      `${path}.targetObjectIds`,
      issues
    );
    references(
      operation.sourceObjectIds,
      objectIds,
      `${path}.sourceObjectIds`,
      "object",
      issues
    );
    references(
      operation.targetObjectIds,
      objectIds,
      `${path}.targetObjectIds`,
      "object",
      issues
    );
    if (Object.keys(operation.roleBindings).length === 0) {
      issues.push(issue(
        "construction.required",
        `${path}.roleBindings`,
        "An operation must bind at least one verified semantic role."
      ));
    }
    for (const [roleId, ids] of Object.entries(operation.roleBindings)) {
      requireText(roleId, `${path}.roleBindings.${roleId}`, issues);
      requireNonEmptyUniqueText(
        ids,
        `${path}.roleBindings.${roleId}`,
        issues
      );
      references(
        ids,
        entityIds,
        `${path}.roleBindings.${roleId}`,
        "entity",
        issues
      );
    }
    if (operation.lineage.length === 0) {
      issues.push(issue(
        "construction.required",
        `${path}.lineage`,
        "An operation must project at least one verified lineage record."
      ));
    }
    unique(
      operation.lineage.map(({ id }) => id),
      `${path}.lineage`,
      issues
    );
    operation.lineage.forEach((lineage, lineageIndex) => {
      const lineagePath = `${path}.lineage[${lineageIndex}]`;
      requireText(lineage.id, `${lineagePath}.id`, issues);
      references(
        lineage.sourceEntityIds,
        entityIds,
        `${lineagePath}.sourceEntityIds`,
        "entity",
        issues
      );
      references(
        lineage.targetEntityIds,
        entityIds,
        `${lineagePath}.targetEntityIds`,
        "entity",
        issues
      );
      if (
        lineage.sourceEntityIds.length === 0 &&
        lineage.targetEntityIds.length === 0
      ) {
        issues.push(issue(
          "construction.required",
          lineagePath,
          "A lineage record must reference at least one endpoint entity."
        ));
      }
    });
    validateCorrespondenceMap({
      id: `construction.${operation.stepId}.lineage`,
      records: operation.lineage.map((lineage) => ({
        id: lineage.id,
        relation: lineage.relation,
        sourceSelectorIds: lineage.sourceEntityIds,
        targetSelectorIds: lineage.targetEntityIds,
        summary: `Verified lineage ${lineage.id}.`
      }))
    }).forEach((correspondenceIssue) => {
      issues.push(issue(
        "construction.totality",
        `${path}.lineage.${correspondenceIssue.path}`,
        correspondenceIssue.message
      ));
    });
  });

  input.explanationIntents.forEach((intent, index) => {
    const path = `$.explanationIntents[${index}]`;
    requireText(intent.id, `${path}.id`, issues);
    requireNonEmptyUniqueText(
      intent.operationStepIds,
      `${path}.operationStepIds`,
      issues
    );
    references(
      intent.operationStepIds,
      operationStepIds,
      `${path}.operationStepIds`,
      "operation step",
      issues
    );
    requireNonEmptyUniqueText(intent.entityIds, `${path}.entityIds`, issues);
    references(
      intent.entityIds,
      entityIds,
      `${path}.entityIds`,
      "entity",
      issues
    );
  });

  requireText(input.composition.id, "$.composition.id", issues);
  requireNonEmptyUniqueText(
    input.composition.operationStepIds,
    "$.composition.operationStepIds",
    issues
  );
  references(
    input.composition.operationStepIds,
    operationStepIds,
    "$.composition.operationStepIds",
    "operation step",
    issues
  );
  const omittedSteps = [...operationStepIds].filter(
    (stepId) => !input.composition.operationStepIds.includes(stepId)
  );
  if (omittedSteps.length > 0) {
    issues.push(issue(
      "construction.totality",
      "$.composition.operationStepIds",
      `Composition omits operation step(s): ${omittedSteps.join(", ")}.`
    ));
  }

  input.checkpoints.forEach((checkpoint, index) => {
    const path = `$.checkpoints[${index}]`;
    requireText(checkpoint.id, `${path}.id`, issues);
    unique(
      checkpoint.afterOperationStepIds,
      `${path}.afterOperationStepIds`,
      issues
    );
    references(
      checkpoint.afterOperationStepIds,
      operationStepIds,
      `${path}.afterOperationStepIds`,
      "operation step",
      issues
    );
    requireNonEmptyUniqueText(checkpoint.objectIds, `${path}.objectIds`, issues);
    references(
      checkpoint.objectIds,
      objectIds,
      `${path}.objectIds`,
      "object",
      issues
    );
    unique(checkpoint.focusEntityIds, `${path}.focusEntityIds`, issues);
    references(
      checkpoint.focusEntityIds,
      entityIds,
      `${path}.focusEntityIds`,
      "entity",
      issues
    );
  });
  if (!input.checkpoints.some(({ kind }) => kind === "source")) {
    issues.push(issue(
      "construction.required",
      "$.checkpoints",
      "Construction requires a source checkpoint."
    ));
  }
  if (!input.checkpoints.some(({ kind }) => kind === "target")) {
    issues.push(issue(
      "construction.required",
      "$.checkpoints",
      "Construction requires a target checkpoint."
    ));
  }
  return Object.freeze(issues);
}

export function createKpCanonicalAnimationConstruction(
  input: KpCanonicalAnimationConstructionInput
): KpCanonicalAnimationConstructionArtifact {
  const issues = validateKpCanonicalAnimationConstruction(input);
  if (issues.length > 0) {
    throw new Error(
      issues.map(({ path, message }) => `${path}: ${message}`).join("\n")
    );
  }
  return Object.freeze({
    kind: "canonical-animation-construction" as const,
    schemaVersion: kpCanonicalAnimationConstructionSchemaVersion,
    id: input.id,
    title: input.title,
    semanticSource: Object.freeze({
      sourceId: input.semanticSource.sourceId,
      revisionId: input.semanticSource.revisionId,
      operationPacks: Object.freeze(
        input.semanticSource.operationPacks.map((pin) =>
          Object.freeze({ ...pin })
        )
      )
    }),
    objects: Object.freeze(input.objects.map((object) => Object.freeze({
      objectId: object.objectId,
      entityIds: Object.freeze([...object.entityIds]),
      expressionIds: Object.freeze([...object.expressionIds])
    }))),
    operations: Object.freeze(input.operations.map((operation) => Object.freeze({
      stepId: operation.stepId,
      transformationId: operation.transformationId,
      definitionId: operation.definitionId,
      sourceObjectIds: Object.freeze([...operation.sourceObjectIds]),
      targetObjectIds: Object.freeze([...operation.targetObjectIds]),
      roleBindings: Object.freeze(Object.fromEntries(
        Object.entries(operation.roleBindings).map(([roleId, ids]) => [
          roleId,
          Object.freeze([...ids])
        ])
      )),
      lineage: Object.freeze(operation.lineage.map((lineage) => Object.freeze({
        id: lineage.id,
        relation: lineage.relation,
        sourceEntityIds: Object.freeze([...lineage.sourceEntityIds]),
        targetEntityIds: Object.freeze([...lineage.targetEntityIds])
      })))
    }))),
    explanationIntents: Object.freeze(input.explanationIntents.map((intent) =>
      Object.freeze({
        id: intent.id,
        kind: intent.kind,
        operationStepIds: Object.freeze([...intent.operationStepIds]),
        entityIds: Object.freeze([...intent.entityIds]),
        detail: intent.detail
      })
    )),
    composition: Object.freeze({
      id: input.composition.id,
      kind: input.composition.kind,
      operationStepIds: Object.freeze([
        ...input.composition.operationStepIds
      ])
    }),
    checkpoints: Object.freeze(input.checkpoints.map((checkpoint) =>
      Object.freeze({
        id: checkpoint.id,
        kind: checkpoint.kind,
        afterOperationStepIds: Object.freeze([
          ...checkpoint.afterOperationStepIds
        ]),
        objectIds: Object.freeze([...checkpoint.objectIds]),
        focusEntityIds: Object.freeze([...checkpoint.focusEntityIds])
      })
    ))
  });
}

function requireNonEmptyUniqueText(
  values: readonly string[],
  path: string,
  issues: KpCanonicalAnimationConstructionIssue[]
): void {
  if (values.length === 0) {
    issues.push(issue(
      "construction.required",
      path,
      `${path} must contain at least one reference.`
    ));
    return;
  }
  values.forEach((value, index) => requireText(value, `${path}[${index}]`, issues));
  unique(values, path, issues);
}

function references(
  values: readonly string[],
  available: ReadonlySet<string>,
  path: string,
  label: string,
  issues: KpCanonicalAnimationConstructionIssue[]
): void {
  values.forEach((value, index) => {
    if (!available.has(value)) {
      issues.push(issue(
        "construction.reference",
        `${path}[${index}]`,
        `Unknown ${label} reference ${value}.`
      ));
    }
  });
}

function unique(
  values: readonly string[],
  path: string,
  issues: KpCanonicalAnimationConstructionIssue[]
): void {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    if (seen.has(value)) {
      issues.push(issue(
        "construction.duplicate",
        `${path}[${index}]`,
        `${path} repeats ${value}.`
      ));
    }
    seen.add(value);
  });
}

function requireText(
  value: string,
  path: string,
  issues: KpCanonicalAnimationConstructionIssue[]
): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(issue(
      "construction.required",
      path,
      `${path} must be a non-empty string.`
    ));
  }
}

function issue(
  code: KpCanonicalAnimationConstructionIssue["code"],
  path: string,
  message: string
): KpCanonicalAnimationConstructionIssue {
  return Object.freeze({ code, path, message });
}
