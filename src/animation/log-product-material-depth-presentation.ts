import {
  kpCanonicalLogProductMaterialRoleBindings
} from "./log-product-material-depth-bindings.ts";
import {
  sampleKpLogProductMaterialDepthPose,
  type KpLogProductMaterialDepthMode,
  type KpLogProductMaterialDepthPose
} from "./log-product-material-depth-pose.ts";
import type {
  KpLogProductMaterialRoleId
} from "./log-product-material-depth-roles.ts";

export interface KpLogProductMaterialDepthOwnerReference {
  readonly ownerId: string;
  readonly semanticEntityId?: string | undefined;
}

export interface KpLogProductMaterialDepthOwnerPresentation {
  readonly ownerId: string;
  readonly semanticEntityId: string;
  readonly roleId: KpLogProductMaterialRoleId;
  readonly pose: KpLogProductMaterialDepthPose;
}

export function projectKpLogProductMaterialDepthPresentation(input: {
  readonly mode: KpLogProductMaterialDepthMode;
  readonly owners: readonly KpLogProductMaterialDepthOwnerReference[];
  readonly poseByRoleId?: Readonly<
    Partial<Record<KpLogProductMaterialRoleId, KpLogProductMaterialDepthPose>>
  > | undefined;
}): readonly KpLogProductMaterialDepthOwnerPresentation[] {
  if (input.mode !== "material") return Object.freeze([]);

  const roleByEntityId = new Map(
    kpCanonicalLogProductMaterialRoleBindings.flatMap((binding) =>
      binding.entityIds.map((entityId) => [entityId, binding.roleId] as const)
    )
  );
  const restingPose = sampleKpLogProductMaterialDepthPose({
    mode: "material",
    verb: "rest",
    progress: 0
  });
  return Object.freeze(input.owners.flatMap((owner) => {
    const semanticEntityId = owner.semanticEntityId;
    if (semanticEntityId === undefined) return [];
    const roleId = roleByEntityId.get(semanticEntityId);
    if (roleId === undefined) return [];
    return [Object.freeze({
      ownerId: owner.ownerId,
      semanticEntityId,
      roleId,
      pose: input.poseByRoleId?.[roleId] ?? restingPose
    })];
  }));
}

