declare const kpPreparedNativeSceneCandidateBrand: unique symbol;

const sealedCandidates = new WeakSet<object>();

export interface KpPreparedNativeSceneCandidate {
  readonly kind: "prepared-native-scene-candidate";
  readonly host: HTMLElement;
  readonly stage: HTMLElement;
  readonly [kpPreparedNativeSceneCandidateBrand]: true;
}

export function prepareKpNativeSceneCandidate(input: {
  readonly host: HTMLElement;
  readonly stage: HTMLElement;
}): KpPreparedNativeSceneCandidate {
  if (input.stage.parentElement !== input.host) {
    throw new Error("Prepared native scene must be a direct host child.");
  }
  // Measurement must never borrow visibility from paint ownership. Keeping the
  // candidate off-canvas lets fonts and paint geometry settle while the last
  // committed scene remains visible; opacity caused the historical blank flash.
  input.stage.dataset["kpPreparedSceneState"] = "preparing";
  input.stage.style.position = "absolute";
  input.stage.style.left = "-200vw";
  input.stage.style.top = "0";
  input.stage.style.width = "100%";
  input.stage.style.pointerEvents = "none";
  const candidate = Object.freeze({
    kind: "prepared-native-scene-candidate" as const,
    host: input.host,
    stage: input.stage
  });
  sealedCandidates.add(candidate);
  return candidate as KpPreparedNativeSceneCandidate;
}

export function commitKpNativeSceneCandidate(input: {
  readonly candidate: KpPreparedNativeSceneCandidate;
  readonly previousStage?: HTMLElement | undefined;
}): void {
  assertCandidate(input.candidate);
  if (
    input.previousStage !== undefined &&
    input.previousStage.parentElement !== input.candidate.host
  ) {
    throw new Error("Prepared native scene cannot retire a foreign stage.");
  }
  const { stage } = input.candidate;
  stage.style.removeProperty("position");
  stage.style.removeProperty("left");
  stage.style.removeProperty("top");
  stage.style.removeProperty("width");
  stage.style.removeProperty("pointer-events");
  stage.dataset["kpPreparedSceneState"] = "committed";
  input.previousStage?.remove();
}

export function discardKpNativeSceneCandidate(
  candidate: KpPreparedNativeSceneCandidate
): void {
  assertCandidate(candidate);
  candidate.stage.remove();
}

function assertCandidate(
  candidate: KpPreparedNativeSceneCandidate
): void {
  if (!sealedCandidates.has(candidate)) {
    throw new Error("Prepared native scene candidate must be sealed.");
  }
  if (candidate.stage.parentElement !== candidate.host) {
    throw new Error("Prepared native scene candidate is no longer mounted.");
  }
}
