import type {
  KpLessonAnimationStoryBlock,
  KpLessonDocument,
  KpLessonInline
} from "../document/public-api.ts";
import type { KpStaticMathBlock } from "./static-math-compiler.ts";

export interface KpStaticLessonHtml {
  readonly articleHtml: string;
  readonly tocHtml: string;
}

export function compileKpStaticLessonProse(
  document: KpLessonDocument,
  options: { readonly staticMath?: readonly KpStaticMathBlock[] | undefined } = {}
): KpStaticLessonHtml {
  const staticMath = new Map((options.staticMath ?? []).map((block) => [block.blockId, block]));
  const article = document.blocks.map((block) => {
    if (block.kind === "heading") {
      return `<h${block.level} id="${attribute(block.id)}" data-kp-block="${attribute(block.id)}">${inlineHtml(block.content)}</h${block.level}>`;
    }
    if (block.kind === "paragraph") {
      return `<p id="${attribute(block.id)}" data-kp-block="${attribute(block.id)}">${inlineHtml(block.content)}</p>`;
    }
    return storyHtml(block, staticMath.get(block.id));
  }).join("\n");
  const tocItems = document.blocks.flatMap((block) => {
    if (block.kind === "heading") {
      return [{
        level: block.level,
        id: block.id,
        label: inlineText(block.content)
      }];
    }
    if (block.kind === "animation-story") {
      return block.beats.map((beat) => ({ level: 2, id: beat.id, label: beat.title }));
    }
    return [];
  });
  const tocHtml = [
    `<nav class="kp-lesson-toc" aria-label="On this page">`,
    "<ol>",
    ...tocItems.map((item) =>
      `<li data-kp-toc-level="${item.level}"><a href="#${attribute(item.id)}">${text(item.label)}</a></li>`
    ),
    "</ol>",
    "</nav>"
  ].join("\n");

  return {
    articleHtml: [
      `<article class="kp-lesson" data-kp-lesson="${attribute(document.id)}" data-kp-version="${attribute(document.version)}"${document.language === undefined ? "" : ` lang="${attribute(document.language)}"`}>`,
      article,
      "</article>"
    ].join("\n"),
    tocHtml
  };
}

function storyHtml(
  block: KpLessonAnimationStoryBlock,
  staticMath: KpStaticMathBlock | undefined
): string {
  const staticStates = staticMath === undefined
    ? `<p class="kp-animation-static-label">See this concept move</p>`
    : staticMath.states.map((state, index) =>
      `<div id="static.${attribute(block.id)}.${attribute(state.checkpointId)}" data-kp-static-state data-kp-progress="${state.progressPermille}"${index === 0 ? "" : " hidden"}>${state.html}</div>`
    ).join("\n");
  return [
    `<section id="${attribute(block.id)}" class="kp-animation-story" data-kp-block="${attribute(block.id)}" data-kp-asset="${attribute(block.asset.id)}" data-kp-asset-version="${attribute(block.asset.version)}">`,
    `<div class="kp-animation-static" data-kp-animation-static aria-label="Interactive explanation">`,
    staticStates,
    "</div>",
    `<ol class="kp-animation-beats" aria-label="Explanation steps">`,
    ...block.beats.map((beat) => [
      `<li id="${attribute(beat.id)}" data-kp-beat="${attribute(beat.id)}" data-kp-checkpoint="${beat.checkpoint.progressPermille}">`,
      `<h2>${text(beat.title)}</h2>`,
      `<p>${inlineHtml(beat.content)}</p>`,
      "</li>"
    ].join("")),
    "</ol>",
    "</section>"
  ].join("\n");
}

function inlineHtml(content: readonly KpLessonInline[]): string {
  return content.map((inline) => {
    if (inline.kind === "text") return text(inline.value);
    const refs = inline.objectRefs.map(attribute).join(" ");
    const tooltip = inline.tooltip === undefined ? "" : ` title="${attribute(inline.tooltip)}"`;
    return `<button type="button" class="kp-semantic-link" data-kp-focus="${refs}"${tooltip}>${text(inline.text)}</button>`;
  }).join("");
}

function inlineText(content: readonly KpLessonInline[]): string {
  return content.map((inline) => inline.kind === "text" ? inline.value : inline.text).join("");
}

function text(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function attribute(value: string): string {
  return text(value)
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
