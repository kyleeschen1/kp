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
