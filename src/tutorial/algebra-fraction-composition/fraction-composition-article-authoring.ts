import articleSourceText from
  "../../../content/lessons/algebra-fraction-composition.kp.md?raw";
import articleImportLockValue from
  "../../../content/lessons/algebra-fraction-composition.kp.lock.json" with { type: "json" };

import {
  mountKpArticleSourceEditor,
  type KpArticleSourceEditorSession
} from "../../article/kp-article-source-editor.ts";
import type { KpArticleImportLock } from
  "../../article/kp-article-import-lock.ts";
import { saveKpArticleSource } from
  "../../article/kp-article-source-client.ts";
import {
  compileKpFractionCompositionArticle,
  kpFractionCompositionArticleSourceId
} from "./fraction-composition-article-compiler.ts";
import {
  kpFractionCompositionArticleSemanticReferences
} from "./fraction-composition-semantic-navigation.ts";
import {
  renderKpFractionCompositionStaticPublication
} from "./fraction-composition-static-publication.ts";

const sourceEndpoint =
  "/api/dev/article-sources/algebra-fraction-composition";
const importLock = articleImportLockValue as KpArticleImportLock;

export function mountKpFractionCompositionArticleEditor(input: {
  readonly ownerDocument: Document;
  readonly preview: (publicationHtml: string) => void;
  readonly onClose?: (() => void) | undefined;
}): KpArticleSourceEditorSession {
  return mountKpArticleSourceEditor({
    ownerDocument: input.ownerDocument,
    sourceId: kpFractionCompositionArticleSourceId,
    sourceFilename: "algebra-fraction-composition.kp.md",
    persistedText: articleSourceText,
    storageKey: "kp.algebra.fraction-composition.article-draft.v1",
    semantic: kpFractionCompositionArticleSemanticReferences.map(
      ({ address }) => ({
        address,
        detail: "fraction composition semantic path"
      })
    ),
    revealText: "# What does the fraction multiply?",
    save: (request) => saveKpArticleSource({
      endpoint: sourceEndpoint,
      request
    }),
    preview: (source) => input.preview(
      renderKpFractionCompositionStaticPublication(
        compileKpFractionCompositionArticle({ text: source, lock: importLock })
      )
    ),
    onClose: input.onClose
  });
}
