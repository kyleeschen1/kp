import {
  compileKpArticleDocument,
  type KpCompiledArticleDocument
} from "../../article/kp-article-document.ts";
import {
  resolveKpArticleImports,
  type KpArticleImportLock
} from "../../article/kp-article-import-lock.ts";
import { createKpArticleSource } from "../../article/kp-article-source.ts";
import { sha256 } from "../../kernel/sha256.ts";
import {
  economicsDemandShiftVignetteArticleRelease,
  kpArticleVignetteRegistry
} from "../../article/vignettes/economics-demand-shift-vignette.ts";
import {
  compileKpEconomicsDemandShiftLesson,
  type KpEconomicsDemandShiftLesson,
  type KpEconomicsDemandShiftLessonPassage
} from "./economics-demand-shift-lesson-compiler.ts";
import {
  createKpEconomicsLessonBuffer,
  parseKpEconomicsLessonBuffer,
  serializeKpEconomicsLessonBuffer
} from "./economics-demand-shift-lesson-buffer.ts";
import {
  parseKpEconomicsTwoColumnSource,
  type KpEconomicsTwoColumnSource
} from "./economics-demand-shift-two-column-source.ts";

export interface KpEconomicsLegacySourceFingerprint {
  readonly source: "markdown" | "two-column" | "lesson-buffer";
  readonly sha256: `sha256:${string}`;
}

export interface KpEconomicsLegacyIdentityAlias {
  readonly legacyId: string;
  readonly articleId: string;
  readonly role: "section" | "block" | "motion-after" | "ordinary-markdown";
}

export interface KpEconomicsRc1ImportResult {
  readonly schemaVersion: "kp.economics-rc1-import.v1";
  readonly authority: "article-source";
  readonly sourceId: "content/lessons/economics-demand-shift.kp.md";
  readonly articleText: string;
  readonly compilation: KpCompiledArticleDocument;
  readonly importLock: KpArticleImportLock;
  readonly sourceNoise: Readonly<{
    metadataLines: number;
    meaningfulLines: number;
    ratio: number;
  }>;
  readonly aliases: readonly KpEconomicsLegacyIdentityAlias[];
  /** Frozen comparison evidence only; it is never a publication input. */
  readonly legacyProjectionBaseline: KpEconomicsTwoColumnSource;
  readonly fingerprints: readonly KpEconomicsLegacySourceFingerprint[];
}

const sourceId = "content/lessons/economics-demand-shift.kp.md" as const;
const migrationRegistry = Object.freeze([
  ...kpArticleVignetteRegistry,
  economicsDemandShiftVignetteArticleRelease
]);
const motionAfter = new Map([
  ["follow-shift", "new-equilibrium"],
  ["shift-versus-movement", "equation-check"]
]);

/**
 * Performs the migration once. Legacy inputs must agree structurally, but the
 * returned RC1 text is the sole authoring authority; compatibility material is
 * retained only as immutable parity evidence for the cutover.
 */
export function importKpEconomicsLegacyArticle(input: {
  readonly markdown: string;
  readonly twoColumnSource: unknown;
  readonly lessonBuffer: string;
}): KpEconomicsRc1ImportResult {
  const lesson = compileKpEconomicsDemandShiftLesson(input.markdown);
  const twoColumn = parseKpEconomicsTwoColumnSource(input.twoColumnSource);
  const parsedBuffer = parseKpEconomicsLessonBuffer(input.lessonBuffer);
  const expectedBuffer = createKpEconomicsLessonBuffer(twoColumn);
  if (serializeKpEconomicsLessonBuffer(parsedBuffer) !==
      serializeKpEconomicsLessonBuffer(expectedBuffer)) {
    throw new Error(
      "The synthesized economics lesson buffer diverges from its two-column source."
    );
  }
  assertMotionParity(lesson, twoColumn);

  const aliases: KpEconomicsLegacyIdentityAlias[] = [];
  const articleText = serializeArticle(lesson, aliases);
  const source = createKpArticleSource(sourceId, articleText);
  const imports = resolveKpArticleImports(source, migrationRegistry);
  const compilation = compileKpArticleDocument({
    source,
    registry: migrationRegistry,
    lock: imports.lock
  });
  const sourceNoise = measureSourceNoise(articleText);
  if (sourceNoise.ratio > 0.25) {
    throw new Error(
      `Imported RC1 metadata occupies ${(sourceNoise.ratio * 100).toFixed(1)}% of meaningful lines.`
    );
  }

  return Object.freeze({
    schemaVersion: "kp.economics-rc1-import.v1" as const,
    authority: "article-source" as const,
    sourceId,
    articleText,
    compilation,
    importLock: imports.lock,
    sourceNoise,
    aliases: Object.freeze(aliases),
    legacyProjectionBaseline: twoColumn,
    fingerprints: Object.freeze([
      fingerprint("markdown", input.markdown),
      fingerprint("two-column", JSON.stringify(input.twoColumnSource)),
      fingerprint("lesson-buffer", input.lessonBuffer)
    ])
  });
}

function serializeArticle(
  lesson: KpEconomicsDemandShiftLesson,
  aliases: KpEconomicsLegacyIdentityAlias[]
): string {
  const lines = [
    "---",
    "kp:",
    "  schema: kp.article.v1-rc1",
    "  id: lesson.economics.demand-shift",
    "  imports:",
    "    demandShift: vignette.economics.demand-shift@1",
    "---",
    "",
    `# ${lesson.title}`,
    "",
    `Kicker: ${lesson.kicker}`,
    "",
    ...wrap(`Assumption: ${lesson.assumption}`),
    "",
    ":::kp-stage{#market use=demandShift}",
    ":::",
    ""
  ];
  const skipped = new Set<string>();
  for (const section of lesson.sections) {
    lines.push(`### ${section.heading}`, "");
    aliases.push(alias(section.id, headingSlug(section.heading), "section"));
    for (let index = 0; index < section.passages.length; index += 1) {
      const passage = section.passages[index]!;
      if (skipped.has(passage.id)) continue;
      const afterId = motionAfter.get(passage.id);
      const after = afterId === undefined
        ? undefined
        : section.passages.find(({ id }) => id === afterId);
      if (after !== undefined) skipped.add(after.id);
      lines.push(...serializePassage(passage, after), "");
      if (passage.motionBlockId !== undefined) {
        aliases.push(alias(passage.id, passage.id, "block"));
        if (after !== undefined) {
          aliases.push(alias(after.id, passage.id, "motion-after"));
        }
      } else if (passage.id === "initial-equilibrium" ||
          passage.id === "demand-change") {
        aliases.push(alias(passage.id, passage.id, "block"));
      } else {
        aliases.push(alias(
          passage.id,
          `${headingSlug(section.heading)}:${index}`,
          "ordinary-markdown"
        ));
      }
    }
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

function serializePassage(
  passage: KpEconomicsDemandShiftLessonPassage,
  after: KpEconomicsDemandShiftLessonPassage | undefined
): string[] {
  const body = passage.paragraphs.flatMap(({ sourceText }, index) => [
    ...(index === 0 ? [] : [""]),
    ...wrap(addFirstSemanticLink(passage.id, sourceText))
  ]);
  if (passage.motionBlockId !== undefined) {
    const run = passage.motionBlockId === "demand-shift"
      ? "market/shift-demand"
      : "market/trace-supply-movement";
    return [
      `:::kp-motion{#${passage.id} stage=market run=${run}}`,
      ...body,
      ...(after === undefined ? [] : [
        "",
        "::after",
        "",
        ...after.paragraphs.flatMap(({ sourceText }, index) => [
          ...(index === 0 ? [] : [""]),
          ...wrap(sourceText)
        ])
      ]),
      ":::"
    ];
  }
  if (passage.id === "initial-equilibrium") {
    return [
      ":::kp-focus{#initial-equilibrium stage=market target=\"market/equilibrium\" context=\"market/axes market/demand market/supply\"}",
      ...body,
      ":::"
    ];
  }
  if (passage.id === "demand-change") {
    return [
      ":::kp-focus{#demand-change stage=market target=\"market/demand\" context=\"market/supply market/axes\"}",
      ...body,
      ":::"
    ];
  }
  return body;
}

function addFirstSemanticLink(passageId: string, sourceText: string): string {
  if (passageId !== "context") return sourceText;
  return sourceText.replace(
    "price, $P$",
    "price, [$P$](kp-ref:market/price-axis)"
  );
}

function assertMotionParity(
  lesson: KpEconomicsDemandShiftLesson,
  twoColumn: KpEconomicsTwoColumnSource
): void {
  const markdownMotion = lesson.sections.flatMap(({ passages }) => passages)
    .filter(({ motionBlockId }) => motionBlockId !== undefined)
    .map(({ id, motionBlockId }) => `${id}:${motionBlockId}`);
  const projectionMotion = twoColumn.passages
    .filter(({ motionBlockId }) => motionBlockId !== undefined)
    .map(({ id, motionBlockId }) => `${id}:${motionBlockId}`);
  if (JSON.stringify(markdownMotion) !== JSON.stringify(projectionMotion)) {
    throw new Error(
      "Legacy economics Markdown and two-column motion ownership diverge."
    );
  }
}

function measureSourceNoise(text: string): KpEconomicsRc1ImportResult["sourceNoise"] {
  const lines = text.split("\n");
  const meaningful = lines.filter((line) => line.trim() !== "");
  let inFrontmatter = false;
  let frontmatterClosed = false;
  const metadataLines = meaningful.filter((line) => {
    if (line === "---" && !frontmatterClosed) {
      inFrontmatter = !inFrontmatter;
      if (!inFrontmatter) frontmatterClosed = true;
      return true;
    }
    return inFrontmatter || line.startsWith(":::kp-") || line === ":::" ||
      line === "::after";
  }).length;
  return Object.freeze({
    metadataLines,
    meaningfulLines: meaningful.length,
    ratio: metadataLines / meaningful.length
  });
}

function wrap(text: string, width = 68): string[] {
  const words = text.split(/\s+/u);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (line === "") {
      line = word;
    } else if (line.length + word.length + 1 <= width) {
      line += ` ${word}`;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line !== "") lines.push(line);
  return lines;
}

function headingSlug(heading: string): string {
  return heading.toLowerCase().replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");
}

function alias(
  legacyId: string,
  articleId: string,
  role: KpEconomicsLegacyIdentityAlias["role"]
): KpEconomicsLegacyIdentityAlias {
  return Object.freeze({ legacyId, articleId, role });
}

function fingerprint(
  source: KpEconomicsLegacySourceFingerprint["source"],
  text: string
): KpEconomicsLegacySourceFingerprint {
  return Object.freeze({
    source,
    sha256: `sha256:${sha256(text)}`
  });
}
