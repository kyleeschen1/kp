import {
  kpLispLessonMotionBlocks,
  type KpLispLessonMotionBlockId
} from "./lisp-function-application-motion-blocks.ts";

export interface KpLispLessonParagraph {
  readonly html: string;
  readonly sourceText: string;
}

export interface KpLispLessonPassageBlock {
  readonly kind: "passage";
  readonly id: string;
  readonly paragraphs: readonly KpLispLessonParagraph[];
}

export interface KpLispLessonMotionBlockRef {
  readonly kind: "motion";
  readonly id: KpLispLessonMotionBlockId;
}

export type KpLispLessonBlock =
  | KpLispLessonPassageBlock
  | KpLispLessonMotionBlockRef;

export interface KpLispLessonSection {
  readonly id: string;
  readonly heading: string;
  readonly blocks: readonly KpLispLessonBlock[];
}

export interface KpLispFunctionApplicationLesson {
  readonly title: string;
  readonly kicker: string;
  readonly assumption: string;
  readonly sections: readonly KpLispLessonSection[];
}

const marker = /^<!-- kp:(section|passage|motion) ([a-z0-9-]+) -->$/;

export function compileKpLispFunctionApplicationLesson(
  markdown: string
): KpLispFunctionApplicationLesson {
  // The local compiler deliberately accepts only the publication surface the
  // exemplar uses, so authored Markdown cannot smuggle runtime HTML or JS.
  let title = "";
  let kicker = "";
  let assumption = "";
  const sections: Array<{
    id: string;
    heading: string;
    blocks: Array<{
      kind: "passage";
      id: string;
      paragraphs: KpLispLessonParagraph[];
    } | KpLispLessonMotionBlockRef>;
  }> = [];
  let section = sections.at(-1);
  let passage = section?.blocks.at(-1)?.kind === "passage"
    ? section.blocks.at(-1) as Extract<(typeof section.blocks)[number], { kind: "passage" }>
    : undefined;
  let paragraph: string[] = [];

  const flush = (): void => {
    if (paragraph.length === 0) return;
    if (passage === undefined) {
      throw new Error("Lisp lesson prose must belong to an annotated passage.");
    }
    const sourceText = paragraph.join(" ");
    passage.paragraphs.push({ html: renderInlineCode(sourceText), sourceText });
    paragraph = [];
  };

  for (const rawLine of markdown.replaceAll("\r\n", "\n").split("\n")) {
    const line = rawLine.trim();
    if (line === "") {
      flush();
      continue;
    }
    if (line.startsWith("# ")) {
      flush();
      title = line.slice(2).trim();
      continue;
    }
    if (line.startsWith("Kicker: ")) {
      kicker = line.slice(8).trim();
      continue;
    }
    if (line.startsWith("Assumption: ")) {
      assumption = line.slice(12).trim();
      continue;
    }
    if (line.startsWith("### ")) {
      flush();
      section = { id: "", heading: line.slice(4).trim(), blocks: [] };
      sections.push(section);
      passage = undefined;
      continue;
    }
    const match = marker.exec(line);
    if (match !== null) {
      flush();
      const [, kind, id] = match;
      if (section === undefined) {
        throw new Error(`${kind} annotations require a lesson section.`);
      }
      if (kind === "section") {
        if (section.id !== "" || section.blocks.length > 0) {
          throw new Error("Section annotations must precede section blocks.");
        }
        section.id = id!;
        passage = undefined;
      } else if (kind === "passage") {
        passage = { kind: "passage", id: id!, paragraphs: [] };
        section.blocks.push(passage);
      } else {
        if (!isMotionBlockId(id!)) {
          throw new Error(`Unknown Lisp motion block: ${id}.`);
        }
        section.blocks.push(Object.freeze({ kind: "motion", id: id! }));
        passage = undefined;
      }
      continue;
    }
    if (line.startsWith("<")) {
      throw new Error(`Unsupported Lisp lesson HTML: ${line}`);
    }
    paragraph.push(line);
  }
  flush();

  validate({ title, kicker, assumption, sections });
  return Object.freeze({
    title,
    kicker,
    assumption,
    sections: Object.freeze(sections.map((candidate) => Object.freeze({
      ...candidate,
      blocks: Object.freeze(candidate.blocks.map((block) =>
        block.kind === "motion"
          ? block
          : Object.freeze({
              ...block,
              paragraphs: Object.freeze([...block.paragraphs])
            })
      ))
    })))
  });
}

function validate(input: {
  readonly title: string;
  readonly kicker: string;
  readonly assumption: string;
  readonly sections: readonly {
    readonly id: string;
    readonly blocks: readonly KpLispLessonBlock[];
  }[];
}): void {
  if (input.title === "" || input.kicker === "" || input.assumption === "") {
    throw new Error("Lisp lesson metadata is incomplete.");
  }
  const sectionIds = input.sections.map(({ id }) => id);
  const passages = input.sections.flatMap(({ blocks }) =>
    blocks.filter((block): block is KpLispLessonPassageBlock => block.kind === "passage")
  );
  const motions = input.sections.flatMap(({ blocks }) =>
    blocks.filter((block): block is KpLispLessonMotionBlockRef => block.kind === "motion")
  );
  const hasUnintroducedMotion = input.sections.some(({ blocks }) =>
    blocks.some((block, index) =>
      block.kind === "motion" && blocks[index - 1]?.kind !== "passage"
    )
  );
  if (sectionIds.some((id) => id === "") || new Set(sectionIds).size !== sectionIds.length) {
    throw new Error("Lisp lesson section annotations must be unique.");
  }
  if (new Set(passages.map(({ id }) => id)).size !== passages.length ||
      passages.some(({ paragraphs }) => paragraphs.length === 0)) {
    throw new Error("Lisp lesson passages must be unique and nonempty.");
  }
  if (hasUnintroducedMotion) {
    throw new Error(
      "Lisp lesson motion blocks must follow an introducing passage."
    );
  }
  if (motions.length !== kpLispLessonMotionBlocks.length ||
      new Set(motions.map(({ id }) => id)).size !== motions.length ||
      kpLispLessonMotionBlocks.some(({ id }) => !motions.some((motion) => motion.id === id))) {
    throw new Error("Lisp lesson must place every local motion block exactly once.");
  }
}

function renderInlineCode(value: string): string {
  const parts = value.split("`");
  if (parts.length % 2 === 0) {
    throw new Error(`Unclosed inline code delimiter in: ${value}`);
  }
  return parts.map((part, index) => index % 2 === 0
    ? escapeHtml(part)
    : `<code class="kp-lisp-tutorial__inline-code">${escapeHtml(part)}</code>`
  ).join("");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isMotionBlockId(value: string): value is KpLispLessonMotionBlockId {
  return kpLispLessonMotionBlocks.some(({ id }) => id === value);
}
