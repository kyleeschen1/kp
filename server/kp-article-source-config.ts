import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import type { KpArticleImportLock } from
  "../src/article/kp-article-import-lock.ts";
import {
  compileKpEconomicsDemandShiftArticle,
  kpEconomicsDemandShiftArticleSourceId
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-article-compiler.ts";
import { KpArticleSourceStore } from "./kp-article-source-store.ts";

export const KP_ARTICLE_SOURCE_WRITE_ENABLE_ENV = "KP_ARTICLE_SOURCE_WRITE";
const lockPath = "content/lessons/economics-demand-shift.kp.lock.json";
const projectRoot = fileURLToPath(new URL("..", import.meta.url));

export function createKpArticleSourceStoreFromEnvironment(
  environment: Readonly<Record<string, string | undefined>>
): KpArticleSourceStore | undefined {
  if (environment[KP_ARTICLE_SOURCE_WRITE_ENABLE_ENV] !== "1") return undefined;
  const importLock = JSON.parse(readFileSync(
    resolve(projectRoot, lockPath),
    "utf8"
  )) as KpArticleImportLock;
  return new KpArticleSourceStore({
    sourceFile: resolve(projectRoot, kpEconomicsDemandShiftArticleSourceId),
    sourcePath: kpEconomicsDemandShiftArticleSourceId,
    validate: (text) => {
      compileKpEconomicsDemandShiftArticle({ text, lock: importLock });
    },
    regenerate: async () => {
      const { generateKpEconomicsDemandShiftPublicationArtifact } =
        await import("../scripts/compile-economics-demand-shift-publication.ts");
      generateKpEconomicsDemandShiftPublicationArtifact(false);
    }
  });
}
