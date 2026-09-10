import { createKpNativeKatexSceneContribution,
  type KpNativeKatexSceneContribution } from "../../src/rendering/native-katex-scene-contribution.ts";
import type { KpEquationMaterialLayerOwnerFrame } from "../../src/rendering/equation-material-layer-types.ts";
import type { KpNativeKatexRenderedSceneObservation } from "../../src/rendering/native-katex-rendered-scene.ts";

function invalidContribution(unmeasured: KpEquationMaterialLayerOwnerFrame,
  source: KpNativeKatexRenderedSceneObservation, target: KpNativeKatexRenderedSceneObservation) {
  const context = { source, target, participantIds: [] };
  // @ts-expect-error Layout geometry cannot substitute for required measured ink.
  createKpNativeKatexSceneContribution({ ...context, id: "bad", sample: () => [unmeasured] });
  // @ts-expect-error A raw sample/audit pair cannot claim issued contribution authority.
  const forged: KpNativeKatexSceneContribution = { id: "forged", sample: () => ({ owners: [], occupancy: [] }) };
  createKpNativeKatexSceneContribution({ ...context, id: "bad", sample: () => [],
    // @ts-expect-error Independent occupancy authoring is not a contribution input.
    occupancy: () => [] });
  // @ts-expect-error A sampler without measured endpoint context cannot contribute.
  createKpNativeKatexSceneContribution({ id: "bad", participantIds: [], sample: () => [] });
  return forged;
}
void invalidContribution;
