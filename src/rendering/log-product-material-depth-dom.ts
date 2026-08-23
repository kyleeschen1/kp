import {
  projectKpLogProductMaterialDepthPresentation
} from "../animation/log-product-material-depth-presentation.ts";
import type {
  KpLogProductMaterialDepthMode,
  KpLogProductMaterialDepthPose
} from "../animation/log-product-material-depth-pose.ts";
import type {
  KpLogProductMaterialRoleId
} from "../animation/log-product-material-depth-roles.ts";

const MATERIAL_OWNER_SELECTOR = "[data-kp-equation-material-owner-id]";
const PROJECTED_OWNER_SELECTOR = "[data-kp-log-product-material-role]";
const CONTACT_SHADOW_MAX_OPACITY = 0.18;
const CONTACT_SHADOW_REST_SCALE = 0.62;
const CONTACT_SHADOW_ACTIVE_SCALE = 1;

export function applyKpLogProductMaterialDepthToDom(input: {
  readonly stage: HTMLElement;
  readonly mode: KpLogProductMaterialDepthMode;
  readonly poseByRoleId?: Readonly<
    Partial<Record<KpLogProductMaterialRoleId, KpLogProductMaterialDepthPose>>
  > | undefined;
}): void {
  const materialOwners = [
    ...input.stage.querySelectorAll<HTMLElement>(MATERIAL_OWNER_SELECTOR)
  ];
  const presentations = projectKpLogProductMaterialDepthPresentation({
    mode: input.mode,
    owners: materialOwners.map((owner) => ({
      ownerId: owner.dataset["kpEquationMaterialOwnerId"] ?? "",
      semanticEntityId:
        owner.dataset["kpEquationMaterialSemanticEntityId"]
    })),
    poseByRoleId: input.poseByRoleId
  });
  const activeIds = new Set(presentations.map(({ ownerId }) => ownerId));
  for (const owner of input.stage.querySelectorAll<HTMLElement>(
    PROJECTED_OWNER_SELECTOR
  )) {
    const ownerId = owner.dataset["kpEquationMaterialOwnerId"];
    if (ownerId !== undefined && activeIds.has(ownerId)) continue;
    clearPresentation(owner);
  }

  const owners = new Map(materialOwners.map((owner) => [
        owner.dataset["kpEquationMaterialOwnerId"],
        owner
      ] as const)
      .filter((entry): entry is readonly [string, HTMLElement] =>
        entry[0] !== undefined
      )
  );
  for (const presentation of presentations) {
    const owner = owners.get(presentation.ownerId);
    if (owner === undefined) continue;
    owner.dataset["kpLogProductMaterialRole"] = presentation.roleId;
    owner.dataset["kpLogProductMaterialIdentityEffect"] =
      presentation.identityEffect;
    owner.dataset["kpLogProductMaterialPlane"] = presentation.pose.plane;
    owner.style.setProperty(
      "--kp-log-product-material-depth",
      String(presentation.pose.normalizedDepth)
    );
    owner.style.setProperty(
      "--kp-log-product-material-activity",
      String(presentation.pose.activity)
    );
    owner.style.setProperty(
      "--kp-log-product-contact-shadow-opacity",
      String(presentation.pose.activity * CONTACT_SHADOW_MAX_OPACITY)
    );
    owner.style.setProperty(
      "--kp-log-product-contact-shadow-scale",
      String(
        CONTACT_SHADOW_REST_SCALE +
        presentation.pose.activity * (
          CONTACT_SHADOW_ACTIVE_SCALE - CONTACT_SHADOW_REST_SCALE
        )
      )
    );
  }
}

function clearPresentation(owner: HTMLElement): void {
  delete owner.dataset["kpLogProductMaterialRole"];
  delete owner.dataset["kpLogProductMaterialIdentityEffect"];
  delete owner.dataset["kpLogProductMaterialPlane"];
  owner.style.removeProperty("--kp-log-product-material-depth");
  owner.style.removeProperty("--kp-log-product-material-activity");
  owner.style.removeProperty("--kp-log-product-contact-shadow-opacity");
  owner.style.removeProperty("--kp-log-product-contact-shadow-scale");
}
