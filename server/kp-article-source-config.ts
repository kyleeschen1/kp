import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import type { KpArticleImportLock } from
  "../src/article/kp-article-import-lock.ts";
import {
  compileKpEconomicsDemandShiftArticle,
  kpEconomicsDemandShiftArticleSourceId
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-article-compiler.ts";
import {
  compileKpFractionCompositionArticle,
  kpFractionCompositionArticleSourceId
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-article-compiler.ts";
import type { KpArticleSourceRoute } from
  "./kp-article-source-http-adapter.ts";
import { KpArticleSourceStore } from "./kp-article-source-store.ts";

export const KP_ARTICLE_SOURCE_WRITE_ENABLE_ENV = "KP_ARTICLE_SOURCE_WRITE";
const lockPath = "content/lessons/economics-demand-shift.kp.lock.json";
const fractionLockPath =
  "content/lessons/algebra-fraction-composition.kp.lock.json";
const projectRoot = fileURLToPath(new URL("..", import.meta.url));

export const kpAlgebraFractionCompositionArticleSourceEndpoint =
  "/api/dev/article-sources/algebra-fraction-composition";

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

export function createKpArticleSourceRoutesFromEnvironment(
  environment: Readonly<Record<string, string | undefined>>
): readonly KpArticleSourceRoute[] | undefined {
  const economics = createKpArticleSourceStoreFromEnvironment(environment);
  if (economics === undefined) return undefined;
  const fractionLock = JSON.parse(readFileSync(
    resolve(projectRoot, fractionLockPath),
    "utf8"
  )) as KpArticleImportLock;
  const algebra = new KpArticleSourceStore({
    sourceFile: resolve(projectRoot, kpFractionCompositionArticleSourceId),
    sourcePath: kpFractionCompositionArticleSourceId,
    validate: (text) => {
      compileKpFractionCompositionArticle({ text, lock: fractionLock });
    },
    // This caller is compiled directly from source; unlike economics it owns
    // no checked-in generated projection that an explicit write must refresh.
    regenerate: async () => undefined
  });
  return Object.freeze([{
    endpoint: "/api/dev/article-sources/economics-demand-shift",
    store: economics
  }, {
    endpoint: kpAlgebraFractionCompositionArticleSourceEndpoint,
    store: algebra
  }]);
}
