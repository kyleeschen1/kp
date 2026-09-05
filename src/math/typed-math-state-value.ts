import type { KpRecoverableMathObject } from "./typed-math-scene.ts";
import type { KpSemanticStateReadonlyValue } from "../semantic-state/authoring-schema.ts";
import { requireAndFreezeKpPersistentSemanticValue } from "../semantic-state/entity-version-store.ts";

export class KpTypedMathStateValueError extends Error {
  readonly code = "kp.math.nonpersistent-state-value";
  readonly objectId: string;
  constructor(objectId: string, cause: unknown) {
    super(`Typed math object ${JSON.stringify(objectId)} is not persistent structural data.`, { cause });
    this.name = "KpTypedMathStateValueError";
    this.objectId = objectId;
  }
}

/** Storage adaptation only; existing math constructors own mathematical claims. */
export function createKpTypedMathStateValue<const Value extends KpRecoverableMathObject>(
  value: Value
): KpSemanticStateReadonlyValue<Value> {
  try {
    // The promoted Hessian descriptor hides evidence from enumeration. Make its
    // existing evidence explicit in stored data; do not reconstruct or upgrade it.
    const data = value.kind === "derivative-matrix" && value.symmetryEvidence !== undefined
      ? Object.create(Object.getPrototypeOf(value), {
          ...Object.getOwnPropertyDescriptors(value),
          symmetryEvidence: {
            ...Object.getOwnPropertyDescriptor(value, "symmetryEvidence"),
            enumerable: true
          }
        }) : value;
    return requireAndFreezeKpPersistentSemanticValue(data) as KpSemanticStateReadonlyValue<Value>;
  } catch (cause) {
    throw new KpTypedMathStateValueError(value.id, cause);
  }
}
