import { createKpAnimationAssetBuilder } from "../animation/asset.ts";
import { createKpImmutableSemanticAssetObject } from "../semantic/immutable-asset.ts";
import { createKpSemanticTransformation } from "../semantic/asset-transformation.ts";
import { createKpCanonicalOperationPack } from "../semantic/canonical-operation-pack.ts";
import { sha256 } from "../kernel/public-api.ts";
import { compileKpGovernedCanonicalConstruction, createKpGovernedCanonicalConstructionRequest } from "./canonical-animation-public-api.ts";
import { assertMomentumEnergy, sampleMomentumEnergy, physicalTime, type CheckedMomentumEnergy } from "../../domains/public-api.ts";

export const momentumEnergyOperations = createKpCanonicalOperationPack({ id: "project.physics.momentum-energy", scope: "project", version: "1.0.0",
  title: "Analytical particle momentum and energy", operationIds: ["physics.advance-straight-particle", "physics.advance-turning-particle"] });
export const momentumEnergyRepresentation = Object.freeze({ id: "representation.physics.momentum-energy.native-2d.v1",
  route: "/experiments/mechanics-relations/", renderTargetId: "render.physics.momentum-energy", status: "candidate" });

/** Build-time governance checks lineage and references. The physics checker owns
 * analytical truth; named law references are not a substitute for that checker. */
export function compileMomentumEnergyAsset(model: CheckedMomentumEnergy) {
  assertMomentumEnergy(model);
  const revisionId = `sha256:${sha256(JSON.stringify(model.source))}`;
  const id = `physics.momentum-energy.${model.source.episode}.${revisionId.slice(7)}`;
  const record = createKpImmutableSemanticAssetObject({ id, objectType: "physics-analytical-particle", title: "Checked analytical particle", value: model.source,
    selectors: [{ id: `${id}.model`, kind: "domain-model", label: "Analytical particle model" }] });
  const state = (phase: "initial" | "final", seconds: number) => {
    const { time, ...values } = sampleMomentumEnergy(model, physicalTime(seconds));
    return createKpImmutableSemanticAssetObject({ id: `${id}.${phase}`, objectType: "physics-particle-state", title: phase,
      value: { ...values, seconds: time.seconds }, selectors: ["particle", "momentum", "force", "energy"].map(role => ({ id: `${id}.${phase}.${role}`, kind: role, label: role })) });
  };
  const initial = state("initial", 0), final = state("final", model.durationSeconds);
  const operationId = model.source.episode === "straight" ? "physics.advance-straight-particle" : "physics.advance-turning-particle";
  const builder = createKpAnimationAssetBuilder({ id: `animation.physics.momentum-energy.${model.source.episode}`, title: "Force, momentum and kinetic energy" });
  [record, initial, final].forEach(object => builder.addObject(object));
  builder.addTransformation(createKpSemanticTransformation({ id: operationId, definitionId: `definition.${operationId}`, transformType: operationId,
    title: "Advance the same particle in physical time", sourceObjectIds: [initial.id], targetObjectIds: [final.id], preserves: ["identity", "role"],
    assumptions: ["Constant-mass Newtonian point particle; fixed inertial frame; SI units", "Only the checked analytical straight-line or quarter-circle episode"],
    lawRefs: [{ id: "physics.newtonian-particle.momentum-power", level: "strict", summary: "Analytical fixture satisfies dp/dt=F and dK/dt=F dot v; numerical display is approximate" }],
    correspondenceMap: { id: `lineage.${id}`, records: initial.selectors.map((selector, i) => ({ id: `lineage.${id}.${i}`, relation: "identity",
      sourceSelectorIds: [selector.id], targetSelectorIds: [final.selectors[i]!.id], summary: "Track the same particle and its quantities, not equal values" })) }
  }));
  builder.addRenderTarget({ id: momentumEnergyRepresentation.renderTargetId, kind: "graph", objectIds: [record.id, initial.id, final.id],
    transformationIds: [operationId], summary: momentumEnergyRepresentation.id });
  const animation = builder.build();
  const source = { sourceId: id, revisionId, operationPacks: [{ packId: momentumEnergyOperations.id, version: momentumEnergyOperations.version }] };
  const request = createKpGovernedCanonicalConstructionRequest({ schemaVersion: "kp.governed-semantic-authoring-request.v2", id: `request.${id}`,
    source: { kind: "verified-semantic-source", ...source }, approvedObjectIds: animation.bundle.objects.map(object => object.id), approvedOperationIds: [operationId],
    explanationPurpose: { kind: "compare", objectIds: [initial.id, final.id], operationIds: [operationId] }, detailLevel: "complete",
    compositionIntent: { kind: "sequence", operationIds: [operationId] } });
  return Object.freeze({ model, revisionId, animation, construction: compileKpGovernedCanonicalConstruction({ request, authority: { ...source, animation } }) });
}
