import type {
  KpTypeScriptRefactorSemanticArtifactV1,
  KpTypeScriptSemanticEntity
} from "../semantic/typescript-refactor-semantic-model.ts";
import {
  createKpTypeScriptRefactorSourceProjections,
  type KpTypeScriptProjectedEntity,
  type KpTypeScriptRefactorSourceProjection,
  type KpTypeScriptRefactorSourceProjectionId
} from "../semantic/typescript-refactor-source-projections.ts";
import { tokenizeKpTypeScriptSource } from
  "../semantic/typescript-source-tokens.ts";

export interface KpTypeScriptRefactorCodeHtmlInput {
  readonly semantics: KpTypeScriptRefactorSemanticArtifactV1;
  readonly stageId: string;
  readonly narration: string;
  readonly activeProjectionId: KpTypeScriptRefactorSourceProjectionId;
  readonly focusSelectorIds: readonly string[];
  readonly accessibleDescription: string;
}

export function renderKpTypeScriptRefactorCodeHtml(
  input: KpTypeScriptRefactorCodeHtmlInput
): string {
  const projections = createKpTypeScriptRefactorSourceProjections(input.semantics);
  return `<section class="kp-typescript-refactor" data-kp-typescript-refactor-stage="${escapeAttribute(input.stageId)}" data-kp-typescript-active-projection="${input.activeProjectionId}" aria-label="${escapeAttribute(input.accessibleDescription)}">
    <header class="kp-typescript-refactor__file"><span>free-shipping.ts</span><span>TypeScript</span></header>
    <div class="kp-typescript-refactor__source" data-kp-typescript-source-owner>
      ${projections.map((projection) => renderProjection({
        projection,
        current: projection.id === input.activeProjectionId,
        focusSelectorIds: input.focusSelectorIds
      })).join("")}
      <div class="kp-typescript-refactor__token-theater" data-kp-typescript-token-theater aria-hidden="true"></div>
    </div>
    <p class="kp-typescript-refactor__narration" data-kp-typescript-narration>${escapeHtml(input.narration)}</p>
    <p class="editor-animation-player__visually-hidden" data-kp-typescript-accessible-state aria-live="polite">${escapeHtml(input.accessibleDescription)}</p>
  </section>`;
}

export function renderKpTypeScriptRevisionCodeHtml(
  revision: KpTypeScriptRefactorSemanticArtifactV1["revisions"][number],
  focusSelectorIds: readonly string[] = []
): string {
  return renderRevision({ revision, current: true, focusSelectorIds });
}

function renderRevision(input: {
  readonly revision: KpTypeScriptRefactorSemanticArtifactV1["revisions"][number];
  readonly current: boolean;
  readonly focusSelectorIds: readonly string[];
}): string {
  const program = input.revision.entities.find(({ kind }) => kind === "source-file");
  if (program === undefined) {
    throw new Error(`TypeScript revision ${input.revision.revision} has no source-file entity.`);
  }
  const tree = entityTree(input.revision.entities.filter(({ kind }) => kind !== "source-file"));
  const code = renderRange(
    input.revision.sourceText,
    0,
    input.revision.sourceText.length,
    tree,
    new Set(input.focusSelectorIds)
  );
  return `<pre class="kp-typescript-refactor__revision" data-kp-typescript-revision="${input.revision.revision}" data-kp-typescript-revision-current="${input.current}"${input.current ? "" : " aria-hidden=\"true\" inert"}><code data-kp-semantic-entity-id="${escapeAttribute(program.id)}" data-kp-typescript-selector-id="${escapeAttribute(selectorId(program.id))}" data-kp-typescript-entity-kind="source-file">${code}</code></pre>`;
}

interface EntityTreeNode {
  readonly entity: KpTypeScriptSemanticEntity | KpTypeScriptProjectedEntity;
  readonly children: EntityTreeNode[];
}

function renderProjection(input: {
  readonly projection: KpTypeScriptRefactorSourceProjection;
  readonly current: boolean;
  readonly focusSelectorIds: readonly string[];
}): string {
  const tree = entityTree(input.projection.entities);
  const code = renderRange(
    input.projection.sourceText,
    0,
    input.projection.sourceText.length,
    tree,
    new Set(input.focusSelectorIds)
  );
  const rootAttributes = input.projection.rootEntityId === undefined
    ? `data-kp-typescript-source-projection-id="${escapeAttribute(input.projection.id)}"`
    : `data-kp-semantic-entity-id="${escapeAttribute(input.projection.rootEntityId)}" data-kp-typescript-selector-id="${escapeAttribute(selectorId(input.projection.rootEntityId))}" data-kp-typescript-entity-kind="source-file"`;
  return `<pre class="kp-typescript-refactor__revision" data-kp-typescript-projection-id="${escapeAttribute(input.projection.id)}" data-kp-typescript-projection-current="${input.current}" data-kp-typescript-projection-visible="${input.current}" style="--kp-typescript-revision-opacity:${input.current ? 1 : 0};--kp-typescript-revision-scale:1"${input.current ? "" : " aria-hidden=\"true\" inert"}><code ${rootAttributes}>${code}</code></pre>`;
}

function entityTree(
  entities: readonly (KpTypeScriptSemanticEntity | KpTypeScriptProjectedEntity)[]
): readonly EntityTreeNode[] {
  const sorted = [...entities].sort((left, right) =>
    left.sourceRange.startOffset - right.sourceRange.startOffset ||
    right.sourceRange.endOffset - left.sourceRange.endOffset
  );
  const roots: EntityTreeNode[] = [];
  const stack: EntityTreeNode[] = [];
  for (const entity of sorted) {
    while (stack.length > 0 && !contains(stack.at(-1)!.entity, entity)) stack.pop();
    const node = { entity, children: [] } satisfies EntityTreeNode;
    const parent = stack.at(-1);
    if (parent === undefined) roots.push(node);
    else parent.children.push(node);
    stack.push(node);
  }
  assertNonCrossing(roots);
  return roots;
}

function renderRange(
  source: string,
  start: number,
  end: number,
  nodes: readonly EntityTreeNode[],
  focusSelectorIds: ReadonlySet<string>
): string {
  let cursor = start;
  let html = "";
  for (const node of nodes) {
    const range = node.entity.sourceRange;
    html += renderSyntaxRange(source, cursor, range.startOffset);
    const selector = selectorId(node.entity.id);
    const focused = focusSelectorIds.has(selector);
    html += `<span data-kp-semantic-entity-id="${escapeAttribute(node.entity.id)}" data-kp-typescript-selector-id="${escapeAttribute(selector)}" data-kp-typescript-entity-kind="${node.entity.kind}" data-kp-typescript-focus="${focused}">${renderRange(source, range.startOffset, range.endOffset, node.children, focusSelectorIds)}</span>`;
    cursor = range.endOffset;
  }
  html += renderSyntaxRange(source, cursor, end);
  return html;
}

function renderSyntaxRange(source: string, start: number, end: number): string {
  const value = source.slice(start, end);
  let cursor = 0;
  let html = "";
  for (const token of tokenizeKpTypeScriptSource(value)) {
    html += escapeHtml(value.slice(cursor, token.startOffset));
    html += `<span data-kp-typescript-syntax-kind="${token.kind}">${escapeHtml(token.text)}</span>`;
    cursor = token.endOffset;
  }
  return html + escapeHtml(value.slice(cursor));
}

function assertNonCrossing(nodes: readonly EntityTreeNode[]): void {
  let priorEnd = -1;
  for (const node of nodes) {
    if (node.entity.sourceRange.startOffset < priorEnd) {
      throw new Error(`TypeScript semantic entity ${node.entity.id} crosses a sibling source range.`);
    }
    priorEnd = node.entity.sourceRange.endOffset;
    assertNonCrossing(node.children);
  }
}

function contains(
  parent: KpTypeScriptSemanticEntity | KpTypeScriptProjectedEntity,
  child: KpTypeScriptSemanticEntity | KpTypeScriptProjectedEntity
): boolean {
  return parent.sourceRange.startOffset <= child.sourceRange.startOffset &&
    parent.sourceRange.endOffset >= child.sourceRange.endOffset;
}

function selectorId(entityId: string): string {
  return `selector.typescript.${entityId}`;
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
