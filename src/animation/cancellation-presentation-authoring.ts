import type {
  KpSemanticTransformation
} from "../semantic/asset-transformation.ts";
const kpVerifiedCancellationPresentationAuthority =
  Symbol("kp.verified-cancellation-presentation-authority");

export interface KpCancellationPresentationSelectorBundle {
  readonly id: string;
  readonly selectorIds: readonly string[];
}

export interface KpCancellationPresentationSurvivor {
  readonly id: string;
  readonly sourceSelectorIds: readonly string[];
  readonly targetSelectorIds: readonly string[];
}

export interface KpCancellationPresentationAuthoringDraft {
  readonly schemaVersion: "kp.cancellation-presentation-authoring.v1";
  readonly id: string;
  readonly transformationId: string;
  readonly cancellationRecordId: string;
  readonly inverseBundles: readonly [
    KpCancellationPresentationSelectorBundle,
    KpCancellationPresentationSelectorBundle
  ];
  readonly catalysts: readonly KpCancellationPresentationSelectorBundle[];
  readonly artifacts: readonly KpCancellationPresentationSelectorBundle[];
  readonly survivors: readonly KpCancellationPresentationSurvivor[];
}

export interface KpVerifiedCancellationPresentationAuthoring
  extends KpCancellationPresentationAuthoringDraft {
  readonly [kpVerifiedCancellationPresentationAuthority]: true;
}

export interface KpCancellationPresentationAuthoringIssue {
  readonly code:
    | "schema.invalid"
    | "authority.mismatch"
    | "relation.invalid"
    | "bundle.invalid"
    | "selector.ambiguous"
    | "selector.missing"
    | "selector.foreign"
    | "role.invalid";
  readonly path: string;
  readonly message: string;
}

export type KpCancellationPresentationAuthoringResult =
  | {
      readonly status: "verified";
      readonly authoring: KpVerifiedCancellationPresentationAuthoring;
    }
  | {
      readonly status: "invalid";
      readonly issues: readonly KpCancellationPresentationAuthoringIssue[];
    };

/**
 * Survivors and retiring structure are already authoritative correspondence
 * facts, so canonical families share this projection. Inverse pairing and
 * catalysts remain explicitly authored because neither may be inferred from
 * selector text, DOM order, or visual proximity.
 */
export function deriveKpCancellationPresentationRoleComplements(input: {
  readonly transformation: Pick<
    KpSemanticTransformation,
    "correspondenceMap"
  >;
  readonly bundleNamespace: string;
}): Pick<
  KpCancellationPresentationAuthoringDraft,
  "artifacts" | "survivors"
> {
  if (input.bundleNamespace.trim().length === 0) {
    throw new Error(
      "Cancellation presentation complements require a bundle namespace."
    );
  }
  const records = input.transformation.correspondenceMap?.records ?? [];
  return Object.freeze({
    artifacts: Object.freeze(records
      .filter(({ relation }) =>
        relation === "removal" || relation === "artifact"
      )
      .map((record) => Object.freeze({
        id: `${input.bundleNamespace}.artifact.${record.id}`,
        selectorIds: Object.freeze([...record.sourceSelectorIds])
      }))),
    survivors: Object.freeze(records
      .filter(({ relation }) =>
        relation === "identity" || relation === "role-change"
      )
      .map((record) => Object.freeze({
        id: `${input.bundleNamespace}.survivor.${record.id}`,
        sourceSelectorIds: Object.freeze([...record.sourceSelectorIds]),
        targetSelectorIds: Object.freeze([...record.targetSelectorIds])
      })))
  });
}

/**
 * This trusted boundary validates authored semantic roles against canonical
 * correspondence records. It never infers inverse pairs from glyph equality,
 * DOM proximity, or measured paths.
 */
export function validateAndMintKpCancellationPresentationAuthoring(input: {
  readonly transformation: Pick<
    KpSemanticTransformation,
    "id" | "correspondenceMap"
  >;
  readonly draft: KpCancellationPresentationAuthoringDraft;
}): KpCancellationPresentationAuthoringResult {
  const issues: KpCancellationPresentationAuthoringIssue[] = [];
  if (!hasExactDraftShape(input.draft, issues)) {
    return invalidResult(issues);
  }
  const draft = input.draft;
  if (draft.transformationId !== input.transformation.id) {
    issues.push({
      code: "authority.mismatch",
      path: "transformationId",
      message:
        `Cancellation authoring ${draft.id} names ${draft.transformationId}, ` +
        `expected ${input.transformation.id}.`
    });
  }
  const records = input.transformation.correspondenceMap?.records ?? [];
  const cancellation = records.find(
    ({ id }) => id === draft.cancellationRecordId
  );
  if (cancellation?.relation !== "cancelation") {
    issues.push({
      code: "relation.invalid",
      path: "cancellationRecordId",
      message:
        `Cancellation authoring ${draft.id} requires a canonical ` +
        "cancelation correspondence record."
    });
  }

  const bundles = [
    ...draft.inverseBundles,
    ...draft.catalysts,
    ...draft.artifacts
  ];
  requireUniqueNonempty(
    bundles.map(({ id }) => id),
    "bundles",
    issues
  );
  bundles.forEach((bundle, index) => {
    requireUniqueNonempty(
      bundle.selectorIds,
      `bundles[${index}].selectorIds`,
      issues
    );
  });
  requireUniqueNonempty(
    draft.survivors.map(({ id }) => id),
    "survivors",
    issues,
    true
  );
  draft.survivors.forEach((survivor, index) => {
    requireUniqueNonempty(
      survivor.sourceSelectorIds,
      `survivors[${index}].sourceSelectorIds`,
      issues
    );
    requireUniqueNonempty(
      survivor.targetSelectorIds,
      `survivors[${index}].targetSelectorIds`,
      issues
    );
    if (!records.some((record) =>
      (record.relation === "identity" || record.relation === "role-change") &&
      sameSet(record.sourceSelectorIds, survivor.sourceSelectorIds) &&
      sameSet(record.targetSelectorIds, survivor.targetSelectorIds)
    )) {
      issues.push({
        code: "role.invalid",
        path: `survivors[${index}]`,
        message:
          `Survivor ${survivor.id} must match one canonical identity or ` +
          "role-change record."
      });
    }
  });

  const inverseSelectorIds = draft.inverseBundles.flatMap(
    ({ selectorIds }) => selectorIds
  );
  const catalystSelectorIds = draft.catalysts.flatMap(
    ({ selectorIds }) => selectorIds
  );
  const artifactSelectorIds = draft.artifacts.flatMap(
    ({ selectorIds }) => selectorIds
  );
  const survivorSourceIds = draft.survivors.flatMap(
    ({ sourceSelectorIds }) => sourceSelectorIds
  );
  const survivorTargetIds = draft.survivors.flatMap(
    ({ targetSelectorIds }) => targetSelectorIds
  );
  const authoredSourceIds = [
    ...inverseSelectorIds,
    ...catalystSelectorIds,
    ...artifactSelectorIds,
    ...survivorSourceIds
  ];
  requireUniqueOwnership(authoredSourceIds, "source", issues);
  requireUniqueOwnership(survivorTargetIds, "target", issues);
  requireExactCoverage(
    authoredSourceIds,
    records.flatMap(({ sourceSelectorIds }) => sourceSelectorIds),
    "source",
    issues
  );
  requireExactCoverage(
    survivorTargetIds,
    records.flatMap(({ targetSelectorIds }) => targetSelectorIds),
    "target",
    issues
  );

  if (cancellation !== undefined) {
    const cancellationIds = new Set(cancellation.sourceSelectorIds);
    for (const selectorId of [
      ...inverseSelectorIds,
      ...catalystSelectorIds
    ]) {
      if (!cancellationIds.has(selectorId)) {
        issues.push({
          code: "role.invalid",
          path: `selectors[${selectorId}]`,
          message:
            `Inverse or catalyst selector ${selectorId} is outside the ` +
            "canonical cancellation record."
        });
      }
    }
    const classifiedCancellation = new Set([
      ...inverseSelectorIds,
      ...catalystSelectorIds,
      ...artifactSelectorIds
    ]);
    for (const selectorId of cancellation.sourceSelectorIds) {
      if (!classifiedCancellation.has(selectorId)) {
        issues.push({
          code: "selector.missing",
          path: `selectors[${selectorId}]`,
          message:
            `Cancellation selector ${selectorId} lacks inverse, catalyst, ` +
            "or artifact classification."
        });
      }
    }
  }

  const structuralRecordSelectorIds = new Set(
    records
      .filter(({ relation }) =>
        relation === "removal" ||
        relation === "artifact" ||
        relation === "cancelation"
      )
      .flatMap(({ sourceSelectorIds }) => sourceSelectorIds)
  );
  artifactSelectorIds.forEach((selectorId) => {
    if (!structuralRecordSelectorIds.has(selectorId)) {
      issues.push({
        code: "role.invalid",
        path: `selectors[${selectorId}]`,
        message:
          `Artifact selector ${selectorId} lacks removal, artifact, or ` +
          "cancellation authority."
      });
    }
  });

  if (issues.length > 0) return invalidResult(issues);
  return Object.freeze({
    status: "verified",
    authoring: freezeVerifiedDraft(draft)
  });
}

export function isKpVerifiedCancellationPresentationAuthoring(
  value: unknown
): value is KpVerifiedCancellationPresentationAuthoring {
  return typeof value === "object" && value !== null &&
    (value as Record<PropertyKey, unknown>)[
      kpVerifiedCancellationPresentationAuthority
    ] === true;
}

function hasExactDraftShape(
  value: unknown,
  issues: KpCancellationPresentationAuthoringIssue[]
): value is KpCancellationPresentationAuthoringDraft {
  if (!isRecord(value) || !hasKeys(value, [
    "schemaVersion",
    "id",
    "transformationId",
    "cancellationRecordId",
    "inverseBundles",
    "catalysts",
    "artifacts",
    "survivors"
  ])) {
    issues.push({
      code: "schema.invalid",
      path: "$",
      message: "Cancellation authoring has unknown or missing fields."
    });
    return false;
  }
  if (
    value["schemaVersion"] !== "kp.cancellation-presentation-authoring.v1" ||
    !isText(value["id"]) ||
    !isText(value["transformationId"]) ||
    !isText(value["cancellationRecordId"]) ||
    !Array.isArray(value["inverseBundles"]) ||
    value["inverseBundles"].length !== 2 ||
    !value["inverseBundles"].every(isBundle) ||
    !Array.isArray(value["catalysts"]) ||
    !value["catalysts"].every(isBundle) ||
    !Array.isArray(value["artifacts"]) ||
    !value["artifacts"].every(isBundle) ||
    !Array.isArray(value["survivors"]) ||
    !value["survivors"].every(isSurvivor)
  ) {
    issues.push({
      code: "schema.invalid",
      path: "$",
      message:
        "Cancellation authoring requires two inverse bundles and explicit " +
        "catalyst, artifact, and survivor arrays."
    });
    return false;
  }
  return true;
}

function isBundle(value: unknown): value is
  KpCancellationPresentationSelectorBundle {
  return isRecord(value) &&
    hasKeys(value, ["id", "selectorIds"]) &&
    isText(value["id"]) &&
    isTextArray(value["selectorIds"]);
}

function isSurvivor(value: unknown): value is
  KpCancellationPresentationSurvivor {
  return isRecord(value) &&
    hasKeys(value, ["id", "sourceSelectorIds", "targetSelectorIds"]) &&
    isText(value["id"]) &&
    isTextArray(value["sourceSelectorIds"]) &&
    isTextArray(value["targetSelectorIds"]);
}

function freezeVerifiedDraft(
  draft: KpCancellationPresentationAuthoringDraft
): KpVerifiedCancellationPresentationAuthoring {
  const verified = {
    ...draft,
    inverseBundles: Object.freeze(draft.inverseBundles.map(freezeBundle)) as
      unknown as KpCancellationPresentationAuthoringDraft["inverseBundles"],
    catalysts: Object.freeze(draft.catalysts.map(freezeBundle)),
    artifacts: Object.freeze(draft.artifacts.map(freezeBundle)),
    survivors: Object.freeze(draft.survivors.map((survivor) =>
      Object.freeze({
        ...survivor,
        sourceSelectorIds: Object.freeze([...survivor.sourceSelectorIds]),
        targetSelectorIds: Object.freeze([...survivor.targetSelectorIds])
      })
    ))
  };
  Object.defineProperty(
    verified,
    kpVerifiedCancellationPresentationAuthority,
    { value: true, enumerable: false }
  );
  return Object.freeze(verified) as
    KpVerifiedCancellationPresentationAuthoring;
}

function freezeBundle(bundle: KpCancellationPresentationSelectorBundle) {
  return Object.freeze({
    ...bundle,
    selectorIds: Object.freeze([...bundle.selectorIds])
  });
}

function requireUniqueNonempty(
  values: readonly string[],
  path: string,
  issues: KpCancellationPresentationAuthoringIssue[],
  allowEmpty = false
): void {
  if (
    (!allowEmpty && values.length === 0) ||
    values.some((value) => value.trim().length === 0) ||
    new Set(values).size !== values.length
  ) {
    issues.push({
      code: "bundle.invalid",
      path,
      message: `${path} must contain unique, non-empty ids.`
    });
  }
}

function requireUniqueOwnership(
  selectorIds: readonly string[],
  side: "source" | "target",
  issues: KpCancellationPresentationAuthoringIssue[]
): void {
  const seen = new Set<string>();
  selectorIds.forEach((selectorId) => {
    if (seen.has(selectorId)) {
      issues.push({
        code: "selector.ambiguous",
        path: `${side}Selectors[${selectorId}]`,
        message:
          `${side} selector ${selectorId} has multiple presentation roles.`
      });
    }
    seen.add(selectorId);
  });
}

function requireExactCoverage(
  authored: readonly string[],
  expected: readonly string[],
  side: "source" | "target",
  issues: KpCancellationPresentationAuthoringIssue[]
): void {
  const authoredSet = new Set(authored);
  const expectedSet = new Set(expected);
  expectedSet.forEach((selectorId) => {
    if (!authoredSet.has(selectorId)) {
      issues.push({
        code: "selector.missing",
        path: `${side}Selectors[${selectorId}]`,
        message: `${side} selector ${selectorId} has no presentation role.`
      });
    }
  });
  authoredSet.forEach((selectorId) => {
    if (!expectedSet.has(selectorId)) {
      issues.push({
        code: "selector.foreign",
        path: `${side}Selectors[${selectorId}]`,
        message: `${side} selector ${selectorId} is foreign to the transition.`
      });
    }
  });
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    new Set(left).size === left.length &&
    left.every((value) => right.includes(value));
}

function invalidResult(
  issues: readonly KpCancellationPresentationAuthoringIssue[]
): KpCancellationPresentationAuthoringResult {
  return Object.freeze({
    status: "invalid",
    issues: Object.freeze(issues.map((issue) => Object.freeze(issue)))
  });
}

function hasKeys(
  value: Readonly<Record<string, unknown>>,
  keys: readonly string[]
): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isTextArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(isText);
}
