import type {
  KatexTransformDefinition,
  KatexTransformFixture,
  KatexTransformFixtureFamily,
  KatexTransformFixtureIntent,
  KatexTransformFixtureLayoutRole,
  KatexTransformFixtureToken,
  KatexTransformFixtureTokenRole
} from "../rendering/katex-transform-fixtures.ts";
import {
  definitionForKatexTransformFixture,
  findKatexTransformFixture
} from "../rendering/katex-transform-fixtures.ts";
import {
  equationVisualMotifDescriptors
} from "../rendering/visual-motif.ts";
import type {
  EquationMotionPrimitiveId,
  EquationVisualMotifKind,
  EquationVisualMotifPhaseId
} from "../rendering/visual-motif.ts";
import {
  createTransformTreeVisualMotifTimeline
} from "../rendering/visual-motif-composition.ts";
import type {
  TransformTreeVisualMotifTimeline
} from "../rendering/visual-motif-composition.ts";
import {
  createSemanticTransformationRef
} from "../semantic/animation.ts";
import type {
  SemanticTransformationPreservation,
  SemanticTransformationRef
} from "../semantic/animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf
} from "../semantic/transformation-composition.ts";
import {
  selectorCorrespondenceRelationIds,
  type CorrespondenceMap
} from "../semantic/correspondence.ts";

export const TRANSFORM_FIXTURE_CONTRACT_VERSION = 1;
export const GENERATED_KATEX_FIXTURE_CONTRACT_VERSION = 1;

export interface TransformFixtureDocument {
  readonly schemaVersion: typeof TRANSFORM_FIXTURE_CONTRACT_VERSION;
  readonly kind: "katex-transform-fixture";
  readonly fixture: KatexTransformFixture;
}

export type GeneratedKatexArtifactSide = "source" | "target";

export type GeneratedKatexArtifactKind =
  | "delimiter"
  | "fraction-bar"
  | "large-operator"
  | "matrix-bracket"
  | "operator"
  | "radical"
  | "rule"
  | "script"
  | "wrapper";

export type GeneratedKatexGeometryMetric =
  | "artifact-presence"
  | "baseline"
  | "bounding-box"
  | "column"
  | "row"
  | "role-change";

export type GeneratedKatexGeometrySeverity = "required" | "advisory";

export interface GeneratedKatexArtifactExpectation {
  readonly id: string;
  readonly side: GeneratedKatexArtifactSide;
  readonly selectorId: string;
  readonly structuralTokenId: string;
  readonly artifactKind: GeneratedKatexArtifactKind;
}

export interface GeneratedKatexGeometryDiagnostic {
  readonly id: string;
  readonly targetId: string;
  readonly metric: GeneratedKatexGeometryMetric;
  readonly severity: GeneratedKatexGeometrySeverity;
  readonly summary: string;
}

export interface GeneratedKatexTransformFixture {
  readonly id: string;
  readonly fixture: KatexTransformFixture;
  readonly semanticTransformation: SemanticTransformationRef;
  readonly correspondenceMap: CorrespondenceMap;
  readonly visualMotifTimeline: TransformTreeVisualMotifTimeline<
    EquationVisualMotifKind,
    EquationMotionPrimitiveId,
    EquationVisualMotifPhaseId
  >;
  readonly artifactExpectations: readonly GeneratedKatexArtifactExpectation[];
  readonly geometryDiagnostics: readonly GeneratedKatexGeometryDiagnostic[];
  readonly summary: string;
}

export interface GeneratedKatexFixtureDocument {
  readonly schemaVersion: typeof GENERATED_KATEX_FIXTURE_CONTRACT_VERSION;
  readonly kind: "generated-katex-transform-fixture";
  readonly generated: GeneratedKatexTransformFixture;
}

export interface CreateGeneratedKatexTransformFixtureFromSemanticTransformationInput {
  readonly fixtureId: string;
  readonly semanticTransformation: SemanticTransformationRef;
}

export interface TransformFixtureValidationIssue {
  readonly path: string;
  readonly message: string;
}

export type TransformFixtureImportResult =
  | {
      readonly ok: true;
      readonly fixture: KatexTransformFixture;
      readonly document: TransformFixtureDocument;
    }
  | {
      readonly ok: false;
      readonly issues: readonly TransformFixtureValidationIssue[];
    };

export type GeneratedKatexFixtureImportResult =
  | {
      readonly ok: true;
      readonly generated: GeneratedKatexTransformFixture;
      readonly document: GeneratedKatexFixtureDocument;
    }
  | {
      readonly ok: false;
      readonly issues: readonly TransformFixtureValidationIssue[];
    };

const KATEX_TRANSFORM_FIXTURE_FAMILIES = new Set<string>([
  "fraction",
  "large-operator",
  "matrix",
  "radical",
  "script",
  "wrapper"
]);

const KATEX_TRANSFORM_FIXTURE_INTENTS = new Set<string>([
  "addIntegralBounds",
  "addSummationBounds",
  "changeIndex",
  "changeLimitApproach",
  "changeMatrixDelimiter",
  "changeProductBounds",
  "combineFractions",
  "combineRepeatedFactorAsPower",
  "expandPower",
  "makeFraction",
  "rewritePowerAsRoot",
  "rewriteRootAsPower",
  "splitFraction",
  "swapMatrixRows",
  "transposeVector",
  "unwrapDelimiter",
  "unwrapIndexedRoot",
  "updateMatrixEntry",
  "wrapWithDelimiter",
  "wrapWithFunction"
]);

const KATEX_TRANSFORM_TOKEN_ROLES = new Set<string>([
  "artifact",
  "base",
  "body",
  "differential",
  "factor",
  "integrand",
  "large-operator",
  "limit-approach",
  "lower-limit",
  "matrix-column",
  "matrix-entry",
  "matrix-row",
  "operator",
  "radicand",
  "root-index",
  "semantic",
  "subscript",
  "superscript",
  "upper-limit",
  "vector-entry"
]);

const KATEX_TRANSFORM_LAYOUT_ROLES = new Set<string>([
  "baseline",
  "lower-limit",
  "matrix-column",
  "matrix-entry",
  "matrix-left-bracket",
  "matrix-right-bracket",
  "matrix-row",
  "upper-limit"
]);

const SEMANTIC_TRANSFORMATION_PRESERVATIONS = new Set<string>([
  "identity",
  "presentation",
  "role",
  "structure",
  "value"
]);

const SELECTOR_CORRESPONDENCE_RELATIONS = new Set<string>(
  selectorCorrespondenceRelationIds
);

const GENERATED_KATEX_ARTIFACT_SIDES = new Set<string>(["source", "target"]);

const GENERATED_KATEX_ARTIFACT_KINDS = new Set<string>([
  "delimiter",
  "fraction-bar",
  "large-operator",
  "matrix-bracket",
  "operator",
  "radical",
  "rule",
  "script",
  "wrapper"
]);

const GENERATED_KATEX_GEOMETRY_METRICS = new Set<string>([
  "artifact-presence",
  "baseline",
  "bounding-box",
  "column",
  "row",
  "role-change"
]);

const GENERATED_KATEX_GEOMETRY_SEVERITIES = new Set<string>([
  "advisory",
  "required"
]);

const TRANSFORM_TREE_ANNOTATION_PLACEMENTS = new Set<string>([
  "after",
  "before",
  "during"
]);

export function exportKatexTransformFixture(
  fixture: KatexTransformFixture
): TransformFixtureDocument {
  return {
    schemaVersion: TRANSFORM_FIXTURE_CONTRACT_VERSION,
    kind: "katex-transform-fixture",
    fixture: cloneJson(fixture)
  };
}

export function createGeneratedKatexTransformFixtureFromSemanticTransformation(
  input: CreateGeneratedKatexTransformFixtureFromSemanticTransformationInput
): GeneratedKatexTransformFixture {
  const fixture = findKatexTransformFixture(input.fixtureId);
  const definition = definitionForKatexTransformFixture(fixture);
  const semanticTransformation = createSemanticTransformationRef(
    input.semanticTransformation
  );

  if (semanticTransformation.kind !== definition.semanticTransform) {
    throw new Error(
      `Semantic transformation ${semanticTransformation.kind} does not match fixture ${fixture.id} semantic transform ${definition.semanticTransform}.`
    );
  }

  const correspondenceMap = createGeneratedCorrespondenceMap(
    fixture,
    semanticTransformation.id
  );
  const visualMotifTimeline = createGeneratedVisualMotifTimeline(
    definition,
    semanticTransformation
  );
  const artifactExpectations = createGeneratedArtifactExpectations(fixture);
  const primaryRoleChangeTargetId =
    correspondenceMap.records.find((record) => record.relation === "role-change")
      ?.targetSelectorIds[0];

  return {
    id: `generated.${fixture.id}`,
    fixture: cloneJson(fixture),
    semanticTransformation,
    correspondenceMap,
    visualMotifTimeline,
    artifactExpectations,
    geometryDiagnostics: createGeneratedGeometryDiagnostics({
      artifactExpectations,
      definition,
      fallbackTargetId: fixture.id,
      primaryRoleChangeTargetId
    }),
    summary: semanticTransformation.summary ?? definition.summary
  };
}

export function exportGeneratedKatexTransformFixture(
  generated: GeneratedKatexTransformFixture
): GeneratedKatexFixtureDocument {
  return {
    schemaVersion: GENERATED_KATEX_FIXTURE_CONTRACT_VERSION,
    kind: "generated-katex-transform-fixture",
    generated: cloneJson(generated)
  };
}

function createGeneratedCorrespondenceMap(
  fixture: KatexTransformFixture,
  transformationId: string
): CorrespondenceMap {
  return {
    id: `correspondence.${transformationId}`,
    records: [
      ...fixture.expectedRoleChanges.map((change, index) => {
        const sourceToken = findFixtureToken(
          fixture.source.tokens,
          change.sourceRole,
          change.sourceText
        );
        const targetToken = findFixtureToken(
          fixture.target.tokens,
          change.targetRole,
          change.targetText
        );

        return {
          id: `${transformationId}.role-change.${index}`,
          relation: "role-change" as const,
          sourceSelectorIds: [
            selectorForFixtureToken(fixture.id, "source", sourceToken)
          ],
          targetSelectorIds: [
            selectorForFixtureToken(fixture.id, "target", targetToken)
          ],
          summary: `${change.sourceRole} ${change.sourceText} persists as ${change.targetRole} ${change.targetText}.`
        };
      }),
      ...createGeneratedArtifactExpectations(fixture).map(
        (artifact, index) => ({
          id: `${transformationId}.artifact.${index}`,
          relation: "artifact" as const,
          sourceSelectorIds:
            artifact.side === "source" ? [artifact.selectorId] : [],
          targetSelectorIds:
            artifact.side === "target" ? [artifact.selectorId] : [],
          summary: `${artifact.structuralTokenId} is a ${artifact.side}-side ${artifact.artifactKind} artifact.`
        })
      )
    ]
  };
}

function createGeneratedVisualMotifTimeline(
  definition: KatexTransformDefinition,
  semanticTransformation: SemanticTransformationRef
): GeneratedKatexTransformFixture["visualMotifTimeline"] {
  const [primaryMotifKind] = definition.defaultVisualMotifs;

  if (primaryMotifKind === undefined) {
    throw new Error(
      `KaTeX transform definition ${definition.id} has no default visual motifs.`
    );
  }

  const descriptor = equationVisualMotifDescriptors.find(
    (candidate) => candidate.kind === primaryMotifKind
  );

  if (descriptor === undefined) {
    throw new Error(
      `KaTeX transform definition ${definition.id} references unknown motif ${primaryMotifKind}.`
    );
  }

  return createTransformTreeVisualMotifTimeline({
    id: `visual.${semanticTransformation.id}`,
    tree: createEditableSemanticTransformationTree({
      root: createSemanticTransformationLeaf(semanticTransformation)
    }),
    rules: [
      {
        transformationKind: semanticTransformation.kind,
        descriptor,
        summary: definition.summary
      }
    ]
  });
}

function createGeneratedArtifactExpectations(
  fixture: KatexTransformFixture
): readonly GeneratedKatexArtifactExpectation[] {
  const sides: readonly GeneratedKatexArtifactSide[] = ["source", "target"];

  return sides.flatMap((side) =>
    fixture.expectedStructuralTokens[side].map((structuralTokenId, index) => {
      const token = findStructuralFixtureToken(
        fixture[side].tokens,
        structuralTokenId
      );

      return {
        id: `artifact.${fixture.id}.${side}.${index}`,
        side,
        selectorId: selectorForFixtureToken(fixture.id, side, token),
        structuralTokenId,
        artifactKind: inferGeneratedArtifactKind(fixture, structuralTokenId)
      };
    })
  );
}

function createGeneratedGeometryDiagnostics(input: {
  readonly artifactExpectations: readonly GeneratedKatexArtifactExpectation[];
  readonly definition: KatexTransformDefinition;
  readonly fallbackTargetId: string;
  readonly primaryRoleChangeTargetId: string | undefined;
}): readonly GeneratedKatexGeometryDiagnostic[] {
  return input.definition.geometryChallenges.map((challenge, index) => {
    const metric = inferGeometryMetric(challenge);
    const targetId =
      metric === "role-change"
        ? input.primaryRoleChangeTargetId ?? input.fallbackTargetId
        : input.artifactExpectations[index]?.selectorId ??
          input.artifactExpectations[0]?.selectorId ??
          input.primaryRoleChangeTargetId ??
          input.fallbackTargetId;

    return {
      id: `geometry.${input.definition.id}.${slugId(challenge)}`,
      targetId,
      metric,
      severity: metric === "role-change" ? "required" : "advisory",
      summary: `Generated ${metric} check for ${challenge}.`
    };
  });
}

function findFixtureToken(
  tokens: readonly KatexTransformFixtureToken[],
  role: KatexTransformFixtureTokenRole,
  text: string
): KatexTransformFixtureToken {
  const token = tokens.find(
    (candidate) => candidate.role === role && candidate.text === text
  );

  if (token === undefined) {
    throw new Error(`Expected fixture token ${role}:${text}.`);
  }

  return token;
}

function findStructuralFixtureToken(
  tokens: readonly KatexTransformFixtureToken[],
  structuralTokenId: string
): KatexTransformFixtureToken {
  const token = tokens.find((candidate) => candidate.text === structuralTokenId);

  if (token === undefined) {
    throw new Error(`Expected structural fixture token ${structuralTokenId}.`);
  }

  return token;
}

function selectorForFixtureToken(
  fixtureId: string,
  side: GeneratedKatexArtifactSide,
  token: KatexTransformFixtureToken
): string {
  return (
    token.selectorId ??
    `${fixtureId}.${side}.${token.role}.${slugId(token.text)}`
  );
}

function inferGeneratedArtifactKind(
  fixture: KatexTransformFixture,
  structuralTokenId: string
): GeneratedKatexArtifactKind {
  if (fixture.family === "radical" || structuralTokenId.includes("sqrt")) {
    return "radical";
  }

  if (fixture.family === "fraction" || structuralTokenId.includes("frac")) {
    return "fraction-bar";
  }

  if (fixture.family === "matrix") {
    return "matrix-bracket";
  }

  if (fixture.family === "large-operator") {
    return "large-operator";
  }

  if (fixture.family === "script") {
    return "script";
  }

  if (fixture.family === "wrapper") {
    return "delimiter";
  }

  return "rule";
}

function inferGeometryMetric(challenge: string): GeneratedKatexGeometryMetric {
  if (challenge.includes("baseline")) {
    return "baseline";
  }

  if (challenge.includes("column")) {
    return "column";
  }

  if (challenge.includes("row")) {
    return "row";
  }

  if (challenge.includes("-to-") || challenge.includes("role")) {
    return "role-change";
  }

  if (
    challenge.includes("artifact") ||
    challenge.includes("bar") ||
    challenge.includes("bracket") ||
    challenge.includes("delimiter") ||
    challenge.includes("glyph") ||
    challenge.includes("line")
  ) {
    return "artifact-presence";
  }

  return "bounding-box";
}

function slugId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function importKatexTransformFixtureDocument(
  value: unknown
): TransformFixtureImportResult {
  const issues = validateTransformFixtureDocument(value);

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const document = cloneJson(value as TransformFixtureDocument);

  return {
    ok: true,
    document,
    fixture: document.fixture
  };
}

export function importGeneratedKatexFixtureDocument(
  value: unknown
): GeneratedKatexFixtureImportResult {
  const issues = validateGeneratedKatexFixtureDocument(value);

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const document = cloneJson(value as GeneratedKatexFixtureDocument);

  return {
    ok: true,
    document,
    generated: document.generated
  };
}

export function validateTransformFixtureDocument(
  value: unknown
): readonly TransformFixtureValidationIssue[] {
  const issues: TransformFixtureValidationIssue[] = [];

  if (!isRecord(value)) {
    issues.push({
      path: "$",
      message: "Expected a transform fixture document object."
    });
    return issues;
  }

  if (value["schemaVersion"] !== TRANSFORM_FIXTURE_CONTRACT_VERSION) {
    issues.push({
      path: "schemaVersion",
      message: `Expected schema version ${TRANSFORM_FIXTURE_CONTRACT_VERSION}.`
    });
  }

  if (value["kind"] !== "katex-transform-fixture") {
    issues.push({
      path: "kind",
      message: "Expected kind katex-transform-fixture."
    });
  }

  validateFixture(value["fixture"], "fixture", issues);

  return issues;
}

export function validateGeneratedKatexFixtureDocument(
  value: unknown
): readonly TransformFixtureValidationIssue[] {
  const issues: TransformFixtureValidationIssue[] = [];

  if (!isRecord(value)) {
    issues.push({
      path: "$",
      message: "Expected a generated KaTeX fixture document object."
    });
    return issues;
  }

  if (value["schemaVersion"] !== GENERATED_KATEX_FIXTURE_CONTRACT_VERSION) {
    issues.push({
      path: "schemaVersion",
      message: `Expected schema version ${GENERATED_KATEX_FIXTURE_CONTRACT_VERSION}.`
    });
  }

  if (value["kind"] !== "generated-katex-transform-fixture") {
    issues.push({
      path: "kind",
      message: "Expected kind generated-katex-transform-fixture."
    });
  }

  validateGeneratedFixture(value["generated"], "generated", issues);

  return issues;
}

function validateGeneratedFixture(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!isRecord(value)) {
    issues.push({
      path,
      message: "Expected a generated fixture object."
    });
    return;
  }

  validateNonEmptyString(value["id"], `${path}.id`, issues);
  validateFixture(value["fixture"], `${path}.fixture`, issues);
  validateSemanticTransformationRef(
    value["semanticTransformation"],
    `${path}.semanticTransformation`,
    issues
  );
  validateCorrespondenceMap(
    value["correspondenceMap"],
    `${path}.correspondenceMap`,
    issues
  );
  validateVisualMotifTimeline(
    value["visualMotifTimeline"],
    `${path}.visualMotifTimeline`,
    issues
  );
  validateArtifactExpectations(
    value["artifactExpectations"],
    `${path}.artifactExpectations`,
    issues
  );
  validateGeometryDiagnostics(
    value["geometryDiagnostics"],
    `${path}.geometryDiagnostics`,
    issues
  );
  validateNonEmptyString(value["summary"], `${path}.summary`, issues);
}

function validateSemanticTransformationRef(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!isRecord(value)) {
    issues.push({
      path,
      message: "Expected a semantic transformation reference object."
    });
    return;
  }

  validateNonEmptyString(value["id"], `${path}.id`, issues);
  validateNonEmptyString(value["kind"], `${path}.kind`, issues);
  validateStringArray(value["sourceObjectIds"], `${path}.sourceObjectIds`, issues);
  validateStringArray(value["targetObjectIds"], `${path}.targetObjectIds`, issues);
  validatePreservationArray(value["preserves"], `${path}.preserves`, issues);
  validateOptionalString(value["summary"], `${path}.summary`, issues);
}

function validatePreservationArray(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!Array.isArray(value)) {
    issues.push({
      path,
      message: "Expected a semantic preservation array."
    });
    return;
  }

  value.forEach((entry, index) =>
    validateKnownString<SemanticTransformationPreservation>(
      entry,
      `${path}[${index}]`,
      SEMANTIC_TRANSFORMATION_PRESERVATIONS,
      issues
    )
  );
}

function validateCorrespondenceMap(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!isRecord(value)) {
    issues.push({
      path,
      message: "Expected a correspondence map object."
    });
    return;
  }

  validateNonEmptyString(value["id"], `${path}.id`, issues);
  validateCorrespondenceRecords(value["records"], `${path}.records`, issues);
}

function validateCorrespondenceRecords(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!Array.isArray(value)) {
    issues.push({
      path,
      message: "Expected a correspondence record array."
    });
    return;
  }

  if (value.length === 0) {
    issues.push({
      path,
      message: "Expected at least one correspondence record."
    });
    return;
  }

  value.forEach((record, index) =>
    validateCorrespondenceRecord(record, `${path}[${index}]`, issues)
  );
}

function validateCorrespondenceRecord(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!isRecord(value)) {
    issues.push({
      path,
      message: "Expected a correspondence record object."
    });
    return;
  }

  validateNonEmptyString(value["id"], `${path}.id`, issues);
  validateKnownString(
    value["relation"],
    `${path}.relation`,
    SELECTOR_CORRESPONDENCE_RELATIONS,
    issues
  );
  validateStringArray(value["sourceSelectorIds"], `${path}.sourceSelectorIds`, issues);
  validateStringArray(value["targetSelectorIds"], `${path}.targetSelectorIds`, issues);
  validateNonEmptyString(value["summary"], `${path}.summary`, issues);

  if (
    Array.isArray(value["sourceSelectorIds"]) &&
    Array.isArray(value["targetSelectorIds"]) &&
    value["sourceSelectorIds"].length === 0 &&
    value["targetSelectorIds"].length === 0
  ) {
    issues.push({
      path,
      message:
        "Expected at least one source or target selector for a correspondence record."
    });
  }
}

function validateVisualMotifTimeline(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!isRecord(value)) {
    issues.push({
      path,
      message: "Expected a visual motif timeline object."
    });
    return;
  }

  validateNonEmptyString(value["id"], `${path}.id`, issues);
  validateVisualMotifSegments(value["segments"], `${path}.segments`, issues);
  validateVisualMotifPhases(
    value["forwardPhases"],
    `${path}.forwardPhases`,
    "forward",
    issues
  );
  validateVisualMotifPhases(
    value["rewindPhases"],
    `${path}.rewindPhases`,
    "rewind",
    issues
  );
  validateTransformTreeAnnotations(value["annotations"], `${path}.annotations`, issues);
}

function validateVisualMotifSegments(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!Array.isArray(value)) {
    issues.push({
      path,
      message: "Expected a visual motif segment array."
    });
    return;
  }

  if (value.length === 0) {
    issues.push({
      path,
      message: "Expected at least one visual motif segment."
    });
    return;
  }

  value.forEach((segment, index) =>
    validateVisualMotifSegment(segment, `${path}[${index}]`, issues)
  );
}

function validateVisualMotifSegment(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!isRecord(value)) {
    issues.push({
      path,
      message: "Expected a visual motif segment object."
    });
    return;
  }

  validateNonEmptyString(value["id"], `${path}.id`, issues);
  validateNonEmptyString(
    value["transformationNodeId"],
    `${path}.transformationNodeId`,
    issues
  );
  validateNonEmptyString(
    value["transformationKind"],
    `${path}.transformationKind`,
    issues
  );
  validateNonEmptyString(value["motifKind"], `${path}.motifKind`, issues);
  validateStringArray(value["sourceObjectIds"], `${path}.sourceObjectIds`, issues);
  validateStringArray(value["targetObjectIds"], `${path}.targetObjectIds`, issues);
  validateStringArray(
    value["motionPrimitiveIds"],
    `${path}.motionPrimitiveIds`,
    issues
  );
  validateStringArray(value["phaseIds"], `${path}.phaseIds`, issues);
  validateNonEmptyString(value["summary"], `${path}.summary`, issues);
}

function validateVisualMotifPhases(
  value: unknown,
  path: string,
  expectedDirection: "forward" | "rewind",
  issues: TransformFixtureValidationIssue[]
): void {
  if (!Array.isArray(value)) {
    issues.push({
      path,
      message: "Expected a visual motif phase array."
    });
    return;
  }

  if (value.length === 0) {
    issues.push({
      path,
      message: "Expected at least one visual motif phase."
    });
    return;
  }

  value.forEach((phase, index) =>
    validateVisualMotifPhase(
      phase,
      `${path}[${index}]`,
      expectedDirection,
      issues
    )
  );
}

function validateVisualMotifPhase(
  value: unknown,
  path: string,
  expectedDirection: "forward" | "rewind",
  issues: TransformFixtureValidationIssue[]
): void {
  if (!isRecord(value)) {
    issues.push({
      path,
      message: "Expected a visual motif phase object."
    });
    return;
  }

  validateNonEmptyString(value["id"], `${path}.id`, issues);

  if (value["direction"] !== expectedDirection) {
    issues.push({
      path: `${path}.direction`,
      message: `Expected ${expectedDirection} visual motif phase direction.`
    });
  }

  validateStringArray(value["segmentIds"], `${path}.segmentIds`, issues);
  validateAnnotationIdsByPlacement(
    value["annotationIdsByPlacement"],
    `${path}.annotationIdsByPlacement`,
    issues
  );
}

function validateAnnotationIdsByPlacement(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!isRecord(value)) {
    issues.push({
      path,
      message: "Expected annotation placement id groups."
    });
    return;
  }

  validateStringArray(value["before"], `${path}.before`, issues);
  validateStringArray(value["during"], `${path}.during`, issues);
  validateStringArray(value["after"], `${path}.after`, issues);
}

function validateTransformTreeAnnotations(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!Array.isArray(value)) {
    issues.push({
      path,
      message: "Expected transform tree annotation array."
    });
    return;
  }

  value.forEach((annotation, index) =>
    validateTransformTreeAnnotation(annotation, `${path}[${index}]`, issues)
  );
}

function validateTransformTreeAnnotation(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!isRecord(value)) {
    issues.push({
      path,
      message: "Expected transform tree annotation object."
    });
    return;
  }

  validateNonEmptyString(value["id"], `${path}.id`, issues);
  validateNonEmptyString(value["kind"], `${path}.kind`, issues);
  validateNonEmptyString(value["targetNodeId"], `${path}.targetNodeId`, issues);
  validateKnownString(
    value["placement"],
    `${path}.placement`,
    TRANSFORM_TREE_ANNOTATION_PLACEMENTS,
    issues
  );

  if (value["selectorIds"] !== undefined) {
    validateStringArray(value["selectorIds"], `${path}.selectorIds`, issues);
  }

  validateOptionalNonNegativeNumber(
    value["durationBeats"],
    `${path}.durationBeats`,
    issues
  );
  validateOptionalString(value["summary"], `${path}.summary`, issues);
}

function validateArtifactExpectations(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!Array.isArray(value)) {
    issues.push({
      path,
      message: "Expected an artifact expectation array."
    });
    return;
  }

  value.forEach((expectation, index) =>
    validateArtifactExpectation(expectation, `${path}[${index}]`, issues)
  );
}

function validateArtifactExpectation(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!isRecord(value)) {
    issues.push({
      path,
      message: "Expected an artifact expectation object."
    });
    return;
  }

  validateNonEmptyString(value["id"], `${path}.id`, issues);
  validateKnownString<GeneratedKatexArtifactSide>(
    value["side"],
    `${path}.side`,
    GENERATED_KATEX_ARTIFACT_SIDES,
    issues
  );
  validateNonEmptyString(value["selectorId"], `${path}.selectorId`, issues);
  validateNonEmptyString(
    value["structuralTokenId"],
    `${path}.structuralTokenId`,
    issues
  );
  validateKnownString<GeneratedKatexArtifactKind>(
    value["artifactKind"],
    `${path}.artifactKind`,
    GENERATED_KATEX_ARTIFACT_KINDS,
    issues
  );
}

function validateGeometryDiagnostics(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!Array.isArray(value)) {
    issues.push({
      path,
      message: "Expected a geometry diagnostic array."
    });
    return;
  }

  if (value.length === 0) {
    issues.push({
      path,
      message: "Expected at least one geometry diagnostic."
    });
    return;
  }

  value.forEach((diagnostic, index) =>
    validateGeometryDiagnostic(diagnostic, `${path}[${index}]`, issues)
  );
}

function validateGeometryDiagnostic(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!isRecord(value)) {
    issues.push({
      path,
      message: "Expected a geometry diagnostic object."
    });
    return;
  }

  validateNonEmptyString(value["id"], `${path}.id`, issues);
  validateNonEmptyString(value["targetId"], `${path}.targetId`, issues);
  validateKnownString<GeneratedKatexGeometryMetric>(
    value["metric"],
    `${path}.metric`,
    GENERATED_KATEX_GEOMETRY_METRICS,
    issues
  );
  validateKnownString<GeneratedKatexGeometrySeverity>(
    value["severity"],
    `${path}.severity`,
    GENERATED_KATEX_GEOMETRY_SEVERITIES,
    issues
  );
  validateNonEmptyString(value["summary"], `${path}.summary`, issues);
}

function validateFixture(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!isRecord(value)) {
    issues.push({
      path,
      message: "Expected a fixture object."
    });
    return;
  }

  validateNonEmptyString(value["id"], `${path}.id`, issues);
  validateKnownString<KatexTransformFixtureFamily>(
    value["family"],
    `${path}.family`,
    KATEX_TRANSFORM_FIXTURE_FAMILIES,
    issues
  );
  validateKnownString<KatexTransformFixtureIntent>(
    value["intent"],
    `${path}.intent`,
    KATEX_TRANSFORM_FIXTURE_INTENTS,
    issues
  );
  validateFixtureSide(value["source"], `${path}.source`, issues);
  validateFixtureSide(value["target"], `${path}.target`, issues);
  validateExpectedStructuralTokens(
    value["expectedStructuralTokens"],
    `${path}.expectedStructuralTokens`,
    issues
  );
  validateRoleChanges(value["expectedRoleChanges"], `${path}.expectedRoleChanges`, issues);
  validateNonEmptyString(value["summary"], `${path}.summary`, issues);
}

function validateFixtureSide(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!isRecord(value)) {
    issues.push({
      path,
      message: "Expected a fixture side object."
    });
    return;
  }

  validateNonEmptyString(value["latex"], `${path}.latex`, issues);
  validateTokenArray(value["tokens"], `${path}.tokens`, issues);
}

function validateTokenArray(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!Array.isArray(value)) {
    issues.push({
      path,
      message: "Expected a token array."
    });
    return;
  }

  if (value.length === 0) {
    issues.push({
      path,
      message: "Expected at least one token."
    });
    return;
  }

  value.forEach((token, index) =>
    validateToken(token, `${path}[${index}]`, issues)
  );
}

function validateToken(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!isRecord(value)) {
    issues.push({
      path,
      message: "Expected a token object."
    });
    return;
  }

  validateNonEmptyString(value["text"], `${path}.text`, issues);
  validateNonEmptyString(value["signature"], `${path}.signature`, issues);
  validateKnownString<KatexTransformFixtureTokenRole>(
    value["role"],
    `${path}.role`,
    KATEX_TRANSFORM_TOKEN_ROLES,
    issues
  );
  validateOptionalKnownString<KatexTransformFixtureLayoutRole>(
    value["layoutRole"],
    `${path}.layoutRole`,
    KATEX_TRANSFORM_LAYOUT_ROLES,
    issues
  );
  validateOptionalString(value["selectorId"], `${path}.selectorId`, issues);
  validateOptionalMatrixPosition(
    value["matrixPosition"],
    `${path}.matrixPosition`,
    issues
  );
  validateInteger(value["row"], `${path}.row`, issues);
  validateInteger(value["column"], `${path}.column`, issues);
}

function validateExpectedStructuralTokens(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!isRecord(value)) {
    issues.push({
      path,
      message: "Expected structural token expectations."
    });
    return;
  }

  validateStringArray(value["source"], `${path}.source`, issues);
  validateStringArray(value["target"], `${path}.target`, issues);
}

function validateRoleChanges(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!Array.isArray(value)) {
    issues.push({
      path,
      message: "Expected a role-change array."
    });
    return;
  }

  value.forEach((change, index) => {
    const changePath = `${path}[${index}]`;

    if (!isRecord(change)) {
      issues.push({
        path: changePath,
        message: "Expected a role-change object."
      });
      return;
    }

    validateKnownString<KatexTransformFixtureTokenRole>(
      change["sourceRole"],
      `${changePath}.sourceRole`,
      KATEX_TRANSFORM_TOKEN_ROLES,
      issues
    );
    validateKnownString<KatexTransformFixtureTokenRole>(
      change["targetRole"],
      `${changePath}.targetRole`,
      KATEX_TRANSFORM_TOKEN_ROLES,
      issues
    );
    validateNonEmptyString(change["sourceText"], `${changePath}.sourceText`, issues);
    validateNonEmptyString(change["targetText"], `${changePath}.targetText`, issues);
  });
}

function validateOptionalMatrixPosition(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (value === undefined) {
    return;
  }

  if (!isRecord(value)) {
    issues.push({
      path,
      message: "Expected a matrix position object."
    });
    return;
  }

  validateNonNegativeInteger(value["row"], `${path}.row`, issues);
  validateNonNegativeInteger(value["column"], `${path}.column`, issues);
}

function validateStringArray(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!Array.isArray(value)) {
    issues.push({
      path,
      message: "Expected a string array."
    });
    return;
  }

  value.forEach((entry, index) =>
    validateNonEmptyString(entry, `${path}[${index}]`, issues)
  );
}

function validateKnownString<T extends string>(
  value: unknown,
  path: string,
  validValues: ReadonlySet<string>,
  issues: TransformFixtureValidationIssue[]
): value is T {
  if (typeof value !== "string" || !validValues.has(value)) {
    issues.push({
      path,
      message: "Expected a known contract value."
    });
    return false;
  }

  return true;
}

function validateOptionalKnownString<T extends string>(
  value: unknown,
  path: string,
  validValues: ReadonlySet<string>,
  issues: TransformFixtureValidationIssue[]
): value is T | undefined {
  if (value === undefined) {
    return true;
  }

  return validateKnownString<T>(value, path, validValues, issues);
}

function validateOptionalString(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (value === undefined) {
    return;
  }

  validateNonEmptyString(value, path, issues);
}

function validateNonEmptyString(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): value is string {
  if (typeof value !== "string" || value.length === 0) {
    issues.push({
      path,
      message: "Expected a non-empty string."
    });
    return false;
  }

  return true;
}

function validateInteger(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): value is number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    issues.push({
      path,
      message: "Expected an integer."
    });
    return false;
  }

  return true;
}

function validateNonNegativeInteger(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): value is number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    issues.push({
      path,
      message: "Expected a non-negative integer."
    });
    return false;
  }

  return true;
}

function validateOptionalNonNegativeNumber(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (value === undefined) {
    return;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    issues.push({
      path,
      message: "Expected a non-negative number."
    });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
