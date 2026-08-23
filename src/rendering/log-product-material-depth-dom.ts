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
const RELIEF_SIDE_OFFSET_PX = 0.45;
const RELIEF_SIDE_MAX_OPACITY = 0.78;
const RELIEF_CAST_OFFSET_PX = 0.85;
const RELIEF_CAST_BLUR_PX = 0.5;
const RELIEF_CAST_MAX_OPACITY = 0.08;
const MATERIAL_SURFACE_EPSILON = 0.001;

export interface KpLogProductMaterialSurfaceProjection {
  readonly reliefActive: boolean;
  readonly reliefStrength: number;
  readonly reliefSideOffsetPx: number;
  readonly reliefSideOpacity: number;
  readonly reliefCastOffsetPx: number;
  readonly reliefCastBlurPx: number;
  readonly reliefCastOpacity: number;
}

export function projectKpLogProductMaterialSurface(input: {
  readonly pose: KpLogProductMaterialDepthPose;
}): KpLogProductMaterialSurfaceProjection {
  const raisedDepth = Math.max(0, input.pose.normalizedDepth);
  const rawStrength = raisedDepth * input.pose.activity;
  const reliefStrength = rawStrength <= MATERIAL_SURFACE_EPSILON
    ? 0
    : Math.min(1, rawStrength);
  return Object.freeze({
    reliefActive: reliefStrength > 0,
    reliefStrength,
    // Foreground ink never moves. These offsets paint a shallow contour
    // behind it, preserving native baseline and endpoint geometry.
    reliefSideOffsetPx: reliefStrength * RELIEF_SIDE_OFFSET_PX,
    reliefSideOpacity: reliefStrength * RELIEF_SIDE_MAX_OPACITY,
    reliefCastOffsetPx: reliefStrength * RELIEF_CAST_OFFSET_PX,
    reliefCastBlurPx: reliefStrength * RELIEF_CAST_BLUR_PX,
    reliefCastOpacity: reliefStrength * RELIEF_CAST_MAX_OPACITY
  });
}

export function resolveKpLogProductDepthModeForVisualOwner(
  mode: KpLogProductMaterialDepthMode,
  visualOwner: "source-native" | "material-scene" | "target-native"
): KpLogProductMaterialDepthMode {
  // Native endpoints must remain exact KaTeX paint, even while the local
  // experiment remains selected for subsequent intermediate frames.
  return visualOwner === "material-scene" ? mode : "no-depth";
}

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
    const surface = projectKpLogProductMaterialSurface({
      pose: presentation.pose
    });
    owner.dataset["kpLogProductMaterialRole"] = presentation.roleId;
    owner.dataset["kpLogProductMaterialIdentityEffect"] =
      presentation.identityEffect;
    owner.dataset["kpLogProductMaterialPlane"] = presentation.pose.plane;
    owner.dataset["kpLogProductMaterialReliefActive"] =
      String(surface.reliefActive);
    owner.style.setProperty(
      "--kp-log-product-material-depth",
      String(presentation.pose.normalizedDepth)
    );
    owner.style.setProperty(
      "--kp-log-product-material-activity",
      String(presentation.pose.activity)
    );
    owner.style.setProperty(
      "--kp-log-product-material-relief-strength",
      String(surface.reliefStrength)
    );
    owner.style.setProperty(
      "--kp-log-product-material-relief-side-offset",
      `${surface.reliefSideOffsetPx}px`
    );
    owner.style.setProperty(
      "--kp-log-product-material-relief-side-opacity",
      String(surface.reliefSideOpacity)
    );
    owner.style.setProperty(
      "--kp-log-product-material-relief-cast-offset",
      `${surface.reliefCastOffsetPx}px`
    );
    owner.style.setProperty(
      "--kp-log-product-material-relief-cast-blur",
      `${surface.reliefCastBlurPx}px`
    );
    owner.style.setProperty(
      "--kp-log-product-material-relief-cast-opacity",
      String(surface.reliefCastOpacity)
    );
  }
}

function clearPresentation(owner: HTMLElement): void {
  delete owner.dataset["kpLogProductMaterialRole"];
  delete owner.dataset["kpLogProductMaterialIdentityEffect"];
  delete owner.dataset["kpLogProductMaterialPlane"];
  delete owner.dataset["kpLogProductMaterialReliefActive"];
  owner.style.removeProperty("--kp-log-product-material-depth");
  owner.style.removeProperty("--kp-log-product-material-activity");
  owner.style.removeProperty("--kp-log-product-material-relief-strength");
  owner.style.removeProperty("--kp-log-product-material-relief-side-offset");
  owner.style.removeProperty("--kp-log-product-material-relief-side-opacity");
  owner.style.removeProperty("--kp-log-product-material-relief-cast-offset");
  owner.style.removeProperty("--kp-log-product-material-relief-cast-blur");
  owner.style.removeProperty("--kp-log-product-material-relief-cast-opacity");
}
