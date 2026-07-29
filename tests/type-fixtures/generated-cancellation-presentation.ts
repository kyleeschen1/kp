import type {
  KpSemanticTransformation
} from "../../src/semantic/asset-transformation.ts";
import type {
  KpCompilerGeneratedAlgebraTransformation
} from "../../src/semantic/generated-algebra-transformation-authority.ts";

declare const externalTransformation: KpSemanticTransformation;

// @ts-expect-error External semantic data lacks nominal compiler authority.
const fabricated: KpCompilerGeneratedAlgebraTransformation =
  externalTransformation;

void fabricated;
