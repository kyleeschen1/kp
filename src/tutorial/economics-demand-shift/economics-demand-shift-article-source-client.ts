import type {
  KpArticleSourceSaveRequest,
  KpArticleSourceSaveResult
} from "../../article/kp-article-source-save.ts";
import { saveKpArticleSource } from
  "../../article/kp-article-source-client.ts";

export const kpEconomicsDemandShiftArticleSourceEndpoint =
  "/api/dev/article-sources/economics-demand-shift";

export async function saveKpEconomicsDemandShiftArticleSource(
  request: Omit<KpArticleSourceSaveRequest, "schemaVersion">
): Promise<KpArticleSourceSaveResult> {
  return saveKpArticleSource({
    endpoint: kpEconomicsDemandShiftArticleSourceEndpoint,
    request
  });
}
