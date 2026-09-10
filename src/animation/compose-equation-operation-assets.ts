import { createKpAnimationAsset, validateKpAnimationAsset, type KpAnimationAsset } from "./asset.ts";
import { createKpAssetBundle } from "../semantic/asset.ts";
import { createEditableSemanticTransformationTree, createSemanticTransformationSequence } from "../semantic/transformation-composition.ts";
import { compileKpAnimationTransformationPhaseCohorts } from "./transformation-phase-cohorts.ts";
import { createKpEquationEndpointHandoffResolver, type KpVerifiedEquationEndpointHandoff } from "../semantic/equation-endpoint-handoff.ts";

/** Compose existing single-operation assets without reconstructing their
 * correspondence, motif, profile or semantic transformation leaves. */
export function composeKpEquationOperationAssets(id: string, title: string, operations: readonly [KpAnimationAsset, KpAnimationAsset, ...KpAnimationAsset[]],
  handoffs: readonly KpVerifiedEquationEndpointHandoff[] = []) {
  const handoffResolver = createKpEquationEndpointHandoffResolver(handoffs);
  const first = operations[0], objects = new Map(first.bundle.objects.map(object => [object.id, object]));
  let previous = compileKpAnimationTransformationPhaseCohorts(first)[0];
  const durations = operations.map(operation => {
    if (!operation.presentationProfile || operation.renderTargets.length !== 1 || operation.renderTargets[0]!.kind !== "equation")
      throw new TypeError("This composition requires one canonical equation surface per operation.");
    const duration = operation.timeline?.durationMs;
    if (!duration || !Number.isFinite(duration) || duration < 0 || compileKpAnimationTransformationPhaseCohorts(operation).length !== 1)
      throw new TypeError("Operation composition requires one timed canonical phase per asset.");
    if (JSON.stringify(operation.presentationProfile) !== JSON.stringify(first.presentationProfile))
      throw new TypeError("Operation composition cannot silently reconcile incompatible presentation profiles.");
    return duration;
  });
  for (const operation of operations.slice(1)) {
    const phase = compileKpAnimationTransformationPhaseCohorts(operation)[0]!;
    if (!previous || JSON.stringify(previous.targetObjectIds) !== JSON.stringify(phase.sourceObjectIds)) {
      const source = previous?.targetObjectIds.length === 1 ? objects.get(previous.targetObjectIds[0]!) : undefined;
      const target = phase.sourceObjectIds.length === 1 ? operation.bundle.objects.find(object => object.id === phase.sourceObjectIds[0]) : undefined;
      if (!source || !target || !handoffResolver.connect(source, target))
        throw new TypeError("Operation composition requires exact adjacent native state identities or their issued endpoint handoff.");
    }
    for (const object of operation.bundle.objects) {
      const existing = objects.get(object.id);
      if (existing && JSON.stringify(existing) !== JSON.stringify(object)) throw new TypeError("Operation endpoints disagree on native state content.");
      objects.set(object.id, object);
    }
    previous = phase;
  }
  handoffResolver.finish();
  const constraints = operations.flatMap(operation => operation.presentationConstraints ? [operation.presentationConstraints] : []);
  if (constraints.some(value => JSON.stringify(value) !== JSON.stringify(constraints[0])))
    throw new TypeError("Operation composition requires compatible canonical constraints.");
  const total = durations.reduce((sum, duration) => sum + duration, 0), timelineId = `timeline.${id}`;
  const transformationTree = createEditableSemanticTransformationTree({ root: createSemanticTransformationSequence({ id: `sequence.${id}`, label: title,
    children: operations.map(operation => operation.transformationTree.root) }), annotations: operations.flatMap(operation => operation.transformationTree.annotations) });
  const animation = createKpAnimationAsset({ id, title,
    bundle: createKpAssetBundle({ id: `bundle.${id}`, title, objects: [...objects.values()] }),
    transformations: operations.flatMap(operation => operation.transformations), transformationTree,
    timeline: { id: timelineId, durationMs: total },
    layout: { id: `layout.${id}`, kind: "single", targetId: `render.${id}` },
    renderTargets: [{ id: `render.${id}`, kind: "equation", objectIds: [...objects.keys()],
      transformationIds: operations.flatMap(operation => operation.transformations.map(t => t.id)), timelineId }],
    presentationProfile: first.presentationProfile, presentationConstraints: constraints[0],
    checks: [{ id: `check.${id}.closure`, lawId: "animation.reference-closure", level: "strict", targetId: id },
      { id: `check.${id}.seek`, lawId: "animation.seek-rewind", level: "strict", targetId: transformationTree.root.id }] });
  const issues = validateKpAnimationAsset(animation);
  if (issues.length) throw new TypeError(issues.map(issue => issue.message).join("; "));
  let elapsed = 0;
  return Object.freeze({ animation, checkpointProgress: Object.freeze([0, ...durations.map(duration => (elapsed += duration) / total)]) });
}
