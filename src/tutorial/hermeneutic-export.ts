import type { KpTutorialExplorationBranch } from "./exploration-branch.ts";
import type { KpHermeneuticTutorialModule } from "./hermeneutic-module.ts";

export interface KpHermeneuticTutorialExportFrame {
  readonly id: string;
  readonly sceneId: string;
  readonly checkpointId: string;
  readonly progress: number;
}

export interface KpHermeneuticTutorialBranchExport {
  readonly branchId: string;
  readonly patchIds: readonly string[];
  readonly lockedParameterIds: readonly string[];
}

export interface KpHermeneuticTutorialExportArtifact {
  readonly id: string;
  readonly moduleId: string;
  readonly clockId: string;
  readonly canonicalOnly: boolean;
  readonly frames: readonly KpHermeneuticTutorialExportFrame[];
  readonly branches: readonly KpHermeneuticTutorialBranchExport[];
}

export function createKpHermeneuticTutorialExportArtifact(input: {
  readonly id: string;
  readonly module: KpHermeneuticTutorialModule;
  readonly includeBranches?: boolean | undefined;
  readonly branches?: readonly KpTutorialExplorationBranch[] | undefined;
}): KpHermeneuticTutorialExportArtifact {
  const canonicalSceneIds = new Set(input.module.canonicalSceneIds);
  const checkpoints = input.module.checkpoints.filter((checkpoint) =>
    canonicalSceneIds.has(checkpoint.sceneId)
  );
  const includeBranches = input.includeBranches === true;

  return {
    id: input.id,
    moduleId: input.module.id,
    clockId: input.module.clockId,
    canonicalOnly: !includeBranches,
    frames: checkpoints.map((checkpoint) => ({
      id: `${input.id}.frame.${checkpoint.id}`,
      sceneId: checkpoint.sceneId,
      checkpointId: checkpoint.id,
      progress: checkpoint.progress
    })),
    branches: includeBranches
      ? (input.branches ?? []).map((branch) => ({
          branchId: branch.id,
          patchIds: branch.patches.map(({ id }) => id),
          lockedParameterIds: [...branch.lockedParameterIds]
        }))
      : []
  };
}
