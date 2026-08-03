import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";

export interface KpEconomicsDemandShiftLessonParagraph {
  readonly html: string;
}

export interface KpEconomicsDemandShiftLessonPassage {
  readonly id: string;
  readonly paragraphs: readonly KpEconomicsDemandShiftLessonParagraph[];
}

export interface KpEconomicsDemandShiftLessonSection {
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
    heading: string;
    passages: Array<{ id: string; paragraphs: KpEconomicsDemandShiftLessonParagraph[] }>;
  }> = [];
  let section = sections.at(-1);
  let passage = section?.passages.at(-1);
  let paragraphLines: string[] = [];

  const flushParagraph = (): void => {
    if (paragraphLines.length === 0) return;
    if (passage === undefined) {
      throw new Error("Lesson prose must belong to an annotated passage.");
    }
    passage.paragraphs.push({
      html: renderInlineMarkdown(paragraphLines.join(" "))
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
      section = { heading: line.slice(4).trim(), passages: [] };
      sections.push(section);
      passage = undefined;
      continue;
    }
    const passageMarker = passageMarkerPattern.exec(line);
    if (passageMarker !== null) {
      flushParagraph();
      if (section === undefined) {
        throw new Error("Passage annotations must follow a lesson section.");
      }
      passage = { id: passageMarker[1]!, paragraphs: [] };
      section.passages.push(passage);
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
  if (sections.some(({ passages }) =>
    passages.length === 0 || passages.some(({ paragraphs }) => paragraphs.length === 0)
  )) {
    throw new Error("Every lesson section and passage must contain prose.");
  }

  return { title, kicker, assumption, sections };
}
