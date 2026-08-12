import articleSourceText from
  "../../../content/lessons/economics-demand-shift.kp.md?raw";
import articleImportLockValue from
  "../../../content/lessons/economics-demand-shift.kp.lock.json" with { type: "json" };

import {
  mountKpArticleSourceEditor,
  type KpArticleSourceEditorSession
} from "../../article/kp-article-source-editor.ts";
import type { KpArticleImportLock } from
  "../../article/kp-article-import-lock.ts";
import {
  createKpEconomicsDemandShiftArticleAuthoringDescriptor
} from "./economics-demand-shift-article-authoring-descriptor.ts";
import {
  saveKpEconomicsDemandShiftArticleSource
} from "./economics-demand-shift-article-source-client.ts";
import {
  compileKpEconomicsDemandShiftArticlePublication,
  type KpEconomicsDemandShiftPublication
} from "./economics-demand-shift-publication.ts";

const importLock = articleImportLockValue as KpArticleImportLock;
const descriptor = createKpEconomicsDemandShiftArticleAuthoringDescriptor(
  articleSourceText
);

export function mountKpEconomicsDemandShiftArticleEditor(input: {
  readonly ownerDocument: Document;
  readonly preview: (publication: KpEconomicsDemandShiftPublication) => void;
  readonly revealText?: string | undefined;
  readonly onClose?: (() => void) | undefined;
}): KpArticleSourceEditorSession {
  return mountKpArticleSourceEditor({
    ownerDocument: input.ownerDocument,
    sourceId: descriptor.sourceId,
    sourceFilename: descriptor.sourceFilename,
    persistedText: descriptor.persistedText,
    storageKey: descriptor.storageKey,
    semantic: descriptor.semantic,
    revealText: input.revealText ?? descriptor.defaultRevealText,
    save: saveKpEconomicsDemandShiftArticleSource,
    preview: (source) => input.preview(
      compileKpEconomicsDemandShiftArticlePublication({
        articleText: source,
        importLock
      })
    ),
    onClose: input.onClose
  });
}
