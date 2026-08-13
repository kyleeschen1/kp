import type { KpArticleImportLock } from
  "../article/kp-article-import-lock.ts";
import {
  compileKpFractionCompositionArticle,
  type KpFractionCompositionArticleCompilation
} from
  "../tutorial/algebra-fraction-composition/fraction-composition-article-compiler.ts";
import { renderKpFractionCompositionStaticPublication } from
  "../tutorial/algebra-fraction-composition/fraction-composition-static-publication.ts";

export const kpFractionCompositionPublicSourceId =
  "content/lessons/algebra-fraction-composition.kp.md" as const;

export interface KpFractionCompositionPublicLesson {
  readonly schemaVersion: "kp.public-symbolic-lesson.v1";
  readonly compilation: KpFractionCompositionArticleCompilation;
}

export function compileKpFractionCompositionPublicLesson(input: {
  readonly text: string;
  readonly lock: KpArticleImportLock;
}): KpFractionCompositionPublicLesson {
  const compilation = compileKpFractionCompositionArticle(input);
  const stage = compilation.article.document.blocks.find(
    (block) => block.kind === "stage"
  );
  if (stage?.vignette.animationId !==
      "animation.fraction-composition.two-thirds-solve") {
    throw new Error(
      "Public fraction composition must retain the canonical KaTeX animation."
    );
  }
  return Object.freeze({
    schemaVersion: "kp.public-symbolic-lesson.v1" as const,
    compilation
  });
}

export function renderKpFractionCompositionPublicLesson(
  lesson: KpFractionCompositionPublicLesson
): string {
  const publication = renderKpFractionCompositionStaticPublication(
    lesson.compilation
  );
  return `<div class="kp-public-symbolic-lesson" data-kp-public-symbolic-lesson>
    <header class="kp-public-symbolic-lesson__masthead">
      <a href="/" class="kp-public-symbolic-lesson__wordmark">Kinetic Press</a>
      <span>Ideas you can inspect</span>
    </header>
    <header class="kp-public-symbolic-lesson__heading">
      <p>Interactive explanation · Algebra</p>
      <h1>What does the fraction multiply?</h1>
    </header>
    ${publication}
  </div>`;
}
