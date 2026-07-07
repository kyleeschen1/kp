import type { KpDocument } from "../semantic/document.ts";

type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export async function compileDocumentAsset(
  document: KpDocument,
  fetcher: FetchLike = fetch
): Promise<string> {
  const response = await fetcher("/api/compile", {
    body: JSON.stringify(document),
    headers: {
      "content-type": "application/json"
    },
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(`Compile request failed with status ${response.status}.`);
  }

  return response.text();
}
