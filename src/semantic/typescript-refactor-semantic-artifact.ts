import generatedArtifact from
  "./typescript-refactor-semantics.generated.json" with { type: "json" };

import {
  defineKpTypeScriptRefactorSemanticArtifact,
  type KpTypeScriptRefactorSemanticArtifactV1
} from "./typescript-refactor-semantic-model.ts";

// Browser code reads generated plain data only; TypeScript compiler imports
// remain behind the build script and cannot acquire playback authority.
const artifact = defineKpTypeScriptRefactorSemanticArtifact(
  generatedArtifact as KpTypeScriptRefactorSemanticArtifactV1
);

export function readKpTypeScriptRefactorSemanticArtifact():
  KpTypeScriptRefactorSemanticArtifactV1 {
  return artifact;
}
