import { renderKpFocusDeckAnnotation } from "../../tutorial/focus-deck-annotation.ts";
import { AnchoredAlgebraGap, type CommentaryStop } from "./commentary.ts";

/** Endpoint-only projection. Material transit has its own paint authority;
 * this adapter never measures its hidden native source as a moving anchor. */
export function mountAnchoredLabels(stage: HTMLElement) {
  const overlay = document.createElement("div");
  overlay.className = "anchored-labels"; overlay.setAttribute("aria-hidden", "true");
  stage.append(overlay);
  let renderedKey: string | undefined;
  const clear = () => { overlay.hidden = true; renderedKey = undefined; delete stage.dataset["anchoredState"]; };
  return {
    render(stop: CommentaryStop | undefined, invalidate = false) {
      if (!stop) { clear(); return; }
      const owner = stage.querySelector<HTMLElement>("[data-kp-reader-native-endpoint]");
      const side = owner?.dataset["kpReaderNativeEndpoint"];
      if (!owner || (side !== "source" && side !== "target") || owner.dataset["kpReaderNativeEndpointPassed"] !== "true")
        throw new AnchoredAlgebraGap(stop.stateId, "Wait for a passed native endpoint before attaching commentary.");
      const endpoint = owner.querySelector<HTMLElement>(`[data-kp-reader-transition-active="true"] [data-kp-reader-native="${side}"]`);
      const object = endpoint?.querySelector<HTMLElement>("[data-kp-reader-equation-state]");
      const objectId = object?.dataset["kpReaderEquationState"];
      if (!object || !objectId) throw new AnchoredAlgebraGap(stop.stateId, "Resolve the active native endpoint view.");
      const key = `${stop.stateId}:${objectId}`;
      if (!invalidate && key === renderedKey) return;
      clear();
      overlay.innerHTML = `<svg class="anchored-leaders" aria-hidden="true"></svg>${stop.notes.map(note => renderKpFocusDeckAnnotation({ entityId: note.id, text: note.text, detail: note.detail })).join("")}`;
      overlay.hidden = false; overlay.style.visibility = "hidden";
      const viewport = stage.getBoundingClientRect(), svg = overlay.querySelector("svg")!;
      try {
        for (const note of stop.notes) {
          const ids = note.views[objectId];
          if (!ids) throw new AnchoredAlgebraGap(note.id, "Declare anchors for the compositor's actual endpoint view.");
          const bounds = ids.map(id => {
            const matches = object.querySelectorAll<HTMLElement>(`[data-kp-reader-selector-id="${CSS.escape(id)}"]`);
            if (matches.length !== 1) throw new AnchoredAlgebraGap(id, "Require exactly one native selector, never a guessed occurrence.");
            const rect = matches[0]!.getBoundingClientRect();
            if (!(rect.width > 0 && rect.height > 0)) throw new AnchoredAlgebraGap(id, "Require measurable native ink.");
            return rect;
          });
          const left = Math.min(...bounds.map(b => b.left)) - viewport.left, right = Math.max(...bounds.map(b => b.right)) - viewport.left;
          const top = Math.min(...bounds.map(b => b.top)) - viewport.top, bottom = Math.max(...bounds.map(b => b.bottom)) - viewport.top;
          const label = overlay.querySelector<HTMLElement>(`[data-kp-focus-deck-annotation="${CSS.escape(note.id)}"]`)!;
          const size = label.getBoundingClientRect(), center = (left + right) / 2;
          const x = Math.max(16, Math.min(viewport.width - size.width - 16, center - size.width / 2));
          const y = note.side === "above" ? top - 32 - size.height : bottom + 32;
          if (y < 8 || y + size.height > viewport.height - 8 || size.width > viewport.width - 32)
            throw new AnchoredAlgebraGap(note.id, "Reserve enough screen space for the full commentary without shrinking or clipping it.");
          label.style.left = `${x}px`; label.style.top = `${y}px`;
          label.dataset["anchorSelectors"] = ids.join(" ");
          const edge = note.side === "above" ? top - 8 : bottom + 8, tip = note.side === "above" ? edge + 4 : edge - 4;
          const labelEdge = note.side === "above" ? y + size.height + 5 : y - 5;
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", `M ${left} ${tip} V ${edge} H ${right} V ${tip} M ${center} ${edge} L ${x + size.width / 2} ${labelEdge}`);
          svg.append(path);
        }
        overlay.style.visibility = ""; stage.dataset["anchoredState"] = stop.stateId; renderedKey = key;
      } catch (error) { clear(); throw error; }
    },
    dispose() { clear(); overlay.remove(); }
  };
}
