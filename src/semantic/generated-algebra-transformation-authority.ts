import type {
  KpSemanticTransformation
} from "./asset-transformation.ts";

export type KpGeneratedAlgebraFixtureFamilyId =
  | "generated.linear-solve"
  | "generated.fraction-expression"
  | "generated.exponent"
  | "generated.radical"
  | "generated.function-wrap"
  | "generated.distribution";

declare const kpGeneratedAlgebraTransformationAuthority: unique symbol;
const generatedAlgebraTransformationAuthorities =
  new WeakMap<object, KpGeneratedAlgebraFixtureFamilyId>();

export type KpCompilerGeneratedAlgebraTransformation =
  KpSemanticTransformation & {
    readonly [kpGeneratedAlgebraTransformationAuthority]: true;
  };

/**
 * The generated semantic compiler is the sole source of this nominal proof.
 * Keeping authority in a module-private weak map prevents JSON, object spread,
 * and external ports from accidentally inheriting executable presentation.
 */
export function mintKpCompilerGeneratedAlgebraTransformation(input: {
  readonly transformation: KpSemanticTransformation;
  readonly familyId: KpGeneratedAlgebraFixtureFamilyId;
}): KpCompilerGeneratedAlgebraTransformation {
  generatedAlgebraTransformationAuthorities.set(
    input.transformation,
    input.familyId
  );
  return Object.freeze(
    input.transformation
  ) as KpCompilerGeneratedAlgebraTransformation;
}

export function isKpCompilerGeneratedAlgebraTransformation(
  value: unknown
): value is KpCompilerGeneratedAlgebraTransformation {
  return typeof value === "object" && value !== null &&
    generatedAlgebraTransformationAuthorities.has(value);
}

export function kpGeneratedAlgebraTransformationFamilyId(
  transformation: KpCompilerGeneratedAlgebraTransformation
): KpGeneratedAlgebraFixtureFamilyId {
  return generatedAlgebraTransformationAuthorities.get(transformation)!;
}

/**
 * Asset construction is a trusted value-preserving clone boundary. Explicitly
 * transferring this proof here keeps ordinary spreads and serialized imports
 * untrusted while canonical animation assets retain compiler provenance.
 */
export function transferKpGeneratedAlgebraTransformationAuthority(
  source: KpSemanticTransformation,
  target: KpSemanticTransformation
): KpSemanticTransformation {
  if (!isKpCompilerGeneratedAlgebraTransformation(source)) return target;
  return mintKpCompilerGeneratedAlgebraTransformation({
    transformation: target,
    familyId: kpGeneratedAlgebraTransformationFamilyId(source)
  });
}
