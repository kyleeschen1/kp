import type { KpChoreographyEnvelopePhaseId } from "./choreography-plan.ts";

export type KpTemporaryFragmentMedium =
  | "dom-clone"
  | "texture-tile"
  | "mesh-fragment";

export interface KpChoreographyGroupCohesion {
  readonly anchorTokenIds: readonly string[];
  readonly maximumSeparation: number;
  readonly maximumStaggerSpan: number;
  readonly preserveTokenOrder: boolean;
  readonly maximumCrossings: number;
  readonly minimumVisibleMaterial: number;
  readonly reconciliationRegionId: string;
  readonly exactTargetRegrouping: true;
}

export interface KpChoreographyGroup {
  readonly id: string;
  readonly semanticEntityIds: readonly string[];
  readonly tokenIds: readonly string[];
  readonly motionFieldId: string;
  readonly cohesion: KpChoreographyGroupCohesion;
}

interface KpChoreographyTokenBase {
  readonly id: string;
  readonly groupId: string;
  readonly selectorIds: readonly string[];
  readonly fragmentIds: readonly string[];
  readonly nativeRendererOwnerId: string;
}

export type KpChoreographyToken =
  | (KpChoreographyTokenBase & {
      readonly kind: "semantic";
      readonly semanticEntityId: string;
    })
  | (KpChoreographyTokenBase & {
      readonly kind: "structural";
      readonly ownerSemanticEntityId: string;
    });

export interface KpTemporaryFragmentProvenance {
  readonly kind: "temporary-render-fragment";
  readonly rendererId: string;
  readonly sourceTokenId: string;
  readonly captureId: string;
  readonly sourceSelectorIds: readonly string[];
}

export interface KpTemporaryFragmentLifecycle {
  readonly createdInPhase: "act";
  readonly disposedInPhase: "settle";
  readonly nativeOwnerTokenId: string;
}

export interface KpChoreographyFragment {
  readonly id: string;
  readonly tokenId: string;
  readonly medium: KpTemporaryFragmentMedium;
  readonly semanticAuthority: false;
  readonly provenance: KpTemporaryFragmentProvenance;
  readonly lifecycle: KpTemporaryFragmentLifecycle;
}

export interface KpNativeRendererSettlement {
  readonly checkpointId: string;
  readonly phaseId: "settle";
  readonly rendererId: string;
  readonly nativeTokenIds: readonly string[];
  readonly disposedFragmentIds: readonly string[];
  readonly requireExactTargetGeometry: true;
}

export interface KpChoreographyHierarchyPlan {
  readonly id: string;
  readonly kind: "kp-choreography-hierarchy-plan";
  readonly groups: readonly KpChoreographyGroup[];
  readonly tokens: readonly KpChoreographyToken[];
  readonly fragments: readonly KpChoreographyFragment[];
  readonly settlement: KpNativeRendererSettlement;
}

export interface KpChoreographyHierarchyIssue {
  readonly path: string;
  readonly message: string;
}

export interface KpChoreographyHierarchyOwnership {
  readonly phaseId: KpChoreographyEnvelopePhaseId;
  readonly semanticAuthorityEntityIds: readonly string[];
  readonly activeTemporaryFragmentIds: readonly string[];
  readonly nativePresentationTokenIds: readonly string[];
}

export function createKpChoreographyHierarchyPlan(
  input: Omit<KpChoreographyHierarchyPlan, "kind">
): KpChoreographyHierarchyPlan {
  const plan: KpChoreographyHierarchyPlan = {
    ...structuredClone(input),
    kind: "kp-choreography-hierarchy-plan"
  };
  const issues = validateKpChoreographyHierarchyPlan(plan);
  if (issues.length > 0) {
    throw new Error(`${issues[0]!.path}: ${issues[0]!.message}`);
  }
  return plan;
}

export function validateKpChoreographyHierarchyPlan(
  plan: KpChoreographyHierarchyPlan
): readonly KpChoreographyHierarchyIssue[] {
  const issues: KpChoreographyHierarchyIssue[] = [];
  requireText(plan.id, "id", issues);
  const groupIds = collectUniqueIds(plan.groups, "groups", issues);
  const tokenIds = collectUniqueIds(plan.tokens, "tokens", issues);
  const fragmentIds = collectUniqueIds(plan.fragments, "fragments", issues);

  plan.groups.forEach((group, index) => {
    const path = `groups[${index}]`;
    requireText(group.motionFieldId, `${path}.motionFieldId`, issues);
    requireIds(group.semanticEntityIds, `${path}.semanticEntityIds`, issues);
    requireIds(group.tokenIds, `${path}.tokenIds`, issues);
    requireIds(
      group.cohesion.anchorTokenIds,
      `${path}.cohesion.anchorTokenIds`,
      issues
    );
    group.tokenIds.forEach((id, tokenIndex) =>
      requireReference(
        id,
        tokenIds,
        `${path}.tokenIds[${tokenIndex}]`,
        "token",
        issues
      )
    );
    group.cohesion.anchorTokenIds.forEach((id, anchorIndex) => {
      requireReference(
        id,
        tokenIds,
        `${path}.cohesion.anchorTokenIds[${anchorIndex}]`,
        "token",
        issues
      );
      if (!group.tokenIds.includes(id)) {
        issue(
          `${path}.cohesion.anchorTokenIds[${anchorIndex}]`,
          `Anchor token ${id} must belong to group ${group.id}.`,
          issues
        );
      }
    });
    requireUnit(
      group.cohesion.maximumSeparation,
      `${path}.cohesion.maximumSeparation`,
      issues
    );
    requireUnit(
      group.cohesion.maximumStaggerSpan,
      `${path}.cohesion.maximumStaggerSpan`,
      issues
    );
    requireUnit(
      group.cohesion.minimumVisibleMaterial,
      `${path}.cohesion.minimumVisibleMaterial`,
      issues
    );
    if (
      !Number.isInteger(group.cohesion.maximumCrossings) ||
      group.cohesion.maximumCrossings < 0
    ) {
      issue(
        `${path}.cohesion.maximumCrossings`,
        "Maximum crossings must be a nonnegative integer.",
        issues
      );
    }
    requireText(
      group.cohesion.reconciliationRegionId,
      `${path}.cohesion.reconciliationRegionId`,
      issues
    );
  });

  plan.tokens.forEach((token, index) => {
    const path = `tokens[${index}]`;
    requireReference(token.groupId, groupIds, `${path}.groupId`, "group", issues);
    requireIds(token.selectorIds, `${path}.selectorIds`, issues);
    requireText(
      token.nativeRendererOwnerId,
      `${path}.nativeRendererOwnerId`,
      issues
    );
    const group = plan.groups.find((candidate) => candidate.id === token.groupId);
    if (group !== undefined && !group.tokenIds.includes(token.id)) {
      issue(
        `${path}.groupId`,
        `Group ${group.id} must declare token ${token.id}.`,
        issues
      );
    }
    const authorityId =
      token.kind === "semantic"
        ? token.semanticEntityId
        : token.ownerSemanticEntityId;
    requireText(
      authorityId,
      token.kind === "semantic"
        ? `${path}.semanticEntityId`
        : `${path}.ownerSemanticEntityId`,
      issues
    );
    if (group !== undefined && !group.semanticEntityIds.includes(authorityId)) {
      issue(
        path,
        `Token ${token.id} must derive authority from a semantic entity in group ${group.id}.`,
        issues
      );
    }
    token.fragmentIds.forEach((id, fragmentIndex) =>
      requireReference(
        id,
        fragmentIds,
        `${path}.fragmentIds[${fragmentIndex}]`,
        "fragment",
        issues
      )
    );
  });

  plan.fragments.forEach((fragment, index) => {
    const path = `fragments[${index}]`;
    requireReference(fragment.tokenId, tokenIds, `${path}.tokenId`, "token", issues);
    if (fragment.semanticAuthority !== false) {
      issue(
        `${path}.semanticAuthority`,
        "Temporary render fragments cannot carry semantic authority.",
        issues
      );
    }
    if (fragment.provenance.sourceTokenId !== fragment.tokenId) {
      issue(
        `${path}.provenance.sourceTokenId`,
        "Fragment provenance must identify its owning token.",
        issues
      );
    }
    requireText(fragment.provenance.rendererId, `${path}.provenance.rendererId`, issues);
    requireText(fragment.provenance.captureId, `${path}.provenance.captureId`, issues);
    requireIds(
      fragment.provenance.sourceSelectorIds,
      `${path}.provenance.sourceSelectorIds`,
      issues
    );
    if (fragment.lifecycle.nativeOwnerTokenId !== fragment.tokenId) {
      issue(
        `${path}.lifecycle.nativeOwnerTokenId`,
        "A fragment must settle back to the token that supplied its provenance.",
        issues
      );
    }
    const token = plan.tokens.find((candidate) => candidate.id === fragment.tokenId);
    if (token !== undefined && !token.fragmentIds.includes(fragment.id)) {
      issue(
        `${path}.tokenId`,
        `Token ${token.id} must declare fragment ${fragment.id}.`,
        issues
      );
    }
  });

  validateSettlement(plan, tokenIds, fragmentIds, issues);
  return issues;
}

export function projectKpChoreographyHierarchyOwnership(
  plan: KpChoreographyHierarchyPlan,
  phaseId: KpChoreographyEnvelopePhaseId
): KpChoreographyHierarchyOwnership {
  const issues = validateKpChoreographyHierarchyPlan(plan);
  if (issues.length > 0) {
    throw new Error(`${issues[0]!.path}: ${issues[0]!.message}`);
  }
  const semanticAuthorityEntityIds = unique(
    plan.tokens.map((token) =>
      token.kind === "semantic"
        ? token.semanticEntityId
        : token.ownerSemanticEntityId
    )
  );
  const fragmentsOwnPresentation = phaseId === "act";
  return {
    phaseId,
    semanticAuthorityEntityIds,
    activeTemporaryFragmentIds: fragmentsOwnPresentation
      ? plan.fragments.map((fragment) => fragment.id)
      : [],
    nativePresentationTokenIds: fragmentsOwnPresentation
      ? plan.tokens
          .filter((token) => token.fragmentIds.length === 0)
          .map((token) => token.id)
      : [...plan.settlement.nativeTokenIds]
  };
}

export function createRadicalArtifactHierarchyFixture():
  KpChoreographyHierarchyPlan {
  const sourceExponent =
    "radical.rewrite-power-as-root.source.exponent";
  const targetRadical =
    "radical.rewrite-power-as-root.target.radical";
  const sourceFragment = `${sourceExponent}.fold-fragment`;
  const targetFragment = `${targetRadical}.unfold-fragment`;
  return createKpChoreographyHierarchyPlan({
    id: "radical.rewrite-power-as-root.hierarchy",
    groups: [
      {
        id: "radical.rewrite-power-as-root.representation-group",
        semanticEntityIds: [sourceExponent, targetRadical],
        tokenIds: [sourceExponent, targetRadical],
        motionFieldId: "radical.rewrite-power-as-root.opposite-corner-field",
        cohesion: {
          anchorTokenIds: [sourceExponent],
          maximumSeparation: 0.32,
          maximumStaggerSpan: 0.24,
          preserveTokenOrder: true,
          maximumCrossings: 0,
          minimumVisibleMaterial: 0.12,
          reconciliationRegionId:
            "radical.rewrite-power-as-root.target-opposite-corner",
          exactTargetRegrouping: true
        }
      }
    ],
    tokens: [
      {
        id: sourceExponent,
        kind: "semantic",
        groupId: "radical.rewrite-power-as-root.representation-group",
        semanticEntityId: sourceExponent,
        selectorIds: [sourceExponent],
        fragmentIds: [sourceFragment],
        nativeRendererOwnerId: "katex-dom"
      },
      {
        id: targetRadical,
        kind: "structural",
        groupId: "radical.rewrite-power-as-root.representation-group",
        ownerSemanticEntityId: targetRadical,
        selectorIds: [targetRadical],
        fragmentIds: [targetFragment],
        nativeRendererOwnerId: "katex-dom"
      }
    ],
    fragments: [
      {
        id: sourceFragment,
        tokenId: sourceExponent,
        medium: "dom-clone",
        semanticAuthority: false,
        provenance: {
          kind: "temporary-render-fragment",
          rendererId: "katex-dom-fold-bundle-swap",
          sourceTokenId: sourceExponent,
          captureId: "radical.source.exponent.capture",
          sourceSelectorIds: [sourceExponent]
        },
        lifecycle: {
          createdInPhase: "act",
          disposedInPhase: "settle",
          nativeOwnerTokenId: sourceExponent
        }
      },
      {
        id: targetFragment,
        tokenId: targetRadical,
        medium: "dom-clone",
        semanticAuthority: false,
        provenance: {
          kind: "temporary-render-fragment",
          rendererId: "katex-dom-fold-bundle-swap",
          sourceTokenId: targetRadical,
          captureId: "radical.target.radical.capture",
          sourceSelectorIds: [targetRadical]
        },
        lifecycle: {
          createdInPhase: "act",
          disposedInPhase: "settle",
          nativeOwnerTokenId: targetRadical
        }
      }
    ],
    settlement: {
      checkpointId: "radical.rewrite-power-as-root.native-settled",
      phaseId: "settle",
      rendererId: "katex-dom",
      nativeTokenIds: [sourceExponent, targetRadical],
      disposedFragmentIds: [sourceFragment, targetFragment],
      requireExactTargetGeometry: true
    }
  });
}

function validateSettlement(
  plan: KpChoreographyHierarchyPlan,
  tokenIds: ReadonlySet<string>,
  fragmentIds: ReadonlySet<string>,
  issues: KpChoreographyHierarchyIssue[]
): void {
  requireText(plan.settlement.checkpointId, "settlement.checkpointId", issues);
  requireText(plan.settlement.rendererId, "settlement.rendererId", issues);
  requireIds(plan.settlement.nativeTokenIds, "settlement.nativeTokenIds", issues);
  plan.settlement.nativeTokenIds.forEach((id, index) =>
    requireReference(
      id,
      tokenIds,
      `settlement.nativeTokenIds[${index}]`,
      "token",
      issues
    )
  );
  plan.settlement.disposedFragmentIds.forEach((id, index) =>
    requireReference(
      id,
      fragmentIds,
      `settlement.disposedFragmentIds[${index}]`,
      "fragment",
      issues
    )
  );
  if (!sameMembers(plan.settlement.nativeTokenIds, [...tokenIds])) {
    issue(
      "settlement.nativeTokenIds",
      "Native settlement must restore presentation ownership for every choreography token.",
      issues
    );
  }
  if (!sameMembers(plan.settlement.disposedFragmentIds, [...fragmentIds])) {
    issue(
      "settlement.disposedFragmentIds",
      "Native settlement must dispose every temporary render fragment.",
      issues
    );
  }
  plan.tokens.forEach((token, index) => {
    if (token.nativeRendererOwnerId !== plan.settlement.rendererId) {
      issue(
        `tokens[${index}].nativeRendererOwnerId`,
        `Token ${token.id} must settle to renderer ${plan.settlement.rendererId}.`,
        issues
      );
    }
  });
}

function collectUniqueIds(
  values: readonly { readonly id: string }[],
  path: string,
  issues: KpChoreographyHierarchyIssue[]
): Set<string> {
  const ids = new Set<string>();
  values.forEach((value, index) => {
    requireText(value.id, `${path}[${index}].id`, issues);
    if (ids.has(value.id)) {
      issue(`${path}[${index}].id`, `Duplicate id ${value.id}.`, issues);
    }
    ids.add(value.id);
  });
  return ids;
}

function requireIds(
  values: readonly string[],
  path: string,
  issues: KpChoreographyHierarchyIssue[]
): void {
  if (values.length === 0) {
    issue(path, "At least one id is required.", issues);
    return;
  }
  const ids = new Set<string>();
  values.forEach((value, index) => {
    requireText(value, `${path}[${index}]`, issues);
    if (ids.has(value)) {
      issue(`${path}[${index}]`, `Duplicate id ${value}.`, issues);
    }
    ids.add(value);
  });
}

function requireReference(
  value: string,
  ids: ReadonlySet<string>,
  path: string,
  kind: string,
  issues: KpChoreographyHierarchyIssue[]
): void {
  requireText(value, path, issues);
  if (!ids.has(value)) {
    issue(path, `Unknown ${kind} reference ${value}.`, issues);
  }
}

function requireText(
  value: string,
  path: string,
  issues: KpChoreographyHierarchyIssue[]
): void {
  if (value.trim().length === 0) {
    issue(path, "Value must be non-empty text.", issues);
  }
}

function requireUnit(
  value: number,
  path: string,
  issues: KpChoreographyHierarchyIssue[]
): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    issue(path, "Value must be normalized between 0 and 1.", issues);
  }
}

function sameMembers(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value) => right.includes(value));
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function issue(
  path: string,
  message: string,
  issues: KpChoreographyHierarchyIssue[]
): void {
  issues.push({ path, message });
}
