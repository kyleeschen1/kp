import type { KpArticleImportLock } from
  "../article/kp-article-import-lock.ts";
import {
  compileKpNormalMatrixProofArticle,
  type KpNormalMatrixProofArticleCompilation
} from
  "../tutorial/normal-matrix-proof/normal-matrix-proof-article-compiler.ts";
import { renderKpNormalMatrixProofStaticPublication } from
  "../tutorial/normal-matrix-proof/normal-matrix-proof-static-publication.ts";
import {
  renderKpNormalMatrixProofPromptSurfaceHtml,
  renderKpNormalMatrixProofReturnRehearsalHtml
} from
  "../tutorial/normal-matrix-proof/normal-matrix-proof-prompt-publication.ts";

export const kpNormalMatrixProofPublicSourceId =
  "content/lessons/linear-algebra-normal-matrices.kp.md" as const;

export interface KpNormalMatrixProofPublicLesson {
  readonly schemaVersion: "kp.public-proof-memory.v1";
  readonly compilation: KpNormalMatrixProofArticleCompilation;
}

export function compileKpNormalMatrixProofPublicLesson(input: {
  readonly text: string;
  readonly lock: KpArticleImportLock;
}): KpNormalMatrixProofPublicLesson {
  const compilation = compileKpNormalMatrixProofArticle(input);
  const stage = compilation.article.document.blocks.find(
    (block) => block.kind === "stage"
  );
  if (stage?.vignette.animationId !==
      "animation.linear-algebra.normal-matrix-proof") {
    throw new Error(
      "Public normal-matrix proof must retain its versioned semantic asset."
    );
  }
  return Object.freeze({
    schemaVersion: "kp.public-proof-memory.v1" as const,
    compilation
  });
}

export function renderKpNormalMatrixProofPublicLesson(
  lesson: KpNormalMatrixProofPublicLesson
): string {
  const publication = renderKpNormalMatrixProofStaticPublication(
    lesson.compilation
  );
  return `<div class="kp-public-proof-memory" data-kp-public-proof-memory>
    <header class="kp-public-proof-memory__masthead">
      <a href="/" class="kp-public-proof-memory__wordmark">Kinetic Press</a>
      <span>Ideas you can recover</span>
    </header>
    ${publication}
  </div>`;
}

/** Keep recall searchable without making the already-complete Article carry it. */
export function renderKpNormalMatrixProofReviewIndex(): string {
  return `<div class="kp-public-proof-memory" data-kp-public-proof-memory>
    <header class="kp-public-proof-memory__masthead">
      <a href="/" class="kp-public-proof-memory__wordmark">Kinetic Press</a>
      <span>Ideas you can recover</span>
    </header>
    <main class="kp-normal-proof-review-index">
      <p><a href="/learn/math/normal-matrices/">Read the complete proof</a></p>
      ${renderKpNormalMatrixProofReturnRehearsalHtml()}
      ${renderKpNormalMatrixProofPromptSurfaceHtml()}
    </main>
  </div>`;
}
