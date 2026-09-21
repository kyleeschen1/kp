/** Callers capture their domain-owned source before invoking this adapter.
 * A denied clipboard is recoverable through each host's manual selection UI. */
export async function writeSourceClipboard(source: string, signal: AbortSignal): Promise<"copied" | "manual" | "disposed"> {
  if (signal.aborted) return "disposed";
  try {
    await navigator.clipboard.writeText(source);
    return signal.aborted ? "disposed" : "copied";
  } catch {
    return signal.aborted ? "disposed" : "manual";
  }
}
