import type {
  KpEconomicsLessonDraftState
} from "./economics-demand-shift-lesson-draft.ts";

const endpoint =
  "/api/dev/lesson-sources/economics-demand-shift-two-column";

export interface KpEconomicsLessonSourceSaveResult {
  readonly schemaVersion: "kp.economics-lesson-source-save-result.v1";
  readonly sourcePath: string;
  readonly changed: boolean;
}

export async function saveKpEconomicsLessonSource(
  draft: KpEconomicsLessonDraftState
): Promise<KpEconomicsLessonSourceSaveResult> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-kp-lesson-source-write": "1"
    },
    body: JSON.stringify({
      schemaVersion: "kp.economics-lesson-source-save.v1",
      draft
    })
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
  if (!isSaveResult(result)) {
    throw new Error("The source-save endpoint returned an invalid response.");
  }
  return result;
}

async function readErrorPayload(
  response: Response
): Promise<{ readonly message?: string | undefined } | undefined> {
  try {
    const payload: unknown = await response.json();
    return typeof payload === "object" && payload !== null &&
      (payload as { message?: unknown }).message !== undefined &&
      typeof (payload as { message?: unknown }).message === "string"
      ? { message: (payload as { message: string }).message }
      : undefined;
  } catch {
    return undefined;
  }
}

function isSaveResult(
  value: unknown
): value is KpEconomicsLessonSourceSaveResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Partial<KpEconomicsLessonSourceSaveResult>;
  return result.schemaVersion ===
      "kp.economics-lesson-source-save-result.v1" &&
    typeof result.sourcePath === "string" &&
    typeof result.changed === "boolean";
}
