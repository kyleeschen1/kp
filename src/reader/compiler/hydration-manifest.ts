import type { KpReaderArtifactRef } from "../document/public-api.ts";
import type { KpResolvedLessonReferences } from "./reference-resolver.ts";
import type { KpStaticMathBlock } from "./static-math-compiler.ts";

export const kpReaderHydrationManifestSchemaVersion = "kp.reader-hydration.v1";

export interface KpReaderHydrationManifest {
  readonly schemaVersion: typeof kpReaderHydrationManifestSchemaVersion;
  readonly lesson: KpReaderArtifactRef<"lesson-document">;
  readonly blocks: readonly KpReaderHydrationBlock[];
}

export interface KpReaderHydrationBlock {
  readonly blockId: string;
  readonly adapterId: string;
  readonly asset: KpReaderArtifactRef<"animation-asset">;
  readonly presentation: "scroll-scrub" | "step";
  readonly checkpoints: readonly KpReaderHydrationCheckpoint[];
  readonly focusObjectRefs: readonly string[];
}

export interface KpReaderHydrationCheckpoint {
  readonly id: string;
  readonly beatId: string;
  readonly progressPermille: number;
  readonly staticStateId: string;
}

export function emitKpReaderHydrationManifest(
  resolved: KpResolvedLessonReferences,
  staticMath: readonly KpStaticMathBlock[]
): KpReaderHydrationManifest {
  const resolvedAssets = new Map(resolved.assets.map((asset) => [asset.blockId, asset]));
  const mathBlocks = new Map(staticMath.map((block) => [block.blockId, block]));
  const blocks = resolved.document.blocks.flatMap((block): readonly KpReaderHydrationBlock[] => {
    if (block.kind !== "animation-story") return [];
    const asset = resolvedAssets.get(block.id);
    if (asset === undefined) throw new Error(`unresolved hydration asset for ${block.id}`);
    const math = mathBlocks.get(block.id);
    if (math === undefined) throw new Error(`missing static math states for ${block.id}`);
    const statesByCheckpoint = new Map(math.states.map((state) => [state.checkpointId, state]));
    const checkpoints = block.beats.map((beat): KpReaderHydrationCheckpoint => {
      const state = statesByCheckpoint.get(beat.checkpoint.id);
      if (state === undefined) {
        throw new Error(`missing static state for ${block.id} checkpoint ${beat.checkpoint.id}`);
      }
      return {
        id: beat.checkpoint.id,
        beatId: beat.id,
        progressPermille: beat.checkpoint.progressPermille,
        staticStateId: `static.${block.id}.${beat.checkpoint.id}`
      };
    });
    return [{
      blockId: block.id,
      adapterId: asset.rendererId,
      asset: { ...block.asset },
      presentation: block.presentation,
      checkpoints,
      focusObjectRefs: [...asset.objectRefs]
    }];
  });

  return {
    schemaVersion: kpReaderHydrationManifestSchemaVersion,
    lesson: {
      kind: "lesson-document",
      id: resolved.document.id,
      version: resolved.document.version
    },
    blocks
  };
}

export function serializeKpReaderHydrationManifest(
  manifest: KpReaderHydrationManifest
): string {
  // Escaping these code points makes the JSON safe inside an inert application/json script.
  return JSON.stringify(manifest)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}
