import {
  isKpVerifiedRootRewritePlan,
  type KpRootRewriteOccurrence,
  type KpVerifiedRootRewritePlan
} from "./root-rewrite-plan.ts";

declare const kpRootPersistentSubtreeCertificateBrand: unique symbol;

export const KP_ROOT_PERSISTENT_SUBTREE_CERTIFICATE_AUTHORITY =
  "certificate.equation.root-persistent-subtree.v1" as const;

export interface KpRootSemanticSubtreeNode {
  readonly occurrence: KpRootRewriteOccurrence;
  readonly children: readonly KpRootSemanticSubtreeNode[];
}

export interface KpRootPersistentSubtreeCorrespondence {
  readonly path: readonly number[];
  readonly semanticId: string;
  readonly subtreeId: string;
  readonly sourceEntityId: string;
  readonly targetEntityId: string;
}

export type KpRootPersistentSubtreeCertificate = Readonly<{
  schemaVersion: "kp.root-persistent-subtree-certificate.v1";
  kind: "root-persistent-subtree-certificate";
  authority: typeof KP_ROOT_PERSISTENT_SUBTREE_CERTIFICATE_AUTHORITY;
  id: string;
  planId: string;
  sourceRootEntityId: string;
  targetRootEntityId: string;
  correspondences: readonly KpRootPersistentSubtreeCorrespondence[];
  readonly [kpRootPersistentSubtreeCertificateBrand]: true;
}>;

export type KpRootPersistentSubtreeErrorCode =
  | "root-subtree.invalid-plan"
  | "root-subtree.invalid-id"
  | "root-subtree.missing-persistent-disposition"
  | "root-subtree.repeated-node"
  | "root-subtree.identity-mismatch"
  | "root-subtree.shape-mismatch"
  | "root-subtree.entity-alias";

export class KpRootPersistentSubtreeError extends Error {
  override readonly name = "KpRootPersistentSubtreeError";
  readonly code: KpRootPersistentSubtreeErrorCode;

  constructor(code: KpRootPersistentSubtreeErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const verifiedCertificates = new WeakSet<object>();

/**
 * The outer plan proves that one carrier persists. This certificate closes the
 * deeper seam: every ordered descendant must preserve semantic and subtree
 * identity even though source and target paint occurrences are distinct.
 */
export function certifyKpRootPersistentSubtree(input: {
  readonly id: string;
  readonly plan: KpVerifiedRootRewritePlan;
  readonly source: KpRootSemanticSubtreeNode;
  readonly target: KpRootSemanticSubtreeNode;
}): KpRootPersistentSubtreeCertificate {
  requireId(input.id, "certificate id");
  if (!isKpVerifiedRootRewritePlan(input.plan)) {
    fail("root-subtree.invalid-plan",
      "Persistent subtree certification requires a verified root plan.");
  }
  const persistence = input.plan.dispositions.find(({ kind, sourceEntityIds,
    targetEntityIds }) => kind === "persist" &&
    sourceEntityIds.includes(input.source.occurrence.entityId) &&
    targetEntityIds.includes(input.target.occurrence.entityId));
  if (persistence === undefined) {
    fail("root-subtree.missing-persistent-disposition",
      "The verified plan does not persist the supplied subtree roots.");
  }
  validateTree(input.source, "source");
  validateTree(input.target, "target");
  const correspondences: KpRootPersistentSubtreeCorrespondence[] = [];
  compare(input.source, input.target, [], correspondences);
  const certificate = deepFreeze({
    schemaVersion: "kp.root-persistent-subtree-certificate.v1" as const,
    kind: "root-persistent-subtree-certificate" as const,
    authority: KP_ROOT_PERSISTENT_SUBTREE_CERTIFICATE_AUTHORITY,
    id: input.id,
    planId: input.plan.id,
    sourceRootEntityId: input.source.occurrence.entityId,
    targetRootEntityId: input.target.occurrence.entityId,
    correspondences
  }) as unknown as KpRootPersistentSubtreeCertificate;
  verifiedCertificates.add(certificate);
  return certificate;
}

export function isKpRootPersistentSubtreeCertificate(
  value: unknown
): value is KpRootPersistentSubtreeCertificate {
  return typeof value === "object" && value !== null &&
    verifiedCertificates.has(value);
}

function compare(
  source: KpRootSemanticSubtreeNode,
  target: KpRootSemanticSubtreeNode,
  path: readonly number[],
  output: KpRootPersistentSubtreeCorrespondence[]
): void {
  if (source.occurrence.entityId === target.occurrence.entityId) {
    fail("root-subtree.entity-alias",
      `Persistent subtree ${formatPath(path)} reuses one representation entity.`);
  }
  if (source.occurrence.semanticId !== target.occurrence.semanticId ||
    source.occurrence.subtreeId !== target.occurrence.subtreeId) {
    fail("root-subtree.identity-mismatch",
      `Persistent subtree ${formatPath(path)} changes semantic identity.`);
  }
  if (source.occurrence.subtreeKind !== target.occurrence.subtreeKind ||
    source.children.length !== target.children.length) {
    fail("root-subtree.shape-mismatch",
      `Persistent subtree ${formatPath(path)} changes ordered structure.`);
  }
  output.push(Object.freeze({
    path: Object.freeze([...path]),
    semanticId: source.occurrence.semanticId,
    subtreeId: source.occurrence.subtreeId,
    sourceEntityId: source.occurrence.entityId,
    targetEntityId: target.occurrence.entityId
  }));
  source.children.forEach((child, index) =>
    compare(child, target.children[index]!, [...path, index], output));
}

function validateTree(node: KpRootSemanticSubtreeNode, label: string): void {
  const seenNodes = new WeakSet<object>();
  const entityIds = new Set<string>();
  const visit = (current: KpRootSemanticSubtreeNode): void => {
    if (seenNodes.has(current) || entityIds.has(current.occurrence.entityId)) {
      fail("root-subtree.repeated-node",
        `${label} subtree repeats an occurrence.`);
    }
    seenNodes.add(current);
    entityIds.add(current.occurrence.entityId);
    requireId(current.occurrence.entityId, `${label} entity`);
    requireId(current.occurrence.semanticId, `${label} semantic identity`);
    requireId(current.occurrence.subtreeId, `${label} subtree identity`);
    current.children.forEach(visit);
  };
  visit(node);
}

function requireId(value: string, label: string): void {
  if (value.trim().length === 0) {
    fail("root-subtree.invalid-id", `${label} requires a non-empty ID.`);
  }
}

function formatPath(path: readonly number[]): string {
  return path.length === 0 ? "root" : path.join(".");
}

function fail(code: KpRootPersistentSubtreeErrorCode, message: string): never {
  throw new KpRootPersistentSubtreeError(code, message);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

