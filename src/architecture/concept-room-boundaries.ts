export type KpConceptRoomBoundaryId =
  | "protocols"
  | "kernel"
  | "domains"
  | "authoring"
  | "integrations"
  | "projections"
  | "app-adapters";

export interface KpConceptRoomBoundary {
  readonly id: KpConceptRoomBoundaryId;
  readonly root: string;
  readonly publicEntryPoint: string;
  readonly mayImport: readonly KpConceptRoomBoundaryId[];
}

// This map declares the intended dependency graph before consumers move onto
// it, so later enforcement can distinguish new architecture from legacy code.
export const kpConceptRoomBoundaries = [
  {
    id: "protocols",
    root: "protocols",
    publicEntryPoint: "protocols/public-api.ts",
    mayImport: []
  },
  {
    id: "kernel",
    root: "src/kernel",
    publicEntryPoint: "src/kernel/public-api.ts",
    mayImport: []
  },
  {
    id: "domains",
    root: "domains",
    publicEntryPoint: "domains/public-api.ts",
    mayImport: ["kernel"]
  },
  {
    id: "authoring",
    root: "src/authoring",
    publicEntryPoint: "src/authoring/public-api.ts",
    mayImport: ["protocols", "kernel", "domains"]
  },
  {
    id: "integrations",
    root: "src/integrations",
    publicEntryPoint: "src/integrations/public-api.ts",
    mayImport: ["protocols", "kernel", "domains"]
  },
  {
    id: "projections",
    root: "src/projections",
    publicEntryPoint: "src/projections/public-api.ts",
    mayImport: ["kernel", "domains"]
  },
  {
    id: "app-adapters",
    root: "src/app-adapters",
    publicEntryPoint: "src/app-adapters/public-api.ts",
    mayImport: ["protocols", "kernel", "domains", "integrations", "projections"]
  }
] as const satisfies readonly KpConceptRoomBoundary[];

