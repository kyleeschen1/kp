import type { KpAnimationAsset } from "../asset.ts";
import {
  createAcceptedGeneratedAddZeroAnimationAsset,
  createAcceptedGeneratedSubstitutionAnimationAsset,
  createProvisionalIncorrectSubstitutionAnimationAsset
} from "../llm-animation-draft-examples.ts";
import {
  createAcceptedGeneratedPipelineDiagramAnimationAsset
} from "../llm-diagram-draft-example.ts";
// Epistemic sampling is loaded with the only pack that currently authors
// provisional branch metadata, keeping the generic editor shell lightweight.
import "../epistemic-branch-register.ts";

export function createKpGeneratedDraftAnimationPack(): readonly KpAnimationAsset[] {
  return [
    createAcceptedGeneratedAddZeroAnimationAsset(),
    createAcceptedGeneratedSubstitutionAnimationAsset(),
    createProvisionalIncorrectSubstitutionAnimationAsset(),
    createAcceptedGeneratedPipelineDiagramAnimationAsset()
  ];
}
