export type KpTutorialViewKind =
  | "controls"
  | "equation"
  | "graph"
  | "narration";

export interface KpTutorialView {
  readonly id: string;
  readonly kind: KpTutorialViewKind;
  readonly semanticObjectIds: readonly string[];
  readonly label: string;
  readonly primary: boolean;
  readonly quietContext: boolean;
}

export interface KpTutorialCheckpoint {
  readonly id: string;
  readonly sceneId: string;
  readonly progress: number;
  readonly viewIds: readonly string[];
  readonly label: string;
}

export interface KpTutorialScene {
  readonly id: string;
  readonly title: string;
  readonly viewIds: readonly string[];
  readonly checkpointIds: readonly string[];
}

export interface KpHermeneuticTutorialModule {
  readonly id: string;
  readonly version: 1;
  readonly title: string;
  readonly clockId: string;
  readonly canonicalSceneIds: readonly string[];
  readonly views: readonly KpTutorialView[];
  readonly scenes: readonly KpTutorialScene[];
  readonly checkpoints: readonly KpTutorialCheckpoint[];
}

export interface KpTutorialModuleDiagnostic {
  readonly path: string;
  readonly message: string;
}

export function createKpHermeneuticTutorialModule(
  input: KpHermeneuticTutorialModule
): KpHermeneuticTutorialModule {
  const module = {
    ...input,
    canonicalSceneIds: [...input.canonicalSceneIds],
    views: input.views.map((view) => ({
      ...view,
      semanticObjectIds: [...view.semanticObjectIds]
    })),
    scenes: input.scenes.map((scene) => ({
      ...scene,
      viewIds: [...scene.viewIds],
      checkpointIds: [...scene.checkpointIds]
    })),
    checkpoints: input.checkpoints.map((checkpoint) => ({
      ...checkpoint,
      viewIds: [...checkpoint.viewIds]
    }))
  };
  const diagnostics = validateKpHermeneuticTutorialModule(module);

  if (diagnostics.length > 0) {
    throw new Error(
      `Invalid tutorial module ${input.id}: ${diagnostics
        .map((diagnostic) => `${diagnostic.path}: ${diagnostic.message}`)
        .join("; ")}`
    );
  }

  return module;
}

export function validateKpHermeneuticTutorialModule(
  module: KpHermeneuticTutorialModule
): readonly KpTutorialModuleDiagnostic[] {
  const diagnostics: KpTutorialModuleDiagnostic[] = [];
  const viewIds = collectIds(module.views, "views", diagnostics);
  const sceneIds = collectIds(module.scenes, "scenes", diagnostics);
  const checkpointIds = collectIds(
    module.checkpoints,
    "checkpoints",
    diagnostics
  );

  requireRefs(
    module.canonicalSceneIds,
    sceneIds,
    "canonicalSceneIds",
    "scene",
    diagnostics
  );

  module.scenes.forEach((scene, index) => {
    requireRefs(
      scene.viewIds,
      viewIds,
      `scenes[${index}].viewIds`,
      "view",
      diagnostics
    );
    requireRefs(
      scene.checkpointIds,
      checkpointIds,
      `scenes[${index}].checkpointIds`,
      "checkpoint",
      diagnostics
    );
  });

  module.checkpoints.forEach((checkpoint, index) => {
    if (!sceneIds.has(checkpoint.sceneId)) {
      diagnostics.push({
        path: `checkpoints[${index}].sceneId`,
        message: `Unknown scene ${checkpoint.sceneId}.`
      });
    }
    if (checkpoint.progress < 0 || checkpoint.progress > 1) {
      diagnostics.push({
        path: `checkpoints[${index}].progress`,
        message: "Progress must be between 0 and 1."
      });
    }
    requireRefs(
      checkpoint.viewIds,
      viewIds,
      `checkpoints[${index}].viewIds`,
      "view",
      diagnostics
    );
  });

  return diagnostics;
}

function collectIds(
  values: readonly { readonly id: string }[],
  path: string,
  diagnostics: KpTutorialModuleDiagnostic[]
): ReadonlySet<string> {
  const ids = new Set<string>();

  values.forEach((value, index) => {
    if (ids.has(value.id)) {
      diagnostics.push({
        path: `${path}[${index}].id`,
        message: `Duplicate id ${value.id}.`
      });
    }
    ids.add(value.id);
  });

  return ids;
}

function requireRefs(
  refs: readonly string[],
  known: ReadonlySet<string>,
  path: string,
  kind: string,
  diagnostics: KpTutorialModuleDiagnostic[]
): void {
  refs.forEach((ref, index) => {
    if (!known.has(ref)) {
      diagnostics.push({
        path: `${path}[${index}]`,
        message: `Unknown ${kind} ${ref}.`
      });
    }
  });
}
