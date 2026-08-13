import generatedArtifact from
  "./python-refactor-semantics.generated.json" with { type: "json" };

import {
  defineKpPythonRefactorSemanticArtifact,
  type KpPythonRefactorSemanticArtifactV1
} from "./python-refactor-semantic-model.ts";

// Browser code imports only this generated-data reader. The Python process,
// AST, and build scripts cannot acquire runtime or playback authority.
const artifact = defineKpPythonRefactorSemanticArtifact(
  generatedArtifact as KpPythonRefactorSemanticArtifactV1
);

export function readKpPythonRefactorSemanticArtifact():
  KpPythonRefactorSemanticArtifactV1 {
  return artifact;
}
