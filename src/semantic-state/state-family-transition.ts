import type {
  KpCompiledSemanticStateLeaf,
  KpCompiledSemanticStateSchema
} from "./authoring-schema-compiler.ts";
import type {
  KpSemanticStateGroupDescriptor,
  KpSemanticStateLeafDescriptor,
  KpSemanticStateMemberMap
} from "./authoring-schema.ts";
import type {
  KpOptionalSemanticStateLeafHandle,
  KpRequiredSemanticStateLeafHandle,
  KpSemanticStateLeafHandle
} from "./authoring-state-handles.ts";
import type { KpSemanticSlotId } from "./identity.ts";
import {
  compareKpSemanticProgress,
  encodeKpSemanticProgress,
  type KpSemanticProgress,
  type KpSemanticProgressEncoding
} from "./semantic-progress.ts";

declare const kpSemanticStateTransitionValue: unique symbol;

export type KpWritableSemanticStateLeafHandle<Value> =
  | KpRequiredSemanticStateLeafHandle<Value>
  | KpOptionalSemanticStateLeafHandle<Value>;

export interface KpSemanticStateTransitionTarget<Value = unknown> {
  readonly schemaVersion: "kp.semantic-state-transition-target.v1";
  readonly kind: "semantic-state-transition-target";
  readonly namespace: string;
  readonly slotId: KpSemanticSlotId;
  readonly path: readonly string[];
  readonly encodedPath: string;
  readonly descriptorKind: KpSemanticStateLeafDescriptor["kind"];
  readonly [kpSemanticStateTransitionValue]?: Value;
}

export interface KpSemanticStateTransitionSource {
  readonly schemaVersion: "kp.semantic-state-transition-source.v1";
  readonly kind: "semantic-state-transition-source";
  readonly id: string;
}

interface KpSemanticStateTransitionDeclarationBase<Value> {
  readonly schemaVersion: "kp.semantic-state-transition-declaration.v1";
  readonly kind: "semantic-state-transition-declaration";
  readonly id: string;
  readonly source: KpSemanticStateTransitionSource;
  readonly target: KpSemanticStateTransitionTarget<Value>;
}

export interface KpSemanticStateInterpolationDeclaration<Value>
  extends KpSemanticStateTransitionDeclarationBase<Value> {
  readonly transitionMode: "semantic-interpolation";
}

export interface KpSemanticStateDiscreteChangePoint {
  readonly schemaVersion: "kp.semantic-state-discrete-change-point.v1";
  readonly kind: "semantic-state-discrete-change-point";
  readonly id: string;
  readonly at: KpSemanticProgressEncoding;
  readonly valueSourceId: string;
}

export interface KpSemanticStateDiscreteTransitionDeclaration<Value>
  extends KpSemanticStateTransitionDeclarationBase<Value> {
  readonly transitionMode: "discrete";
  readonly changePoints: readonly KpSemanticStateDiscreteChangePoint[];
}

export interface KpSemanticStatePresentationTransitionDeclaration<Value>
  extends KpSemanticStateTransitionDeclarationBase<Value> {
  readonly transitionMode: "presentation-only";
}

export type KpSemanticStateTransitionDeclaration<Value = unknown> =
  | KpSemanticStateInterpolationDeclaration<Value>
  | KpSemanticStateDiscreteTransitionDeclaration<Value>
  | KpSemanticStatePresentationTransitionDeclaration<Value>;

interface KpSemanticStateTransitionDeclarationInput<Target> {
  readonly id: string;
  readonly sourceId: string;
  readonly target: Target;
}

export function declareKpSemanticStateInterpolation<const Value>(
  input: KpSemanticStateTransitionDeclarationInput<
    KpWritableSemanticStateLeafHandle<Value>
  > & {
    readonly changePoints?: never;
  }
): KpSemanticStateInterpolationDeclaration<Value> {
  return Object.freeze({
    ...createDeclarationBase(input),
    transitionMode: "semantic-interpolation"
  });
}

export function declareKpSemanticStateDiscreteTransition<const Value>(
  input: KpSemanticStateTransitionDeclarationInput<
    KpWritableSemanticStateLeafHandle<Value>
  > & {
    readonly changePoints: readonly {
      readonly id: string;
      readonly at: KpSemanticProgress;
      readonly valueSourceId: string;
    }[];
  }
): KpSemanticStateDiscreteTransitionDeclaration<Value> {
  const changePoints = [...input.changePoints]
    .sort((left, right) =>
      compareKpSemanticProgress(left.at, right.at) ||
      compareStrings(left.id, right.id)
    )
    .map((point): KpSemanticStateDiscreteChangePoint => Object.freeze({
      schemaVersion: "kp.semantic-state-discrete-change-point.v1",
      kind: "semantic-state-discrete-change-point",
      id: point.id,
      at: encodeKpSemanticProgress(point.at),
      valueSourceId: point.valueSourceId
    }));
  return Object.freeze({
    ...createDeclarationBase(input),
    transitionMode: "discrete",
    changePoints: Object.freeze(changePoints)
  });
}

export function declareKpSemanticStatePresentationTransition<const Value>(
  input: KpSemanticStateTransitionDeclarationInput<
    KpSemanticStateLeafHandle<Value>
  > & {
    readonly changePoints?: never;
  }
): KpSemanticStatePresentationTransitionDeclaration<Value> {
  return Object.freeze({
    ...createDeclarationBase(input),
    transitionMode: "presentation-only"
  });
}

export interface KpSemanticStateTransitionPlan {
  readonly schemaVersion: "kp.semantic-state-transition-plan.v1";
  readonly kind: "semantic-state-transition-plan";
  readonly namespace: string;
  readonly declarations: readonly KpSemanticStateTransitionDeclaration[];
}

export function areKpSemanticStateTransitionPlansEqual(
  left: KpSemanticStateTransitionPlan,
  right: KpSemanticStateTransitionPlan
): boolean {
  return left.namespace === right.namespace &&
    left.declarations.length === right.declarations.length &&
    left.declarations.every((declaration, index) =>
      areDeclarationsEqual(declaration, right.declarations[index])
    );
}

export type KpSemanticStateTransitionDiagnosticCode =
  | "cross-schema-transition-target"
  | "duplicate-discrete-change-point"
  | "duplicate-transition-id"
  | "duplicate-transition-target"
  | "invalid-transition-source"
  | "invalid-transition-target"
  | "missing-discrete-change-point"
  | "undeclared-transition-target";

export interface KpSemanticStateTransitionDiagnostic {
  readonly schemaVersion: "kp.semantic-state-transition-diagnostic.v1";
  readonly kind: "semantic-state-transition-diagnostic";
  readonly code: KpSemanticStateTransitionDiagnosticCode;
  readonly declarationId: string;
  readonly sourceId: string;
  readonly transitionMode:
    KpSemanticStateTransitionDeclaration["transitionMode"];
  readonly targetSlotId: KpSemanticSlotId;
  readonly targetPath: readonly string[];
  readonly message: string;
}

export class KpSemanticStateTransitionValidationError extends Error {
  readonly diagnostics: readonly KpSemanticStateTransitionDiagnostic[];

  constructor(diagnostics: readonly KpSemanticStateTransitionDiagnostic[]) {
    super(diagnostics.map(({ message }) => message).join("\n"));
    this.name = "KpSemanticStateTransitionValidationError";
    this.diagnostics = Object.freeze([...diagnostics]);
  }
}

export function compileKpSemanticStateTransitionPlan<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(input: {
  readonly compiled: KpCompiledSemanticStateSchema<Root>;
  readonly declarations: readonly KpSemanticStateTransitionDeclaration[];
}): KpSemanticStateTransitionPlan {
  const diagnostics: KpSemanticStateTransitionDiagnostic[] = [];
  const declarationIds = new Set<string>();
  const targetSlotIds = new Set<KpSemanticSlotId>();
  const leafBySlotId = new Map(input.compiled.leaves.map((leaf) => [
    leaf.identities.slotId,
    leaf
  ]));

  for (const declaration of input.declarations) {
    const diagnostic = (
      code: KpSemanticStateTransitionDiagnosticCode,
      message: string
    ) => diagnostics.push(createDiagnostic(declaration, code, message));
    if (declarationIds.has(declaration.id)) {
      diagnostic(
        "duplicate-transition-id",
        `Semantic state transition ${JSON.stringify(declaration.id)} is declared more than once.`
      );
    }
    declarationIds.add(declaration.id);
    if (declaration.source.id.length === 0 ||
      declaration.source.id.trim() !== declaration.source.id) {
      diagnostic(
        "invalid-transition-source",
        `Semantic state transition ${JSON.stringify(declaration.id)} requires a non-empty trimmed source id.`
      );
    }
    if (targetSlotIds.has(declaration.target.slotId)) {
      diagnostic(
        "duplicate-transition-target",
        `Semantic state path ${formatPath(declaration.target.path)} has more than one transition mode.`
      );
    }
    targetSlotIds.add(declaration.target.slotId);

    const leaf = leafBySlotId.get(declaration.target.slotId);
    if (declaration.target.namespace !== input.compiled.namespace) {
      diagnostic(
        "cross-schema-transition-target",
        `Semantic state transition target ${formatPath(declaration.target.path)} does not belong to schema ${JSON.stringify(input.compiled.namespace)}.`
      );
    } else if (leaf === undefined || !matchesLeaf(declaration.target, leaf)) {
      diagnostic(
        "undeclared-transition-target",
        `Semantic state transition target ${formatPath(declaration.target.path)} is not an exact leaf in schema ${JSON.stringify(input.compiled.namespace)}.`
      );
    } else if (declaration.transitionMode !== "presentation-only" &&
      leaf.descriptor.kind === "derived-value") {
      diagnostic(
        "invalid-transition-target",
        `Semantic state path ${formatPath(declaration.target.path)} is derived and cannot be a ${declaration.transitionMode} driver.`
      );
    }

    if (declaration.transitionMode === "discrete") {
      validateChangePoints(declaration, diagnostic);
    }
  }

  if (diagnostics.length > 0) {
    throw new KpSemanticStateTransitionValidationError(diagnostics);
  }
  return Object.freeze({
    schemaVersion: "kp.semantic-state-transition-plan.v1",
    kind: "semantic-state-transition-plan",
    namespace: input.compiled.namespace,
    declarations: Object.freeze([...input.declarations].sort(
      (left, right) => compareStrings(left.target.slotId, right.target.slotId) ||
        compareStrings(left.id, right.id)
    ))
  });
}

function createDeclarationBase<Value>(input: {
  readonly id: string;
  readonly sourceId: string;
  readonly target: KpSemanticStateLeafHandle<Value>;
}): KpSemanticStateTransitionDeclarationBase<Value> {
  return {
    schemaVersion: "kp.semantic-state-transition-declaration.v1",
    kind: "semantic-state-transition-declaration",
    id: input.id,
    source: Object.freeze({
      schemaVersion: "kp.semantic-state-transition-source.v1",
      kind: "semantic-state-transition-source",
      id: input.sourceId
    }),
    target: Object.freeze({
      schemaVersion: "kp.semantic-state-transition-target.v1",
      kind: "semantic-state-transition-target",
      namespace: input.target.namespace,
      slotId: input.target.slotId,
      path: Object.freeze([...input.target.path]),
      encodedPath: input.target.encodedPath,
      descriptorKind: input.target.descriptorKind
    })
  };
}

function validateChangePoints(
  declaration: KpSemanticStateDiscreteTransitionDeclaration<unknown>,
  diagnostic: (
    code: KpSemanticStateTransitionDiagnosticCode,
    message: string
  ) => void
): void {
  if (declaration.changePoints.length === 0) {
    diagnostic(
      "missing-discrete-change-point",
      `Discrete semantic state transition ${JSON.stringify(declaration.id)} requires at least one explicit change point.`
    );
  }
  const ids = new Set<string>();
  const progress = new Set<KpSemanticProgressEncoding>();
  for (const point of declaration.changePoints) {
    if (ids.has(point.id) || progress.has(point.at)) {
      diagnostic(
        "duplicate-discrete-change-point",
        `Discrete semantic state transition ${JSON.stringify(declaration.id)} repeats change point ${JSON.stringify(point.id)} or progress ${JSON.stringify(point.at)}.`
      );
    }
    ids.add(point.id);
    progress.add(point.at);
  }
}

function createDiagnostic(
  declaration: KpSemanticStateTransitionDeclaration,
  code: KpSemanticStateTransitionDiagnosticCode,
  message: string
): KpSemanticStateTransitionDiagnostic {
  return Object.freeze({
    schemaVersion: "kp.semantic-state-transition-diagnostic.v1",
    kind: "semantic-state-transition-diagnostic",
    code,
    declarationId: declaration.id,
    sourceId: declaration.source.id,
    transitionMode: declaration.transitionMode,
    targetSlotId: declaration.target.slotId,
    targetPath: declaration.target.path,
    message
  });
}

function matchesLeaf(
  target: KpSemanticStateTransitionTarget,
  leaf: KpCompiledSemanticStateLeaf
): boolean {
  return target.encodedPath === leaf.encodedPath &&
    target.descriptorKind === leaf.descriptor.kind &&
    target.path.length === leaf.path.length &&
    target.path.every((part, index) => part === leaf.path[index]);
}

function formatPath(path: readonly string[]): string {
  return path.length === 0 ? "<root>" : JSON.stringify(path);
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function areDeclarationsEqual(
  left: KpSemanticStateTransitionDeclaration,
  right: KpSemanticStateTransitionDeclaration | undefined
): boolean {
  if (right === undefined ||
    left.id !== right.id ||
    left.source.id !== right.source.id ||
    left.transitionMode !== right.transitionMode ||
    left.target.namespace !== right.target.namespace ||
    left.target.slotId !== right.target.slotId ||
    left.target.encodedPath !== right.target.encodedPath ||
    left.target.descriptorKind !== right.target.descriptorKind ||
    left.target.path.length !== right.target.path.length ||
    !left.target.path.every((part, index) => part === right.target.path[index])) {
    return false;
  }
  if (left.transitionMode !== "discrete") return true;
  if (right.transitionMode !== "discrete" ||
    left.changePoints.length !== right.changePoints.length) {
    return false;
  }
  return left.changePoints.every((point, index) => {
    const other = right.changePoints[index];
    return other !== undefined &&
      point.id === other.id &&
      point.at === other.at &&
      point.valueSourceId === other.valueSourceId;
  });
}
