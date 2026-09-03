import {
  type KpSemanticStateGroupDescriptor,
  type KpSemanticStateLeafDescriptor,
  type KpSemanticStateMemberMap
} from "./authoring-schema.ts";
import {
  createKpSemanticStateIdentityScope,
  type KpSemanticDerivationId,
  type KpSemanticEntityId,
  type KpSemanticSlotId,
  type KpSemanticStateIdentityScope
} from "./identity.ts";

const reservedMemberNames = new Set([
  "__proto__",
  "constructor",
  "prototype"
]);

export type KpSemanticStateSchemaCompileErrorCode =
  | "descriptor-cycle"
  | "duplicate-path"
  | "invalid-member-name"
  | "invalid-schema-node"
  | "reserved-member-name"
  | "symbol-member-name";

export class KpSemanticStateSchemaCompileError extends Error {
  readonly code: KpSemanticStateSchemaCompileErrorCode;
  readonly path: readonly string[];

  constructor(input: {
    readonly code: KpSemanticStateSchemaCompileErrorCode;
    readonly path: readonly string[];
    readonly message: string;
  }) {
    super(input.message);
    this.name = "KpSemanticStateSchemaCompileError";
    this.code = input.code;
    this.path = Object.freeze([...input.path]);
  }
}

export interface KpSemanticStateLeafIdentityDefaults {
  readonly slotId: KpSemanticSlotId;
  readonly initialEntityId: KpSemanticEntityId;
  readonly derivationId: KpSemanticDerivationId;
  readonly sourceIds: Readonly<{
    initialValue: string;
    initialAbsence: string;
    derivation: string;
  }>;
  readonly operationIds: Readonly<{
    update: string;
    bind: string;
    bindCopy: string;
    introduce: string;
    remove: string;
    derive: string;
  }>;
}

export interface KpCompiledSemanticStateLeaf {
  readonly schemaVersion: "kp.compiled-semantic-state-leaf.v1";
  readonly kind: "compiled-semantic-state-leaf";
  readonly path: readonly string[];
  readonly encodedPath: string;
  readonly descriptor: KpSemanticStateLeafDescriptor;
  readonly identities: KpSemanticStateLeafIdentityDefaults;
}

export interface KpCompiledSemanticStateSchema<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly schemaVersion: "kp.compiled-semantic-state-schema.v1";
  readonly kind: "compiled-semantic-state-schema";
  readonly namespace: string;
  readonly root: Root;
  readonly identityScope: KpSemanticStateIdentityScope;
  readonly leaves: readonly KpCompiledSemanticStateLeaf[];
  readonly leafIndex: Readonly<Record<string, number>>;
}

export function compileKpSemanticStateSchema<
  const Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(
  namespace: string,
  root: Root
): KpCompiledSemanticStateSchema<Root> {
  const identityScope = createKpSemanticStateIdentityScope(namespace);
  const leaves: KpCompiledSemanticStateLeaf[] = [];
  visitGroup(root, [], new Set<object>(), identityScope, leaves);
  const leafIndex: Record<string, number> = {};
  leaves.forEach((leaf, index) => {
    if (leafIndex[leaf.encodedPath] !== undefined) {
      throw new KpSemanticStateSchemaCompileError({
        code: "duplicate-path",
        path: leaf.path,
        message: `Semantic state schema path ${JSON.stringify(leaf.path)} collides with another encoded path.`
      });
    }
    leafIndex[leaf.encodedPath] = index;
  });

  return Object.freeze<KpCompiledSemanticStateSchema<Root>>({
    schemaVersion: "kp.compiled-semantic-state-schema.v1",
    kind: "compiled-semantic-state-schema",
    namespace: identityScope.namespace,
    root,
    identityScope,
    leaves: Object.freeze(leaves),
    leafIndex: Object.freeze(leafIndex)
  });
}

export function encodeKpSemanticStatePathSegment(segment: string): string {
  requireMemberName(segment, []);
  if (/^[a-y][a-z0-9]*(?:[_-][a-z0-9]+)*$/u.test(segment)) {
    return segment;
  }
  // A reserved leading z makes the readable and UTF-16-escaped forms disjoint.
  let encoded = "z";
  for (let index = 0; index < segment.length; index += 1) {
    encoded += segment.charCodeAt(index).toString(16).padStart(4, "0");
  }
  return encoded;
}

function visitGroup(
  group: KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>,
  path: readonly string[],
  ancestors: Set<object>,
  identityScope: KpSemanticStateIdentityScope,
  leaves: KpCompiledSemanticStateLeaf[]
): void {
  assertSchemaNode(group, path, "group");
  if (ancestors.has(group)) {
    throw new KpSemanticStateSchemaCompileError({
      code: "descriptor-cycle",
      path,
      message: `Semantic state schema group ${formatPath(path)} contains a descriptor cycle.`
    });
  }
  ancestors.add(group);
  try {
    const keys = Reflect.ownKeys(group.members);
    for (const key of keys) {
      if (typeof key !== "string") {
        throw new KpSemanticStateSchemaCompileError({
          code: "symbol-member-name",
          path,
          message: `Semantic state schema group ${formatPath(path)} may not contain symbol member names.`
        });
      }
    }
    const memberNames = keys
      .filter((key): key is string => typeof key === "string")
      .sort(compareStrings);
    for (const memberName of memberNames) {
      requireMemberName(memberName, path);
      const memberPath = [...path, memberName];
      const node = group.members[memberName];
      assertSchemaNode(node, memberPath);
      if (node.kind === "group") {
        visitGroup(node, memberPath, ancestors, identityScope, leaves);
      } else {
        leaves.push(createCompiledLeaf(node, memberPath, identityScope));
      }
    }
  } finally {
    ancestors.delete(group);
  }
}

function createCompiledLeaf(
  descriptor: KpSemanticStateLeafDescriptor,
  path: readonly string[],
  identityScope: KpSemanticStateIdentityScope
): KpCompiledSemanticStateLeaf {
  const encodedPath = path
    .map(encodeKpSemanticStatePathSegment)
    .join(".");
  const base = `schema.${encodedPath}`;
  return Object.freeze<KpCompiledSemanticStateLeaf>({
    schemaVersion: "kp.compiled-semantic-state-leaf.v1",
    kind: "compiled-semantic-state-leaf",
    path: Object.freeze([...path]),
    encodedPath,
    descriptor,
    identities: Object.freeze<KpSemanticStateLeafIdentityDefaults>({
      slotId: identityScope.slot(encodedPath),
      initialEntityId: identityScope.entity(`initial.${encodedPath}`),
      derivationId: identityScope.derivation(`derived.${encodedPath}`),
      sourceIds: Object.freeze<
        KpSemanticStateLeafIdentityDefaults["sourceIds"]
      >({
        initialValue: `${base}.initial-value`,
        initialAbsence: `${base}.initial-absence`,
        derivation: `${base}.derivation`
      }),
      operationIds: Object.freeze<
        KpSemanticStateLeafIdentityDefaults["operationIds"]
      >({
        update: `${base}.update`,
        bind: `${base}.bind`,
        bindCopy: `${base}.bind-copy`,
        introduce: `${base}.introduce`,
        remove: `${base}.remove`,
        derive: `${base}.derive`
      })
    })
  });
}

function assertSchemaNode(
  value: unknown,
  path: readonly string[],
  expectedKind?: "group"
): asserts value is KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap> |
KpSemanticStateLeafDescriptor {
  if (value === null || typeof value !== "object") {
    invalidSchemaNode(path);
  }
  const candidate = value as Partial<{
    readonly schemaVersion: string;
    readonly kind: string;
    readonly members: unknown;
  }>;
  const allowedKind = candidate.kind === "group" ||
    candidate.kind === "required-value" ||
    candidate.kind === "optional-value" ||
    candidate.kind === "derived-value";
  if (candidate.schemaVersion !== "kp.semantic-state-schema-node.v1" ||
      !allowedKind ||
      (expectedKind !== undefined && candidate.kind !== expectedKind) ||
      (candidate.kind === "group" &&
        (candidate.members === null || typeof candidate.members !== "object"))) {
    invalidSchemaNode(path);
  }
}

function invalidSchemaNode(path: readonly string[]): never {
  throw new KpSemanticStateSchemaCompileError({
    code: "invalid-schema-node",
    path,
    message: `Semantic state schema path ${formatPath(path)} is not a declared schema descriptor.`
  });
}

function requireMemberName(
  memberName: string,
  parentPath: readonly string[]
): void {
  const path = [...parentPath, memberName];
  if (memberName.length === 0 || memberName.trim() !== memberName) {
    throw new KpSemanticStateSchemaCompileError({
      code: "invalid-member-name",
      path,
      message: `Semantic state schema member ${JSON.stringify(memberName)} must be non-empty and trimmed.`
    });
  }
  if (reservedMemberNames.has(memberName)) {
    throw new KpSemanticStateSchemaCompileError({
      code: "reserved-member-name",
      path,
      message: `Semantic state schema member ${JSON.stringify(memberName)} is reserved for safe object traversal.`
    });
  }
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function formatPath(path: readonly string[]): string {
  return path.length === 0 ? "<root>" : JSON.stringify(path);
}
