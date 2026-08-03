import type {
  KpLessonAnimationStoryBlock,
  KpLessonHeadingBlock,
  KpLessonInline
} from "../reader/document/lesson-document.ts";
import type {
  KpTutorialLessonPublicationDocument
} from "./kp-tutorial-lesson-document.ts";
import { renderKpTutorialScrubBar } from "./kp-tutorial-scrub-bar-renderer.ts";
import {
  renderKpTutorialToc,
  type KpTutorialTocItem,
  type KpTutorialTocModel
} from "./kp-tutorial-toc.ts";
import { serializeKpTutorialDestinationHref } from "./kp-tutorial-url.ts";

export interface KpTutorialPublicationControls<BlockId extends string> {
  readonly tocModel: KpTutorialTocModel;
  readonly tocHtml: string;
  readonly motionScrubBarHtml: Readonly<Record<BlockId, string>>;
}

/** Compile meaningful final-geometry controls from document truth once. */
export function compileKpTutorialPublicationControls<BlockId extends string>(input: {
  readonly publication: KpTutorialLessonPublicationDocument;
  readonly path: string;
  readonly motionBlockLabels: Readonly<Record<BlockId, string>>;
  readonly tocLabel?: string | undefined;
}): KpTutorialPublicationControls<BlockId> {
  const sections: Array<{
    readonly heading: KpLessonHeadingBlock;
    readonly stories: KpLessonAnimationStoryBlock[];
  }> = [];
  let section: (typeof sections)[number] | undefined;
  for (const block of input.publication.document.blocks) {
    if (block.kind === "heading") {
      section = { heading: block, stories: [] };
      sections.push(section);
    } else if (block.kind === "animation-story") {
      if (section === undefined) {
        throw new Error(`Tutorial motion block ${block.id} precedes its section.`);
      }
      section.stories.push(block);
    }
  }
  if (sections.length === 0) throw new Error("Tutorial controls need a section heading.");

  const stories = sections.flatMap(({ stories: nested }) => nested);
  const knownIds = new Set(Object.keys(input.motionBlockLabels));
  for (const story of stories) {
    if (!knownIds.has(story.id)) {
      throw new Error(`Tutorial controls need a label for motion block ${story.id}.`);
    }
  }
  if (knownIds.size !== stories.length) {
    throw new Error("Tutorial control labels must match document motion blocks exactly.");
  }

  const tocModel: KpTutorialTocModel = Object.freeze({
    label: input.tocLabel ?? "In this lesson",
    items: Object.freeze(sections.map(({ heading, stories: nested }) => item({
      kind: "section",
      id: heading.id,
      label: inlineText(heading.content),
      href: href(input.path, "section", heading.id),
      children: nested.map((story) => item({
        kind: "block",
        id: story.id,
        label: input.motionBlockLabels[story.id as BlockId]!,
        href: href(input.path, "block", story.id),
        children: story.beats.map((beat) => item({
          kind: "checkpoint",
          id: beat.checkpoint.id,
          label: beat.title,
          href: href(input.path, "checkpoint", beat.checkpoint.id),
          children: []
        }))
      }))
    })))
  });
  const motionScrubBarHtml = Object.fromEntries(stories.map((story) => [
    story.id,
    renderKpTutorialScrubBar({
      blockId: story.id,
      checkpoints: story.beats.map((beat) => ({
        id: beat.checkpoint.id,
        label: beat.title,
        progress: beat.checkpoint.progressPermille / 1_000,
        href: href(input.path, "checkpoint", beat.checkpoint.id)
      }))
    })
  ])) as Record<BlockId, string>;
  return Object.freeze({
    tocModel,
    tocHtml: renderKpTutorialToc(tocModel),
    motionScrubBarHtml: Object.freeze(motionScrubBarHtml)
  });
}

function inlineText(content: readonly KpLessonInline[]): string {
  return content.map((inline) => inline.kind === "text" ? inline.value : inline.text).join("");
}

function href(
  path: string,
  kind: "section" | "block" | "checkpoint",
  id: string
): string {
  return serializeKpTutorialDestinationHref(path, { kind, id });
}

function item(value: KpTutorialTocItem): KpTutorialTocItem {
  return Object.freeze({ ...value, children: Object.freeze([...value.children]) });
}
