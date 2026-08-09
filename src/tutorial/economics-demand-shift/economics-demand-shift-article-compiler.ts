import {
  compileKpArticleDocument,
  type KpCompiledArticleDocument
} from "../../article/kp-article-document.ts";
import { deriveKpArticleDeck, type KpArticleDeck } from
  "../../article/kp-article-deck.ts";
import type { KpArticleImportLock } from
  "../../article/kp-article-import-lock.ts";
import type { KpArticleSemanticCompletion } from
  "../../article/kp-article-language-service.ts";
import { createKpArticleSource } from "../../article/kp-article-source.ts";
import {
  economicsDemandShiftVignetteArticleRelease,
  kpEconomicsDemandShiftArticleVignetteRegistry
} from "../../article/vignettes/economics-demand-shift-vignette.ts";
import {
  renderKpEconomicsDemandShiftInlineMarkdown,
  type KpEconomicsDemandShiftLesson,
  type KpEconomicsDemandShiftLessonParagraph,
  type KpEconomicsDemandShiftLessonPassage
} from "./economics-demand-shift-lesson-compiler.ts";

export const kpEconomicsDemandShiftArticleSourceId =
  "content/lessons/economics-demand-shift.kp.md" as const;

export interface KpEconomicsDemandShiftArticleCompilation {
  readonly article: KpCompiledArticleDocument;
  readonly deck: KpArticleDeck;
  readonly lesson: KpEconomicsDemandShiftLesson;
  readonly twoColumnParagraphs: readonly KpEconomicsDemandShiftLessonPassage[];
  readonly semanticCompletions: readonly KpArticleSemanticCompletion[];
}

const sectionIds = new Map([
  ["The puzzle in the starting market", "equilibrium"],
  ["Change one relationship", "demand-increase"],
  ["Follow the new intersection", "market-clearing"],
  ["Check and generalize", "model-scope"]
]);
const passageRoles = new Map<string, KpEconomicsDemandShiftLessonPassage["role"]>([
  ["context", "regular"],
  ["initial-equilibrium", "interpretation"],
  ["demand-change", "regular"],
  ["prediction", "reflection"],
  ["follow-shift", "transition"],
  ["new-equilibrium", "interpretation"],
  ["shift-versus-movement", "transition"],
  ["equation-check", "reflection"],
  ["scope", "interpretation"],
  ["synthesis", "reflection"],
  ["explore", "reflection"]
]);
const motionIds = new Map<string, "demand-shift" | "supply-movement">([
  ["follow-shift", "demand-shift"],
  ["shift-versus-movement", "supply-movement"]
] as const);
const motionAfterIds = new Map([
  ["follow-shift", "new-equilibrium"],
  ["shift-versus-movement", "equation-check"]
]);

/**
 * Compiles the canonical article into domain presentation data. This adapter
 * owns only economics compatibility names; source meaning stays in the shared
 * article IR and no presenter becomes a second authoring format.
 */
export function compileKpEconomicsDemandShiftArticle(input: {
  readonly text: string;
  readonly lock: KpArticleImportLock;
}): KpEconomicsDemandShiftArticleCompilation {
  const source = createKpArticleSource(
    kpEconomicsDemandShiftArticleSourceId,
    input.text
  );
  const article = compileKpArticleDocument({
    source,
    registry: kpEconomicsDemandShiftArticleVignetteRegistry,
    lock: input.lock
  });
  const lesson = projectLesson(article);
  return Object.freeze({
    article,
    deck: deriveKpArticleDeck(article.document),
    lesson,
    twoColumnParagraphs: projectTwoColumnParagraphs(lesson),
    semanticCompletions: kpEconomicsDemandShiftArticleSemanticCompletions
  });
}

export const kpEconomicsDemandShiftArticleSemanticCompletions = Object.freeze([
  ...economicsDemandShiftVignetteArticleRelease.objectPaths.map((path) =>
    Object.freeze({
      address: `market/${path}`,
      detail: `economics stage object · ${path}`
    })
  ),
  ...economicsDemandShiftVignetteArticleRelease.transitionPaths.map((path) =>
    Object.freeze({
      address: `market/${path}`,
      detail: `economics transition · ${path}`
    })
  ),
  ...economicsDemandShiftVignetteArticleRelease.checkpointPaths.map((path) =>
    Object.freeze({
      address: `market/${path}`,
      detail: `economics checkpoint · ${path}`
    })
  )
]) satisfies readonly KpArticleSemanticCompletion[];

function projectLesson(
  article: KpCompiledArticleDocument
): KpEconomicsDemandShiftLesson {
  const preamble = article.document.blocks.find((block) =>
    block.kind === "markdown" && block.markdown.includes("Kicker:")
  );
  if (preamble?.kind !== "markdown") {
    throw new Error("The economics article is missing its title metadata.");
  }
  const metadata = parsePreamble(preamble.markdown);
  const sections: Array<{
    id: string;
    heading: string;
    passages: KpEconomicsDemandShiftLessonPassage[];
  }> = [];
  let current: typeof sections[number] | undefined;

  for (const block of article.document.blocks) {
    if (block.kind === "markdown") {
      const heading = /^###\s+(.+)$/mu.exec(block.markdown)?.[1]?.trim();
      if (heading === undefined) continue;
      const id = sectionIds.get(heading);
      if (id === undefined) {
        throw new Error(`Unknown economics article section: ${heading}.`);
      }
      current = { id, heading, passages: [] };
      sections.push(current);
      continue;
    }
    if (block.kind === "stage") continue;
    if (current === undefined) {
      throw new Error(`Economics article block ${block.id} precedes its section.`);
    }
    if (block.kind === "motion") {
      current.passages.push(createPassage(
        block.id,
        block.beforeMarkdown,
        motionIds.get(block.id)
      ));
      const afterId = motionAfterIds.get(block.id);
      if (block.afterMarkdown !== undefined && afterId !== undefined) {
        current.passages.push(createPassage(afterId, block.afterMarkdown));
      }
      continue;
    }
    current.passages.push(createPassage(block.id, block.markdown));
  }

  const ids = sections.flatMap(({ passages }) => passages.map(({ id }) => id));
  const expected = [...passageRoles.keys()];
  if (JSON.stringify(ids) !== JSON.stringify(expected)) {
    throw new Error(
      `Economics article passage order drifted: expected ${expected.join(", ")}.`
    );
  }
  return Object.freeze({
    ...metadata,
    sections: Object.freeze(sections.map((section) => Object.freeze({
      ...section,
      passages: Object.freeze(section.passages)
    })))
  });
}

function createPassage(
  id: string,
  markdown: string,
  motionBlockId?: "demand-shift" | "supply-movement"
): KpEconomicsDemandShiftLessonPassage {
  const role = passageRoles.get(id);
  if (role === undefined) throw new Error(`Unknown economics article passage: ${id}.`);
  const paragraphs = markdown.trim().split(/\n\s*\n/gu).map((source) => {
    const sourceText = source.replace(/\s+/gu, " ").trim();
    return Object.freeze<KpEconomicsDemandShiftLessonParagraph>({
      sourceText,
      html: renderKpEconomicsDemandShiftInlineMarkdown(
        // The retained presenter transit still uses its pre-RC1 DOM token;
        // canonical source/reference authority remains market/price-axis.
        sourceText.replace(
          "kp-ref:market/price-axis",
          "kp-ref:price-axis-inline"
        )
      )
    });
  });
  if (paragraphs.length === 0 || paragraphs.some(({ sourceText }) => sourceText === "")) {
    throw new Error(`Economics article passage ${id} has no prose.`);
  }
  return Object.freeze({
    id,
    role,
    ...(motionBlockId === undefined ? {} : { motionBlockId }),
    paragraphs: Object.freeze(paragraphs)
  });
}

function projectTwoColumnParagraphs(
  lesson: KpEconomicsDemandShiftLesson
): readonly KpEconomicsDemandShiftLessonPassage[] {
  const passages = new Map(lesson.sections.flatMap(({ passages }) =>
    passages.map((passage) => [passage.id, passage] as const)
  ));
  const selections = [
    ["context", "graph-at-rest"],
    ["initial-equilibrium", "initial-equilibrium"],
    ["follow-shift", "follow-shift"],
    ["new-equilibrium", "new-equilibrium"],
    ["shift-versus-movement", "shift-versus-movement"],
    ["equation-check", "movement-along-supply"]
  ] as const;
  return Object.freeze(selections.map(([sourceId, presenterId]) => {
    const passage = passages.get(sourceId);
    if (passage === undefined) {
      throw new Error(`Missing economics presenter passage ${sourceId}.`);
    }
    return Object.freeze({ ...passage, id: presenterId });
  }));
}

function parsePreamble(markdown: string): Pick<
  KpEconomicsDemandShiftLesson,
  "title" | "kicker" | "assumption"
> {
  const paragraphs = markdown.trim().split(/\n\s*\n/gu)
    .map((paragraph) => paragraph.replace(/\s+/gu, " ").trim());
  const title = paragraphs.find((paragraph) => paragraph.startsWith("# "))
    ?.slice(2).trim() ?? "";
  const kicker = paragraphs.find((paragraph) => paragraph.startsWith("Kicker: "))
    ?.slice("Kicker: ".length).trim() ?? "";
  const assumption = paragraphs.find((paragraph) => paragraph.startsWith("Assumption: "))
    ?.slice("Assumption: ".length).trim() ?? "";
  if (title === "" || kicker === "" || assumption === "") {
    throw new Error("The economics article preamble is incomplete.");
  }
  return Object.freeze({ title, kicker, assumption });
}
