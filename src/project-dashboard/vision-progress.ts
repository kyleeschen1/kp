import { projectVision } from "./vision-data.ts";
import { describeVisionExecution, readVisionExecution } from "./vision-execution.ts";

/** One read per mount, with no polling or task mutations. A late response belongs
 * only to the captured element, never to a replacement dashboard/editor. */
export async function updateProjectVisionProgress(root: ParentNode): Promise<void> {
  const output = root.querySelector<HTMLElement>("[data-kp-vision-execution]");
  if (!output) return;
  const contract = projectVision.commitment.contractId;
  try {
    const response = await fetch(`/docs/theseus/nodes/run-contracts/${contract}.json`, {
      cache: "no-store", signal: AbortSignal.timeout(10_000)
    });
    if (!response.ok) throw new Error("Execution source unavailable");
    const execution = readVisionExecution(await response.json(), contract);
    if (!output.isConnected) return;
    output.dataset["kpVisionExecution"] = "loaded";
    output.textContent = `${describeVisionExecution(execution)} Read from Theseus at ${new Date().toLocaleTimeString()}. Reload to refresh.`;
  } catch {
    if (!output.isConnected) return;
    output.dataset["kpVisionExecution"] = "unavailable";
    output.textContent = "Execution status unavailable. Direction is still readable; run npm run project:orientation in the product checkout for a fresh check.";
  }
}
