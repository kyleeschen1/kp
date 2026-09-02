import { createKpFloatingPointScalars } from "../algebra/standard-spaces.ts";
import {
  createKpMathAuthoringContext,
  type KpMathAuthoringContext,
  type KpMathAuthoringNotation
} from "./context.ts";

export function createKpStandardMathAuthoringContext(input: {
  readonly namespace: string;
  readonly notation?: Partial<KpMathAuthoringNotation> | undefined;
}): KpMathAuthoringContext {
  return createKpMathAuthoringContext({
    namespace: input.namespace,
    defaults: {
      scalars: createKpFloatingPointScalars(),
      notation: input.notation
    }
  });
}
