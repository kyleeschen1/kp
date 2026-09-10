import { sha256 } from "../kernel/sha256.ts";
import { isKpVerifiedComposedEvaluation, type KpVerifiedComposedEvaluation } from "./composed-algebra-evaluation.ts";
import type { KpStructuredExpressionNode, KpStructuredSumNode } from "./structured-expression.ts";

const brand = Symbol("verified-composed-group-partition");
const issued = new WeakSet<object>();

/** Presentation may address a whole sum or its ordered members without
 * asserting a mathematical rewrite or copying any material. */
export interface KpVerifiedComposedGroupPartition {
  readonly [brand]: true;
  readonly kind: "verified-composed-group-partition";
  readonly evaluation: KpVerifiedComposedEvaluation;
  readonly revisionId: string;
  readonly group: KpStructuredSumNode;
  readonly members: readonly [KpStructuredExpressionNode, KpStructuredExpressionNode];
}

export class KpComposedGroupPartitionError extends Error {
  readonly code: "missing-authority" | "unsupported-shape" | "disconnected-chain";
  constructor(code: KpComposedGroupPartitionError["code"], message: string) {
    super(message); this.name = "KpComposedGroupPartitionError"; this.code = code;
  }
}

export function verifyKpComposedGroupPartition(input: {
  readonly evaluation: KpVerifiedComposedEvaluation;
  readonly groupId: string;
  readonly memberIds: readonly [string, string];
}): KpVerifiedComposedGroupPartition {
  const evaluation = input.evaluation;
  if (!isKpVerifiedComposedEvaluation(evaluation)) fail("missing-authority", "Use the issued coefficient evaluation.");
  const group = evaluation.preservedContext;
  if (group.kind !== "sum" || group.terms.length !== 2)
    fail("unsupported-shape", "The bounded handoff opens one unchanged binary sum.");
  if (input.groupId !== group.id || !Array.isArray(input.memberIds) || input.memberIds.length !== 2 ||
      input.memberIds[0] !== group.terms[0]!.id || input.memberIds[1] !== group.terms[1]!.id)
    fail("disconnected-chain", "Bind both complete immediate members of this exact group in semantic order.");
  // Taking the existing immutable nodes, rather than caller-provided trees,
  // preserves authenticated occurrence identity and excludes partial coverage.
  const members = Object.freeze([group.terms[0]!, group.terms[1]!] as const);
  const partition: KpVerifiedComposedGroupPartition = Object.freeze({ [brand]: true as const,
    kind: "verified-composed-group-partition", evaluation, group, members,
    revisionId: `sha256:${sha256(JSON.stringify({ kind: "composed-group-partition.v1", evaluation: evaluation.revisionId,
      groupId: group.id, memberIds: members.map(member => member.id) }))}` });
  issued.add(partition);
  return partition;
}

export function isKpVerifiedComposedGroupPartition(value: unknown): value is KpVerifiedComposedGroupPartition {
  return typeof value === "object" && value !== null && issued.has(value);
}

export function assertKpComposedGroupPartitionForEvaluation(partition: KpVerifiedComposedGroupPartition,
  evaluation: KpVerifiedComposedEvaluation): void {
  if (!isKpVerifiedComposedGroupPartition(partition) || !isKpVerifiedComposedEvaluation(evaluation))
    fail("missing-authority", "Use issued group partition and evaluation evidence.");
  if (partition.evaluation !== evaluation)
    fail("disconnected-chain", "The group partition belongs to a different evaluation capability.");
}

function fail(code: KpComposedGroupPartitionError["code"], message: string): never {
  throw new KpComposedGroupPartitionError(code, message);
}
