import type { KpSemanticSlotId } from "./identity.ts";
import type { KpSemanticStateTransitionPlan } from
  "./state-family-transition.ts";
import type {
  KpSemanticTransactionCommit,
  KpSemanticTransactionJournalEntry,
  KpSemanticTransactionJournalOperation
} from "./transaction.ts";

export type KpSemanticStateFamilyApplicationDiagnosticCode =
  | "changed-derivation-authority"
  | "missing-driver-write"
  | "presentation-only-write"
  | "undeclared-driver-write"
  | "unsupported-endpoint-write";

export interface KpSemanticStateFamilyApplicationDiagnostic {
  readonly schemaVersion:
    "kp.semantic-state-family-application-diagnostic.v1";
  readonly kind: "semantic-state-family-application-diagnostic";
  readonly code: KpSemanticStateFamilyApplicationDiagnosticCode;
  readonly declarationId?: string;
  readonly targetSlotId?: KpSemanticSlotId;
  readonly targetPath?: readonly string[];
  readonly writeId?: string;
  readonly operationKind?: KpSemanticTransactionJournalOperation["kind"];
  readonly message: string;
}

export class KpSemanticStateFamilyApplicationValidationError extends Error {
  readonly diagnostics:
    readonly KpSemanticStateFamilyApplicationDiagnostic[];

  constructor(
    diagnostics: readonly KpSemanticStateFamilyApplicationDiagnostic[]
  ) {
    super(diagnostics.map(({ message }) => message).join("\n"));
    this.name = "KpSemanticStateFamilyApplicationValidationError";
    this.diagnostics = Object.freeze([...diagnostics]);
  }
}

export function validateKpSemanticStateFamilyEndpoint(input: {
  readonly commit: KpSemanticTransactionCommit;
  readonly transitionPlan: KpSemanticStateTransitionPlan;
}): void {
  const diagnostics: KpSemanticStateFamilyApplicationDiagnostic[] = [];
  const declarationBySlotId = new Map(
    input.transitionPlan.declarations.map((declaration) => [
      declaration.target.slotId,
      declaration
    ])
  );
  const writtenDriverSlotIds = new Set<KpSemanticSlotId>();

  // The journal is the write authority. A snapshot diff would incorrectly
  // treat identity-preserving alias rebinding as another authored driver.
  for (const entry of input.commit.journal) {
    const operation = entry.operation;
    if (operation.kind === "staged-write") {
      diagnostics.push(createDiagnostic({
        code: "unsupported-endpoint-write",
        entry,
        message: `Semantic state family endpoint contains unsupported raw staged write ${JSON.stringify(entry.writeId)}.`
      }));
      continue;
    }
    const targetSlotId = operationTargetSlotId(operation);
    const declaration = declarationBySlotId.get(targetSlotId);
    if (operation.kind === "derive") {
      diagnostics.push(createDiagnostic({
        code: "changed-derivation-authority",
        ...(declaration === undefined ? {} : { declaration }),
        entry,
        targetSlotId,
        message: `Semantic state family endpoint cannot change derivation authority for slot ${JSON.stringify(targetSlotId)}.`
      }));
      continue;
    }
    if (declaration === undefined) {
      diagnostics.push(createDiagnostic({
        code: "undeclared-driver-write",
        entry,
        targetSlotId,
        message: `Semantic state family endpoint writes undeclared driver slot ${JSON.stringify(targetSlotId)}.`
      }));
      continue;
    }
    if (declaration.transitionMode === "presentation-only") {
      diagnostics.push(createDiagnostic({
        code: "presentation-only-write",
        declaration,
        entry,
        targetSlotId,
        message: `Presentation-only transition ${JSON.stringify(declaration.id)} cannot authorize a semantic endpoint write.`
      }));
      continue;
    }
    writtenDriverSlotIds.add(targetSlotId);
  }

  for (const declaration of input.transitionPlan.declarations) {
    if (declaration.transitionMode !== "presentation-only" &&
      !writtenDriverSlotIds.has(declaration.target.slotId)) {
      diagnostics.push(createDiagnostic({
        code: "missing-driver-write",
        declaration,
        targetSlotId: declaration.target.slotId,
        message: `Semantic state family endpoint did not write declared ${declaration.transitionMode} driver ${JSON.stringify(declaration.id)}.`
      }));
    }
  }

  if (diagnostics.length > 0) {
    throw new KpSemanticStateFamilyApplicationValidationError(diagnostics);
  }
}

function operationTargetSlotId(
  operation: Exclude<
    KpSemanticTransactionJournalOperation,
    { readonly kind: "staged-write" }
  >
): KpSemanticSlotId {
  switch (operation.kind) {
    case "bind":
    case "bind-copy":
      return operation.targetSlotId;
    case "derive":
    case "introduce":
    case "remove":
    case "update":
      return operation.slotId;
  }
}

function createDiagnostic(input: {
  readonly code: KpSemanticStateFamilyApplicationDiagnosticCode;
  readonly declaration?: KpSemanticStateTransitionPlan[
    "declarations"
  ][number];
  readonly entry?: KpSemanticTransactionJournalEntry;
  readonly targetSlotId?: KpSemanticSlotId;
  readonly message: string;
}): KpSemanticStateFamilyApplicationDiagnostic {
  return Object.freeze({
    schemaVersion:
      "kp.semantic-state-family-application-diagnostic.v1" as const,
    kind: "semantic-state-family-application-diagnostic" as const,
    code: input.code,
    ...(input.declaration === undefined
      ? {}
      : {
        declarationId: input.declaration.id,
        targetPath: Object.freeze([...input.declaration.target.path])
      }),
    ...(input.targetSlotId === undefined
      ? {}
      : { targetSlotId: input.targetSlotId }),
    ...(input.entry === undefined
      ? {}
      : {
        writeId: input.entry.writeId,
        operationKind: input.entry.operation.kind
      }),
    message: input.message
  });
}
