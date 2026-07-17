export interface KpEditorEquationMaterialContinuitySnapshot {
  readonly ownerIds: readonly string[];
  readonly fragmentRoles: readonly string[];
  readonly motionIdentityIds: readonly string[];
  readonly materialContinuantCount: number;
  readonly structuralFragmentCount: number;
  readonly bundleAnchor?: string | undefined;
  readonly nativeSettlementProgress?: number | undefined;
  readonly semanticProgress: number;
}

export interface KpEditorEquationMaterialContinuityInspection {
  readonly mode:
    | "persistent-owners-and-bundle"
    | "persistent-owners"
    | "native-identities"
    | "unreported";
  readonly ownershipLabel: string;
  readonly bundleLabel: string;
  readonly settlementLabel:
    | "material fragments"
    | "native handoff"
    | "native geometry"
    | "not applicable";
  readonly eligibilityLabel: string;
}

export function inspectKpEditorEquationMaterialContinuity(
  snapshot: KpEditorEquationMaterialContinuitySnapshot
): KpEditorEquationMaterialContinuityInspection {
  const mode = snapshot.ownerIds.length > 0
    ? snapshot.fragmentRoles.length > 0
      ? "persistent-owners-and-bundle"
      : "persistent-owners"
    : snapshot.motionIdentityIds.length > 0
      ? "native-identities"
      : "unreported";
  const settlementLabel = snapshot.nativeSettlementProgress === undefined
    ? snapshot.fragmentRoles.length === 0
      ? "not applicable"
      : "material fragments"
    : snapshot.nativeSettlementProgress >= 1
      ? "native geometry"
      : snapshot.nativeSettlementProgress > 0
        ? "native handoff"
        : "material fragments";

  return {
    mode,
    ownershipLabel:
      `${countLabel(snapshot.ownerIds.length, "owner")} · ${countLabel(snapshot.motionIdentityIds.length, "motion identity", "motion identities")}`,
    bundleLabel: snapshot.bundleAnchor === undefined
      ? "none"
      : `${snapshot.fragmentRoles.length} fragments → ${snapshot.bundleAnchor}`,
    settlementLabel,
    eligibilityLabel:
      `${snapshot.materialContinuantCount} continuants · ${snapshot.structuralFragmentCount} structural exemptions`
  };
}

export function syncKpEditorEquationMaterialContinuityInspection(input: {
  readonly player: HTMLElement;
  readonly stage: HTMLElement;
}): KpEditorEquationMaterialContinuityInspection {
  const transition = input.stage.querySelector<HTMLElement>(
    "[data-kp-editor-equation-transition-id]"
  );
  const inspection = inspectKpEditorEquationMaterialContinuity({
    ownerIds: uniqueDatasetValues(
      input.stage,
      "[data-kp-equation-material-owner-id]",
      "kpEquationMaterialOwnerId"
    ),
    fragmentRoles: uniqueDatasetValues(
      input.stage,
      "[data-kp-equation-material-fragment-role]",
      "kpEquationMaterialFragmentRole"
    ),
    motionIdentityIds: uniqueDatasetValues(
      input.stage,
      "[data-kp-editor-gestalt-motion-identity]",
      "kpEditorGestaltMotionIdentity"
    ),
    materialContinuantCount: input.stage.querySelectorAll(
      '[data-kp-editor-gestalt-motion-eligibility="material-continuant"]'
    ).length,
    structuralFragmentCount: input.stage.querySelectorAll(
      '[data-kp-editor-gestalt-motion-eligibility="structural-fragment"]'
    ).length,
    ...(transition?.dataset["kpEditorEquationSuccessionBundle"] === undefined
      ? {}
      : {
          bundleAnchor:
            transition.dataset["kpEditorEquationSuccessionBundle"]
        }),
    ...(input.stage.dataset["kpEditorEquationNativeSettlementProgress"] === undefined
      ? {}
      : {
          nativeSettlementProgress: Number(
            input.stage.dataset["kpEditorEquationNativeSettlementProgress"]
          )
        }),
    semanticProgress: Number(
      input.stage.dataset["kpEditorEquationSemanticProgress"] ?? 0
    )
  });

  input.player.dataset["kpEditorAnimationContinuityMode"] = inspection.mode;
  input.player.dataset["kpEditorAnimationContinuitySettlement"] =
    inspection.settlementLabel;
  replaceText(
    input.player,
    "[data-kp-editor-continuity-ownership]",
    inspection.ownershipLabel
  );
  replaceText(
    input.player,
    "[data-kp-editor-continuity-bundle]",
    inspection.bundleLabel
  );
  replaceText(
    input.player,
    "[data-kp-editor-continuity-settlement]",
    inspection.settlementLabel
  );
  replaceText(
    input.player,
    "[data-kp-editor-continuity-eligibility]",
    inspection.eligibilityLabel
  );
  return inspection;
}

function uniqueDatasetValues(
  root: ParentNode,
  selector: string,
  key: string
): readonly string[] {
  return [...new Set(
    [...root.querySelectorAll<HTMLElement>(selector)]
      .map((element) => element.dataset[key])
      .filter((value): value is string => value !== undefined)
  )];
}

function replaceText(root: ParentNode, selector: string, value: string): void {
  root.querySelector<HTMLElement>(selector)
    ?.replaceChildren(document.createTextNode(value));
}

function countLabel(
  count: number,
  singular: string,
  plural = `${singular}s`
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
