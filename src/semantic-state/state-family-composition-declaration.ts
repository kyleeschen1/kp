import type {
  KpSemanticStateFamilyApplicationRecord
} from "./state-family-definition.ts";

// Canonical/reverse endpoint comparison covers every order only for a pair.
// Larger cohorts need a separately verified read/write capability contract.
export const kpSemanticStateIndependentCohortMaximumMembers = 2;

export interface KpSemanticStateCompositionMemberDeclaration<
  Parameters = unknown,
  Name extends string = string
> {
  readonly schemaVersion: "kp.semantic-state-composition-node.v1";
  readonly kind: "member";
  readonly name: Name;
  readonly sourceId: string;
  readonly application: KpSemanticStateFamilyApplicationRecord<Parameters>;
}

export interface KpSemanticStateCompositionSequenceDeclaration<
  Members extends readonly KpSemanticStateCompositionNodeDeclaration[] =
    readonly KpSemanticStateCompositionNodeDeclaration[],
  Name extends string = string
> {
  readonly schemaVersion: "kp.semantic-state-composition-node.v1";
  readonly kind: "sequence";
  readonly name: Name;
  readonly sourceId: string;
  readonly members: Members;
}

export interface KpSemanticStateCompositionGroupDeclaration<
  Body extends KpSemanticStateCompositionNodeDeclaration =
    KpSemanticStateCompositionNodeDeclaration,
  Name extends string = string
> {
  readonly schemaVersion: "kp.semantic-state-composition-node.v1";
  readonly kind: "group";
  readonly name: Name;
  readonly sourceId: string;
  readonly body: Body;
}

export interface KpSemanticStateCompositionIndependenceEvidence {
  readonly schemaVersion:
    "kp.semantic-state-composition-independence-evidence.v1";
  readonly kind: "demonstrated-independence";
  readonly id: string;
  readonly sourceId: string;
}

export interface KpSemanticStateCompositionIndependentDeclaration<
  Members extends readonly KpSemanticStateCompositionMemberDeclaration[] =
    readonly KpSemanticStateCompositionMemberDeclaration[],
  Name extends string = string
> {
  readonly schemaVersion: "kp.semantic-state-composition-node.v1";
  readonly kind: "independent";
  readonly name: Name;
  readonly sourceId: string;
  readonly evidence: KpSemanticStateCompositionIndependenceEvidence;
  readonly members: Members;
}

export type KpSemanticStateCompositionNodeDeclaration =
  | KpSemanticStateCompositionMemberDeclaration
  | KpSemanticStateCompositionSequenceDeclaration
  | KpSemanticStateCompositionGroupDeclaration
  | KpSemanticStateCompositionIndependentDeclaration;

export interface KpSemanticStateCompositionDeclaration<
  Root extends KpSemanticStateCompositionNodeDeclaration =
    KpSemanticStateCompositionNodeDeclaration
> {
  readonly schemaVersion: "kp.semantic-state-composition-declaration.v1";
  readonly kind: "semantic-state-composition-declaration";
  readonly namespace: string;
  readonly localId: string;
  readonly sourceId: string;
  readonly root: Root;
}

export type KpSemanticStateCompositionDeclarationErrorCode =
  | "ambiguous-declaration-shape"
  | "empty-independent-cohort"
  | "empty-sequence"
  | "invalid-declaration-identity"
  | "invalid-declaration-shape"
  | "invalid-declaration-source"
  | "recursive-declaration"
  | "unsupported-independent-cohort-size";

export class KpSemanticStateCompositionDeclarationError extends Error {
  readonly code: KpSemanticStateCompositionDeclarationErrorCode;
  readonly declarationPath: readonly string[];

  constructor(input: {
    readonly code: KpSemanticStateCompositionDeclarationErrorCode;
    readonly path: readonly string[];
    readonly message: string;
  }) {
    super(input.message);
    this.name = "KpSemanticStateCompositionDeclarationError";
    this.code = input.code;
    this.declarationPath = Object.freeze([...input.path]);
  }
}

export function declareKpSemanticStateCompositionMember<
  Parameters,
  const Name extends string
>(input: {
  readonly name: Name;
  readonly sourceId: string;
  readonly application: KpSemanticStateFamilyApplicationRecord<Parameters>;
}): KpSemanticStateCompositionMemberDeclaration<Parameters, Name> {
  return Object.freeze({
    schemaVersion: "kp.semantic-state-composition-node.v1",
    kind: "member",
    name: requireIdentity(input.name, "member name", []),
    sourceId: requireSource(input.sourceId, []),
    application: input.application
  });
}

export function declareKpSemanticStateCompositionSequence<
  const Name extends string,
  const Members extends readonly KpSemanticStateCompositionNodeDeclaration[]
>(input: {
  readonly name: Name;
  readonly sourceId: string;
  readonly members: Members;
}): KpSemanticStateCompositionSequenceDeclaration<Members, Name> {
  if (input.members.length === 0) {
    fail("empty-sequence", [input.name], "A composition sequence requires at least one member.");
  }
  return Object.freeze({
    schemaVersion: "kp.semantic-state-composition-node.v1",
    kind: "sequence",
    name: requireIdentity(input.name, "sequence name", []),
    sourceId: requireSource(input.sourceId, []),
    members: freezeDeclarationTuple(input.members)
  });
}

export function declareKpSemanticStateCompositionGroup<
  const Name extends string,
  const Body extends KpSemanticStateCompositionNodeDeclaration
>(input: {
  readonly name: Name;
  readonly sourceId: string;
  readonly body: Body;
}): KpSemanticStateCompositionGroupDeclaration<Body, Name> {
  return Object.freeze({
    schemaVersion: "kp.semantic-state-composition-node.v1",
    kind: "group",
    name: requireIdentity(input.name, "group name", []),
    sourceId: requireSource(input.sourceId, []),
    body: input.body
  });
}

export function declareKpSemanticStateCompositionIndependent<
  const Name extends string,
  const Members extends readonly KpSemanticStateCompositionMemberDeclaration[]
>(input: {
  readonly name: Name;
  readonly sourceId: string;
  readonly evidence: {
    readonly id: string;
    readonly sourceId: string;
  };
  readonly members: Members;
}): KpSemanticStateCompositionIndependentDeclaration<Members, Name> {
  if (input.members.length === 0) {
    fail(
      "empty-independent-cohort",
      [input.name],
      "A demonstrated-independent cohort requires at least one member."
    );
  }
  requireSupportedIndependentSize(input.members.length, [input.name]);
  return Object.freeze({
    schemaVersion: "kp.semantic-state-composition-node.v1",
    kind: "independent",
    name: requireIdentity(input.name, "independent cohort name", []),
    sourceId: requireSource(input.sourceId, []),
    evidence: Object.freeze({
      schemaVersion:
        "kp.semantic-state-composition-independence-evidence.v1",
      kind: "demonstrated-independence",
      id: requireIdentity(input.evidence.id, "independence evidence id", []),
      sourceId: requireSource(input.evidence.sourceId, [])
    }),
    // Declaration order has no semantic authority for an independent cohort.
    // Compilation later chooses a canonical internal endpoint order.
    members: freezeDeclarationTuple(input.members)
  });
}

export function declareKpSemanticStateComposition<
  const Root extends KpSemanticStateCompositionNodeDeclaration
>(input: {
  readonly namespace: string;
  readonly localId: string;
  readonly sourceId: string;
  readonly root: Root;
}): KpSemanticStateCompositionDeclaration<Root> {
  const namespace = requireIdentity(input.namespace, "namespace", []);
  const localId = requireIdentity(input.localId, "composition id", []);
  const sourceId = requireSource(input.sourceId, []);
  validateNodeShape(input.root, [], new Set<object>());
  return Object.freeze({
    schemaVersion: "kp.semantic-state-composition-declaration.v1",
    kind: "semantic-state-composition-declaration",
    namespace,
    localId,
    sourceId,
    root: input.root
  });
}

const identityPattern = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/u;

function requireIdentity<const Value extends string>(
  value: Value,
  label: string,
  path: readonly string[]
): Value {
  if (!identityPattern.test(value)) {
    fail(
      "invalid-declaration-identity",
      path,
      `Invalid semantic state composition ${label} ${JSON.stringify(value)}.`
    );
  }
  return value;
}

function freezeDeclarationTuple<const Values extends readonly unknown[]>(
  values: Values
): Values {
  return Object.freeze([...values]) as unknown as Values;
}

function requireSource(value: string, path: readonly string[]): string {
  if (value.length === 0 || value.trim() !== value) {
    fail(
      "invalid-declaration-source",
      path,
      "A semantic state composition declaration requires a non-empty trimmed source id."
    );
  }
  return value;
}

function validateNodeShape(
  node: KpSemanticStateCompositionNodeDeclaration,
  path: readonly string[],
  ancestors: Set<object>
): void {
  if (typeof node !== "object" || node === null) {
    fail("invalid-declaration-shape", path, "A composition node must be an object.");
  }
  if (ancestors.has(node)) {
    fail("recursive-declaration", path, "A composition declaration cannot contain a cycle.");
  }
  ancestors.add(node);
  const nodePath = [...path, typeof node.name === "string" ? node.name : "?"];
  requireIdentity(node.name, "node name", nodePath);
  requireSource(node.sourceId, nodePath);
  if (node.schemaVersion !== "kp.semantic-state-composition-node.v1") {
    fail("invalid-declaration-shape", nodePath, "A composition node has an unsupported schema version.");
  }

  if (node.kind === "member") {
    rejectShapeExtras(node, ["application", "kind", "name", "schemaVersion", "sourceId"], nodePath);
  } else if (node.kind === "sequence") {
    rejectShapeExtras(node, ["kind", "members", "name", "schemaVersion", "sourceId"], nodePath);
    if (!Array.isArray(node.members) || node.members.length === 0) {
      fail("empty-sequence", nodePath, "A composition sequence requires at least one member.");
    }
    node.members.forEach((member) => validateNodeShape(member, nodePath, ancestors));
  } else if (node.kind === "group") {
    rejectShapeExtras(node, ["body", "kind", "name", "schemaVersion", "sourceId"], nodePath);
    validateNodeShape(node.body, nodePath, ancestors);
  } else if (node.kind === "independent") {
    rejectShapeExtras(node, ["evidence", "kind", "members", "name", "schemaVersion", "sourceId"], nodePath);
    if (!Array.isArray(node.members) || node.members.length === 0) {
      fail("empty-independent-cohort", nodePath, "A demonstrated-independent cohort requires at least one member.");
    }
    requireSupportedIndependentSize(node.members.length, nodePath);
    for (const member of node.members) {
      if (member.kind !== "member") {
        fail("invalid-declaration-shape", nodePath, "An independent cohort contains only transition members.");
      }
      validateNodeShape(member, nodePath, ancestors);
    }
  } else {
    fail("invalid-declaration-shape", nodePath, "A composition node has an unknown kind.");
  }
  ancestors.delete(node);
}

function requireSupportedIndependentSize(
  size: number,
  path: readonly string[]
): void {
  if (size > kpSemanticStateIndependentCohortMaximumMembers) {
    fail(
      "unsupported-independent-cohort-size",
      path,
      "Independent cohorts support at most two members under endpoint-order checking; use an explicit ordered sequence for larger groups."
    );
  }
}

function rejectShapeExtras(
  value: object,
  allowedKeys: readonly string[],
  path: readonly string[]
): void {
  const extras = Object.keys(value).filter((key) => !allowedKeys.includes(key));
  if (extras.length > 0) {
    fail(
      "ambiguous-declaration-shape",
      path,
      `Composition node contains fields owned by another form: ${extras.join(", ")}.`
    );
  }
}

function fail(
  code: KpSemanticStateCompositionDeclarationErrorCode,
  path: readonly string[],
  message: string
): never {
  throw new KpSemanticStateCompositionDeclarationError({ code, path, message });
}
