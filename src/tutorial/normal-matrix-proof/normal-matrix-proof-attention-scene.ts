import {
  createKpSemanticEntity,
  createKpSemanticEntityRegistry
} from "../../semantic/semantic-entity-provenance.ts";
import { createKpSemanticScene } from
  "../../semantic/semantic-scene-protocol.ts";
import { kpNormalMatrixProofSemanticRegistry } from
  "../../semantic/normal-matrix-proof-semantics.ts";

// Both local attention cycles validate against this projection so they cannot
// drift into parallel semantic registries. Proof paths remain its authority.
export const kpNormalMatrixProofAttentionScene = createKpSemanticScene({
  id: "scene.normal-proof.attention",
  surfaceKind: "equation",
  title: "Normal-matrix proof attention scene",
  registry: createKpSemanticEntityRegistry({
    entities: kpNormalMatrixProofSemanticRegistry.map((entity) =>
      createKpSemanticEntity({
        id: entity.path,
        semanticKind: entity.kind,
        label: entity.label,
        ...(entity.parentPath === undefined
          ? {}
          : { parentId: entity.parentPath }),
        provenance: {
          kind: "authored",
          sourceId: "proof.linear-algebra.normal-matrix-unitary-diagonalization"
        }
      })
    )
  })
});
