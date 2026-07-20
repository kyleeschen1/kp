import katex from "katex";

import type { KpLessonDocument } from "../document/public-api.ts";

export interface KpStaticMathProjectionInput {
  readonly assetId: string;
  readonly assetVersion: string;
  readonly blockId: string;
  readonly beatId: string;
  readonly checkpointId: string;
  readonly progressPermille: number;
}

export interface KpStaticMathProjection {
  readonly latex: string;
  readonly label: string;
}

export interface KpStaticMathState extends KpStaticMathProjectionInput {
  readonly latex: string;
  readonly label: string;
  readonly html: string;
}

export interface KpStaticMathBlock {
  readonly blockId: string;
  readonly states: readonly KpStaticMathState[];
}

export type KpStaticMathProjector = (
  input: KpStaticMathProjectionInput
) => KpStaticMathProjection;

export function compileKpStaticMathStates(
  document: KpLessonDocument,
  project: KpStaticMathProjector
): readonly KpStaticMathBlock[] {
  return document.blocks.flatMap((block): readonly KpStaticMathBlock[] => {
    if (block.kind !== "animation-story") return [];
    const states = block.beats.map((beat): KpStaticMathState => {
      const input = {
        assetId: block.asset.id,
        assetVersion: block.asset.version,
        blockId: block.id,
        beatId: beat.id,
        checkpointId: beat.checkpoint.id,
        progressPermille: beat.checkpoint.progressPermille
      };
      const projection = project(input);
      if (projection.latex.trim() === "") {
        throw new Error(`${beat.id} projected an empty LaTeX state`);
      }
      if (projection.label.trim() === "") {
        throw new Error(`${beat.id} projected an empty accessible label`);
      }
      return {
        ...input,
        ...projection,
        html: katex.renderToString(projection.latex, {
          displayMode: true,
          output: "htmlAndMathml",
          throwOnError: true,
          strict: "error",
          trust: false
        })
      };
    });
    return [{ blockId: block.id, states }];
  });
}
