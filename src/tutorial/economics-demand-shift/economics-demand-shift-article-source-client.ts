import {
  isKpArticleSourceSaveResult,
  kpArticleSourceSaveSchema,
  type KpArticleSourceSaveRequest,
  type KpArticleSourceSaveResult
} from "../../article/kp-article-source-save.ts";

export const kpEconomicsDemandShiftArticleSourceEndpoint =
  "/api/dev/article-sources/economics-demand-shift";

export async function saveKpEconomicsDemandShiftArticleSource(
  request: Omit<KpArticleSourceSaveRequest, "schemaVersion">
): Promise<KpArticleSourceSaveResult> {
  const response = await fetch(kpEconomicsDemandShiftArticleSourceEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-kp-article-source-write": "1"
    },
    body: JSON.stringify({ schemaVersion: kpArticleSourceSaveSchema, ...request })
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        "Source saving is unavailable. Run the full development stack with npm run dev."
      );
    }
    const payload = await readErrorPayload(response);
    throw new Error(
      payload?.message ?? `Source save failed with status ${response.status}.`
    );
  }
  const result: unknown = await response.json();
  if (!isKpArticleSourceSaveResult(result)) {
    throw new Error("The article source-save endpoint returned an invalid response.");
  }
  return result;
}

async function readErrorPayload(
  response: Response
): Promise<{ readonly message?: string | undefined } | undefined> {
  try {
    const payload: unknown = await response.json();
    return typeof payload === "object" && payload !== null &&
      typeof (payload as { message?: unknown }).message === "string"
      ? { message: (payload as { message: string }).message }
      : undefined;
  } catch {
    return undefined;
  }
}
