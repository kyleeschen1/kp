import { compile } from "../../authoring/algebra/compile.ts";
import { bindAnchoredCommentary, AnchoredAlgebraGap } from "./what-counts-commentary.ts";
import { mountAnchoredLabels } from "./what-counts-anchors.ts";
import "./what-counts-annotations.css";

/** Local reviewed score; the reader supplies its sole current attention owner. */
export function mountWhatCountsAnnotations(story: HTMLElement, source: unknown) {
  const commentary = bindAnchoredCommentary(compile(source));
  const requestedState = window.location.hash.slice(1);
  const unknownState = requestedState.startsWith('state.what-counts.') && !commentary.stops.some(stop => stop.stateId === requestedState);
  const plane = story.querySelector<HTMLElement>(".kp-caption-pin");
  if (!plane) throw new AnchoredAlgebraGap("reader.layout", "Require the document annotation plane.");
  const labels = mountAnchoredLabels(plane), alert = document.createElement("p");
  alert.setAttribute("role", "alert"); alert.hidden = true; alert.dataset["anchoredError"] = "";
  story.append(alert);
  let layoutRevision = -1;
  let invalidated = true;
  return {
    invalidate() { invalidated = true; },
    render(stateId: string | undefined, revision: number) {
      try {
        if (unknownState) throw new AnchoredAlgebraGap("location.state", "This link names an unknown explanation state. Open /reader/what-counts/ for the current explanation.");
        const stop = stateId === undefined ? undefined : commentary.stops.find(stop => stop.stateId === stateId);
        if (stateId && !stop) throw new AnchoredAlgebraGap(stateId, "Use a declared annotation stop.");
        labels.render(stop, invalidated || layoutRevision !== revision); layoutRevision = revision; invalidated = false;
        alert.hidden = true; alert.textContent = ""; story.dataset["anchoredStatus"] = "ready";
      } catch (error) {
        labels.render(undefined);
        if (!(error instanceof AnchoredAlgebraGap)) throw error;
        alert.textContent = error.message; alert.hidden = false; story.dataset["anchoredStatus"] = "repair-gap";
      }
    },
    dispose() { labels.dispose(); alert.remove(); }
  };
}
