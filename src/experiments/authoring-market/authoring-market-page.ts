import { prepareKpAuthoringMarketPreview } from "./authoring-market-preview-prepare.ts";
import { projectKpAuthoringMarketPreviewStatus } from "./authoring-market-preview-status.ts";
import { projectKpAuthoringMarketRevisionReview } from "./authoring-market-revision-review.ts";
import { createKpAuthoringMarketRevisionReceiver, kpAuthoringMarketPreviewEndpoint,
  kpAuthoringMarketPreviewEvent, type KpAuthoringMarketBuildRevision } from "./authoring-market-preview-protocol.ts";

const initialRoot = document.querySelector<HTMLElement>("#app");
if (initialRoot === null) throw new Error("Expected authoring-market root.");
let root: HTMLElement = initialRoot;

// The experiment is reached only through its physical opt-in document; no
// default reader/bootstrap dependency pulls this integration into other pages.
const { mountKpAuthoringMarket } = await import("./authoring-market-host.ts");
let session: ReturnType<typeof mountKpAuthoringMarket> | undefined;
let lastPrepared: ReturnType<typeof prepareKpAuthoringMarketPreview> | undefined;
const status = document.createElement("p");
status.setAttribute("role", "status");
status.dataset["kpAuthoringMarketBuildStatus"] = "building";
root.before(status);
const review = document.createElement("details");
review.dataset["kpAuthoringMarketRevisionReview"] = "";
review.hidden = true;
const reviewSummary = document.createElement("summary");
reviewSummary.textContent = "Parameter edit: review refreshed facts and claims";
const reviewText = document.createElement("p");
review.append(reviewSummary, reviewText);
status.after(review);
const reportStatus = (revision: KpAuthoringMarketBuildRevision) => {
  const projected = projectKpAuthoringMarketPreviewStatus(revision,
    root.dataset["kpAuthoringMarketPreviewRevision"]);
  status.dataset["kpAuthoringMarketBuildStatus"] = projected.phase;
  status.dataset["kpAuthoringMarketSourceRevision"] = projected.draftRevision;
  status.dataset["kpAuthoringMarketDisplayedRevision"] = projected.displayedRevision ?? "";
  status.textContent = projected.text;
};
const receiver = createKpAuthoringMarketRevisionReceiver({
  prepare: prepareKpAuthoringMarketPreview,
  report: reportStatus,
  commit(prepared, revision) {
    const changes = projectKpAuthoringMarketRevisionReview(lastPrepared, prepared);
    const candidate = document.createElement("div");
    const position = root.querySelector<HTMLInputElement>("[data-kp-supply-tax-state-scrubber]")?.value;
    const restorePosition = (target: HTMLElement) => {
      const scrubber = target.querySelector<HTMLInputElement>("[data-kp-supply-tax-state-scrubber]");
      if (position !== undefined && scrubber !== null) {
        scrubber.value = position;
        scrubber.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };
    // The canonical host's sibling cards own exclusive registered adapters.
    // Prepare first, then retire before mounting: two live hosts cannot overlap.
    root.before(candidate);
    session?.dispose();
    let next: ReturnType<typeof mountKpAuthoringMarket>;
    try { next = mountKpAuthoringMarket({ root: candidate, prepared }); }
    catch (error) {
      candidate.remove();
      if (lastPrepared !== undefined) {
        session = mountKpAuthoringMarket({ root, prepared: lastPrepared });
        restorePosition(root);
      }
      throw error;
    }
    candidate.id = "app";
    candidate.dataset["kpAuthoringMarketPreviewRevision"] = revision.sourceRevision;
    root.remove();
    root = candidate;
    session = next;
    lastPrepared = prepared;
    restorePosition(root);
    review.hidden = changes === undefined;
    reviewText.textContent = changes === undefined ? "" :
      `Changed facts: ${changes.changedFacts.join(", ") || "none"}. Refreshed bound claims: ${changes.changedClaims.join(", ") || "none"}. ${changes.editorialReview}`;
    reportStatus(revision);
  }
});
const onRevision = (revision: KpAuthoringMarketBuildRevision) => { void receiver.receive(revision); };
import.meta.hot?.on(kpAuthoringMarketPreviewEvent, onRevision);
try {
  const response = await fetch(kpAuthoringMarketPreviewEndpoint, { cache: "no-store" });
  if (!response.ok) throw new Error(`Local preview build unavailable (${response.status}).`);
  await receiver.receive(await response.json() as KpAuthoringMarketBuildRevision);
} catch (error) {
  status.dataset["kpAuthoringMarketBuildStatus"] = "invalid";
  status.textContent = error instanceof Error ? error.message : String(error);
}
const dispose = () => {
  receiver.dispose();
  import.meta.hot?.off(kpAuthoringMarketPreviewEvent, onRevision);
  session?.dispose();
};
const onPageHide = (event: PageTransitionEvent) => {
  if (!event.persisted) dispose();
};
window.addEventListener("pagehide", onPageHide);
if (import.meta.hot !== undefined) {
  import.meta.hot.dispose(() => {
    window.removeEventListener("pagehide", onPageHide);
    dispose();
    status.remove();
    review.remove();
  });
}
