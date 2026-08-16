export interface KpExpressionProtocolNode {
  readonly id: string;
  readonly kind: string;
}

export type KpExpressionNodeHandlers<
  Node extends KpExpressionProtocolNode
> = Readonly<{
  [Kind in Node["kind"]]: Readonly<{
    children: (
      node: Extract<Node, { readonly kind: Kind }>
    ) => readonly Node[];
  }>;
}>;

export interface KpExpressionNodeProtocol<
  Node extends KpExpressionProtocolNode
> {
  readonly schemaVersion: "kp.expression-node-protocol.v1";
  readonly id: string;
  readonly kinds: readonly Node["kind"][];
  readonly children: (node: Node) => readonly Node[];
}

export type KpExpressionProjectionHandlers<
  Node extends KpExpressionProtocolNode,
  Result
> = Readonly<{
  [Kind in Node["kind"]]: Readonly<{
    project: (
      node: Extract<Node, { readonly kind: Kind }>,
      children: readonly Result[]
    ) => Result;
  }>;
}>;

export interface KpExpressionProjection<
  Node extends KpExpressionProtocolNode,
  Result
> {
  readonly schemaVersion: "kp.expression-projection.v1";
  readonly id: string;
  readonly protocolId: string;
  readonly project: (node: Node, children: readonly Result[]) => Result;
}

interface ErasedNodeHandler<Node extends KpExpressionProtocolNode> {
  readonly children: (node: Node) => readonly Node[];
}

interface ErasedProjectionHandler<
  Node extends KpExpressionProtocolNode,
  Result
> {
  readonly project: (node: Node, children: readonly Result[]) => Result;
}

export function defineKpExpressionNodeProtocol<
  Node extends KpExpressionProtocolNode
>(input: {
  readonly id: string;
  readonly kinds: readonly Node["kind"][];
  readonly handlers: KpExpressionNodeHandlers<Node>;
}): KpExpressionNodeProtocol<Node> {
  const kinds = Object.freeze([...input.kinds]);
  assertExactHandlerKinds(input.id, kinds, input.handlers);
  const handlers = Object.freeze({ ...input.handlers }) as unknown as Readonly<
    Record<Node["kind"], ErasedNodeHandler<Node>>
  >;

  return Object.freeze({
    schemaVersion: "kp.expression-node-protocol.v1" as const,
    id: input.id,
    kinds,
    children(node: Node): readonly Node[] {
      const handler = handlers[node.kind as Node["kind"]];
      if (handler === undefined) {
        throw new Error(`${input.id} does not handle node kind ${node.kind}.`);
      }
      return Object.freeze([...handler.children(node)]);
    }
  });
}

export function defineKpExpressionProjection<
  Node extends KpExpressionProtocolNode,
  Result
>(input: {
  readonly id: string;
  readonly protocol: KpExpressionNodeProtocol<Node>;
  readonly handlers: KpExpressionProjectionHandlers<Node, Result>;
}): KpExpressionProjection<Node, Result> {
  assertExactHandlerKinds(input.id, input.protocol.kinds, input.handlers);
  const handlers = Object.freeze({ ...input.handlers }) as unknown as Readonly<
    Record<Node["kind"], ErasedProjectionHandler<Node, Result>>
  >;

  return Object.freeze({
    schemaVersion: "kp.expression-projection.v1" as const,
    id: input.id,
    protocolId: input.protocol.id,
    project(node: Node, children: readonly Result[]): Result {
      const handler = handlers[node.kind as Node["kind"]];
      if (handler === undefined) {
        throw new Error(`${input.id} does not project node kind ${node.kind}.`);
      }
      return handler.project(node, children);
    }
  });
}

export function listKpExpressionNodes<Node extends KpExpressionProtocolNode>(
  root: Node,
  protocol: KpExpressionNodeProtocol<Node>
): readonly Node[] {
  const nodes: Node[] = [];
  const visit = (node: Node): void => {
    nodes.push(node);
    protocol.children(node).forEach(visit);
  };
  visit(root);
  return Object.freeze(nodes);
}

export function projectKpExpressionTree<
  Node extends KpExpressionProtocolNode,
  Result
>(
  root: Node,
  protocol: KpExpressionNodeProtocol<Node>,
  projection: KpExpressionProjection<Node, Result>
): Result {
  if (projection.protocolId !== protocol.id) {
    throw new Error(
      `${projection.id} targets ${projection.protocolId}, not ${protocol.id}.`
    );
  }
  return projection.project(
    root,
    protocol.children(root).map((child) =>
      projectKpExpressionTree(child, protocol, projection)
    )
  );
}

function assertExactHandlerKinds(
  ownerId: string,
  kinds: readonly string[],
  handlers: Readonly<Record<string, unknown>>
): void {
  if (new Set(kinds).size !== kinds.length) {
    throw new Error(`${ownerId} declares duplicate node kinds.`);
  }
  const actual = Object.keys(handlers);
  if (
    actual.length !== kinds.length ||
    actual.some((kind) => !kinds.includes(kind)) ||
    kinds.some((kind) => !actual.includes(kind))
  ) {
    throw new Error(`${ownerId} must handle every declared node kind exactly once.`);
  }
}
