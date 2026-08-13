import {
  assertKpCodeSourceTokenStream,
  type KpCodeSourceToken
} from "./code-source-token-protocol.ts";

export interface KpCodeProjectionSourceRange {
  readonly startOffset: number;
  readonly endOffset: number;
}

export interface KpCodeProjectionEntity {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly sourceRange: KpCodeProjectionSourceRange;
}

export interface KpCodeSourceFragment<
  Entity extends KpCodeProjectionEntity = KpCodeProjectionEntity,
  Token extends KpCodeSourceToken = KpCodeSourceToken
> {
  readonly sourceText: string;
  readonly entities: readonly Entity[];
  readonly tokens: readonly Token[];
}

export interface KpCompleteCodeSourceProjection<
  ProjectionId extends string = string,
  Entity extends KpCodeProjectionEntity = KpCodeProjectionEntity,
  Token extends KpCodeSourceToken = KpCodeSourceToken,
  RootEntityId extends string = string
> {
  readonly id: ProjectionId;
  readonly sourceText: string;
  readonly rootEntityId?: RootEntityId;
  readonly entities: readonly Entity[];
  readonly tokens: readonly Token[];
}

/**
 * Callers choose semantic fragments and whitespace; this seam only composes
 * complete source and rebases already-authoritative ranges.
 */
export function composeKpCompleteCodeSourceProjection<
  ProjectionId extends string,
  Entity extends KpCodeProjectionEntity,
  Token extends KpCodeSourceToken,
  RootEntityId extends string = string
>(input: {
  readonly id: ProjectionId;
  readonly fragments: readonly KpCodeSourceFragment<Entity, Token>[];
  readonly separator: string;
  readonly rootEntityId?: RootEntityId;
  readonly tokenId?: ((token: Token) => string) | undefined;
}): KpCompleteCodeSourceProjection<ProjectionId, Entity, Token, RootEntityId> {
  if (input.fragments.length === 0) {
    throw new Error(`Code source projection ${input.id} requires at least one fragment.`);
  }

  let sourceText = "";
  const entities: Entity[] = [];
  const tokens: Token[] = [];
  for (const fragment of input.fragments) {
    assertFragment(fragment);
    if (sourceText !== "") sourceText += input.separator;
    const offset = sourceText.length;
    sourceText += fragment.sourceText;
    entities.push(...fragment.entities.map((entity) => rebaseEntity(entity, offset)));
    tokens.push(...fragment.tokens.map((token) => rebaseToken(token, offset)));
  }

  assertUnique(entities.map(({ id }) => id), `projection ${input.id} entity`);
  if (input.tokenId !== undefined) {
    assertUnique(tokens.map(input.tokenId), `projection ${input.id} token`);
  }
  assertKpCodeSourceTokenStream(sourceText, tokens);

  return Object.freeze({
    id: input.id,
    sourceText,
    ...(input.rootEntityId === undefined ? {} : { rootEntityId: input.rootEntityId }),
    entities: Object.freeze(entities),
    tokens: Object.freeze(tokens)
  });
}

function assertFragment<
  Entity extends KpCodeProjectionEntity,
  Token extends KpCodeSourceToken
>(fragment: KpCodeSourceFragment<Entity, Token>): void {
  assertKpCodeSourceTokenStream(fragment.sourceText, fragment.tokens);
  for (const entity of fragment.entities) {
    if (
      entity.sourceRange.startOffset < 0 ||
      entity.sourceRange.endOffset <= entity.sourceRange.startOffset ||
      entity.sourceRange.endOffset > fragment.sourceText.length
    ) {
      throw new Error(`Code projection entity ${entity.id} has an invalid fragment range.`);
    }
  }
  assertUnique(fragment.entities.map(({ id }) => id), "fragment entity");
}

function rebaseEntity<Entity extends KpCodeProjectionEntity>(
  entity: Entity,
  offset: number
): Entity {
  return Object.freeze({
    ...entity,
    sourceRange: Object.freeze({
      startOffset: entity.sourceRange.startOffset + offset,
      endOffset: entity.sourceRange.endOffset + offset
    })
  }) as Entity;
}

function rebaseToken<Token extends KpCodeSourceToken>(
  token: Token,
  offset: number
): Token {
  return Object.freeze({
    ...token,
    startOffset: token.startOffset + offset,
    endOffset: token.endOffset + offset
  }) as Token;
}

function assertUnique(ids: readonly string[], label: string): void {
  if (new Set(ids).size !== ids.length) {
    throw new Error(`Code source ${label} ids must be unique.`);
  }
}
