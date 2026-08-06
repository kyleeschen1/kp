import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { KpEconomicsLessonSourceStore } from
  "./economics-lesson-source-store.ts";

export const KP_LESSON_SOURCE_WRITE_ENABLE_ENV =
  "KP_LESSON_SOURCE_WRITE";
export const kpEconomicsTwoColumnSourcePath =
  "content/lessons/economics-demand-shift-two-column.json";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

export function createKpEconomicsLessonSourceStoreFromEnvironment(
  environment: Readonly<Record<string, string | undefined>>
): KpEconomicsLessonSourceStore | undefined {
  if (environment[KP_LESSON_SOURCE_WRITE_ENABLE_ENV] !== "1") return undefined;
  return new KpEconomicsLessonSourceStore({
    sourceFile: resolve(projectRoot, kpEconomicsTwoColumnSourcePath),
    sourcePath: kpEconomicsTwoColumnSourcePath,
    regenerate: async () => {
      const { generateKpEconomicsDemandShiftPublicationArtifact } =
        await import("../scripts/compile-economics-demand-shift-publication.ts");
      generateKpEconomicsDemandShiftPublicationArtifact(false);
    }
  });
}
