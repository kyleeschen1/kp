export interface KpCrossViewSemanticMember {
  readonly id: string;
  readonly viewId: string;
  readonly selectorId: string;
  readonly role: string;
}

export interface KpCrossViewSemanticIdentity {
  readonly id: string;
  readonly meaning: string;
  readonly memberIds: readonly string[];
}

export type KpCrossViewCorrespondenceKind =
  | "evidence-to-claim"
  | "part-to-whole"
  | "representation-to-representation";

export interface KpCrossViewCorrespondence {
  readonly id: string;
  readonly sourceMemberId: string;
  readonly targetMemberId: string;
  readonly kind: KpCrossViewCorrespondenceKind;
  readonly reversible: boolean;
  readonly summary: string;
}

export interface KpCrossViewCorrespondenceMap {
  readonly id: string;
  readonly members: readonly KpCrossViewSemanticMember[];
  readonly identities: readonly KpCrossViewSemanticIdentity[];
  readonly correspondences: readonly KpCrossViewCorrespondence[];
}

export interface KpCrossViewCorrespondenceDiagnostic {
  readonly path: string;
  readonly message: string;
}

export function validateKpCrossViewCorrespondenceMap(
  map: KpCrossViewCorrespondenceMap
): readonly KpCrossViewCorrespondenceDiagnostic[] {
  const diagnostics: KpCrossViewCorrespondenceDiagnostic[] = [];
  const memberIds = uniqueIds(map.members, "members", diagnostics);
  uniqueIds(map.identities, "identities", diagnostics);
  uniqueIds(map.correspondences, "correspondences", diagnostics);

  const ownership = new Map<string, string>();
  map.identities.forEach((identity, identityIndex) => {
    identity.memberIds.forEach((memberId, memberIndex) => {
      if (!memberIds.has(memberId)) {
        diagnostics.push({
          path: `identities[${identityIndex}].memberIds[${memberIndex}]`,
          message: `Unknown semantic member ${memberId}.`
        });
      }
      const owner = ownership.get(memberId);
      if (owner !== undefined) {
        diagnostics.push({
          path: `identities[${identityIndex}].memberIds[${memberIndex}]`,
          message: `Semantic member ${memberId} already belongs to ${owner}.`
        });
      }
      ownership.set(memberId, identity.id);
    });
  });

  map.correspondences.forEach((correspondence, index) => {
    requireMember(
      correspondence.sourceMemberId,
      memberIds,
      `correspondences[${index}].sourceMemberId`,
      diagnostics
    );
    requireMember(
      correspondence.targetMemberId,
      memberIds,
      `correspondences[${index}].targetMemberId`,
      diagnostics
    );
    if (correspondence.sourceMemberId === correspondence.targetMemberId) {
      diagnostics.push({
        path: `correspondences[${index}]`,
        message: "Directional correspondence requires distinct members."
      });
    }
  });

  return diagnostics;
}

function uniqueIds(
  values: readonly { readonly id: string }[],
  path: string,
  diagnostics: KpCrossViewCorrespondenceDiagnostic[]
): ReadonlySet<string> {
  const ids = new Set<string>();
  values.forEach((value, index) => {
    if (ids.has(value.id)) {
      diagnostics.push({
        path: `${path}[${index}].id`,
        message: `Duplicate id ${value.id}.`
      });
    }
    ids.add(value.id);
  });
  return ids;
}

function requireMember(
  id: string,
  memberIds: ReadonlySet<string>,
  path: string,
  diagnostics: KpCrossViewCorrespondenceDiagnostic[]
): void {
  if (!memberIds.has(id)) {
    diagnostics.push({ path, message: `Unknown semantic member ${id}.` });
  }
}
