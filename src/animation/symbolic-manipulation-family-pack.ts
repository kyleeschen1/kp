import type {
  KpSymbolicManipulationDomain,
  KpSymbolicManipulationFamily
} from "./symbolic-manipulation-family.ts";

export interface KpSymbolicManipulationFamilyPackDeclaration {
  readonly id: `symbolic-family-pack.${string}`;
  readonly domain: KpSymbolicManipulationDomain;
  readonly familyIds: readonly string[];
  readonly createFamilies: () => readonly KpSymbolicManipulationFamily[];
}

export type KpSymbolicManipulationFamilyPackDiagnosticCode =
  | "duplicate-pack-id"
  | "duplicate-family-id"
  | "declared-family-missing"
  | "undeclared-family"
  | "family-order-mismatch"
  | "family-domain-mismatch";

export interface KpSymbolicManipulationFamilyPackDiagnostic {
  readonly code: KpSymbolicManipulationFamilyPackDiagnosticCode;
  readonly packId: string;
  readonly message: string;
}

export function createKpSymbolicManipulationFamilyPackDeclaration(
  input: KpSymbolicManipulationFamilyPackDeclaration
): KpSymbolicManipulationFamilyPackDeclaration {
  return Object.freeze({
    ...input,
    familyIds: Object.freeze([...input.familyIds])
  });
}

export function materializeKpSymbolicManipulationFamilyPacks(
  declarations: readonly KpSymbolicManipulationFamilyPackDeclaration[]
): readonly KpSymbolicManipulationFamily[] {
  const { diagnostics, families } = inspectPacks(declarations);
  if (diagnostics.length > 0) {
    throw new Error(diagnostics.map(({ message }) => message).join("\n"));
  }
  return families;
}

export function validateKpSymbolicManipulationFamilyPacks(
  declarations: readonly KpSymbolicManipulationFamilyPackDeclaration[]
): readonly KpSymbolicManipulationFamilyPackDiagnostic[] {
  return inspectPacks(declarations).diagnostics;
}

function inspectPacks(
  declarations: readonly KpSymbolicManipulationFamilyPackDeclaration[]
): {
  readonly diagnostics: readonly KpSymbolicManipulationFamilyPackDiagnostic[];
  readonly families: readonly KpSymbolicManipulationFamily[];
} {
  const diagnostics: KpSymbolicManipulationFamilyPackDiagnostic[] = [];
  const materializedFamilies: KpSymbolicManipulationFamily[] = [];
  const packIds = new Set<string>();
  const familyIds = new Set<string>();
  for (const declaration of declarations) {
    if (packIds.has(declaration.id)) {
      diagnostics.push(diagnostic(
        "duplicate-pack-id",
        declaration.id,
        `Duplicate symbolic family pack ${declaration.id}.`
      ));
    }
    packIds.add(declaration.id);
    for (const familyId of declaration.familyIds) {
      if (familyIds.has(familyId)) {
        diagnostics.push(diagnostic(
          "duplicate-family-id",
          declaration.id,
          `Duplicate symbolic family declaration ${familyId}.`
        ));
      }
      familyIds.add(familyId);
    }

    const families = declaration.createFamilies();
    materializedFamilies.push(...families);
    const actualIds = families.map(({ id }) => id);
    for (const expectedId of declaration.familyIds) {
      if (!actualIds.includes(expectedId)) {
        diagnostics.push(diagnostic(
          "declared-family-missing",
          declaration.id,
          `Pack ${declaration.id} did not materialize declared family ${expectedId}.`
        ));
      }
    }
    for (const family of families) {
      if (!declaration.familyIds.includes(family.id)) {
        diagnostics.push(diagnostic(
          "undeclared-family",
          declaration.id,
          `Pack ${declaration.id} materialized undeclared family ${family.id}.`
        ));
      }
      if (family.domain !== declaration.domain) {
        diagnostics.push(diagnostic(
          "family-domain-mismatch",
          declaration.id,
          `Family ${family.id} belongs to ${family.domain}, not ${declaration.domain}.`
        ));
      }
    }
    if (actualIds.join("\u0000") !== declaration.familyIds.join("\u0000")) {
      diagnostics.push(diagnostic(
        "family-order-mismatch",
        declaration.id,
        `Pack ${declaration.id} materialized families out of declared order.`
      ));
    }
  }
  return Object.freeze({
    diagnostics: Object.freeze(diagnostics),
    families: Object.freeze(materializedFamilies)
  });
}

export function symbolicManipulationFamilyRowId(familyId: string): string {
  return `symbolic-family-${familyId.replace(/^family\./, "").replaceAll(".", "-")}`;
}

function diagnostic(
  code: KpSymbolicManipulationFamilyPackDiagnosticCode,
  packId: string,
  message: string
): KpSymbolicManipulationFamilyPackDiagnostic {
  return Object.freeze({ code, packId, message });
}
