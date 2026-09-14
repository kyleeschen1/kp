import { assertMomentumEnergyDerivation, momentumEnergyDerivationSteps, momentumEnergyDerivationStates,
  type CheckedMomentumEnergyDerivation } from "../../domains/public-api.ts";
import { createKpAnimationAssetBuilder } from "../animation/asset.ts";
import { createKpImmutableSemanticAssetObject } from "../semantic/immutable-asset.ts";
import { createKpSemanticTransformation } from "../semantic/asset-transformation.ts";
import { createKpCanonicalOperationPack } from "../semantic/canonical-operation-pack.ts";
import { compileKpGovernedCanonicalConstruction, createKpGovernedCanonicalConstructionRequest } from "./canonical-animation-public-api.ts";
import { createEnergyDerivationPlan } from "../semantic/momentum-energy-derivation-plan.ts";

const pack = createKpCanonicalOperationPack({ id: "project.physics.energy-derivation", scope: "project", version: "1.0.0",
  title: "Checked vector kinetic-energy derivation", operationIds: momentumEnergyDerivationSteps.map(s => `physics.energy.${s.id}`) });

// Semantic fragments are named by the bounded proof, never inferred from equal
// glyphs. The native renderer may measure them, but cannot choose their lineage.
export function compileMomentumEnergyDerivation(model: CheckedMomentumEnergyDerivation) {
  assertMomentumEnergyDerivation(model);
  const part = (id: string, latex: string) => String.raw`\htmlData{kp-semantic-entity-id=${id},kp-presentation-group-id=group.${id}}{${latex}}`;
  const p = (id: string, latex: string) => part(`energy.${id}`, latex);
  const prefix = p("prefix", "K=");
  const half = p("half", String.raw`\frac{1}{2}`), mass = p("mass", "m");
  // left/right delimiters must be paired within native KaTeX grammar, so the
  // ownership wrappers enclose delimiter glyphs rather than unmatched \left.
  const magnitude = (inside: string) => `${p("left", "|")}${inside}${p("right", "|")}`;
  const power = p("power", "2");
  const fixed = prefix + half + mass;
  const first = [fixed + magnitude(p("velocity", String.raw`\mathbf v`)) + `^{${power}}`,
    fixed + magnitude(p("replacement", String.raw`\frac{\mathbf p}{m}`)) + `^{${power}}`];
  const quotient = (top: string, bottom: string) => p("rule", String.raw`\frac{${top}}{${bottom}}`);
  const numerator = p("momentum", String.raw`\mathbf p`), denominator = p("denominator", "m");
  const second = [fixed + magnitude(quotient(numerator, denominator)) + `^{${power}}`,
    fixed + quotient(magnitude(numerator) + `^{${p("power-top", "2")}}`, denominator + `^{${p("power-bottom", "2")}}`)];
  const normP = p("norm", String.raw`|\mathbf p|^2`);
  const third = [fixed + quotient(normP, p("scalar-before", "m^2")),
    prefix + quotient(normP, p("scalar-after", "2m"))];
  const specs = createEnergyDerivationPlan(model).moves.map((move, i) => ({ ...move, endpoints: [first, second, third][i]! }));
  const builder = createKpAnimationAssetBuilder({ id: "animation.physics.energy-derivation", title: "Energy in terms of momentum" });
  const moves = specs.map((spec, i) => {
    const step = momentumEnergyDerivationSteps[i]!;
    const sourceRoles = [...spec.persist, ...spec.exits, ...(spec.split ? ["power"] : [])];
    const targetRoles = [...spec.persist, ...spec.entries, ...(spec.split ? ["power-top", "power-bottom"] : [])];
    const objects = [sourceRoles, targetRoles].map((roles, side) => createKpImmutableSemanticAssetObject({
      id: `energy.${step.id}.${side}`, objectType: "equation", title: `${step.title} ${side}`,
      value: { latex: momentumEnergyDerivationStates[i + side]! },
      selectors: roles.map(role => ({ id: `energy.${step.id}.${side}.${role}`, kind: "semantic", label: role }))
    }));
    objects.forEach(o => builder.addObject(o));
    const records = [
      ...spec.persist.map(role => ({ id: `lineage.${step.id}.${role}`, relation: "identity" as const,
        sourceSelectorIds: [`energy.${step.id}.0.${role}`], targetSelectorIds: [`energy.${step.id}.1.${role}`], summary: `The ${role} persists.` })),
      ...spec.exits.map(role => ({ id: `lineage.${step.id}.exit.${role}`, relation: "removal" as const,
        sourceSelectorIds: [`energy.${step.id}.0.${role}`], targetSelectorIds: [], summary: `${role} is rewritten by ${model.proof[i]}.` })),
      ...spec.entries.map(role => ({ id: `lineage.${step.id}.enter.${role}`, relation: "introduction" as const,
        sourceSelectorIds: [], targetSelectorIds: [`energy.${step.id}.1.${role}`], summary: `${role} follows from ${model.proof[i]}.` })),
      ...(spec.split ? [{ id: "lineage.scale-magnitude.power", relation: "fan-out" as const,
        sourceSelectorIds: ["energy.scale-magnitude.0.power"], targetSelectorIds: ["energy.scale-magnitude.1.power-top", "energy.scale-magnitude.1.power-bottom"],
        summary: "Squared norm homogeneity retains numerator exponent and squares the denominator." }] : [])
    ];
    const transformation = createKpSemanticTransformation({ id: `physics.energy.${step.id}`, definitionId: `definition.physics.energy.${step.id}`,
      transformType: `physics.energy.${step.id}`, title: step.title, sourceObjectIds: [objects[0]!.id], targetObjectIds: [objects[1]!.id],
      preserves: ["value"], assumptions: ["m is a positive real scalar; p=m v; Euclidean vectors"],
      lawRefs: [{ id: `physics.energy.${model.proof[i]}`, level: "strict" }], correspondenceMap: { id: `map.energy.${step.id}`, records } });
    builder.addTransformation(transformation);
    // Endpoint-local selector IDs distinguish successive records of the same
    // entity while maintaining a shared semantic role in renderer bindings.
    const annotated = spec.endpoints.map((latex, side) => latex!.replaceAll("energy.", `energy.${step.id}.${side}.`));
    return Object.freeze({ ...step, index: i, transformation, annotated, sourceRoles, targetRoles,
      persist: spec.persist, exits: spec.exits, entries: spec.entries, split: spec.split });
  });
  builder.addRenderTarget({ id: "render.physics.energy-derivation.native-katex", kind: "equation",
    objectIds: moves.flatMap(m => [...m.transformation.sourceObjectIds, ...m.transformation.targetObjectIds]),
    transformationIds: moves.map(m => m.transformation.id), summary: "Candidate canonical native KaTeX derivation" });
  const animation = builder.build();
  const source = { sourceId: "source.physics.energy-derivation", revisionId: "revision.physics.energy-derivation.v1", operationPacks: [{ packId: pack.id, version: pack.version }] };
  const request = createKpGovernedCanonicalConstructionRequest({ schemaVersion: "kp.governed-semantic-authoring-request.v2", id: "request.physics.energy-derivation.v1",
    source: { kind: "verified-semantic-source", ...source }, approvedObjectIds: animation.bundle.objects.map(o => o.id),
    approvedOperationIds: moves.map(m => m.transformation.id), explanationPurpose: { kind: "cause", objectIds: animation.bundle.objects.map(o => o.id), operationIds: moves.map(m => m.transformation.id) },
    detailLevel: "complete", compositionIntent: { kind: "sequence", operationIds: moves.map(m => m.transformation.id) } });
  const construction = compileKpGovernedCanonicalConstruction({ request, authority: { ...source, animation } });
  return Object.freeze({ model, moves, animation, construction });
}
