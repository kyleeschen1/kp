import { encodeKpSemanticStatePathSegment } from
  "./authoring-schema-compiler.ts";
import type {
  KpAppliedTransformationId,
  KpSemanticCompositionBoundaryId,
  KpSemanticCompositionGroupId,
  KpSemanticCompositionMemberId,
  KpSemanticStateIdentityScope
} from "./identity.ts";
import type {
  KpSemanticStateCompositionGroupDeclaration,
  KpSemanticStateCompositionIndependenceEvidence,
  KpSemanticStateCompositionIndependentDeclaration,
  KpSemanticStateCompositionMemberDeclaration,
  KpSemanticStateCompositionNodeDeclaration,
  KpSemanticStateCompositionSequenceDeclaration
} from "./state-family-composition-declaration.ts";
import type {
  KpSemanticStateCompositionPreflight,
  KpSemanticStateCompositionPreflightMember
} from "./state-family-composition-preflight.ts";
import type {
  KpSemanticStateTransitionFootprint
} from "./state-family-transition-footprint.ts";

interface KpCompiledSemanticStateCompositionNodeBase {
  readonly schemaVersion: "kp.compiled-semantic-state-composition-node.v1";
  readonly path: readonly string[];
  readonly encodedPath: string;
  readonly sourceId: string;
}

export interface KpCompiledSemanticStateCompositionMember extends
  KpCompiledSemanticStateCompositionNodeBase {
  readonly kind: "member";
  readonly id: KpSemanticCompositionMemberId;
  readonly application: KpSemanticStateCompositionMemberDeclaration["application"];
  readonly footprint: KpSemanticStateTransitionFootprint;
}

export interface KpCompiledSemanticStateCompositionSequence extends
  KpCompiledSemanticStateCompositionNodeBase {
  readonly kind: "sequence";
  readonly id: KpSemanticCompositionGroupId;
  readonly members: readonly KpCompiledSemanticStateCompositionNode[];
}

export interface KpCompiledSemanticStateCompositionGroup extends
  KpCompiledSemanticStateCompositionNodeBase {
  readonly kind: "group";
  readonly id: KpSemanticCompositionGroupId;
  readonly body: KpCompiledSemanticStateCompositionNode;
}

export interface KpCompiledSemanticStateCompositionIndependent extends
  KpCompiledSemanticStateCompositionNodeBase {
  readonly kind: "independent";
  readonly id: KpSemanticCompositionGroupId;
  readonly evidence: KpSemanticStateCompositionIndependenceEvidence;
  readonly members: readonly KpCompiledSemanticStateCompositionMember[];
}

export type KpCompiledSemanticStateCompositionNode =
  | KpCompiledSemanticStateCompositionMember
  | KpCompiledSemanticStateCompositionSequence
  | KpCompiledSemanticStateCompositionGroup
  | KpCompiledSemanticStateCompositionIndependent;

export interface KpSemanticStateCompositionBoundarySpecification {
  readonly schemaVersion:
    "kp.semantic-state-composition-boundary-specification.v1";
  readonly kind: "before" | "after-member" | "after-independent";
  readonly id: KpSemanticCompositionBoundaryId;
  readonly stepIndex: number;
  readonly path: readonly string[];
  readonly sourceId: string;
  readonly memberIds: readonly KpSemanticCompositionMemberId[];
}

export interface KpCompiledSemanticStateCompositionStep {
  readonly schemaVersion: "kp.compiled-semantic-state-composition-step.v1";
  readonly kind: "member-step" | "independent-step";
  readonly stepIndex: number;
  readonly path: readonly string[];
  readonly sourceId: string;
  readonly members: readonly KpCompiledSemanticStateCompositionMember[];
  readonly beforeBoundaryId: KpSemanticCompositionBoundaryId;
  readonly afterBoundaryId: KpSemanticCompositionBoundaryId;
}

export interface KpCompiledSemanticStateComposition {
  readonly schemaVersion: "kp.compiled-semantic-state-composition.v1";
  readonly kind: "compiled-semantic-state-composition";
  readonly id: KpSemanticStateCompositionPreflight["composition"]["id"];
  readonly namespace: string;
  readonly sourceId: string;
  readonly graphSignature: string;
  readonly baseSnapshotId: KpSemanticStateCompositionPreflight["base"]["id"];
  readonly root: KpCompiledSemanticStateCompositionNode;
  readonly groups: readonly (
    | KpCompiledSemanticStateCompositionSequence
    | KpCompiledSemanticStateCompositionGroup
    | KpCompiledSemanticStateCompositionIndependent
  )[];
  readonly members: readonly KpCompiledSemanticStateCompositionMember[];
  readonly steps: readonly KpCompiledSemanticStateCompositionStep[];
  readonly boundaries:
    readonly KpSemanticStateCompositionBoundarySpecification[];
}

export type KpSemanticStateCompositionCompileErrorCode =
  | "foreign-composition-authority"
  | "missing-preflight-member";

export class KpSemanticStateCompositionCompileError extends Error {
  readonly code: KpSemanticStateCompositionCompileErrorCode;
  readonly path: readonly string[];

  constructor(input: {
    readonly code: KpSemanticStateCompositionCompileErrorCode;
    readonly path: readonly string[];
    readonly message: string;
  }) {
    super(input.message);
    this.name = "KpSemanticStateCompositionCompileError";
    this.code = input.code;
    this.path = Object.freeze([...input.path]);
  }
}

export function compileKpSemanticStateComposition(input: {
  readonly identities: KpSemanticStateIdentityScope;
  readonly preflight: KpSemanticStateCompositionPreflight;
}): KpCompiledSemanticStateComposition {
  const composition = input.preflight.composition;
  if (input.identities.namespace !== composition.namespace ||
    input.identities.composition(composition.declaration.localId) !==
      composition.id) {
    fail(
      "foreign-composition-authority",
      [],
      `Composition ${JSON.stringify(composition.id)} does not belong to the supplied identity scope.`
    );
  }

  const preflightMembers = new Map<KpAppliedTransformationId,
    KpSemanticStateCompositionPreflightMember>(
      input.preflight.members.map(member => [
        member.member.application.transformationId,
        member
      ])
    );
  const groups: (
    | KpCompiledSemanticStateCompositionSequence
    | KpCompiledSemanticStateCompositionGroup
    | KpCompiledSemanticStateCompositionIndependent
  )[] = [];
  const members: KpCompiledSemanticStateCompositionMember[] = [];

  const compileNode = (
    node: KpSemanticStateCompositionNodeDeclaration,
    parentPath: readonly string[]
  ): KpCompiledSemanticStateCompositionNode => {
    const path = Object.freeze([...parentPath, node.name]);
    const encodedPath = encodeScopePath(path);
    if (node.kind === "member") {
      const compiled = compileMember(node, path, encodedPath);
      members.push(compiled);
      return compiled;
    }
    if (node.kind === "sequence") {
      const compiled = compileSequence(node, path, encodedPath);
      groups.push(compiled);
      return compiled;
    }
    if (node.kind === "group") {
      const compiled = compileGroup(node, path, encodedPath);
      groups.push(compiled);
      return compiled;
    }
    const compiled = compileIndependent(node, path, encodedPath);
    groups.push(compiled);
    return compiled;
  };

  const compileMember = (
    node: KpSemanticStateCompositionMemberDeclaration,
    path: readonly string[],
    encodedPath: string
  ): KpCompiledSemanticStateCompositionMember => {
    const preflight = preflightMembers.get(node.application.transformationId);
    if (preflight === undefined) {
      fail(
        "missing-preflight-member",
        path,
        `Composition member ${JSON.stringify(node.application.transformationId)} was not closed by preflight.`
      );
    }
    return Object.freeze({
      schemaVersion: "kp.compiled-semantic-state-composition-node.v1",
      kind: "member",
      id: input.identities.compositionMember(composition.id, encodedPath),
      path,
      encodedPath,
      sourceId: node.sourceId,
      application: node.application,
      footprint: preflight.footprint
    });
  };

  const compileSequence = (
    node: KpSemanticStateCompositionSequenceDeclaration,
    path: readonly string[],
    encodedPath: string
  ): KpCompiledSemanticStateCompositionSequence => Object.freeze({
    schemaVersion: "kp.compiled-semantic-state-composition-node.v1",
    kind: "sequence",
    id: input.identities.compositionGroup(composition.id, encodedPath),
    path,
    encodedPath,
    sourceId: node.sourceId,
    // Sequence order is authored meaning and must never be canonicalized.
    members: Object.freeze(node.members.map(member => compileNode(member, path)))
  });

  const compileGroup = (
    node: KpSemanticStateCompositionGroupDeclaration,
    path: readonly string[],
    encodedPath: string
  ): KpCompiledSemanticStateCompositionGroup => Object.freeze({
    schemaVersion: "kp.compiled-semantic-state-composition-node.v1",
    kind: "group",
    id: input.identities.compositionGroup(composition.id, encodedPath),
    path,
    encodedPath,
    sourceId: node.sourceId,
    body: compileNode(node.body, path)
  });

  const compileIndependent = (
    node: KpSemanticStateCompositionIndependentDeclaration,
    path: readonly string[],
    encodedPath: string
  ): KpCompiledSemanticStateCompositionIndependent => {
    const compiledMembers = node.members
      .map(member => compileMember(
        member,
        Object.freeze([...path, member.name]),
        encodeScopePath([...path, member.name])
      ))
      .sort((left, right) => left.id.localeCompare(right.id));
    // Independence removes authored iteration order, so stable scoped identity
    // supplies the only legal internal endpoint order.
    members.push(...compiledMembers);
    return Object.freeze({
      schemaVersion: "kp.compiled-semantic-state-composition-node.v1",
      kind: "independent",
      id: input.identities.compositionGroup(composition.id, encodedPath),
      path,
      encodedPath,
      sourceId: node.sourceId,
      evidence: node.evidence,
      members: Object.freeze(compiledMembers)
    });
  };

  const root = compileNode(composition.declaration.root, []);
  const executable = flattenExecutableSteps(root);
  const boundaries: KpSemanticStateCompositionBoundarySpecification[] = [];
  const before = createBoundary({
    kind: "before",
    localId: "before",
    stepIndex: 0,
    path: [],
    sourceId: composition.declaration.sourceId,
    memberIds: []
  });
  boundaries.push(before);
  const steps: KpCompiledSemanticStateCompositionStep[] = [];
  executable.forEach((node, stepIndex) => {
    const stepMembers = node.kind === "member"
      ? Object.freeze([node])
      : node.members;
    const after = createBoundary({
      kind: node.kind === "member" ? "after-member" : "after-independent",
      localId: `after.${node.encodedPath}`,
      stepIndex: stepIndex + 1,
      path: node.path,
      sourceId: node.sourceId,
      memberIds: stepMembers.map(({ id }) => id)
    });
    steps.push(Object.freeze({
      schemaVersion: "kp.compiled-semantic-state-composition-step.v1",
      kind: node.kind === "member" ? "member-step" : "independent-step",
      stepIndex,
      path: node.path,
      sourceId: node.sourceId,
      members: stepMembers,
      beforeBoundaryId: boundaries[stepIndex]!.id,
      afterBoundaryId: after.id
    }));
    boundaries.push(after);
  });

  return Object.freeze({
    schemaVersion: "kp.compiled-semantic-state-composition.v1",
    kind: "compiled-semantic-state-composition",
    id: composition.id,
    namespace: composition.namespace,
    sourceId: composition.declaration.sourceId,
    graphSignature: input.preflight.graphSignature,
    baseSnapshotId: input.preflight.base.id,
    root,
    groups: Object.freeze(groups.sort((left, right) =>
      left.id.localeCompare(right.id))),
    members: Object.freeze(members.sort((left, right) =>
      left.id.localeCompare(right.id))),
    steps: Object.freeze(steps),
    boundaries: Object.freeze(boundaries)
  });

  function createBoundary(boundary: {
    readonly kind: KpSemanticStateCompositionBoundarySpecification["kind"];
    readonly localId: string;
    readonly stepIndex: number;
    readonly path: readonly string[];
    readonly sourceId: string;
    readonly memberIds: readonly KpSemanticCompositionMemberId[];
  }): KpSemanticStateCompositionBoundarySpecification {
    return Object.freeze({
      schemaVersion:
        "kp.semantic-state-composition-boundary-specification.v1",
      kind: boundary.kind,
      id: input.identities.compositionBoundary(
        composition.id,
        boundary.localId
      ),
      stepIndex: boundary.stepIndex,
      path: Object.freeze([...boundary.path]),
      sourceId: boundary.sourceId,
      memberIds: Object.freeze([...boundary.memberIds])
    });
  }
}

function flattenExecutableSteps(
  node: KpCompiledSemanticStateCompositionNode
): readonly (
  | KpCompiledSemanticStateCompositionMember
  | KpCompiledSemanticStateCompositionIndependent
)[] {
  if (node.kind === "member" || node.kind === "independent") return [node];
  if (node.kind === "group") return flattenExecutableSteps(node.body);
  return node.members.flatMap(flattenExecutableSteps);
}

function encodeScopePath(path: readonly string[]): string {
  return path.map(encodeKpSemanticStatePathSegment).join(".");
}

function fail(
  code: KpSemanticStateCompositionCompileErrorCode,
  path: readonly string[],
  message: string
): never {
  throw new KpSemanticStateCompositionCompileError({ code, path, message });
}
