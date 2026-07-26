import type {
  KpReaderEquationRelationPlan,
  KpReaderEquationRenderPlan,
  KpReaderEquationSelectorPlan,
  KpReaderEquationStatePlan,
  KpReaderEquationTransitionPlan
} from "./equation-render-plan.ts";

export interface KpReaderEquationMaterialPlan {
  readonly id: string;
  readonly kind: "reader-equation-material-plan";
  readonly renderPlanId: string;
  readonly direction: KpReaderEquationRenderPlan["direction"];
  readonly transitions: readonly KpReaderEquationTransitionMaterialPlan[];
  readonly diagnostics: readonly KpReaderEquationMaterialPlanDiagnostic[];
}

export interface KpReaderEquationTransitionMaterialPlan {
  readonly transitionId: string;
  readonly anchors: readonly KpReaderEquationAnchorPlan[];
  readonly owners: readonly KpReaderEquationMaterialOwnerPlan[];
}

export interface KpReaderEquationAnchorPlan {
  readonly id: string;
  readonly side: "source" | "target";
  readonly selectorId: string;
  readonly objectId: string;
  readonly selectorIndex: number;
  readonly anchorKind: "ink-center" | "relation-center" | "operator-center";
  readonly label?: string | undefined;
  readonly focused: boolean;
}

export interface KpReaderEquationMaterialOwnerPlan {
  readonly id: string;
  readonly transitionId: string;
  readonly relationRecordId: string;
  readonly relation: KpReaderEquationRelationPlan["relation"];
  readonly lifecycle: KpReaderEquationRelationPlan["lifecycle"];
  readonly continuity: "source-target" | "source-only" | "target-only";
  readonly sourceAnchorIds: readonly string[];
  readonly targetAnchorIds: readonly string[];
  readonly seedAnchorId: string;
  readonly focused: boolean;
}

export interface KpReaderEquationMaterialPlanDiagnostic {
  readonly code:
    | "material-plan.empty-relation"
    | "material-plan.missing-anchor"
    | "material-plan.unowned-selector";
  readonly message: string;
  readonly transitionId: string;
  readonly selectorId?: string | undefined;
  readonly relationRecordId?: string | undefined;
}

export interface KpReaderEquationMaterialTotalityIssue {
  readonly code:
    | "material-totality.transition"
    | "material-totality.owner"
    | "material-totality.anchor";
  readonly path: string;
  readonly message: string;
}

export function compileKpReaderEquationMaterialPlan(
  renderPlan: KpReaderEquationRenderPlan
): KpReaderEquationMaterialPlan {
  const diagnostics: KpReaderEquationMaterialPlanDiagnostic[] = [];
  const transitions = renderPlan.transitions.map((transition) =>
    compileTransitionMaterialPlan(transition, diagnostics)
  );
  return {
    id: `material-plan.${renderPlan.id}`,
    kind: "reader-equation-material-plan",
    renderPlanId: renderPlan.id,
    direction: renderPlan.direction,
    transitions,
    diagnostics
  };
}

export function validateKpReaderEquationMaterialPlanTotality(
  renderPlan: KpReaderEquationRenderPlan,
  materialPlan: KpReaderEquationMaterialPlan
): readonly KpReaderEquationMaterialTotalityIssue[] {
  const issues: KpReaderEquationMaterialTotalityIssue[] = [];
  if (
    materialPlan.renderPlanId !== renderPlan.id ||
    materialPlan.direction !== renderPlan.direction
  ) {
    issues.push({
      code: "material-totality.transition",
      path: "$",
      message: "Material totality requires its exact render-plan authority."
    });
    return issues;
  }
  const materialByTransition = new Map(
    materialPlan.transitions.map((transition) => [
      transition.transitionId,
      transition
    ])
  );
  for (const transition of renderPlan.transitions) {
    const material = materialByTransition.get(transition.id);
    if (material === undefined) {
      issues.push({
        code: "material-totality.transition",
        path: `$.transitions.${transition.id}`,
        message: `Transition ${transition.id} has no material binding.`
      });
      continue;
    }
    const anchorsById = new Map(material.anchors.map((anchor) => [
      anchor.id,
      anchor
    ]));
    const ownersByRecord = new Map<string, KpReaderEquationMaterialOwnerPlan[]>();
    const ownerCountByAnchor = new Map<string, number>();
    for (const owner of material.owners) {
      const existing = ownersByRecord.get(owner.relationRecordId) ?? [];
      ownersByRecord.set(owner.relationRecordId, [...existing, owner]);
      for (const anchorId of [
        ...owner.sourceAnchorIds,
        ...owner.targetAnchorIds
      ]) {
        ownerCountByAnchor.set(
          anchorId,
          (ownerCountByAnchor.get(anchorId) ?? 0) + 1
        );
      }
    }
    for (const relation of transition.relations) {
      const owners = ownersByRecord.get(relation.recordId) ?? [];
      if (owners.length !== 1) {
        issues.push({
          code: "material-totality.owner",
          path: `$.transitions.${transition.id}.relations.${relation.recordId}`,
          message:
            `Relation ${relation.recordId} requires exactly one material owner; found ${owners.length}.`
        });
        continue;
      }
      const owner = owners[0]!;
      const sourceIds = owner.sourceAnchorIds.map(
        (anchorId) => anchorsById.get(anchorId)?.selectorId
      );
      const targetIds = owner.targetAnchorIds.map(
        (anchorId) => anchorsById.get(anchorId)?.selectorId
      );
      if (
        !sameStrings(sourceIds, relation.sourceSelectorIds) ||
        !sameStrings(targetIds, relation.targetSelectorIds) ||
        owner.lifecycle !== relation.lifecycle
      ) {
        issues.push({
          code: "material-totality.owner",
          path: `$.transitions.${transition.id}.relations.${relation.recordId}`,
          message: `Material owner ${owner.id} diverges from canonical lineage.`
        });
      }
    }
    for (const anchor of material.anchors) {
      const count = ownerCountByAnchor.get(anchor.id) ?? 0;
      if (count !== 1) {
        issues.push({
          code: "material-totality.anchor",
          path: `$.transitions.${transition.id}.anchors.${anchor.id}`,
          message:
            `Anchor ${anchor.id} requires exactly one lineage owner; found ${count}.`
        });
      }
    }
  }
  return Object.freeze(issues);
}

function compileTransitionMaterialPlan(
  transition: KpReaderEquationTransitionPlan,
  diagnostics: KpReaderEquationMaterialPlanDiagnostic[]
): KpReaderEquationTransitionMaterialPlan {
  const anchors = [
    ...compileAnchors("source", transition.source),
    ...compileAnchors("target", transition.target)
  ];
  const anchorsBySelectorId = new Map(
    anchors.map((anchor) => [anchor.selectorId, anchor])
  );
  const ownedSelectorIds = new Set<string>();
  const owners = transition.relations.flatMap((relation) => {
    const sourceAnchors = resolveRelationAnchors(
      transition.id,
      relation,
      relation.sourceSelectorIds,
      anchorsBySelectorId,
      diagnostics
    );
    const targetAnchors = resolveRelationAnchors(
      transition.id,
      relation,
      relation.targetSelectorIds,
      anchorsBySelectorId,
      diagnostics
    );
    for (const anchor of [...sourceAnchors, ...targetAnchors]) {
      ownedSelectorIds.add(anchor.selectorId);
    }
    const seed = sourceAnchors[0] ?? targetAnchors[0];
    if (seed === undefined) {
      diagnostics.push({
        code: "material-plan.empty-relation",
        message: `Relation ${relation.recordId} has no measurable selector anchors.`,
        transitionId: transition.id,
        relationRecordId: relation.recordId
      });
      return [];
    }

    // Correspondence records, rather than DOM similarity, authorize stable
    // visual ownership. This ID therefore survives endpoint reversal.
    return [{
      // Relation record IDs are the semantic identity across adjacent
      // transformations; transition IDs describe only the current geometry.
      id: `material-owner.${relation.recordId}`,
      transitionId: transition.id,
      relationRecordId: relation.recordId,
      relation: relation.relation,
      lifecycle: relation.lifecycle,
      continuity: continuityKind(sourceAnchors.length, targetAnchors.length),
      sourceAnchorIds: sourceAnchors.map((anchor) => anchor.id),
      targetAnchorIds: targetAnchors.map((anchor) => anchor.id),
      seedAnchorId: seed.id,
      focused: [...sourceAnchors, ...targetAnchors].some(
        (anchor) => anchor.focused
      )
    }];
  });

  for (const anchor of anchors) {
    if (ownedSelectorIds.has(anchor.selectorId)) continue;
    diagnostics.push({
      code: "material-plan.unowned-selector",
      message: `Selector ${anchor.selectorId} has no semantic material owner.`,
      transitionId: transition.id,
      selectorId: anchor.selectorId
    });
  }

  return {
    transitionId: transition.id,
    anchors,
    owners
  };
}

function compileAnchors(
  side: "source" | "target",
  states: readonly KpReaderEquationStatePlan[]
): readonly KpReaderEquationAnchorPlan[] {
  return states.flatMap((state) =>
    state.selectors.map((selector, selectorIndex) => ({
      id: `anchor.${selector.id}`,
      side,
      selectorId: selector.id,
      objectId: state.objectId,
      selectorIndex,
      anchorKind: anchorKind(selector),
      ...(selector.label === undefined ? {} : { label: selector.label }),
      focused: selector.focused
    }))
  );
}

function resolveRelationAnchors(
  transitionId: string,
  relation: KpReaderEquationRelationPlan,
  selectorIds: readonly string[],
  anchorsBySelectorId: ReadonlyMap<string, KpReaderEquationAnchorPlan>,
  diagnostics: KpReaderEquationMaterialPlanDiagnostic[]
): readonly KpReaderEquationAnchorPlan[] {
  return selectorIds.flatMap((selectorId) => {
    const anchor = anchorsBySelectorId.get(selectorId);
    if (anchor !== undefined) return [anchor];
    diagnostics.push({
      code: "material-plan.missing-anchor",
      message: `Relation ${relation.recordId} references missing selector anchor ${selectorId}.`,
      transitionId,
      selectorId,
      relationRecordId: relation.recordId
    });
    return [];
  });
}

function anchorKind(
  selector: KpReaderEquationSelectorPlan
): KpReaderEquationAnchorPlan["anchorKind"] {
  if (selector.semanticKind === "relation") return "relation-center";
  if (selector.semanticKind === "operator") return "operator-center";
  return "ink-center";
}

function continuityKind(
  sourceCount: number,
  targetCount: number
): KpReaderEquationMaterialOwnerPlan["continuity"] {
  if (sourceCount > 0 && targetCount > 0) return "source-target";
  return sourceCount > 0 ? "source-only" : "target-only";
}

function sameStrings(
  actual: readonly (string | undefined)[],
  expected: readonly string[]
): boolean {
  return actual.length === expected.length &&
    actual.every((value, index) => value === expected[index]);
}
