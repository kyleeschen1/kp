export type KpOperationPresentationBundleRole =
  | "source-material"
  | "target-material"
  | "continuant"
  | "catalyst"
  | "artifact";

export interface KpOperationPresentationBundle {
  readonly kind: "operation-presentation-bundle";
  readonly id: string;
  readonly role: KpOperationPresentationBundleRole;
  readonly semanticEntityIds: readonly string[];
}

export type KpOperationPresentationGroupKind =
  | "branch"
  | "contact"
  | "fusion"
  | "fission";

export interface KpOperationPresentationGroup {
  readonly kind: "operation-presentation-group";
  readonly id: string;
  readonly groupKind: KpOperationPresentationGroupKind;
  readonly bundleIds: readonly string[];
}

export interface KpOperationPresentationRoles {
  readonly kind: "operation-presentation-roles";
  readonly bundles: readonly KpOperationPresentationBundle[];
  readonly groups: readonly KpOperationPresentationGroup[];
}

export function createKpOperationPresentationBundle(input: {
  readonly id: string;
  readonly role: KpOperationPresentationBundleRole;
  readonly semanticEntityIds: readonly string[];
}): KpOperationPresentationBundle {
  requireId(input.id, "operation presentation bundle");
  requireUniqueNonempty(
    input.semanticEntityIds,
    `operation presentation bundle ${input.id} entity`
  );
  return Object.freeze({
    kind: "operation-presentation-bundle",
    id: input.id,
    role: input.role,
    semanticEntityIds: Object.freeze([...input.semanticEntityIds])
  });
}

export function createKpOperationPresentationGroup(input: {
  readonly id: string;
  readonly groupKind: KpOperationPresentationGroupKind;
  readonly bundleIds: readonly string[];
}): KpOperationPresentationGroup {
  requireId(input.id, "operation presentation group");
  requireUniqueNonempty(
    input.bundleIds,
    `operation presentation group ${input.id} bundle`
  );
  // Contact is the only group whose participant cardinality is intrinsic.
  // Other group sizes are operation-plan laws rather than renderer guesses.
  if (input.groupKind === "contact" && input.bundleIds.length !== 2) {
    throw new Error(
      `Operation presentation contact ${input.id} requires exactly two bundles.`
    );
  }
  return Object.freeze({
    kind: "operation-presentation-group",
    id: input.id,
    groupKind: input.groupKind,
    bundleIds: Object.freeze([...input.bundleIds])
  });
}

export function createKpOperationPresentationRoles(input: {
  readonly bundles: readonly KpOperationPresentationBundle[];
  readonly groups?: readonly KpOperationPresentationGroup[] | undefined;
}): KpOperationPresentationRoles {
  const groups = input.groups ?? [];
  requireUniqueNonempty(
    input.bundles.map(({ id }) => id),
    "operation presentation bundle id"
  );
  requireUnique(groups.map(({ id }) => id), "operation presentation group id");
  return Object.freeze({
    kind: "operation-presentation-roles",
    bundles: Object.freeze(input.bundles.map(cloneBundle)),
    groups: Object.freeze(groups.map(cloneGroup))
  });
}

function cloneBundle(
  bundle: KpOperationPresentationBundle
): KpOperationPresentationBundle {
  return Object.freeze({
    ...bundle,
    semanticEntityIds: Object.freeze([...bundle.semanticEntityIds])
  });
}

function cloneGroup(
  group: KpOperationPresentationGroup
): KpOperationPresentationGroup {
  return Object.freeze({
    ...group,
    bundleIds: Object.freeze([...group.bundleIds])
  });
}

function requireId(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} id must not be empty.`);
  }
}

function requireUniqueNonempty(
  values: readonly string[],
  label: string
): void {
  if (values.length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
  requireUnique(values, label);
}

function requireUnique(values: readonly string[], label: string): void {
  if (
    values.some((value) => value.trim().length === 0) ||
    new Set(values).size !== values.length
  ) {
    throw new Error(`${label} values must be unique and non-empty.`);
  }
}

