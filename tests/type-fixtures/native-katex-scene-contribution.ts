import { createKpNativeKatexSceneContribution,
  type KpNativeKatexSceneContribution } from "../../src/rendering/native-katex-scene-contribution.ts";
import type { KpEquationMaterialLayerOwnerFrame } from "../../src/rendering/equation-material-layer-types.ts";

function invalidContribution(unmeasured: KpEquationMaterialLayerOwnerFrame) {
  // @ts-expect-error Layout geometry cannot substitute for required measured ink.
  createKpNativeKatexSceneContribution({ id: "bad", sample: () => [unmeasured] });
  // @ts-expect-error A raw sample/audit pair cannot claim issued contribution authority.
  const forged: KpNativeKatexSceneContribution = { id: "forged", sample: () => ({ owners: [], occupancy: [] }) };
  createKpNativeKatexSceneContribution({ id: "bad", sample: () => [],
    // @ts-expect-error Independent occupancy authoring is not a contribution input.
    occupancy: () => [] });
  return forged;
}
void invalidContribution;
