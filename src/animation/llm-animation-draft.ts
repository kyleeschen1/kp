import type {
  SelectorCorrespondenceRelationId
} from "../semantic/correspondence.ts";
import type {
  KpTransformationPreservation
} from "../semantic/asset-transformation.ts";
import type { KpDiagramScene } from "../semantic/diagram-scene.ts";

export const kpLlmAnimationDraftSchemaVersion =
  "kp.llm-animation-draft.v1" as const;

export interface KpLlmAnimationDraft {
  readonly schemaVersion: typeof kpLlmAnimationDraftSchemaVersion;
  readonly id: string;
  readonly title: string;
  readonly renderTarget: KpLlmAnimationDraftRenderTarget;
  readonly objects: readonly KpLlmAnimationDraftObject[];
  readonly transformations: readonly KpLlmAnimationDraftTransformation[];
  readonly sequence: readonly string[];
  readonly timeline?: KpLlmAnimationDraftTimeline | undefined;
}

export interface KpLlmAnimationDraftRenderTarget {
  readonly id: string;
  readonly kind: "equation" | "diagram";
}

export type KpLlmAnimationDraftObject =
  | KpLlmEquationDraftObject
  | KpLlmDiagramDraftObject;

export interface KpLlmEquationDraftObject {
  readonly id: string;
  readonly title: string;
  readonly latex: string;
  readonly selectors: readonly KpLlmAnimationDraftSelector[];
}

export interface KpLlmDiagramDraftObject {
  readonly id: string;
  readonly title: string;
  readonly scene: Omit<KpDiagramScene, "id" | "kind" | "title">;
}

export interface KpLlmAnimationDraftSelector {
  readonly id: string;
  readonly kind: string;
  readonly label?: string | undefined;
  readonly summary?: string | undefined;
}

export interface KpLlmAnimationDraftTransformation {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly sourceObjectIds: readonly string[];
  readonly targetObjectIds: readonly string[];
  readonly preserves: readonly KpTransformationPreservation[];
  readonly correspondenceMap: KpLlmAnimationDraftCorrespondenceMap;
  readonly assumptions?: readonly string[] | undefined;
}

export interface KpLlmAnimationDraftCorrespondenceMap {
  readonly id: string;
  readonly records: readonly KpLlmAnimationDraftCorrespondenceRecord[];
}

export interface KpLlmAnimationDraftCorrespondenceRecord {
  readonly id: string;
  readonly relation: SelectorCorrespondenceRelationId;
  readonly sourceSelectorIds: readonly string[];
  readonly targetSelectorIds: readonly string[];
  readonly summary: string;
}

export interface KpLlmAnimationDraftTimeline {
  readonly id: string;
  readonly durationMs: number;
  readonly beatCount?: number | undefined;
}

export interface KpLlmAnimationDraftSchemaIssue {
  readonly path: string;
  readonly code: "draft.type" | "draft.required" | "draft.unknown-field" | "draft.value";
  readonly message: string;
}

const preservationValues = new Set<KpTransformationPreservation>([
  "identity",
  "structure",
  "value",
  "role",
  "presentation"
]);
const relationValues = new Set<SelectorCorrespondenceRelationId>([
  "identity",
  "role-change",
  "introduction",
  "removal",
  "cancelation",
  "fan-in",
  "fan-out",
  "artifact",
  "focus"
]);

// Drafts are an untrusted model boundary. Exact field allowlists prevent a
// model from smuggling renderer instructions such as DOM, pixels, or keyframes.
export function validateKpLlmAnimationDraftSchema(
  value: unknown
): readonly KpLlmAnimationDraftSchemaIssue[] {
  const issues: KpLlmAnimationDraftSchemaIssue[] = [];
  if (!expectRecord(value, "$", issues)) return issues;

  rejectUnknownFields(
    value,
    [
      "schemaVersion",
      "id",
      "title",
      "renderTarget",
      "objects",
      "transformations",
      "sequence",
      "timeline"
    ],
    "$",
    issues
  );
  expectLiteral(
    value["schemaVersion"],
    kpLlmAnimationDraftSchemaVersion,
    "$.schemaVersion",
    issues
  );
  expectNonEmptyString(value["id"], "$.id", issues);
  expectNonEmptyString(value["title"], "$.title", issues);
  validateRenderTarget(value["renderTarget"], "$.renderTarget", issues);
  validateArray(value["objects"], "$.objects", issues, validateObject, true);
  validateArray(
    value["transformations"],
    "$.transformations",
    issues,
    validateTransformation,
    true
  );
  validateStringArray(value["sequence"], "$.sequence", issues, true);
  if (value["timeline"] !== undefined) {
    validateTimeline(value["timeline"], "$.timeline", issues);
  }

  return issues;
}

function validateRenderTarget(
  value: unknown,
  path: string,
  issues: KpLlmAnimationDraftSchemaIssue[]
): void {
  if (!expectRecord(value, path, issues)) return;
  rejectUnknownFields(value, ["id", "kind"], path, issues);
  expectNonEmptyString(value["id"], `${path}.id`, issues);
  expectEnum(value["kind"], new Set(["equation", "diagram"]), `${path}.kind`, issues);
}

function validateObject(
  value: unknown,
  path: string,
  issues: KpLlmAnimationDraftSchemaIssue[]
): void {
  if (!expectRecord(value, path, issues)) return;
  if ("scene" in value) {
    validateDiagramObject(value, path, issues);
    return;
  }
  rejectUnknownFields(value, ["id", "title", "latex", "selectors"], path, issues);
  expectNonEmptyString(value["id"], `${path}.id`, issues);
  expectNonEmptyString(value["title"], `${path}.title`, issues);
  expectNonEmptyString(value["latex"], `${path}.latex`, issues);
  validateArray(value["selectors"], `${path}.selectors`, issues, validateSelector, true);
}

function validateDiagramObject(
  value: Record<string, unknown>,
  path: string,
  issues: KpLlmAnimationDraftSchemaIssue[]
): void {
  rejectUnknownFields(value, ["id", "title", "scene"], path, issues);
  expectNonEmptyString(value["id"], `${path}.id`, issues);
  expectNonEmptyString(value["title"], `${path}.title`, issues);
  const scene = value["scene"];
  if (!expectRecord(scene, `${path}.scene`, issues)) return;
  rejectUnknownFields(scene, ["width", "height", "nodes", "edges", "groups", "labels"], `${path}.scene`, issues);
  expectPositiveNumber(scene["width"], `${path}.scene.width`, issues);
  expectPositiveNumber(scene["height"], `${path}.scene.height`, issues);
  validateArray(scene["nodes"], `${path}.scene.nodes`, issues, validateDiagramNode, true);
  validateArray(scene["edges"], `${path}.scene.edges`, issues, validateDiagramEdge, false);
  validateArray(scene["groups"], `${path}.scene.groups`, issues, validateDiagramGroup, false);
  validateArray(scene["labels"], `${path}.scene.labels`, issues, validateDiagramLabel, false);
}

function validateDiagramNode(value: unknown, path: string, issues: KpLlmAnimationDraftSchemaIssue[]): void {
  if (!expectRecord(value, path, issues)) return;
  rejectUnknownFields(value, ["id", "selectorId", "shape", "x", "y", "width", "height", "label"], path, issues);
  expectNonEmptyString(value["id"], `${path}.id`, issues);
  expectNonEmptyString(value["selectorId"], `${path}.selectorId`, issues);
  expectEnum(value["shape"], new Set(["rectangle", "circle"]), `${path}.shape`, issues);
  expectFiniteNumber(value["x"], `${path}.x`, issues);
  expectFiniteNumber(value["y"], `${path}.y`, issues);
  expectPositiveNumber(value["width"], `${path}.width`, issues);
  expectPositiveNumber(value["height"], `${path}.height`, issues);
  expectNonEmptyString(value["label"], `${path}.label`, issues);
}

function validateDiagramEdge(value: unknown, path: string, issues: KpLlmAnimationDraftSchemaIssue[]): void {
  if (!expectRecord(value, path, issues)) return;
  rejectUnknownFields(value, ["id", "selectorId", "sourceNodeId", "targetNodeId", "directed"], path, issues);
  expectNonEmptyString(value["id"], `${path}.id`, issues);
  expectNonEmptyString(value["selectorId"], `${path}.selectorId`, issues);
  expectNonEmptyString(value["sourceNodeId"], `${path}.sourceNodeId`, issues);
  expectNonEmptyString(value["targetNodeId"], `${path}.targetNodeId`, issues);
  expectBoolean(value["directed"], `${path}.directed`, issues);
}

function validateDiagramGroup(value: unknown, path: string, issues: KpLlmAnimationDraftSchemaIssue[]): void {
  if (!expectRecord(value, path, issues)) return;
  rejectUnknownFields(value, ["id", "selectorId", "nodeIds", "label", "padding"], path, issues);
  expectNonEmptyString(value["id"], `${path}.id`, issues);
  expectNonEmptyString(value["selectorId"], `${path}.selectorId`, issues);
  validateStringArray(value["nodeIds"], `${path}.nodeIds`, issues, true);
  expectNonEmptyString(value["label"], `${path}.label`, issues);
  expectNonNegativeNumber(value["padding"], `${path}.padding`, issues);
}

function validateDiagramLabel(value: unknown, path: string, issues: KpLlmAnimationDraftSchemaIssue[]): void {
  if (!expectRecord(value, path, issues)) return;
  rejectUnknownFields(value, ["id", "selectorId", "targetId", "text", "placement"], path, issues);
  expectNonEmptyString(value["id"], `${path}.id`, issues);
  expectNonEmptyString(value["selectorId"], `${path}.selectorId`, issues);
  expectNonEmptyString(value["targetId"], `${path}.targetId`, issues);
  expectNonEmptyString(value["text"], `${path}.text`, issues);
  expectEnum(value["placement"], new Set(["center", "above", "below"]), `${path}.placement`, issues);
}

function validateSelector(
  value: unknown,
  path: string,
  issues: KpLlmAnimationDraftSchemaIssue[]
): void {
  if (!expectRecord(value, path, issues)) return;
  rejectUnknownFields(value, ["id", "kind", "label", "summary"], path, issues);
  expectNonEmptyString(value["id"], `${path}.id`, issues);
  expectNonEmptyString(value["kind"], `${path}.kind`, issues);
  expectOptionalString(value["label"], `${path}.label`, issues);
  expectOptionalString(value["summary"], `${path}.summary`, issues);
}

function validateTransformation(
  value: unknown,
  path: string,
  issues: KpLlmAnimationDraftSchemaIssue[]
): void {
  if (!expectRecord(value, path, issues)) return;
  rejectUnknownFields(
    value,
    [
      "id",
      "transformType",
      "title",
      "sourceObjectIds",
      "targetObjectIds",
      "preserves",
      "correspondenceMap",
      "assumptions"
    ],
    path,
    issues
  );
  expectNonEmptyString(value["id"], `${path}.id`, issues);
  expectNonEmptyString(value["transformType"], `${path}.transformType`, issues);
  expectNonEmptyString(value["title"], `${path}.title`, issues);
  validateStringArray(value["sourceObjectIds"], `${path}.sourceObjectIds`, issues, true);
  validateStringArray(value["targetObjectIds"], `${path}.targetObjectIds`, issues, true);
  validateEnumArray(
    value["preserves"],
    preservationValues,
    `${path}.preserves`,
    issues,
    true
  );
  validateCorrespondenceMap(value["correspondenceMap"], `${path}.correspondenceMap`, issues);
  if (value["assumptions"] !== undefined) {
    validateStringArray(value["assumptions"], `${path}.assumptions`, issues, false);
  }
}

function validateCorrespondenceMap(
  value: unknown,
  path: string,
  issues: KpLlmAnimationDraftSchemaIssue[]
): void {
  if (!expectRecord(value, path, issues)) return;
  rejectUnknownFields(value, ["id", "records"], path, issues);
  expectNonEmptyString(value["id"], `${path}.id`, issues);
  validateArray(value["records"], `${path}.records`, issues, validateCorrespondenceRecord, true);
}

function validateCorrespondenceRecord(
  value: unknown,
  path: string,
  issues: KpLlmAnimationDraftSchemaIssue[]
): void {
  if (!expectRecord(value, path, issues)) return;
  rejectUnknownFields(
    value,
    ["id", "relation", "sourceSelectorIds", "targetSelectorIds", "summary"],
    path,
    issues
  );
  expectNonEmptyString(value["id"], `${path}.id`, issues);
  expectEnum(value["relation"], relationValues, `${path}.relation`, issues);
  validateStringArray(value["sourceSelectorIds"], `${path}.sourceSelectorIds`, issues, false);
  validateStringArray(value["targetSelectorIds"], `${path}.targetSelectorIds`, issues, false);
  expectNonEmptyString(value["summary"], `${path}.summary`, issues);
}

function validateTimeline(
  value: unknown,
  path: string,
  issues: KpLlmAnimationDraftSchemaIssue[]
): void {
  if (!expectRecord(value, path, issues)) return;
  rejectUnknownFields(value, ["id", "durationMs", "beatCount"], path, issues);
  expectNonEmptyString(value["id"], `${path}.id`, issues);
  expectPositiveNumber(value["durationMs"], `${path}.durationMs`, issues);
  if (value["beatCount"] !== undefined) {
    expectPositiveNumber(value["beatCount"], `${path}.beatCount`, issues, true);
  }
}

function validateArray(
  value: unknown,
  path: string,
  issues: KpLlmAnimationDraftSchemaIssue[],
  validateItem: (
    item: unknown,
    itemPath: string,
    target: KpLlmAnimationDraftSchemaIssue[]
  ) => void,
  nonEmpty: boolean
): void {
  if (!Array.isArray(value)) {
    issues.push({ path, code: "draft.type", message: `${path} must be an array.` });
    return;
  }
  if (nonEmpty && value.length === 0) {
    issues.push({ path, code: "draft.required", message: `${path} must not be empty.` });
  }
  value.forEach((item, index) => validateItem(item, `${path}[${index}]`, issues));
}

function validateStringArray(
  value: unknown,
  path: string,
  issues: KpLlmAnimationDraftSchemaIssue[],
  nonEmpty: boolean
): void {
  validateArray(
    value,
    path,
    issues,
    (item, itemPath, target) => expectNonEmptyString(item, itemPath, target),
    nonEmpty
  );
}

function validateEnumArray<T extends string>(
  value: unknown,
  allowed: ReadonlySet<T>,
  path: string,
  issues: KpLlmAnimationDraftSchemaIssue[],
  nonEmpty: boolean
): void {
  validateArray(
    value,
    path,
    issues,
    (item, itemPath, target) => expectEnum(item, allowed, itemPath, target),
    nonEmpty
  );
}

function expectRecord(
  value: unknown,
  path: string,
  issues: KpLlmAnimationDraftSchemaIssue[]
): value is Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) return true;
  issues.push({ path, code: "draft.type", message: `${path} must be an object.` });
  return false;
}

function expectNonEmptyString(
  value: unknown,
  path: string,
  issues: KpLlmAnimationDraftSchemaIssue[]
): void {
  if (typeof value !== "string") {
    issues.push({ path, code: "draft.type", message: `${path} must be a string.` });
  } else if (value.trim().length === 0) {
    issues.push({ path, code: "draft.required", message: `${path} must not be empty.` });
  }
}

function expectOptionalString(
  value: unknown,
  path: string,
  issues: KpLlmAnimationDraftSchemaIssue[]
): void {
  if (value !== undefined) expectNonEmptyString(value, path, issues);
}

function expectLiteral(
  value: unknown,
  expected: string,
  path: string,
  issues: KpLlmAnimationDraftSchemaIssue[]
): void {
  if (value !== expected) {
    issues.push({
      path,
      code: "draft.value",
      message: `${path} must equal ${JSON.stringify(expected)}.`
    });
  }
}

function expectEnum<T extends string>(
  value: unknown,
  allowed: ReadonlySet<T>,
  path: string,
  issues: KpLlmAnimationDraftSchemaIssue[]
): void {
  if (typeof value !== "string" || !allowed.has(value as T)) {
    issues.push({
      path,
      code: "draft.value",
      message: `${path} must be one of: ${[...allowed].join(", ")}.`
    });
  }
}

function expectPositiveNumber(
  value: unknown,
  path: string,
  issues: KpLlmAnimationDraftSchemaIssue[],
  integer = false
): void {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= 0 ||
    (integer && !Number.isInteger(value))
  ) {
    issues.push({
      path,
      code: "draft.value",
      message: `${path} must be a positive${integer ? " integer" : " number"}.`
    });
  }
}

function expectFiniteNumber(
  value: unknown,
  path: string,
  issues: KpLlmAnimationDraftSchemaIssue[]
): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    issues.push({ path, code: "draft.value", message: `${path} must be a finite number.` });
  }
}

function expectNonNegativeNumber(
  value: unknown,
  path: string,
  issues: KpLlmAnimationDraftSchemaIssue[]
): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    issues.push({ path, code: "draft.value", message: `${path} must be a non-negative number.` });
  }
}

function expectBoolean(
  value: unknown,
  path: string,
  issues: KpLlmAnimationDraftSchemaIssue[]
): void {
  if (typeof value !== "boolean") {
    issues.push({ path, code: "draft.type", message: `${path} must be a boolean.` });
  }
}

function rejectUnknownFields(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: KpLlmAnimationDraftSchemaIssue[]
): void {
  const allowedSet = new Set(allowed);
  Object.keys(value).forEach((key) => {
    if (!allowedSet.has(key)) {
      issues.push({
        path: `${path}.${key}`,
        code: "draft.unknown-field",
        message: `${path}.${key} is not part of ${kpLlmAnimationDraftSchemaVersion}.`
      });
    }
  });
}
