import type {
  KpSymbolicManipulationFamily
} from "./symbolic-manipulation-family.ts";
import {
  materializeKpSymbolicManipulationFamilyPacks,
  type KpSymbolicManipulationFamilyPackDeclaration
} from "./symbolic-manipulation-family-pack.ts";
import {
  kpAlgebraSymbolicManipulationFamilyPack
} from "./symbolic-manipulation-families/algebra.ts";
import {
  kpCalculusSymbolicManipulationFamilyPack
} from "./symbolic-manipulation-families/calculus.ts";
import {
  kpLinearAlgebraSymbolicManipulationFamilyPack
} from "./symbolic-manipulation-families/linear-algebra.ts";

export const kpSymbolicManipulationFamilyPackDeclarations = Object.freeze([
  kpAlgebraSymbolicManipulationFamilyPack,
  kpCalculusSymbolicManipulationFamilyPack,
  kpLinearAlgebraSymbolicManipulationFamilyPack
] satisfies readonly KpSymbolicManipulationFamilyPackDeclaration[]);

export function createSymbolicManipulationFamilyRegistry():
  readonly KpSymbolicManipulationFamily[] {
  return materializeKpSymbolicManipulationFamilyPacks(
    kpSymbolicManipulationFamilyPackDeclarations
  );
}

export function symbolicManipulationFamilyById(
  id: string
): KpSymbolicManipulationFamily | undefined {
  const pack = kpSymbolicManipulationFamilyPackDeclarations.find(
    ({ familyIds }) => familyIds.includes(id)
  );
  return pack?.createFamilies().find(
    (family) => family.id === id
  );
}
