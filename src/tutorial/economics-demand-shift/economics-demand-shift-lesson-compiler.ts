import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import {
  findKpEconomicsMotionBlock,
  kpEconomicsMotionBlocks,
  type KpEconomicsMotionBlockId
} from "./economics-demand-shift-motion-blocks.ts";

export interface KpEconomicsDemandShiftLessonParagraph {
  readonly html: string;
  readonly sourceText: string;
}

export type KpEconomicsDemandShiftPassageRole =
  | "regular"
  | "transition"
  | "interpretation"
  | "reflection";

export interface KpEconomicsDemandShiftLessonPassage {
  readonly id: string;
  readonly role: KpEconomicsDemandShiftPassageRole;
  readonly motionBlockId?: KpEconomicsMotionBlockId | undefined;
  readonly paragraphs: readonly KpEconomicsDemandShiftLessonParagraph[];
}

export interface KpEconomicsDemandShiftLessonSection {
  readonly id: string;
  readonly heading: string;
  readonly passages: readonly KpEconomicsDemandShiftLessonPassage[];
}

export interface KpEconomicsDemandShiftLesson {
  readonly title: string;
  readonly kicker: string;
  readonly assumption: string;
  readonly sections: readonly KpEconomicsDemandShiftLessonSection[];
}

const passageMarkerPattern = /^<!-- kp:passage ([a-z0-9-]+) -->$/;
const passageRoleMarkerPattern =
  /^<!-- kp:role (regular|transition|interpretation|reflection) -->$/;
const motionMarkerPattern = /^<!-- kp:motion ([a-z0-9-]+) -->$/;
const sectionMarkerPattern = /^<!-- kp:section ([a-z0-9-]+) -->$/;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInlineMarkdown(value: string): string {
  const parts = value.split("$");
  if (parts.length % 2 === 0) {
    throw new Error(`Unclosed inline math delimiter in: ${value}`);
  }
  return parts.map((part, index) => {
    if (index % 2 === 0) return escapeHtml(part);
    const latex = part.trim();
    return `<span class="kp-economics-tutorial__math" data-kp-latex="${escapeHtml(latex)}">${renderLatexToHtml(latex, {
      displayMode: false
    })}</span>`;
  }).join("");
}

export function compileKpEconomicsDemandShiftLesson(
  markdown: string
): KpEconomicsDemandShiftLesson {
  // This deliberately narrow compiler keeps the accepted prose in Markdown
  // without prematurely creating a shared lesson schema or editor contract.
  let title = "";
  let kicker = "";
  let assumption = "";
  const sections: Array<{
    id: string;
    heading: string;
    passages: Array<{
      id: string;
      role: KpEconomicsDemandShiftPassageRole;
      motionBlockId?: KpEconomicsMotionBlockId | undefined;
      paragraphs: KpEconomicsDemandShiftLessonParagraph[];
    }>;
  }> = [];
  let section = sections.at(-1);
  let passage = section?.passages.at(-1);
  let paragraphLines: string[] = [];

  const flushParagraph = (): void => {
    if (paragraphLines.length === 0) return;
    if (passage === undefined) {
      throw new Error("Lesson prose must belong to an annotated passage.");
    }
    const sourceText = paragraphLines.join(" ");
    passage.paragraphs.push({
      html: renderInlineMarkdown(sourceText),
      sourceText
    });
    paragraphLines = [];
  };

  for (const rawLine of markdown.replaceAll("\r\n", "\n").split("\n")) {
    const line = rawLine.trim();
    if (line === "") {
      flushParagraph();
      continue;
    }
    if (line.startsWith("# ")) {
      flushParagraph();
      title = line.slice(2).trim();
      continue;
    }
    if (line.startsWith("Kicker: ")) {
      flushParagraph();
      kicker = line.slice("Kicker: ".length).trim();
      continue;
    }
    if (line.startsWith("Assumption: ")) {
      flushParagraph();
      assumption = line.slice("Assumption: ".length).trim();
      continue;
    }
    if (line.startsWith("### ")) {
      flushParagraph();
      section = { id: "", heading: line.slice(4).trim(), passages: [] };
      sections.push(section);
      passage = undefined;
      continue;
    }
    const sectionMarker = sectionMarkerPattern.exec(line);
    if (sectionMarker !== null) {
      flushParagraph();
      if (
        section === undefined ||
        section.id !== "" ||
        section.passages.length > 0
      ) {
        throw new Error(
          "A section annotation must appear once before its first passage."
        );
      }
      section.id = sectionMarker[1]!;
      continue;
    }
    const passageMarker = passageMarkerPattern.exec(line);
    if (passageMarker !== null) {
      flushParagraph();
      if (section === undefined) {
        throw new Error("Passage annotations must follow a lesson section.");
      }
      passage = { id: passageMarker[1]!, role: "regular", paragraphs: [] };
      section.passages.push(passage);
      continue;
    }
    const passageRoleMarker = passageRoleMarkerPattern.exec(line);
    if (passageRoleMarker !== null) {
      flushParagraph();
      if (passage === undefined || passage.paragraphs.length > 0) {
        throw new Error(
          "A passage role must appear once before its prose."
        );
      }
      passage.role = passageRoleMarker[1] as KpEconomicsDemandShiftPassageRole;
      continue;
    }
    const motionMarker = motionMarkerPattern.exec(line);
    if (motionMarker !== null) {
      flushParagraph();
      if (passage === undefined) {
        throw new Error("Motion annotations must follow a passage annotation.");
      }
      if (passage.paragraphs.length > 0 || passage.motionBlockId !== undefined) {
        throw new Error("A motion annotation must appear once before passage prose.");
      }
      const motionBlock = findKpEconomicsMotionBlock(motionMarker[1]);
      if (motionBlock === undefined || motionBlock.passageId !== passage.id) {
        throw new Error(
          `Motion annotation ${motionMarker[1]} does not belong to passage ${passage.id}.`
        );
      }
      passage.motionBlockId = motionBlock.id;
      continue;
    }
    if (line.startsWith("<")) {
      throw new Error(`Unsupported lesson HTML: ${line}`);
    }
    paragraphLines.push(line);
  }
  flushParagraph();

  const passageIds = sections.flatMap(({ passages }) =>
    passages.map(({ id }) => id)
  );
  if (title === "" || kicker === "" || assumption === "" || sections.length === 0) {
    throw new Error("Lesson Markdown is missing its title, kicker, assumption, or sections.");
  }
  if (new Set(passageIds).size !== passageIds.length) {
    throw new Error("Lesson passage annotations must be unique.");
  }
  const sectionIds = sections.map(({ id }) => id);
  if (
    sectionIds.some((id) => id === "") ||
    new Set(sectionIds).size !== sectionIds.length
  ) {
    throw new Error("Lesson section annotations must be present and unique.");
  }
  const motionBlockIds = sections.flatMap(({ passages }) =>
    passages.flatMap(({ motionBlockId }) =>
      motionBlockId === undefined ? [] : [motionBlockId]
    )
  );
  if (new Set(motionBlockIds).size !== motionBlockIds.length) {
    throw new Error("Lesson motion annotations must be unique.");
  }
  if (
    motionBlockIds.length !== kpEconomicsMotionBlocks.length ||
    kpEconomicsMotionBlocks.some(({ id }) => !motionBlockIds.includes(id))
  ) {
    throw new Error(
      "Lesson motion annotations must cover every local motion block exactly once."
    );
  }
  if (sections.some(({ passages }) => passages.some((candidate) =>
    (candidate.role === "transition") !==
      (candidate.motionBlockId !== undefined)
  ))) {
    throw new Error(
      "Transition passages and motion annotations must correspond exactly."
    );
  }
  if (sections.some(({ passages }) =>
    passages.length === 0 || passages.some(({ paragraphs }) => paragraphs.length === 0)
  )) {
    throw new Error("Every lesson section and passage must contain prose.");
  }

  return { title, kicker, assumption, sections };
}
