import type {
  KpMaterialJunctionFrame,
  KpMaterialJunctionRect
} from "../animation/material-junction.ts";

export interface KpMaterialJunctionDomTargetBinding {
  readonly material: HTMLElement;
  readonly native: HTMLElement;
}

export function measureKpMaterialJunctionDomGeometry(input: {
  readonly stage: HTMLElement;
  readonly elements: ReadonlyMap<string, HTMLElement>;
}): Readonly<Record<string, KpMaterialJunctionRect>> {
  const stageRect = input.stage.getBoundingClientRect();
  return Object.fromEntries([...input.elements].map(([id, element]) => {
    const rect = element.getBoundingClientRect();
    return [id, {
      left: rect.left - stageRect.left,
      top: rect.top - stageRect.top,
      width: rect.width,
      height: rect.height
    }];
  }));
}

export function applyKpMaterialJunctionDomFrame(input: {
  readonly stage: HTMLElement;
  readonly frame: KpMaterialJunctionFrame;
  readonly sources: ReadonlyMap<string, HTMLElement>;
  readonly targets: ReadonlyMap<string, KpMaterialJunctionDomTargetBinding>;
}): void {
  input.frame.sources.forEach((source) => {
    const element = input.sources.get(source.annotationId);
    if (element === undefined) {
      throw new Error(`Missing material junction source ${source.annotationId}.`);
    }
    applyPose(element, source.pose);
    element.dataset["kpMaterialJunctionRole"] = "source";
    element.dataset["kpMaterialJunctionArrival"] = String(source.arrivalProgress);
  });
  input.frame.targets.forEach((target) => {
    const binding = input.targets.get(target.annotationId);
    if (binding === undefined) {
      throw new Error(`Missing material junction target ${target.annotationId}.`);
    }
    applyPose(binding.material, target.materialPose);
    binding.material.dataset["kpMaterialJunctionRole"] = "target-material";
    binding.material.dataset["kpMaterialJunctionReveal"] = String(
      target.revealProgress
    );
    binding.native.dataset["kpMaterialJunctionRole"] = "target-native";
    if (input.frame.phase === "settled") {
      // Native settlement returns ownership to untouched renderer geometry;
      // transforms belong only to the temporary material representation.
      binding.native.style.removeProperty("opacity");
      binding.native.style.removeProperty("translate");
      binding.native.style.removeProperty("scale");
    } else {
      binding.native.style.opacity = String(target.nativeOpacity);
    }
  });
  input.stage.dataset["kpMaterialJunctionPlanId"] = input.frame.planId;
  input.stage.dataset["kpMaterialJunctionPhase"] = input.frame.phase;
  input.stage.dataset["kpMaterialJunctionSourcesReady"] = String(
    input.frame.allRequiredSourcesReady
  );
  input.stage.dataset["kpMaterialJunctionTargetRecognizable"] = String(
    input.frame.targetRecognizable
  );
  input.stage.dataset["kpMaterialJunctionNativeReady"] = String(
    input.frame.nativeGeometryReady
  );
}

function applyPose(
  element: HTMLElement,
  pose: {
    readonly x: number;
    readonly y: number;
    readonly scale: number;
    readonly opacity: number;
  }
): void {
  element.style.translate = `${pose.x}px ${pose.y}px`;
  element.style.scale = String(pose.scale);
  element.style.opacity = String(pose.opacity);
}
