import type {
  KpPythonRefactorSemanticArtifactV1,
  KpPythonSemanticEntity
} from "../semantic/python-refactor-semantic-model.ts";
import {
  createKpPythonRefactorSourceProjections,
  type KpPythonProjectedEntity,
  type KpPythonRefactorSourceProjection,
  type KpPythonRefactorSourceProjectionId
} from "../semantic/python-refactor-source-projections.ts";
import type { KpPythonSourceToken } from "../semantic/python-source-tokens.ts";
import {
  encodeKpHtmlAttribute as encodeKpEditorHtmlAttribute,
  encodeKpHtmlText as encodeKpEditorHtmlText
} from "./html-output-encoding.ts";

export interface KpPythonRefactorCodeHtmlInput {
  readonly semantics: KpPythonRefactorSemanticArtifactV1;
  readonly stageId: string;
  readonly narration: string;
  readonly activeProjectionId: KpPythonRefactorSourceProjectionId;
  readonly focusSelectorIds: readonly string[];
  readonly accessibleDescription: string;
}

export function renderKpPythonRefactorCodeHtml(
  input: KpPythonRefactorCodeHtmlInput
): string {
  const projections = createKpPythonRefactorSourceProjections(input.semantics);
  return `<section class="kp-python-refactor" data-kp-python-refactor-stage="${encodeKpEditorHtmlAttribute(input.stageId)}" data-kp-python-active-projection="${input.activeProjectionId}" aria-label="${encodeKpEditorHtmlAttribute(input.accessibleDescription)}">
    <header class="kp-python-refactor__file"><span>shipping.py</span><span>Python</span></header>
    <div class="kp-python-refactor__source" data-kp-python-source-owner>
      ${projections.map((projection) => renderProjection({
        projection,
        current: projection.id === input.activeProjectionId,
        focusSelectorIds: input.focusSelectorIds
      })).join("")}
      <div class="kp-python-refactor__token-theater" data-kp-python-token-theater aria-hidden="true"></div>
    </div>
    <p class="kp-python-refactor__narration" data-kp-python-narration>${encodeKpEditorHtmlText(input.narration)}</p>
    <p class="editor-animation-player__visually-hidden" data-kp-python-accessible-state aria-live="polite">${encodeKpEditorHtmlText(input.accessibleDescription)}</p>
  </section>`;
}

export function renderKpPythonRevisionCodeHtml(
  revision: KpPythonRefactorSemanticArtifactV1["revisions"][number],
  focusSelectorIds: readonly string[] = []
): string {
  const program = revision.entities.find(({ kind }) => kind === "source-file");
  if (program === undefined) {
    throw new Error(`Python revision ${revision.revision} has no source-file entity.`);
  }
  const tree = entityTree(revision.entities.filter(({ kind }) => kind !== "source-file"));
  const code = renderRange(
    revision.sourceText,
    0,
    revision.sourceText.length,
    tree,
    revision.tokens,
    new Set(focusSelectorIds)
  );
  return `<pre class="kp-python-refactor__revision" data-kp-python-revision="${revision.revision}" data-kp-python-revision-current="true"><code data-kp-semantic-entity-id="${encodeKpEditorHtmlAttribute(program.id)}" data-kp-python-selector-id="${encodeKpEditorHtmlAttribute(selectorId(program.id))}" data-kp-python-entity-kind="source-file">${code}</code></pre>`;
}

interface EntityTreeNode {
  readonly entity: KpPythonSemanticEntity | KpPythonProjectedEntity;
  readonly children: EntityTreeNode[];
}

function renderProjection(input: {
  readonly projection: KpPythonRefactorSourceProjection;
  readonly current: boolean;
  readonly focusSelectorIds: readonly string[];
}): string {
  const tree = entityTree(input.projection.entities);
  const code = renderRange(
    input.projection.sourceText,
    0,
    input.projection.sourceText.length,
    tree,
    input.projection.tokens,
    new Set(input.focusSelectorIds)
  );
  const rootAttributes = input.projection.rootEntityId === undefined
    ? `data-kp-python-source-projection-id="${encodeKpEditorHtmlAttribute(input.projection.id)}"`
    : `data-kp-semantic-entity-id="${encodeKpEditorHtmlAttribute(input.projection.rootEntityId)}" data-kp-python-selector-id="${encodeKpEditorHtmlAttribute(selectorId(input.projection.rootEntityId))}" data-kp-python-entity-kind="source-file"`;
  return `<pre class="kp-python-refactor__revision" data-kp-python-projection-id="${encodeKpEditorHtmlAttribute(input.projection.id)}" data-kp-python-projection-current="${input.current}" data-kp-python-projection-visible="${input.current}" style="--kp-python-revision-opacity:${input.current ? 1 : 0};--kp-python-revision-scale:1"${input.current ? "" : " aria-hidden=\"true\" inert"}><code ${rootAttributes}>${code}</code></pre>`;
}

function entityTree(
  entities: readonly (KpPythonSemanticEntity | KpPythonProjectedEntity)[]
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
  tokens: readonly KpPythonSourceToken[],
  focusSelectorIds: ReadonlySet<string>
): string {
  let cursor = start;
  let html = "";
  for (const node of nodes) {
    const range = node.entity.sourceRange;
    html += renderSyntaxRange(source, cursor, range.startOffset, tokens);
    const selector = selectorId(node.entity.id);
    const focused = focusSelectorIds.has(selector);
    html += `<span data-kp-semantic-entity-id="${encodeKpEditorHtmlAttribute(node.entity.id)}" data-kp-python-selector-id="${encodeKpEditorHtmlAttribute(selector)}" data-kp-python-entity-kind="${node.entity.kind}" data-kp-python-focus="${focused}">${renderRange(source, range.startOffset, range.endOffset, node.children, tokens, focusSelectorIds)}</span>`;
    cursor = range.endOffset;
  }
  html += renderSyntaxRange(source, cursor, end, tokens);
  return html;
}

function renderSyntaxRange(
  source: string,
  start: number,
  end: number,
  tokens: readonly KpPythonSourceToken[]
): string {
  let cursor = start;
  let html = "";
  for (const token of tokens) {
    if (token.startOffset < start || token.endOffset > end) continue;
    html += encodeKpEditorHtmlText(source.slice(cursor, token.startOffset));
    html += `<span data-kp-python-syntax-kind="${token.kind}">${encodeKpEditorHtmlText(token.text)}</span>`;
    cursor = token.endOffset;
  }
  return html + encodeKpEditorHtmlText(source.slice(cursor, end));
}

function assertNonCrossing(nodes: readonly EntityTreeNode[]): void {
  let priorEnd = -1;
  for (const node of nodes) {
    if (node.entity.sourceRange.startOffset < priorEnd) {
      throw new Error(`Python semantic entity ${node.entity.id} crosses a sibling source range.`);
    }
    priorEnd = node.entity.sourceRange.endOffset;
    assertNonCrossing(node.children);
  }
}

function contains(
  parent: KpPythonSemanticEntity | KpPythonProjectedEntity,
  child: KpPythonSemanticEntity | KpPythonProjectedEntity
): boolean {
  return parent.sourceRange.startOffset <= child.sourceRange.startOffset &&
    parent.sourceRange.endOffset >= child.sourceRange.endOffset;
}

function selectorId(entityId: string): string {
  return `selector.python.${entityId}`;
}
