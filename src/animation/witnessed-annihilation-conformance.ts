import {
  sampleKpWitnessedAnnihilation,
  type KpWitnessedAnnihilationPlan
} from "./witnessed-annihilation.ts";

export type KpWitnessedAnnihilationLawId =
  | "annihilation.symmetric-contact"
  | "annihilation.visible-compression"
  | "annihilation.witness-after-contact"
  | "annihilation.witness-dwell"
  | "annihilation.compaction-after-absorption"
  | "annihilation.continuous-ownership"
  | "annihilation.exact-settlement";

export interface KpWitnessedAnnihilationViolation {
  readonly lawId: KpWitnessedAnnihilationLawId;
  readonly progress: number;
  readonly message: string;
}

export function evaluateKpWitnessedAnnihilationLaws(
  plan: KpWitnessedAnnihilationPlan,
  sampleCount = 100
): readonly KpWitnessedAnnihilationViolation[] {
  const violations: KpWitnessedAnnihilationViolation[] = [];
  for (let index = 0; index <= sampleCount; index += 1) {
    const progress = index / sampleCount;
    const frame = sampleKpWitnessedAnnihilation({ plan, progress });
    if (frame.witness.pose.opacity > 0 && frame.contactProgress < 0.9) {
      add(violations, "annihilation.witness-after-contact", progress, "Witness appears before canceling material makes contact.");
    }
    if (frame.sources.some((source) => source.pose.scale <= 0)) {
      add(violations, "annihilation.visible-compression", progress, "Canceling material collapses to zero scale.");
    }
    if (frame.survivorCompactionProgress > 0 && frame.witnessAbsorptionProgress < 1) {
      add(violations, "annihilation.compaction-after-absorption", progress, "Survivors compact before the witness is absorbed.");
    }
    const visible = Math.max(
      ...frame.sources.map((source) => source.pose.opacity),
      frame.witness.pose.opacity,
      ...frame.survivors.map((survivor) => survivor.pose.opacity + survivor.nativeOpacity)
    );
    if (visible <= 0) {
      add(violations, "annihilation.continuous-ownership", progress, "No visible material owns the annihilation frame.");
    }
  }
  if (plan.witnessDwellEnd - plan.witnessReadableAt < 0.12) {
    add(violations, "annihilation.witness-dwell", plan.witnessDwellEnd, "Witness dwell is too short to read.");
  }
  const contact = sampleKpWitnessedAnnihilation({ plan, progress: plan.contactEnd });
  const ordered = [...plan.sources].sort(
    (left, right) => left.semanticRank - right.semanticRank || left.id.localeCompare(right.id)
  );
  const distances = contact.sources.map((source, index) => {
    const rect = ordered[index]!.rect;
    const x = rect.left + rect.width / 2 + source.pose.x - plan.contactPoint.x;
    const y = rect.top + rect.height / 2 + source.pose.y - plan.contactPoint.y;
    return Math.hypot(x, y);
  });
  if (Math.max(...distances) - Math.min(...distances) > 2) {
    add(violations, "annihilation.symmetric-contact", plan.contactEnd, "Canceling sources do not meet symmetrically.");
  }
  const settled = sampleKpWitnessedAnnihilation({ plan, progress: 1 });
  if (
    settled.sources.some((source) => source.pose.opacity !== 0) ||
    settled.witness.pose.opacity !== 0 ||
    settled.survivors.some((survivor) =>
      survivor.pose.opacity !== 0 || survivor.nativeOpacity !== 1
    )
  ) {
    add(violations, "annihilation.exact-settlement", 1, "Annihilation does not settle to native survivors only.");
  }
  return violations;
}

function add(
  violations: KpWitnessedAnnihilationViolation[],
  lawId: KpWitnessedAnnihilationLawId,
  progress: number,
  message: string
): void {
  violations.push({ lawId, progress, message });
}
