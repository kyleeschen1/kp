import { type EnergyDerivationDetail, type CheckedMomentumEnergyDerivation } from "../../domains/public-api.ts";
import { createKpAnimationAssetBuilder } from "../animation/asset.ts";
import { createKpImmutableSemanticAssetObject } from "../semantic/immutable-asset.ts";
import { createKpSemanticTransformation } from "../semantic/asset-transformation.ts";
import { createKpCanonicalOperationPack } from "../semantic/canonical-operation-pack.ts";
import { compileKpGovernedCanonicalConstruction, createKpGovernedCanonicalConstructionRequest } from "./canonical-animation-public-api.ts";
import { assertEnergyDerivationPlan, createEnergyDerivationPlan, createScalarCancellationPlan, type EnergyDerivationPlan } from "../semantic/momentum-energy-derivation-plan.ts";

import type { CheckedScalarCancellation } from "../../domains/public-api.ts";

export function compileMomentumEnergyDerivation(model: CheckedMomentumEnergyDerivation, detail: EnergyDerivationDetail = "coarse") {
  return compileCheckedDerivation(createEnergyDerivationPlan(model, detail));
}
export function compileScalarCancellation(model: CheckedScalarCancellation, detail: EnergyDerivationDetail = "coarse") {
  return compileCheckedDerivation(createScalarCancellationPlan(model, detail));
}

/** Both proof issuers use one governed lowering. This accepts an issued plan,
 * never arbitrary caller-authored endpoints or claimed correspondences. */
export function compileCheckedDerivation(plan: EnergyDerivationPlan) {
  assertEnergyDerivationPlan(plan);
  const { model, view, namespace: ns, operationPrefix: op, notation, artifactId } = plan;
  const detail = view.refinement ? "mass-refinement" : "coarse";
  const selectedPack = createKpCanonicalOperationPack({ id: plan.packId, scope: "project", version: "1.0.0",
    title: plan.title, operationIds: view.steps.map(s => `${op}.${s.id}`) });
  const part = (id: string, latex: string) => String.raw`\htmlData{kp-semantic-entity-id=${id},kp-presentation-group-id=group.${id}}{${latex}}`;
  const p = (id: string, latex: string) => part(`${ns}.${id}`, latex);
  const prefix = p("prefix", `${notation.result}=`);
  const half = p("half", plan.coefficientGranularity === "factors"
    ? String.raw`\frac{${p("coefficient-one", "1")}}{${p("two", "2")}}` : String.raw`\frac{1}{2}`), mass = p("mass", notation.factor);
  // left/right delimiters must be paired within native KaTeX grammar, so the
  // ownership wrappers enclose delimiter glyphs rather than unmatched \left.
  const magnitude = (inside: string) => `${p("left", String.raw`\lVert`)}${inside}${p("right", String.raw`\rVert`)}`;
  const power = p("power", "2");
  const fixed = prefix + half + mass;
  const first = [fixed + magnitude(p("velocity", String.raw`\mathbf v`)) + `^{${power}}`,
    fixed + magnitude(p("replacement", String.raw`\frac{\mathbf p}{m}`)) + `^{${power}}`];
  const quotient = (top: string, bottom: string) => p("rule", String.raw`\frac{${top}}{${bottom}}`);
  const numerator = p("momentum", String.raw`\mathbf p`), denominator = p("denominator", "m");
  const second = [fixed + magnitude(quotient(numerator, denominator)) + `^{${power}}`,
    fixed + quotient(magnitude(numerator) + `^{${p("power-top", "2")}}`, denominator + `^{${p("power-bottom", "2")}}`)];
  const parentheses = (inside: string) => p("paren-left", String.raw`\Bigl(`) + inside + p("paren-right", String.raw`\Bigr)`);
  const norm = p("norm", String.raw`\lVert\mathbf p\rVert`);
  const homogeneity = [second[0]!, fixed + parentheses(quotient(magnitude(numerator), denominator)) + `^{${power}}`];
  const quotientSquare = [fixed + parentheses(quotient(norm, denominator)) + `^{${power}}`,
    fixed + quotient(norm + `^{${p("power-top", "2")}}`, denominator + `^{${p("power-bottom", "2")}}`)];
  const normP = p("norm", notation.numerator);
  const third = [fixed + quotient(normP, p("scalar-before", `${notation.factor}^2`)),
    prefix + quotient(normP, p("scalar-after", `2${notation.factor}`))];
  // The checked quotient has residual denominator exponent 2-1=1. Its base
  // survives; only the exponent notation is omitted. Coefficient two has its
  // own identity rather than being recreated with the denominator.
  const fluentHalf = p("half", String.raw`\frac{${p("coefficient-one", "1")}}{${p("two", "2")}}`);
  const fluent = [prefix + fluentHalf + mass + quotient(normP, p("factor-retain", notation.factor) + `^{${power}}`),
    prefix + quotient(normP, p("two", "2") + p("factor-retain", notation.factor))];
  const factors = p("factor-cancel", notation.factor) + p("times", String.raw`\cdot`) + p("factor-retain", notation.factor);
  const identity = p("identity", String.raw`\cdot1`);
  const fine = [
    [fixed + quotient(normP, p("scalar-before", `${notation.factor}^2`)), fixed + quotient(normP, factors)],
    [fixed + quotient(normP, factors), prefix + half + identity + quotient(normP, p("factor-retain", notation.factor))],
    [prefix + half + identity + quotient(normP, p("factor-retain", notation.factor)), prefix + quotient(normP, p("two", "2") + p("factor-retain", notation.factor))]
  ];
  const rate = String.raw`\dot{\mathbf p}`, momentum = String.raw`\mathbf p`;
  const powerPrefix = p("prefix", String.raw`\frac{dK}{dt}=`), powerHalf = p("half", String.raw`\frac{1}{2m}`);
  const left = p("left", "("), right = p("right", ")"), dot = p("dot", String.raw`\cdot`), plus = p("plus", "+");
  const dotted = (syntax: string, role: string) => p(syntax, String.raw`\dot{${p(role, momentum)}}`);
  const productSource = powerPrefix + powerHalf + p("derivative", String.raw`\frac{d}{dt}`) + left + p("p-first", momentum) + dot + p("p-second", momentum) + right;
  const productTarget = powerPrefix + powerHalf + left + dotted("derivative-first", "p-first") + dot + p("p-second", momentum) + plus
    + p("p-first-copy", momentum) + p("dot-second", String.raw`\cdot`) + dotted("derivative-second", "p-second-copy") + right;
  const secondTerm = p("second-term", String.raw`\mathbf p\cdot\dot{\mathbf p}`);
  const symmetry = [powerPrefix + powerHalf + left + p("first-rate", rate) + dot + p("first-momentum", momentum) + plus + secondTerm + right,
    powerPrefix + powerHalf + left + p("first-momentum", momentum) + dot + p("first-rate", rate) + plus + secondTerm + right];
  const collect = [powerPrefix + powerHalf + left + p("first-term", String.raw`\mathbf p\cdot\dot{\mathbf p}`) + plus + secondTerm + right,
    powerPrefix + powerHalf + p("two", "2") + secondTerm];
  const cancelTwo = [powerPrefix + powerHalf + p("two", "2") + p("momentum", momentum) + dot + p("rate", rate),
    powerPrefix + p("inverse", String.raw`\frac{${p("momentum", momentum)}}{m}`) + dot + p("rate", rate)];
  const endpoints = { substitute: first, "scale-magnitude": second, "cancel-factor": third, "cancel-unit-power": fluent,
    "extract-norm-scale": homogeneity, "square-quotient": quotientSquare,
    "expand-square": fine[0]!, "cancel-pair": fine[1]!, "collect-coefficient": fine[2]!,
    "product-rule": [productSource, productTarget], "dot-symmetry": symmetry, "collect-terms": collect, "cancel-two": cancelTwo,
    "differentiate-energy": [powerPrefix + p("before", String.raw`\frac{1}{2m}\frac{d}{dt}(\mathbf p\cdot\mathbf p)`),
      powerPrefix + p("after", String.raw`\frac{\mathbf p}{m}\cdot\dot{\mathbf p}`)] };
  const specs = plan.moves.map(move => ({ ...move, endpoints: endpoints[move.operationKind] }));
  const builder = createKpAnimationAssetBuilder({ id: `animation.${artifactId}`, title: plan.title });
  const moves = specs.map((spec, i) => {
    const step = view.steps[i]!;
    const sourceRoles = [...spec.persist, ...spec.exits, ...(spec.copies ?? []).map(copy => copy.source), ...(spec.split ? ["power"] : [])];
    const targetRoles = [...spec.persist, ...spec.entries, ...(spec.copies ?? []).flatMap(copy => copy.targets), ...(spec.split ? ["power-top", "power-bottom"] : [])];
    const objects = [sourceRoles, targetRoles].map((roles, side) => createKpImmutableSemanticAssetObject({
      id: `${ns}.${step.id}.${side}`, objectType: "equation", title: `${step.title} ${side}`,
      value: { latex: view.states[i + side]! },
      selectors: roles.map(role => ({ id: `${ns}.${step.id}.${side}.${role}`, kind: "semantic", label: role }))
    }));
    objects.forEach(o => builder.addObject(o));
    const records = [
      ...spec.persist.map(role => ({ id: `lineage.${step.id}.${role}`, relation: "identity" as const,
        sourceSelectorIds: [`${ns}.${step.id}.0.${role}`], targetSelectorIds: [`${ns}.${step.id}.1.${role}`], summary: `The ${role} persists.` })),
      ...spec.exits.map(role => ({ id: `lineage.${step.id}.exit.${role}`, relation: "removal" as const,
        sourceSelectorIds: [`${ns}.${step.id}.0.${role}`], targetSelectorIds: [], summary: `${role} is rewritten by ${view.proof[i]}.` })),
      ...spec.entries.map(role => ({ id: `lineage.${step.id}.enter.${role}`, relation: "introduction" as const,
        sourceSelectorIds: [], targetSelectorIds: [`${ns}.${step.id}.1.${role}`], summary: `${role} follows from ${view.proof[i]}.` })),
      ...(spec.copies ?? []).map(copy => ({ id: `lineage.${step.id}.copy.${copy.source}`, relation: "fan-out" as const,
        sourceSelectorIds: [`${ns}.${step.id}.0.${copy.source}`], targetSelectorIds: copy.targets.map(role => `${ns}.${step.id}.1.${role}`),
        summary: `The product rule uses this factor in both contributions; derivative syntax identifies which occurrence changes.` })),
      ...(spec.split ? [{ id: `lineage.${step.id}.power`, relation: "fan-out" as const,
        sourceSelectorIds: [`${ns}.${step.id}.0.power`], targetSelectorIds: [`${ns}.${step.id}.1.power-top`, `${ns}.${step.id}.1.power-bottom`],
        summary: "The checked quotient square applies the exponent to numerator and denominator." }] : [])
    ];
    const transformation = createKpSemanticTransformation({ id: `${op}.${step.id}`, definitionId: `definition.${op}.${step.id}`,
      transformType: `${op}.${step.id}`, title: step.title, sourceObjectIds: [objects[0]!.id], targetObjectIds: [objects[1]!.id],
      preserves: ["value"], assumptions: [...plan.assumptions],
      lawRefs: [{ id: `${op}.${view.proof[i]}`, level: "strict" }], correspondenceMap: { id: `map.${ns}.${step.id}`, records } });
    builder.addTransformation(transformation);
    // Endpoint-local selector IDs distinguish successive records of the same
    // entity while maintaining a shared semantic role in renderer bindings.
    const annotated = spec.endpoints.map((latex, side) => latex!.replaceAll(`${ns}.`, `${ns}.${step.id}.${side}.`));
    return Object.freeze({ ...step, index: i, transformation, annotated, sourceRoles, targetRoles,
      operationKind: spec.operationKind, persist: spec.persist, exits: spec.exits, entries: spec.entries, split: spec.split });
  });
  builder.addRenderTarget({ id: `render.${artifactId}.native-katex`, kind: "equation",
    objectIds: moves.flatMap(m => [...m.transformation.sourceObjectIds, ...m.transformation.targetObjectIds]),
    transformationIds: moves.map(m => m.transformation.id), summary: "Candidate canonical native KaTeX derivation" });
  const animation = builder.build();
  const source = { sourceId: `source.${artifactId}`, revisionId: `revision.${artifactId}.${detail === "coarse" ? "v1" : "refinement.v1"}`, operationPacks: [{ packId: selectedPack.id, version: selectedPack.version }] };
  const request = createKpGovernedCanonicalConstructionRequest({ schemaVersion: "kp.governed-semantic-authoring-request.v2", id: `request.${artifactId}.v1`,
    source: { kind: "verified-semantic-source", ...source }, approvedObjectIds: animation.bundle.objects.map(o => o.id),
    approvedOperationIds: moves.map(m => m.transformation.id), explanationPurpose: { kind: "cause", objectIds: animation.bundle.objects.map(o => o.id), operationIds: moves.map(m => m.transformation.id) },
    detailLevel: "complete", compositionIntent: { kind: "sequence", operationIds: moves.map(m => m.transformation.id) } });
  const construction = compileKpGovernedCanonicalConstruction({ request, authority: { ...source, animation } });
  return Object.freeze({ model, moves, animation, construction });
}
