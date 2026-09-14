import { checkMomentumEnergy, physicalTime, type CheckedMomentumEnergy, type MomentumEnergySource } from "../../../domains/physics/momentum-energy.ts";
import { sha256 } from "../../kernel/sha256.ts";

export interface MomentumEnergyRuntimeSource {
  readonly schemaVersion: "kp.physics.momentum-energy.runtime.v1";
  readonly source: MomentumEnergySource;
  readonly revisionId: string;
  readonly representationId: "representation.physics.momentum-energy.native-2d.v1";
}

/** This is a transport check, not a replacement for build-time governance.
 * Unknown renderer/source combinations fail closed instead of getting a fallback. */
export function loadMomentumEnergyRuntimeSource(value: unknown): CheckedMomentumEnergy {
  if (!value || typeof value !== "object" || Object.keys(value).sort().join(",") !== "representationId,revisionId,schemaVersion,source")
    throw new Error("Unsupported physics runtime manifest");
  const input = value as Record<string, unknown>;
  const checked = checkMomentumEnergy(input["source"]);
  if (input["schemaVersion"] !== "kp.physics.momentum-energy.runtime.v1" || checked.status !== "checked"
    || input["representationId"] !== "representation.physics.momentum-energy.native-2d.v1"
    || input["revisionId"] !== `sha256:${sha256(JSON.stringify(checked.model.source))}`)
    throw new Error("Physics source or representation revision requires repair");
  return checked.model;
}

/** Only this boundary converts the reader's presentation fraction into seconds.
 * No eased coordinate or independent energy playhead enters the physics model. */
export function momentumEnergyTimeAtProgress(model: CheckedMomentumEnergy, progress: number) {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) throw new Error("Physics progress must be in [0, 1]");
  return physicalTime(progress * model.durationSeconds);
}
