import {
  createKpArticleSourceAuthoringDescriptor,
  type KpArticleSourceAuthoringDescriptor
} from "../../article/kp-article-source-authoring.ts";
import {
  kpEconomicsDemandShiftArticleSemanticCompletions,
  kpEconomicsDemandShiftArticleSourceId
} from "./economics-demand-shift-article-compiler.ts";

export const kpEconomicsDemandShiftArticleDraftStorageKey =
  "kp.economics.demand-shift.article-draft.v1";

export function createKpEconomicsDemandShiftArticleAuthoringDescriptor(
  persistedText: string
): KpArticleSourceAuthoringDescriptor {
  return createKpArticleSourceAuthoringDescriptor({
    sourceId: kpEconomicsDemandShiftArticleSourceId,
    sourceFilename: "economics-demand-shift.kp.md",
    persistedText,
    storageKey: kpEconomicsDemandShiftArticleDraftStorageKey,
    semantic: kpEconomicsDemandShiftArticleSemanticCompletions,
    defaultRevealText: "#context"
  });
}
