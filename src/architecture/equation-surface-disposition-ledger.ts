import {
  createKpEquationSurfaceAuthorityGraph,
  type KpEquationSurfaceAuthorityGraph,
  type KpEquationSurfaceAuthorityPathClass
} from "./equation-surface-authority-graph.ts";
import {
  createKpEquationSurfaceInventory,
  type KpEquationSurfaceInventory
} from "./equation-surface-inventory.ts";
import {
  createKpEquationSurfacePreservationMatrix,
  type KpEquationSurfaceFamilyId,
  type KpEquationSurfacePreservationMatrix
} from "./equation-surface-preservation-matrix.ts";

export const kpEquationSurfaceDispositionValues = Object.freeze([
  "canonical",
  "adapter-backed",
  "static-only",
  "unsupported",
  "retirement-candidate"
] as const);

export type KpEquationSurfaceDisposition =
  typeof kpEquationSurfaceDispositionValues[number];

export const kpEquationSurfaceMigrationWaveValues = Object.freeze([
  "wave-a-operation-plan",
  "wave-b-structural-native-math",
  "wave-c-generated-bespoke-diagnostic-static"
] as const);

export type KpEquationSurfaceMigrationWave =
  typeof kpEquationSurfaceMigrationWaveValues[number];

export interface KpEquationSurfaceDispositionEntry {
  readonly schemaVersion: "kp.equation-surface-disposition-entry.v1";
  readonly animationId: string;
  readonly familyId: KpEquationSurfaceFamilyId;
  readonly disposition: KpEquationSurfaceDisposition;
  readonly migrationWave: KpEquationSurfaceMigrationWave;
  readonly rationale: string;
  readonly preCheckpointAdapterSlice?: "s20" | "s21" | "s22" | undefined;
  readonly preservationBoundary: {
    readonly semanticEndpointFingerprints: readonly string[];
    readonly route: string;
    readonly adapterId: string;
    readonly accessibilityMode: string;
    readonly visualVerificationCommand: string;
  };
  readonly rollbackUnit: {
    readonly id: string;
    readonly scope: "single-equation-surface-authority-path";
    readonly restorePathClass: KpEquationSurfaceAuthorityPathClass;
    readonly restoreSourcePaths: readonly string[];
    readonly verificationCommands: readonly string[];
  };
  readonly retirementEvidence: {
    readonly status: "blocked-active-callers";
    readonly productionCallers: readonly KpEquationSurfaceCallerEvidence[];
    readonly conformanceCallers: readonly KpEquationSurfaceCallerEvidence[];
    readonly retirementCondition:
      "zero-production-and-conformance-callers-after-replacement";
  };
}

export interface KpEquationSurfaceCallerEvidence {
  readonly id: string;
  readonly kind:
    | "catalogue-owner"
    | "lazy-pack"
    | "presentation-route"
    | "preservation-contract"
    | "browser-conformance"
    | "family-verification";
  readonly sourcePath?: string | undefined;
  readonly command?: string | undefined;
}

export interface KpEquationSurfaceDispositionLedger {
  readonly schemaVersion: "kp.equation-surface-disposition-ledger.v1";
  readonly kind: "equation-surface-disposition-ledger";
  readonly entries: readonly KpEquationSurfaceDispositionEntry[];
}

export class KpEquationSurfaceDispositionLedgerError extends Error {
  override readonly name = "KpEquationSurfaceDispositionLedgerError";
  readonly diagnostics: readonly string[];

  constructor(diagnostics: readonly string[]) {
    super(diagnostics.join("\n"));
    this.diagnostics = diagnostics;
  }
}

const staticOnlyIds = new Set([
  "animation.comparison.jacobian-hessian",
  "animation.comparison.linear-solve-programming",
  "animation.sample.fourier-transform-pair",
  "animation.sample.fundamental-theorem-calculus"
]);

const retirementCandidateIds = new Set([
  "animation.generated.substitute-three.provisional-incorrect"
]);

const waveAIds = new Set([
  "animation.generated.add-zero",
  "animation.generated.cancellation.additive-inverses",
  "animation.generated.distribution.expand-a-sum",
  "animation.generated.distribution.factor-common-a",
  "animation.generated.linear-solve.linear-68c15d41",
  "animation.linear-solve.solve-x",
  "animation.operation-evaluation.five-plus-two",
  "animation.operation-evaluation.one-plus-two",
  "animation.operation-evaluation.three-sixths"
]);

const waveBIds = new Set([
  "animation.algebra.log-exponent.solve-two-power-x",
  "animation.algebra.log-quotient.difference-to-quotient",
  "animation.generated.exponent.square-as-product",
  "animation.generated.fraction-expression.two-fourths",
  "animation.generated.function-wrap.apply-f",
  "animation.generated.linear-algebra.dot-product.three-vector",
  "animation.generated.linear-algebra.matrix-matrix.two-by-two",
  "animation.generated.linear-algebra.matrix-vector.two-by-two",
  "animation.generated.radical.square-root-as-power"
]);

export function createKpEquationSurfaceDispositionLedger():
KpEquationSurfaceDispositionLedger {
  return compileKpEquationSurfaceDispositionLedger({
    inventory: createKpEquationSurfaceInventory(),
    authority: createKpEquationSurfaceAuthorityGraph(),
    preservation: createKpEquationSurfacePreservationMatrix()
  });
}

export function compileKpEquationSurfaceDispositionLedger(input: {
  readonly inventory: KpEquationSurfaceInventory;
  readonly authority: KpEquationSurfaceAuthorityGraph;
  readonly preservation: KpEquationSurfacePreservationMatrix;
}): KpEquationSurfaceDispositionLedger {
  const diagnostics: string[] = [];
  const authorityById = uniqueByAnimationId(
    input.authority.rows,
    "authority",
    diagnostics
  );
  const preservationById = uniqueByAnimationId(
    input.preservation.entries,
    "preservation",
    diagnostics
  );
  const familyByAnimationId = new Map(input.preservation.families.flatMap(
    (family) => family.animationIds.map((animationId) => [
      animationId,
      family
    ] as const)
  ));
  const seenInventory = new Set<string>();
  const entries = input.inventory.entries.flatMap((inventory) => {
    if (seenInventory.has(inventory.animationId)) {
      diagnostics.push(`Duplicate inventory row ${inventory.animationId}.`);
      return [];
    }
    seenInventory.add(inventory.animationId);
    const authority = authorityById.get(inventory.animationId);
    const preservation = preservationById.get(inventory.animationId);
    const family = familyByAnimationId.get(inventory.animationId);
    if (authority === undefined || preservation === undefined ||
        family === undefined) {
      diagnostics.push(
        `Unclassified equation row ${inventory.animationId}: ` +
        `authority=${authority !== undefined}, ` +
        `preservation=${preservation !== undefined}, ` +
        `family=${family !== undefined}.`
      );
      return [];
    }
    return [dispositionEntry({
      animationId: inventory.animationId,
      familyId: preservation.familyId,
      pathClass: authority.pathClass,
      rendererAdapterId: inventory.catalogueSurface.rendererAdapterId,
      semanticOwnerPath: inventory.semanticOwner.sourcePath,
      packPath: inventory.lazyCapability.packSourcePath,
      rendererPath: inventory.catalogueSurface.rendererSourcePath,
      route: preservation.route.href,
      accessibilityMode: preservation.accessibility.mathSemantics,
      endpointFingerprints: preservation.semanticEndpoints.flatMap((endpoint) => [
        endpoint.transformationFingerprint,
        ...endpoint.source.map(({ semanticFingerprint }) => semanticFingerprint),
        ...endpoint.target.map(({ semanticFingerprint }) => semanticFingerprint)
      ]),
      familySemanticCommand: family.semanticVerificationCommand,
      familyVisualCommand: family.visualVerificationCommand
    })];
  });

  const missingInventoryIds = [
    ...new Set([...authorityById.keys(), ...preservationById.keys()])
  ].filter((animationId) => !seenInventory.has(animationId));
  missingInventoryIds.forEach((animationId) => diagnostics.push(
    `Equation disposition source ${animationId} is absent from inventory.`
  ));
  if (diagnostics.length > 0) {
    throw new KpEquationSurfaceDispositionLedgerError(
      Object.freeze(diagnostics)
    );
  }

  return Object.freeze({
    schemaVersion: "kp.equation-surface-disposition-ledger.v1" as const,
    kind: "equation-surface-disposition-ledger" as const,
    entries: Object.freeze(entries)
  });
}

function dispositionEntry(input: {
  readonly animationId: string;
  readonly familyId: KpEquationSurfaceFamilyId;
  readonly pathClass: KpEquationSurfaceAuthorityPathClass;
  readonly rendererAdapterId: string;
  readonly semanticOwnerPath: string;
  readonly packPath: string;
  readonly rendererPath: string;
  readonly route: string;
  readonly accessibilityMode: string;
  readonly endpointFingerprints: readonly string[];
  readonly familySemanticCommand: string;
  readonly familyVisualCommand: string;
}): KpEquationSurfaceDispositionEntry {
  const disposition = dispositionFor(input.animationId, input.pathClass);
  const migrationWave = waveFor(input.animationId);
  return Object.freeze({
    schemaVersion: "kp.equation-surface-disposition-entry.v1" as const,
    animationId: input.animationId,
    familyId: input.familyId,
    disposition,
    migrationWave,
    rationale: rationaleFor(disposition, input.animationId),
    ...preCheckpointAdapterSlice(input.animationId),
    preservationBoundary: Object.freeze({
      semanticEndpointFingerprints: Object.freeze(unique(
        input.endpointFingerprints
      )),
      route: input.route,
      adapterId: input.rendererAdapterId,
      accessibilityMode: input.accessibilityMode,
      visualVerificationCommand: input.familyVisualCommand
    }),
    rollbackUnit: Object.freeze({
      id: `rollback.equation-surface.${input.animationId}`,
      scope: "single-equation-surface-authority-path" as const,
      restorePathClass: input.pathClass,
      restoreSourcePaths: Object.freeze(unique([
        input.semanticOwnerPath,
        input.packPath,
        input.rendererPath
      ]).sort()),
      verificationCommands: Object.freeze([
        input.familySemanticCommand,
        input.familyVisualCommand,
        "npm run test:browser:equation-surface-preservation"
      ])
    }),
    retirementEvidence: Object.freeze({
      status: "blocked-active-callers" as const,
      productionCallers: Object.freeze([
        caller(`catalogue.${input.animationId}`, "catalogue-owner",
          input.semanticOwnerPath),
        caller(`pack.${input.animationId}`, "lazy-pack", input.packPath),
        caller(`route.${input.animationId}`, "presentation-route",
          input.rendererPath)
      ]),
      conformanceCallers: Object.freeze([
        caller(`preservation.${input.animationId}`, "preservation-contract",
          "src/architecture/equation-surface-preservation-matrix.generated.json"),
        caller(`browser.${input.animationId}`, "browser-conformance",
          "tests/equation-surface-preservation.browser.spec.ts"),
        commandCaller(`family.${input.familyId}`, "family-verification",
          input.familySemanticCommand)
      ]),
      retirementCondition:
        "zero-production-and-conformance-callers-after-replacement" as const
    })
  });
}

function dispositionFor(
  animationId: string,
  pathClass: KpEquationSurfaceAuthorityPathClass
): KpEquationSurfaceDisposition {
  if (retirementCandidateIds.has(animationId)) return "retirement-candidate";
  if (staticOnlyIds.has(animationId)) return "static-only";
  if (pathClass === "operation-evaluation-specialized") return "canonical";
  return "adapter-backed";
}

function waveFor(animationId: string): KpEquationSurfaceMigrationWave {
  if (waveAIds.has(animationId)) return "wave-a-operation-plan";
  if (waveBIds.has(animationId)) return "wave-b-structural-native-math";
  return "wave-c-generated-bespoke-diagnostic-static";
}

function rationaleFor(
  disposition: KpEquationSurfaceDisposition,
  animationId: string
): string {
  if (disposition === "canonical") {
    return "Existing operation-evaluation authority is the canonical executable anchor; later convergence must preserve its native endpoint and scene contracts.";
  }
  if (disposition === "static-only") {
    return "The row compares or presents semantic endpoints but lacks a supported transformation whose movement warrants canonical compilation.";
  }
  if (disposition === "retirement-candidate") {
    return "The deliberately incorrect generated row belongs in negative conformance evidence, not the production catalogue; retirement remains blocked by its active callers.";
  }
  if (disposition === "unsupported") {
    return `Equation surface ${animationId} has no supported semantic motion contract.`;
  }
  return "The row has valid semantic endpoints but still relies on a local or generic compatibility presentation path that must be adapted into the canonical compiler.";
}

function preCheckpointAdapterSlice(animationId: string): {
  readonly preCheckpointAdapterSlice?: "s20" | "s21" | "s22";
} {
  if (animationId.includes("log-quotient")) {
    return { preCheckpointAdapterSlice: "s20" };
  }
  if (animationId.includes("distribution")) {
    return { preCheckpointAdapterSlice: "s21" };
  }
  if (animationId.includes("cancellation")) {
    return { preCheckpointAdapterSlice: "s22" };
  }
  return {};
}

function caller(
  id: string,
  kind: KpEquationSurfaceCallerEvidence["kind"],
  sourcePath: string
): KpEquationSurfaceCallerEvidence {
  return Object.freeze({ id, kind, sourcePath });
}

function commandCaller(
  id: string,
  kind: KpEquationSurfaceCallerEvidence["kind"],
  command: string
): KpEquationSurfaceCallerEvidence {
  return Object.freeze({ id, kind, command });
}

function uniqueByAnimationId<T extends { readonly animationId: string }>(
  values: readonly T[],
  label: string,
  diagnostics: string[]
): ReadonlyMap<string, T> {
  const byId = new Map<string, T>();
  for (const value of values) {
    if (byId.has(value.animationId)) {
      diagnostics.push(`Duplicate ${label} row ${value.animationId}.`);
    } else {
      byId.set(value.animationId, value);
    }
  }
  return byId;
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
