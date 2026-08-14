import type { KpNormalMatrixProofCheckpointId } from
  "../../semantic/normal-matrix-proof-checkpoints.ts";

export function selectKpNormalMatrixProofSettledCheckpoint(
  stage: HTMLElement,
  checkpointId: KpNormalMatrixProofCheckpointId
): HTMLElement {
  const scenes = [
    ...stage.querySelectorAll<HTMLElement>("[data-kp-normal-proof-settled-scene]")
  ];
  let active: HTMLElement | undefined;
  for (const scene of scenes) {
    const selected = scene.dataset["kpNormalProofSettledScene"] === checkpointId;
    scene.hidden = !selected;
    scene.setAttribute("aria-hidden", selected ? "false" : "true");
    if (selected) active = scene;
  }
  if (active === undefined) {
    throw new Error(`Missing settled proof scene ${checkpointId}.`);
  }
  stage.dataset["kpNormalProofActiveCheckpoint"] = checkpointId;
  return active;
}
