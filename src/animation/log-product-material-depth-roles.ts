export type KpLogProductMaterialPlane =
  | "surface"
  | "active"
  | "subsurface";

export type KpLogProductMaterialVerb =
  | "rest"
  | "activate"
  | "impress"
  | "withdraw"
  | "release"
  | "transport"
  | "receive"
  | "resolve"
  | "settle";

export type KpLogProductMaterialIdentityEffect =
  | "preserve"
  | "withdraw-source"
  | "generate-successor"
  | "replace-structure";

export type KpLogProductMaterialRoleId =
  | "role.material.log-product.source-application"
  | "role.material.log-product.source-relation"
  | "role.material.log-product.persistent-factor"
  | "role.material.log-product.target-enclosure"
  | "role.material.log-product.target-application-syntax"
  | "role.material.log-product.target-relation";

export interface KpLogProductMaterialRoleDefinition {
  readonly id: KpLogProductMaterialRoleId;
  readonly identityEffect: KpLogProductMaterialIdentityEffect;
  readonly restingPlane: "surface";
  readonly permittedPlanes: readonly KpLogProductMaterialPlane[];
  readonly physicalVerbs: readonly KpLogProductMaterialVerb[];
}

// Physical roles express semantic presentation intent; renderers alone own pixels,
// DOM selection, timing, and paint so this vocabulary cannot become choreography.
export const kpLogProductMaterialRoleDefinitions = Object.freeze([
  {
    id: "role.material.log-product.source-application",
    identityEffect: "withdraw-source",
    restingPlane: "surface",
    permittedPlanes: ["surface", "active", "subsurface"],
    physicalVerbs: ["rest", "activate", "impress", "withdraw"]
  },
  {
    id: "role.material.log-product.source-relation",
    identityEffect: "replace-structure",
    restingPlane: "surface",
    permittedPlanes: ["surface", "active", "subsurface"],
    physicalVerbs: ["rest", "activate", "release", "withdraw"]
  },
  {
    id: "role.material.log-product.persistent-factor",
    identityEffect: "preserve",
    restingPlane: "surface",
    permittedPlanes: ["surface", "active"],
    physicalVerbs: ["rest", "release", "transport", "settle"]
  },
  {
    id: "role.material.log-product.target-enclosure",
    identityEffect: "generate-successor",
    restingPlane: "surface",
    permittedPlanes: ["subsurface", "active", "surface"],
    physicalVerbs: ["receive", "settle", "rest"]
  },
  {
    id: "role.material.log-product.target-application-syntax",
    identityEffect: "generate-successor",
    restingPlane: "surface",
    permittedPlanes: ["subsurface", "active", "surface"],
    physicalVerbs: ["receive", "resolve", "settle", "rest"]
  },
  {
    id: "role.material.log-product.target-relation",
    identityEffect: "replace-structure",
    restingPlane: "surface",
    permittedPlanes: ["subsurface", "active", "surface"],
    physicalVerbs: ["receive", "resolve", "settle", "rest"]
  }
] as const satisfies readonly KpLogProductMaterialRoleDefinition[]);

