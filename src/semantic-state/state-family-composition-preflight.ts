import type { KpAggregateSemanticSnapshot } from "./aggregate-snapshot.ts";
import { areKpSemanticDerivedBindingsEqual } from "./derived-binding.ts";
import type { KpSemanticDerivedGraph } from "./derived-graph.ts";
import type {
  KpAppliedTransformationId,
  KpTransformationDefinitionId
} from "./identity.ts";
import type {
  KpSemanticStateCompositionMemberDeclaration,
  KpSemanticStateCompositionNodeDeclaration
} from "./state-family-composition-declaration.ts";
import type {
  KpValidatedSemanticStateComposition
} from "./state-family-composition-validation.ts";
import {
  KpSemanticStateTransitionFootprintError,
  projectKpSemanticStateTransitionFootprint,
  type KpSemanticStateTransitionFootprint
} from "./state-family-transition-footprint.ts";

export interface KpSemanticStateCompositionGraphBinding {
  readonly schemaVersion:
    "kp.semantic-state-composition-graph-binding.v1";
  readonly kind: "semantic-state-composition-graph-binding";
  readonly definitionId: KpTransformationDefinitionId;
  readonly graph: KpSemanticDerivedGraph;
}

export interface KpSemanticStateCompositionPreflightMember {
  readonly schemaVersion:
    "kp.semantic-state-composition-preflight-member.v1";
  readonly kind: "semantic-state-composition-preflight-member";
  readonly path: readonly string[];
  readonly member: KpSemanticStateCompositionMemberDeclaration;
  readonly footprint: KpSemanticStateTransitionFootprint;
  readonly graph: KpSemanticDerivedGraph;
}

export interface KpSemanticStateCompositionPreflight<
  Composition extends KpValidatedSemanticStateComposition =
    KpValidatedSemanticStateComposition
> {
  readonly schemaVersion: "kp.semantic-state-composition-preflight.v1";
  readonly kind: "semantic-state-composition-preflight";
  readonly composition: Composition;
  readonly base: KpAggregateSemanticSnapshot;
  readonly graphSignature: string;
  readonly members: readonly KpSemanticStateCompositionPreflightMember[];
}

export type KpSemanticStateCompositionPreflightDiagnosticCode =
  | "duplicate-composition-member"
  | "duplicate-graph-binding"
  | "foreign-base-snapshot"
  | "incompatible-derived-graph"
  | "independent-write-conflict"
  | "unresolved-transition-hazard";

export interface KpSemanticStateCompositionPreflightDiagnostic {
  readonly schemaVersion:
    "kp.semantic-state-composition-preflight-diagnostic.v1";
  readonly kind: "semantic-state-composition-preflight-diagnostic";
  readonly code: KpSemanticStateCompositionPreflightDiagnosticCode;
  readonly path: readonly string[];
  readonly memberIds: readonly KpAppliedTransformationId[];
  readonly message: string;
}

export class KpSemanticStateCompositionPreflightError extends Error {
  readonly diagnostics:
    readonly KpSemanticStateCompositionPreflightDiagnostic[];

  constructor(
    diagnostics: readonly KpSemanticStateCompositionPreflightDiagnostic[]
  ) {
    super(diagnostics.map(({ message }) => message).join("\n"));
    this.name = "KpSemanticStateCompositionPreflightError";
    this.diagnostics = Object.freeze([...diagnostics]);
  }
}

export function bindKpSemanticStateCompositionGraph(input: {
  readonly definitionId: KpTransformationDefinitionId;
  readonly graph: KpSemanticDerivedGraph;
}): KpSemanticStateCompositionGraphBinding {
  return Object.freeze({
    schemaVersion: "kp.semantic-state-composition-graph-binding.v1",
    kind: "semantic-state-composition-graph-binding",
    definitionId: input.definitionId,
    graph: input.graph
  });
}

/**
 * Preflight is deliberately data-only. Family definitions and their apply
 * callbacks do not enter this boundary, so a rejected composition cannot
 * create an endpoint, evaluate a sample, or leak a partial chain.
 */
export function preflightKpSemanticStateComposition<
  const Composition extends KpValidatedSemanticStateComposition
>(input: {
  readonly composition: Composition;
  readonly base: KpAggregateSemanticSnapshot;
  readonly graphBindings:
    readonly KpSemanticStateCompositionGraphBinding[];
}): KpSemanticStateCompositionPreflight<Composition> {
  const diagnostics: KpSemanticStateCompositionPreflightDiagnostic[] = [];
  const report = (
    code: KpSemanticStateCompositionPreflightDiagnosticCode,
    path: readonly string[],
    memberIds: readonly KpAppliedTransformationId[],
    message: string
  ) => diagnostics.push(Object.freeze({
    schemaVersion:
      "kp.semantic-state-composition-preflight-diagnostic.v1" as const,
    kind: "semantic-state-composition-preflight-diagnostic" as const,
    code,
    path: Object.freeze([...path]),
    memberIds: Object.freeze([...memberIds]),
    message
  }));

  if (input.base.namespace !== input.composition.namespace) {
    report(
      "foreign-base-snapshot",
      [],
      [],
      `Composition ${JSON.stringify(input.composition.id)} cannot start from snapshot namespace ${JSON.stringify(input.base.namespace)}.`
    );
  }

  const graphBindings = new Map<
    KpTransformationDefinitionId,
    KpSemanticStateCompositionGraphBinding
  >();
  for (const binding of input.graphBindings) {
    if (graphBindings.has(binding.definitionId)) {
      report(
        "duplicate-graph-binding",
        [],
        [],
        `Family definition ${JSON.stringify(binding.definitionId)} has more than one composition graph binding.`
      );
      continue;
    }
    graphBindings.set(binding.definitionId, binding);
  }

  const members: KpSemanticStateCompositionPreflightMember[] = [];
  const memberIds = new Set<KpAppliedTransformationId>();
  let referenceGraphSignature: string | undefined;

  const visit = (
    node: KpSemanticStateCompositionNodeDeclaration,
    parentPath: readonly string[]
  ): void => {
    const path = [...parentPath, node.name];
    if (node.kind === "member") {
      visitMember(node, path);
    } else if (node.kind === "sequence") {
      for (const member of node.members) visit(member, path);
    } else if (node.kind === "group") {
      visit(node.body, path);
    } else {
      const cohortMembers: KpSemanticStateCompositionPreflightMember[] = [];
      for (const member of node.members) {
        const prepared = visitMember(member, [...path, member.name]);
        if (prepared !== undefined) cohortMembers.push(prepared);
      }
      diagnoseIndependentConflicts(path, cohortMembers, report);
    }
  };

  const visitMember = (
    member: KpSemanticStateCompositionMemberDeclaration,
    path: readonly string[]
  ): KpSemanticStateCompositionPreflightMember | undefined => {
    const transformationId = member.application.transformationId;
    if (memberIds.has(transformationId)) {
      report(
        "duplicate-composition-member",
        path,
        [transformationId],
        `Prepared family application ${JSON.stringify(transformationId)} appears more than once.`
      );
      return undefined;
    }
    memberIds.add(transformationId);

    const graphBinding = graphBindings.get(member.application.definitionId);
    if (graphBinding === undefined) {
      report(
        "unresolved-transition-hazard",
        path,
        [transformationId],
        `Prepared family application ${JSON.stringify(transformationId)} has no derived-graph authority.`
      );
      return undefined;
    }

    const graph = graphBinding.graph;
    const graphSignature = projectKpSemanticStateCompositionGraphSignature(
      graph
    );
    if (graph.namespace !== input.composition.namespace ||
      !doesGraphMatchSnapshot(graph, input.base)) {
      report(
        "incompatible-derived-graph",
        path,
        [transformationId],
        `Prepared family application ${JSON.stringify(transformationId)} has a derived graph incompatible with the composition base.`
      );
    }
    if (referenceGraphSignature === undefined) {
      referenceGraphSignature = graphSignature;
    } else if (referenceGraphSignature !== graphSignature) {
      report(
        "incompatible-derived-graph",
        path,
        [transformationId],
        `Prepared family application ${JSON.stringify(transformationId)} does not share the composition derived graph.`
      );
    }

    let footprint: KpSemanticStateTransitionFootprint;
    try {
      footprint = projectKpSemanticStateTransitionFootprint(
        member.application.transitionPlan
      );
    } catch (error) {
      const detail = error instanceof KpSemanticStateTransitionFootprintError
        ? `: ${error.message}`
        : ".";
      report(
        "unresolved-transition-hazard",
        path,
        [transformationId],
        `Prepared family application ${JSON.stringify(transformationId)} has an unresolved transition footprint${detail}`
      );
      return undefined;
    }

    const prepared = Object.freeze({
      schemaVersion:
        "kp.semantic-state-composition-preflight-member.v1" as const,
      kind: "semantic-state-composition-preflight-member" as const,
      path: Object.freeze([...path]),
      member,
      footprint,
      graph
    });
    members.push(prepared);
    return prepared;
  };

  visit(input.composition.declaration.root, []);
  if (diagnostics.length > 0) {
    throw new KpSemanticStateCompositionPreflightError(diagnostics);
  }
  if (referenceGraphSignature === undefined) {
    throw new KpSemanticStateCompositionPreflightError([Object.freeze({
      schemaVersion:
        "kp.semantic-state-composition-preflight-diagnostic.v1",
      kind: "semantic-state-composition-preflight-diagnostic",
      code: "unresolved-transition-hazard",
      path: Object.freeze([]),
      memberIds: Object.freeze([]),
      message: "A validated composition requires at least one resolved member."
    })]);
  }

  return Object.freeze({
    schemaVersion: "kp.semantic-state-composition-preflight.v1",
    kind: "semantic-state-composition-preflight",
    composition: input.composition,
    base: input.base,
    graphSignature: referenceGraphSignature,
    members: Object.freeze(members)
  });
}

type PreflightReporter = (
  code: KpSemanticStateCompositionPreflightDiagnosticCode,
  path: readonly string[],
  memberIds: readonly KpAppliedTransformationId[],
  message: string
) => void;

function diagnoseIndependentConflicts(
  path: readonly string[],
  members: readonly KpSemanticStateCompositionPreflightMember[],
  report: PreflightReporter
): void {
  const owners = new Map<string, KpSemanticStateCompositionPreflightMember>();
  for (const member of members) {
    for (const entry of [
      ...member.footprint.semanticWrites,
      ...member.footprint.discreteWrites
    ]) {
      const owner = owners.get(entry.target.slotId);
      if (owner === undefined) {
        owners.set(entry.target.slotId, member);
        continue;
      }
      report(
        "independent-write-conflict",
        path,
        [
          owner.member.application.transformationId,
          member.member.application.transformationId
        ],
        `Independent cohort ${JSON.stringify(path)} has multiple semantic owners for ${JSON.stringify(entry.target.encodedPath)}.`
      );
    }
  }
}

function doesGraphMatchSnapshot(
  graph: KpSemanticDerivedGraph,
  snapshot: KpAggregateSemanticSnapshot
): boolean {
  if (graph.namespace !== snapshot.namespace ||
    graph.input.definitions.length !== snapshot.derivedBindings.length) {
    return false;
  }
  const bindings = new Map(snapshot.derivedBindings.map(binding => [
    binding.derivationId,
    binding
  ]));
  return graph.input.definitions.every(({ definition }) => {
    const binding = bindings.get(definition.declaration.derivationId);
    return binding !== undefined && areKpSemanticDerivedBindingsEqual(
      definition.declaration,
      binding
    );
  });
}

export function projectKpSemanticStateCompositionGraphSignature(
  graph: KpSemanticDerivedGraph
): string {
  const definitions = graph.input.definitions.map(definition => ({
    id: definition.id,
    sourceId: definition.sourceId,
    targetSlotId: definition.target.slotId,
    dependencies: definition.dependencies.map(({ dependency }) =>
      dependency.slotId)
  })).sort((left, right) => left.id.localeCompare(right.id));
  return JSON.stringify({ namespace: graph.namespace, definitions });
}
