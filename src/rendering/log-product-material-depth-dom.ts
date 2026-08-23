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
const CONTACT_SHADOW_DEPTH_FADE = 0.35;
const CONTACT_SHADOW_REST_SCALE = 0.62;
const CONTACT_SHADOW_ACTIVE_SCALE = 1;
const MATERIAL_LIFT_PX = 2.5;
const MATERIAL_SURFACE_EPSILON = 0.001;

export interface KpLogProductMaterialSurfaceProjection {
  readonly lifted: boolean;
  readonly shadowActive: boolean;
  readonly glyphLiftPx: number;
  readonly shadowGroundingPx: number;
  readonly shadowOpacity: number;
  readonly shadowScale: number;
}

export function projectKpLogProductMaterialSurface(input: {
  readonly pose: KpLogProductMaterialDepthPose;
}): KpLogProductMaterialSurfaceProjection {
  const absoluteDepth = Math.abs(input.pose.normalizedDepth);
  const normalizedDepth = absoluteDepth <= MATERIAL_SURFACE_EPSILON
    ? 0
    : input.pose.normalizedDepth;
  const shadowOpacity =
    input.pose.activity * CONTACT_SHADOW_MAX_OPACITY *
    (1 - absoluteDepth * CONTACT_SHADOW_DEPTH_FADE);
  return Object.freeze({
    lifted: absoluteDepth > MATERIAL_SURFACE_EPSILON,
    shadowActive: shadowOpacity > MATERIAL_SURFACE_EPSILON,
    glyphLiftPx: normalizedDepth === 0
      ? 0
      : -normalizedDepth * MATERIAL_LIFT_PX,
    // The inverse offset keeps the shadow on the implied baseline while its
    // glyph rises above or sinks beneath that surface.
    shadowGroundingPx: normalizedDepth * MATERIAL_LIFT_PX,
    shadowOpacity,
    shadowScale:
      CONTACT_SHADOW_REST_SCALE +
      absoluteDepth * (
        CONTACT_SHADOW_ACTIVE_SCALE - CONTACT_SHADOW_REST_SCALE
      )
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
  readonly surfaceBaselineY?: number | undefined;
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
    owner.dataset["kpLogProductMaterialLifted"] = String(surface.lifted);
    owner.dataset["kpLogProductContactShadowActive"] =
      String(surface.shadowActive);
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
      String(surface.shadowOpacity)
    );
    owner.style.setProperty(
      "--kp-log-product-contact-shadow-scale",
      String(surface.shadowScale)
    );
    owner.style.setProperty(
      "--kp-log-product-material-glyph-lift-y",
      `${surface.glyphLiftPx}px`
    );
    owner.style.setProperty(
      "--kp-log-product-contact-shadow-grounding-y",
      `${surface.shadowGroundingPx}px`
    );
    // The compositor already writes stage-relative top as inline geometry;
    // consuming it here aligns shadows without a synchronous layout read.
    const ownerTop = Number.parseFloat(owner.style.top);
    if (
      input.surfaceBaselineY !== undefined &&
      Number.isFinite(input.surfaceBaselineY) &&
      Number.isFinite(ownerTop)
    ) {
      owner.style.setProperty(
        "--kp-log-product-contact-shadow-surface-y",
        `${input.surfaceBaselineY - ownerTop}px`
      );
    } else {
      owner.style.removeProperty(
        "--kp-log-product-contact-shadow-surface-y"
      );
    }
  }
}

function clearPresentation(owner: HTMLElement): void {
  delete owner.dataset["kpLogProductMaterialRole"];
  delete owner.dataset["kpLogProductMaterialIdentityEffect"];
  delete owner.dataset["kpLogProductMaterialPlane"];
  delete owner.dataset["kpLogProductMaterialLifted"];
  delete owner.dataset["kpLogProductContactShadowActive"];
  owner.style.removeProperty("--kp-log-product-material-depth");
  owner.style.removeProperty("--kp-log-product-material-activity");
  owner.style.removeProperty("--kp-log-product-contact-shadow-opacity");
  owner.style.removeProperty("--kp-log-product-contact-shadow-scale");
  owner.style.removeProperty("--kp-log-product-material-glyph-lift-y");
  owner.style.removeProperty("--kp-log-product-contact-shadow-grounding-y");
  owner.style.removeProperty("--kp-log-product-contact-shadow-surface-y");
}
