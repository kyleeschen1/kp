import type { KpAnimationAsset } from "../asset.ts";
import {
  createAcceptedGeneratedAddZeroAnimationAsset,
  createAcceptedGeneratedSubstitutionAnimationAsset
} from "../llm-animation-draft-examples.ts";
import {
  createAcceptedGeneratedPipelineDiagramAnimationAsset
} from "../llm-diagram-draft-example.ts";

export function createKpGeneratedDraftAnimationPack(): readonly KpAnimationAsset[] {
  return [
    createAcceptedGeneratedAddZeroAnimationAsset(),
    createAcceptedGeneratedSubstitutionAnimationAsset(),
    createAcceptedGeneratedPipelineDiagramAnimationAsset()
  ];
}
