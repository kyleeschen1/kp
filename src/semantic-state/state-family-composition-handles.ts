import type {
  KpAppliedTransformationId,
  KpSemanticCompositionBoundaryId,
  KpSemanticCompositionGroupId,
  KpSemanticCompositionId,
  KpSemanticCompositionMemberId,
  KpTransformationDefinitionId
} from "./identity.ts";
import type {
  KpCompiledSemanticStateComposition,
  KpCompiledSemanticStateCompositionNode,
  KpSemanticStateCompositionBoundarySpecification
} from "./state-family-composition-compiler.ts";
import type {
  KpSemanticStateCompositionGroupDeclaration,
  KpSemanticStateCompositionIndependentDeclaration,
  KpSemanticStateCompositionMemberDeclaration,
  KpSemanticStateCompositionNodeDeclaration,
  KpSemanticStateCompositionSequenceDeclaration
} from "./state-family-composition-declaration.ts";

declare const kpCompositionMemberHandleParameters: unique symbol;

type AppendPath<
  Path extends readonly string[],
  Name extends string
> = readonly [...Path, Name];

export interface KpSemanticStateCompositionMemberHandle<
  Parameters = unknown,
  Name extends string = string,
  Path extends readonly string[] = readonly string[]
> {
  readonly schemaVersion:
    "kp.semantic-state-composition-member-handle.v1";
  readonly kind: "semantic-state-composition-member-handle";
  readonly name: Name;
  readonly path: Path;
  readonly encodedPath: string;
  readonly sourceId: string;
  readonly id: KpSemanticCompositionMemberId;
  readonly definitionId: KpTransformationDefinitionId;
  readonly transformationId: KpAppliedTransformationId;
  readonly applicationId: string;
  readonly [kpCompositionMemberHandleParameters]?: Parameters;
}

export interface KpSemanticStateCompositionGroupHandle<
  NodeKind extends "group" | "independent" | "sequence" =
    "group" | "independent" | "sequence",
  Name extends string = string,
  Path extends readonly string[] = readonly string[],
  Children extends Readonly<Record<string, unknown>> =
    Readonly<Record<string, unknown>>
> {
  readonly schemaVersion: "kp.semantic-state-composition-group-handle.v1";
  readonly kind: "semantic-state-composition-group-handle";
  readonly nodeKind: NodeKind;
  readonly name: Name;
  readonly path: Path;
  readonly encodedPath: string;
  readonly sourceId: string;
  readonly id: KpSemanticCompositionGroupId;
  readonly children: Children;
}

type ChildHandleMap<
  Nodes extends readonly KpSemanticStateCompositionNodeDeclaration[],
  ParentPath extends readonly string[]
> = {
  readonly [Node in Nodes[number] as Node["name"]]:
    KpSemanticStateCompositionNodeHandle<Node, ParentPath>
};

type KpSemanticStateCompositionNodeHandle<
  Node extends KpSemanticStateCompositionNodeDeclaration,
  ParentPath extends readonly string[]
> = Node extends KpSemanticStateCompositionMemberDeclaration<
  infer Parameters,
  infer Name
> ? KpSemanticStateCompositionMemberHandle<
    Parameters,
    Name,
    AppendPath<ParentPath, Name>
  >
  : Node extends KpSemanticStateCompositionSequenceDeclaration<
      infer Members,
      infer Name
    > ? KpSemanticStateCompositionGroupHandle<
      "sequence",
      Name,
      AppendPath<ParentPath, Name>,
      ChildHandleMap<Members, AppendPath<ParentPath, Name>>
    >
    : Node extends KpSemanticStateCompositionGroupDeclaration<
        infer Body,
        infer Name
      > ? KpSemanticStateCompositionGroupHandle<
        "group",
        Name,
        AppendPath<ParentPath, Name>,
        ChildHandleMap<readonly [Body], AppendPath<ParentPath, Name>>
      >
      : Node extends KpSemanticStateCompositionIndependentDeclaration<
          infer Members,
          infer Name
        > ? KpSemanticStateCompositionGroupHandle<
          "independent",
          Name,
          AppendPath<ParentPath, Name>,
          ChildHandleMap<Members, AppendPath<ParentPath, Name>>
        >
        : never;

export type KpSemanticStateCompositionHandleRoot<
  Root extends KpSemanticStateCompositionNodeDeclaration
> = KpSemanticStateCompositionNodeHandle<Root, readonly []>;

export type KpSemanticStateCompositionMemberHandleParameters<Handle> =
  Handle extends KpSemanticStateCompositionMemberHandle<
    infer Parameters,
    string,
    readonly string[]
  > ? Parameters : never;

export interface KpSemanticStateCompositionBoundaryHandle {
  readonly schemaVersion:
    "kp.semantic-state-composition-boundary-handle.v1";
  readonly kind: "semantic-state-composition-boundary-handle";
  readonly boundaryKind:
    KpSemanticStateCompositionBoundarySpecification["kind"];
  readonly id: KpSemanticCompositionBoundaryId;
  readonly stepIndex: number;
  readonly path: readonly string[];
  readonly sourceId: string;
  readonly memberIds: readonly KpSemanticCompositionMemberId[];
}

export interface KpSemanticStateCompositionHandle {
  readonly schemaVersion: "kp.semantic-state-composition-handle.v1";
  readonly kind: "semantic-state-composition-handle";
  readonly id: KpSemanticCompositionId;
  readonly namespace: string;
  readonly sourceId: string;
  readonly before: KpSemanticStateCompositionBoundaryHandle;
  readonly after: KpSemanticStateCompositionBoundaryHandle;
}

export interface KpSemanticStateCompositionHandleSet<
  Root extends KpSemanticStateCompositionNodeDeclaration =
    KpSemanticStateCompositionNodeDeclaration
> {
  readonly schemaVersion: "kp.semantic-state-composition-handle-set.v1";
  readonly kind: "semantic-state-composition-handle-set";
  readonly composition: KpSemanticStateCompositionHandle;
  readonly root: KpSemanticStateCompositionHandleRoot<Root>;
  readonly boundaries: readonly KpSemanticStateCompositionBoundaryHandle[];
  readonly groups: readonly KpSemanticStateCompositionGroupHandle[];
  readonly members: readonly KpSemanticStateCompositionMemberHandle[];
}

export function createKpSemanticStateCompositionHandleSet<
  const Root extends KpSemanticStateCompositionNodeDeclaration
>(
  compiled: KpCompiledSemanticStateComposition<Root>
): KpSemanticStateCompositionHandleSet<Root> {
  const groups: KpSemanticStateCompositionGroupHandle[] = [];
  const members: KpSemanticStateCompositionMemberHandle[] = [];
  const root = createNodeHandle(compiled.root, groups, members) as
    KpSemanticStateCompositionHandleRoot<Root>;
  const boundaries = Object.freeze(compiled.boundaries.map(boundary =>
    Object.freeze({
      schemaVersion:
        "kp.semantic-state-composition-boundary-handle.v1" as const,
      kind: "semantic-state-composition-boundary-handle" as const,
      boundaryKind: boundary.kind,
      id: boundary.id,
      stepIndex: boundary.stepIndex,
      path: boundary.path,
      sourceId: boundary.sourceId,
      memberIds: boundary.memberIds
    })));
  const before = boundaries[0];
  const after = boundaries.at(-1);
  if (before === undefined || after === undefined) {
    throw new Error(
      `Compiled composition ${JSON.stringify(compiled.id)} has no settled boundaries.`
    );
  }
  const composition = Object.freeze({
    schemaVersion: "kp.semantic-state-composition-handle.v1" as const,
    kind: "semantic-state-composition-handle" as const,
    id: compiled.id,
    namespace: compiled.namespace,
    sourceId: compiled.sourceId,
    before,
    after
  });
  return Object.freeze({
    schemaVersion: "kp.semantic-state-composition-handle-set.v1",
    kind: "semantic-state-composition-handle-set",
    composition,
    root,
    boundaries,
    groups: Object.freeze(groups),
    members: Object.freeze(members)
  });
}

function createNodeHandle(
  node: KpCompiledSemanticStateCompositionNode,
  groups: KpSemanticStateCompositionGroupHandle[],
  members: KpSemanticStateCompositionMemberHandle[]
): KpSemanticStateCompositionGroupHandle |
  KpSemanticStateCompositionMemberHandle {
  const name = node.path.at(-1);
  if (name === undefined) {
    throw new Error("A compiled composition node requires a scoped name.");
  }
  if (node.kind === "member") {
    const handle = Object.freeze({
      schemaVersion:
        "kp.semantic-state-composition-member-handle.v1" as const,
      kind: "semantic-state-composition-member-handle" as const,
      name,
      path: node.path,
      encodedPath: node.encodedPath,
      sourceId: node.sourceId,
      id: node.id,
      definitionId: node.application.definitionId,
      transformationId: node.application.transformationId,
      applicationId: node.application.applicationId
    });
    members.push(handle);
    return handle;
  }
  const childNodes = node.kind === "group" ? [node.body] : node.members;
  const children: Record<string, unknown> = Object.create(null);
  for (const child of childNodes) {
    const childName = child.path.at(-1);
    if (childName === undefined || children[childName] !== undefined) {
      throw new Error(
        `Compiled composition group ${JSON.stringify(node.id)} has invalid child handle metadata.`
      );
    }
    children[childName] = createNodeHandle(child, groups, members);
  }
  const handle = Object.freeze({
    schemaVersion: "kp.semantic-state-composition-group-handle.v1" as const,
    kind: "semantic-state-composition-group-handle" as const,
    nodeKind: node.kind,
    name,
    path: node.path,
    encodedPath: node.encodedPath,
    sourceId: node.sourceId,
    id: node.id,
    children: Object.freeze(children)
  });
  groups.push(handle);
  return handle;
}
