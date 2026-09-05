import type {
  KpSemanticStateAuthorityProjection
} from "../semantic/semantic-state-authority-adapter.ts";
import type {
  KpSemanticStateGroupDescriptor,
  KpSemanticStateMemberMap
} from "./authoring-schema.ts";
import type {
  KpSemanticCompositionGroupId,
  KpSemanticCompositionMemberId
} from "./identity.ts";
import type {
  KpCompiledSemanticStateCompositionGroup,
  KpCompiledSemanticStateCompositionIndependent,
  KpCompiledSemanticStateCompositionMember,
  KpCompiledSemanticStateCompositionNode,
  KpCompiledSemanticStateCompositionSequence
} from "./state-family-composition-compiler.ts";
import type {
  KpSemanticStateCompositionAppliedMember,
  KpSemanticStateCompositionEndpointChain
} from "./state-family-composition-endpoints.ts";

type KpCompiledSemanticStateCompositionGroupNode =
  | KpCompiledSemanticStateCompositionSequence
  | KpCompiledSemanticStateCompositionGroup
  | KpCompiledSemanticStateCompositionIndependent;

export interface KpSemanticStateCompositionEvidenceMember<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly schemaVersion:
    "kp.semantic-state-composition-evidence-member.v1";
  readonly kind: "semantic-state-composition-evidence-member";
  readonly id: KpSemanticCompositionMemberId;
  readonly ancestorGroupIds: readonly KpSemanticCompositionGroupId[];
  readonly member: KpCompiledSemanticStateCompositionMember;
  readonly applied: KpSemanticStateCompositionAppliedMember<Root>;
  readonly commit: KpSemanticStateCompositionAppliedMember<Root>["application"]["commit"];
  readonly authority: KpSemanticStateAuthorityProjection;
  readonly changeSet: KpSemanticStateAuthorityProjection["changeSet"];
  readonly sourceRegistry: KpSemanticStateAuthorityProjection["sourceRegistry"];
  readonly targetRegistry: KpSemanticStateAuthorityProjection["targetRegistry"];
  readonly correspondenceMap:
    KpSemanticStateAuthorityProjection["correspondenceMap"];
  readonly lineageGraph: KpSemanticStateAuthorityProjection["lineageGraph"];
}

export interface KpSemanticStateCompositionEvidenceGroup {
  readonly schemaVersion:
    "kp.semantic-state-composition-evidence-group.v1";
  readonly kind: "semantic-state-composition-evidence-group";
  readonly id: KpSemanticCompositionGroupId;
  readonly parentGroupId?: KpSemanticCompositionGroupId;
  readonly ancestorGroupIds: readonly KpSemanticCompositionGroupId[];
  readonly memberIds: readonly KpSemanticCompositionMemberId[];
  readonly group: KpCompiledSemanticStateCompositionGroupNode;
}

export interface KpSemanticStateCompositionEvidenceIndex<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly schemaVersion: "kp.semantic-state-composition-evidence-index.v1";
  readonly kind: "semantic-state-composition-evidence-index";
  readonly compositionId:
    KpSemanticStateCompositionEndpointChain<Root>["composition"]["id"];
  readonly chain: KpSemanticStateCompositionEndpointChain<Root>;
  readonly groups: readonly KpSemanticStateCompositionEvidenceGroup[];
  readonly members: readonly KpSemanticStateCompositionEvidenceMember<Root>[];
  readonly groupIndex: Readonly<Record<string, number>>;
  readonly memberIndex: Readonly<Record<string, number>>;
  readonly transformationIndex: Readonly<Record<string, number>>;
}

export type KpSemanticStateCompositionEvidenceErrorCode =
  | "authority-projection-mismatch"
  | "duplicate-authority-projection"
  | "duplicate-member-application"
  | "missing-authority-projection"
  | "missing-member-application"
  | "unexpected-authority-projection"
  | "unexpected-member-application";

export class KpSemanticStateCompositionEvidenceError extends Error {
  readonly code: KpSemanticStateCompositionEvidenceErrorCode;
  readonly memberId?: KpSemanticCompositionMemberId;
  readonly transactionId?: string;

  constructor(input: {
    readonly code: KpSemanticStateCompositionEvidenceErrorCode;
    readonly message: string;
    readonly memberId?: KpSemanticCompositionMemberId;
    readonly transactionId?: string;
  }) {
    super(input.message);
    this.name = "KpSemanticStateCompositionEvidenceError";
    this.code = input.code;
    if (input.memberId !== undefined) this.memberId = input.memberId;
    if (input.transactionId !== undefined) {
      this.transactionId = input.transactionId;
    }
  }
}

/**
 * Aggregate evidence is an ownership index over existing records. Keeping the
 * exact member, commit, and authority objects prevents this layer from
 * becoming a competing source of semantic changes or lineage.
 */
export function createKpSemanticStateCompositionEvidenceIndex<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(input: {
  readonly chain: KpSemanticStateCompositionEndpointChain<Root>;
  readonly authorities: readonly KpSemanticStateAuthorityProjection[];
}): KpSemanticStateCompositionEvidenceIndex<Root> {
  const appliedByMember = indexAppliedMembers(input.chain);
  const authorityByTransaction = indexAuthorities(input.authorities);
  const membership = projectGroupMembership(input.chain.composition.root);

  const members = input.chain.composition.members.map(member => {
    const applied = appliedByMember.get(member.id);
    if (applied === undefined) {
      fail({
        code: "missing-member-application",
        memberId: member.id,
        message: `Composition evidence member ${JSON.stringify(member.id)} has no endpoint application.`
      });
    }
    appliedByMember.delete(member.id);
    const commit = applied.application.commit;
    const authority = authorityByTransaction.get(commit.transactionId);
    if (authority === undefined) {
      fail({
        code: "missing-authority-projection",
        memberId: member.id,
        transactionId: commit.transactionId,
        message: `Composition evidence member ${JSON.stringify(member.id)} has no existing authority projection.`
      });
    }
    authorityByTransaction.delete(commit.transactionId);
    validateAuthorityProjection(member, commit, authority);
    return Object.freeze({
      schemaVersion:
        "kp.semantic-state-composition-evidence-member.v1" as const,
      kind: "semantic-state-composition-evidence-member" as const,
      id: member.id,
      ancestorGroupIds: membership.memberAncestors.get(member.id) ??
        Object.freeze([]),
      member,
      applied,
      commit,
      authority,
      changeSet: authority.changeSet,
      sourceRegistry: authority.sourceRegistry,
      targetRegistry: authority.targetRegistry,
      correspondenceMap: authority.correspondenceMap,
      lineageGraph: authority.lineageGraph
    });
  });

  const unexpectedApplication = appliedByMember.values().next().value as
    KpSemanticStateCompositionAppliedMember<Root> | undefined;
  if (unexpectedApplication !== undefined) {
    fail({
      code: "unexpected-member-application",
      memberId: unexpectedApplication.memberId,
      message: `Endpoint application ${JSON.stringify(unexpectedApplication.memberId)} is not owned by the compiled composition.`
    });
  }
  const unexpectedAuthority = authorityByTransaction.values().next().value as
    KpSemanticStateAuthorityProjection | undefined;
  if (unexpectedAuthority !== undefined) {
    fail({
      code: "unexpected-authority-projection",
      transactionId: unexpectedAuthority.transactionId,
      message: `Authority projection ${JSON.stringify(unexpectedAuthority.transactionId)} is not owned by the endpoint chain.`
    });
  }

  const groups = input.chain.composition.groups.map(group => Object.freeze({
    schemaVersion:
      "kp.semantic-state-composition-evidence-group.v1" as const,
    kind: "semantic-state-composition-evidence-group" as const,
    id: group.id,
    ...optionalParent(membership.groupAncestors.get(group.id) ?? []),
    ancestorGroupIds: membership.groupAncestors.get(group.id) ??
      Object.freeze([]),
    memberIds: membership.groupMembers.get(group.id) ?? Object.freeze([]),
    group
  }));
  const groupIndex = createOrdinalIndex(groups.map(({ id }) => id));
  const memberIndex = createOrdinalIndex(members.map(({ id }) => id));
  const transformationIndex = createOrdinalIndex(members.map(
    ({ commit }) => commit.transformationId
  ));

  return Object.freeze({
    schemaVersion: "kp.semantic-state-composition-evidence-index.v1",
    kind: "semantic-state-composition-evidence-index",
    compositionId: input.chain.composition.id,
    chain: input.chain,
    groups: Object.freeze(groups),
    members: Object.freeze(members),
    groupIndex,
    memberIndex,
    transformationIndex
  });
}

export function readKpSemanticStateCompositionEvidenceMember<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(
  index: KpSemanticStateCompositionEvidenceIndex<Root>,
  memberId: KpSemanticCompositionMemberId
): KpSemanticStateCompositionEvidenceMember<Root> {
  const ordinal = index.memberIndex[memberId];
  const member = ordinal === undefined ? undefined : index.members[ordinal];
  if (member === undefined || member.id !== memberId) {
    throw new Error(`Unknown semantic composition evidence member ${JSON.stringify(memberId)}.`);
  }
  return member;
}

export function readKpSemanticStateCompositionEvidenceGroup<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(
  index: KpSemanticStateCompositionEvidenceIndex<Root>,
  groupId: KpSemanticCompositionGroupId
): KpSemanticStateCompositionEvidenceGroup {
  const ordinal = index.groupIndex[groupId];
  const group = ordinal === undefined ? undefined : index.groups[ordinal];
  if (group === undefined || group.id !== groupId) {
    throw new Error(`Unknown semantic composition evidence group ${JSON.stringify(groupId)}.`);
  }
  return group;
}

function indexAppliedMembers<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(chain: KpSemanticStateCompositionEndpointChain<Root>): Map<
  KpSemanticCompositionMemberId,
  KpSemanticStateCompositionAppliedMember<Root>
> {
  const index = new Map<
    KpSemanticCompositionMemberId,
    KpSemanticStateCompositionAppliedMember<Root>
  >();
  for (const applied of chain.applications) {
    if (index.has(applied.memberId)) {
      fail({
        code: "duplicate-member-application",
        memberId: applied.memberId,
        message: `Composition endpoint chain repeats member application ${JSON.stringify(applied.memberId)}.`
      });
    }
    index.set(applied.memberId, applied);
  }
  return index;
}

function indexAuthorities(
  authorities: readonly KpSemanticStateAuthorityProjection[]
): Map<string, KpSemanticStateAuthorityProjection> {
  const index = new Map<string, KpSemanticStateAuthorityProjection>();
  for (const authority of authorities) {
    if (index.has(authority.transactionId)) {
      fail({
        code: "duplicate-authority-projection",
        transactionId: authority.transactionId,
        message: `Composition evidence repeats authority projection ${JSON.stringify(authority.transactionId)}.`
      });
    }
    index.set(authority.transactionId, authority);
  }
  return index;
}

function validateAuthorityProjection<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(
  member: KpCompiledSemanticStateCompositionMember,
  commit: KpSemanticStateCompositionAppliedMember<Root>["application"]["commit"],
  authority: KpSemanticStateAuthorityProjection
): void {
  if (authority.transactionId !== commit.transactionId ||
    authority.changeSet.transformationId !== commit.transformationId ||
    authority.changeSet.beforeSnapshotId !== commit.before.id ||
    authority.changeSet.afterSnapshotId !== commit.after.id) {
    fail({
      code: "authority-projection-mismatch",
      memberId: member.id,
      transactionId: authority.transactionId,
      message: `Authority projection ${JSON.stringify(authority.transactionId)} does not describe composition member ${JSON.stringify(member.id)}.`
    });
  }
}

function projectGroupMembership(
  root: KpCompiledSemanticStateCompositionNode
): {
  readonly groupAncestors: ReadonlyMap<
    KpSemanticCompositionGroupId,
    readonly KpSemanticCompositionGroupId[]
  >;
  readonly groupMembers: ReadonlyMap<
    KpSemanticCompositionGroupId,
    readonly KpSemanticCompositionMemberId[]
  >;
  readonly memberAncestors: ReadonlyMap<
    KpSemanticCompositionMemberId,
    readonly KpSemanticCompositionGroupId[]
  >;
} {
  const groupAncestors = new Map<
    KpSemanticCompositionGroupId,
    readonly KpSemanticCompositionGroupId[]
  >();
  const groupMembers = new Map<
    KpSemanticCompositionGroupId,
    readonly KpSemanticCompositionMemberId[]
  >();
  const memberAncestors = new Map<
    KpSemanticCompositionMemberId,
    readonly KpSemanticCompositionGroupId[]
  >();

  const visit = (
    node: KpCompiledSemanticStateCompositionNode,
    ancestors: readonly KpSemanticCompositionGroupId[]
  ): readonly KpSemanticCompositionMemberId[] => {
    if (node.kind === "member") {
      memberAncestors.set(node.id, Object.freeze([...ancestors]));
      return Object.freeze([node.id]);
    }
    groupAncestors.set(node.id, Object.freeze([...ancestors]));
    const descendants = node.kind === "group"
      ? visit(node.body, [...ancestors, node.id])
      : node.members.flatMap(child => visit(
        child,
        [...ancestors, node.id]
      ));
    const frozen = Object.freeze([...descendants]);
    groupMembers.set(node.id, frozen);
    return frozen;
  };
  visit(root, []);
  return { groupAncestors, groupMembers, memberAncestors };
}

function optionalParent(
  ancestors: readonly KpSemanticCompositionGroupId[]
): { readonly parentGroupId?: KpSemanticCompositionGroupId } {
  const parentGroupId = ancestors.at(-1);
  return parentGroupId === undefined ? {} : { parentGroupId };
}

function createOrdinalIndex(ids: readonly string[]): Readonly<Record<string, number>> {
  const index: Record<string, number> = Object.create(null);
  ids.forEach((id, ordinal) => {
    index[id] = ordinal;
  });
  return Object.freeze(index);
}

function fail(input: {
  readonly code: KpSemanticStateCompositionEvidenceErrorCode;
  readonly message: string;
  readonly memberId?: KpSemanticCompositionMemberId;
  readonly transactionId?: string;
}): never {
  throw new KpSemanticStateCompositionEvidenceError(input);
}
