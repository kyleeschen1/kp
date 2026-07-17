import type {
  KpWitnessedAnnihilationFrame,
  KpWitnessedAnnihilationPlan,
  KpWitnessedAnnihilationPose
} from "../animation/witnessed-annihilation.ts";

export interface KpWitnessedAnnihilationDomSurvivorBinding {
  readonly material: HTMLElement;
  readonly native: HTMLElement;
}

export interface KpWitnessedAnnihilationDomBinding {
  readonly stage: HTMLElement;
  readonly sources: ReadonlyMap<string, HTMLElement>;
  readonly witness: HTMLElement;
  readonly survivors: ReadonlyMap<string, KpWitnessedAnnihilationDomSurvivorBinding>;
}

export function validateKpWitnessedAnnihilationDomBinding(input: {
  readonly plan: KpWitnessedAnnihilationPlan;
  readonly binding: KpWitnessedAnnihilationDomBinding;
}): void {
  input.plan.sources.forEach((source) => requireElement(
    input.binding.sources,
    source.id,
    "source"
  ));
  input.plan.survivors.forEach((survivor) => requireElement(
    input.binding.survivors,
    survivor.id,
    "survivor"
  ));
  if (input.binding.witness.textContent?.trim() !== input.plan.witness.semanticValue.latex) {
    throw new Error(
      "The annihilation witness element must be rendered from the semantic witness value."
    );
  }
}

export function applyKpWitnessedAnnihilationDomFrame(input: {
  readonly frame: KpWitnessedAnnihilationFrame;
  readonly binding: KpWitnessedAnnihilationDomBinding;
}): void {
  input.frame.sources.forEach((source) => {
    const element = requireElement(input.binding.sources, source.id, "source");
    applyPose(element, source.pose);
    element.dataset["kpAnnihilationRole"] = "source";
  });

  applyPose(input.binding.witness, input.frame.witness.pose);
  input.binding.witness.dataset["kpAnnihilationRole"] = "witness";
  input.binding.witness.dataset["kpAnnihilationDescriptorId"] =
    input.frame.witness.descriptorId;
  input.binding.witness.dataset["kpAnnihilationSlotId"] = input.frame.witness.slotId;

  input.frame.survivors.forEach((survivor) => {
    const binding = requireElement(input.binding.survivors, survivor.id, "survivor");
    applyPose(binding.material, survivor.pose);
    binding.material.dataset["kpAnnihilationRole"] = "survivor-material";
    binding.native.dataset["kpAnnihilationRole"] = "survivor-native";
    if (input.frame.phase === "settled") {
      // Settlement returns ownership to untouched native renderer geometry.
      binding.native.style.removeProperty("opacity");
      binding.native.style.removeProperty("translate");
      binding.native.style.removeProperty("scale");
    } else {
      binding.native.style.opacity = String(survivor.nativeOpacity);
    }
  });

  const stage = input.binding.stage;
  stage.dataset["kpAnnihilationPlanId"] = input.frame.planId;
  stage.dataset["kpAnnihilationPhase"] = input.frame.phase;
  stage.dataset["kpAnnihilationWitnessReadable"] = String(input.frame.witnessReadable);
  stage.dataset["kpAnnihilationWitnessDwell"] = String(input.frame.witnessDwellProgress);
  stage.dataset["kpAnnihilationWitnessAbsorption"] = String(
    input.frame.witnessAbsorptionProgress
  );
  stage.dataset["kpAnnihilationCompaction"] = String(
    input.frame.survivorCompactionProgress
  );
  stage.dataset["kpAnnihilationInwardPulse"] = String(input.frame.inwardPulse);
}

function applyPose(element: HTMLElement, pose: KpWitnessedAnnihilationPose): void {
  element.style.translate = `${pose.x}px ${pose.y}px`;
  element.style.scale = String(pose.scale);
  element.style.opacity = String(pose.opacity);
  element.style.transformOrigin = "center";
}

function requireElement<T>(
  elements: ReadonlyMap<string, T>,
  id: string,
  role: string
): T {
  const element = elements.get(id);
  if (element === undefined) throw new Error(`Missing annihilation ${role} ${id}.`);
  return element;
}
