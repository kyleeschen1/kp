import {
  compileKpArticleDocument,
  type KpArticleBlock,
  type KpCompiledArticleDocument
} from "../article/kp-article-document.ts";
import type { KpArticleImportLock } from
  "../article/kp-article-import-lock.ts";
import { createKpArticleSource } from "../article/kp-article-source.ts";
import { compileKpArticleMarkdownFragmentHtml } from
  "../article/kp-article-static-html.ts";
import { kpTypeScriptFreeShippingVignetteRegistry } from
  "../article/vignettes/typescript-free-shipping-vignette.ts";
import { renderKpTypeScriptRefactorCodeHtml } from
  "../rendering/typescript-refactor-code-html.ts";
import { createKpTypeScriptFreeShippingAnimationAsset } from
  "../semantic/typescript-free-shipping-animation-asset.ts";
import {
  escapeKpTutorialHtmlAttribute,
  escapeKpTutorialHtmlText
} from "../tutorial/generated-html-escaping.ts";
import { kpTypeScriptFreeShippingPublicPath } from
  "./typescript-free-shipping-route.ts";

export const kpTypeScriptFreeShippingPublicSourceId =
  "content/lessons/typescript-free-shipping.kp.md" as const;

export interface KpTypeScriptPublicCheckpoint {
  readonly id: string;
  readonly label: string;
  readonly progress: number;
  readonly focusSelectorIds: readonly string[];
}

export interface KpTypeScriptFreeShippingPublicLesson {
  readonly schemaVersion: "kp.public-typescript-lesson.v1";
  readonly article: KpCompiledArticleDocument;
  readonly checkpoints: readonly KpTypeScriptPublicCheckpoint[];
}

export function compileKpTypeScriptFreeShippingPublicLesson(input: {
  readonly text: string;
  readonly lock: KpArticleImportLock;
}): KpTypeScriptFreeShippingPublicLesson {
  const article = compileKpArticleDocument({
    source: createKpArticleSource(
      kpTypeScriptFreeShippingPublicSourceId,
      input.text
    ),
    registry: kpTypeScriptFreeShippingVignetteRegistry,
    lock: input.lock
  });
  const exemplar = createKpTypeScriptFreeShippingAnimationAsset();
  const stage = article.document.blocks.find((block) => block.kind === "stage");
  if (stage?.vignette.animationId !== exemplar.id) {
    throw new Error("Public TypeScript lesson must import the approved free-shipping vignette.");
  }
  return Object.freeze({
    schemaVersion: "kp.public-typescript-lesson.v1" as const,
    article,
    checkpoints: Object.freeze(exemplar.score.stages.map((checkpoint) =>
      Object.freeze({
        id: checkpoint.id,
        label: checkpoint.narration,
        progress: checkpoint.checkpointMs / exemplar.score.durationMs,
        focusSelectorIds: checkpoint.focusSelectorIds
      })
    ))
  });
}

export function renderKpTypeScriptFreeShippingPublicLesson(
  lesson: KpTypeScriptFreeShippingPublicLesson
): string {
  const exemplar = createKpTypeScriptFreeShippingAnimationAsset();
  const first = exemplar.score.stages[0]!;
  const stage = renderKpTypeScriptRefactorCodeHtml({
    semantics: exemplar.semantics,
    stageId: first.id,
    narration: first.narration,
    activeProjectionId: "projection.typescript.before",
    focusSelectorIds: first.focusSelectorIds,
    accessibleDescription:
      `${exemplar.accessibility.title}. ${first.narration}`
  });
  const article = lesson.article.document.blocks.map((block) =>
    renderArticleBlock(block, stage, lesson.checkpoints, exemplar.staticEndpoints)
  ).join("\n");
  return `<main class="kp-public-lesson" data-kp-public-typescript-lesson>
    <header class="kp-public-lesson__masthead">
      <a href="/" class="kp-public-lesson__wordmark">Kinetic Press</a>
      <span>Ideas you can inspect</span>
    </header>
    <div class="kp-public-lesson__article">${article}</div>
  </main>`;
}

function renderArticleBlock(
  block: KpArticleBlock,
  stageHtml: string,
  checkpoints: readonly KpTypeScriptPublicCheckpoint[],
  endpoints: Readonly<{ before: string; after: string }>
): string {
  if (block.kind === "stage") {
    return renderStage(stageHtml, checkpoints, endpoints);
  }
  if (block.kind === "markdown" || block.kind === "passage" ||
      block.kind === "focus") {
    const markdown = block.kind === "markdown" ? block.markdown : block.markdown;
    return `<section class="kp-public-lesson__prose"${block.kind === "markdown"
      ? ""
      : ` id="${escapeKpTutorialHtmlAttribute(block.id)}" data-kp-public-passage="${escapeKpTutorialHtmlAttribute(block.kind)}"`}>${compileKpArticleMarkdownFragmentHtml(markdown)}</section>`;
  }
  return `<section class="kp-public-lesson__prose" id="${escapeKpTutorialHtmlAttribute(block.id)}" data-kp-public-passage="motion">
    ${compileKpArticleMarkdownFragmentHtml(block.beforeMarkdown)}
    ${block.afterMarkdown === undefined
      ? ""
      : compileKpArticleMarkdownFragmentHtml(block.afterMarkdown)}
  </section>`;
}

function renderStage(
  stageHtml: string,
  checkpoints: readonly KpTypeScriptPublicCheckpoint[],
  endpoints: Readonly<{ before: string; after: string }>
): string {
  const chapters = checkpoints.map((checkpoint) =>
    `<li><a href="${kpTypeScriptFreeShippingPublicPath}?checkpoint=${encodeURIComponent(checkpoint.id)}#refactor-stage" data-kp-public-typescript-checkpoint="${escapeKpTutorialHtmlAttribute(checkpoint.id)}" data-kp-progress="${checkpoint.progress}">${escapeKpTutorialHtmlText(checkpoint.label)}</a></li>`
  ).join("");
  return `<section class="kp-public-stage" id="refactor-stage" data-kp-public-typescript-stage>
    <p class="kp-public-stage__eyebrow">Interactive explanation · TypeScript</p>
    <figure class="kp-public-stage__figure">
      <div class="kp-public-stage__viewport" data-kp-public-typescript-stage-host>${stageHtml}</div>
    </figure>
    <div class="kp-public-stage__transport" aria-label="Animation controls">
      <button type="button" data-kp-public-typescript-play disabled>Play</button>
      <input type="range" min="0" max="1" step="0.001" value="0" aria-label="Scrub the refactor" data-kp-public-typescript-seek disabled>
      <output data-kp-public-typescript-progress>0%</output>
    </div>
    <nav class="kp-public-stage__chapters" aria-label="Refactor stages"><ol>${chapters}</ol></nav>
    <details class="kp-public-stage__transcript">
      <summary>Read the complete source and stage transcript</summary>
      <ol>${checkpoints.map(({ label }) => `<li>${escapeKpTutorialHtmlText(label)}</li>`).join("")}</ol>
      <h3>Before</h3><pre><code>${escapeKpTutorialHtmlText(endpoints.before)}</code></pre>
      <h3>After</h3><pre><code>${escapeKpTutorialHtmlText(endpoints.after)}</code></pre>
    </details>
  </section>`;
}
