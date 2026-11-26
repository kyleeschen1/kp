import { renderKpFocusDeckAnnotation } from "../../tutorial/focus-deck-annotation.ts";
import { AnchoredAlgebraGap, type CommentaryStop } from "../document/public-api.ts";
import type { ObjectCommentPose } from './object-comment-arrival.ts';
import { prepareObjectCommentPaint } from './object-comment-paint.ts';

/** Endpoint-only projection. Material transit has its own paint authority;
 * this adapter never measures its hidden native source as a moving anchor. */
export function mountAnchoredLabels(stage: HTMLElement) {
  const overlay = document.createElement("div");
  overlay.className = "anchored-labels kp-annotation-plane"; overlay.setAttribute("aria-hidden", "true");
  stage.append(overlay);
  let renderedKey: string | undefined;
  let painters: ((pose: ObjectCommentPose) => void)[] = [];
  const clear = () => { overlay.hidden = true; renderedKey = undefined; painters = []; delete stage.dataset["anchoredState"]; };
  return {
    render(stop: CommentaryStop | undefined, invalidate = false, presence = 1, motion?: ObjectCommentPose) {
      if (!Number.isFinite(presence) || presence < 0 || presence > 1)
        throw new AnchoredAlgebraGap('reading.presence', 'Require a finite annotation presence between zero and one.');
      if (!stop || presence === 0) { clear(); return; }
      if (motion && [motion.emergence, motion.withdrawal].some(value => !Number.isFinite(value) || value < 0 || value > 1))
        throw new AnchoredAlgebraGap(stop.stateId, 'Require a finite object-comment pose between zero and one.');
      if (motion && (stop.notes.length !== 1 || stop.notes[0]!.side !== 'above'))
        throw new AnchoredAlgebraGap(stop.stateId, 'This exemplar supports one upward comment at a time.');
      // Update even when anchors are unchanged. The reader's semantic playhead
      // is the only clock; CSS transitions would lag reversal and direct seeks.
      overlay.style.opacity = String(presence);
      const owner = stage.querySelector<HTMLElement>("[data-kp-reader-native-endpoint]");
      const side = owner?.dataset["kpReaderNativeEndpoint"];
      if (!owner || (side !== "source" && side !== "target") || owner.dataset["kpReaderNativeEndpointPassed"] !== "true")
        throw new AnchoredAlgebraGap(stop.stateId, "Wait for a passed native endpoint before attaching commentary.");
      const endpoint = owner.querySelector<HTMLElement>(`[data-kp-reader-transition-active="true"] [data-kp-reader-native="${side}"]`);
      const object = endpoint?.querySelector<HTMLElement>("[data-kp-reader-equation-state]");
      const objectId = object?.dataset["kpReaderEquationState"];
      if (!object || !objectId) throw new AnchoredAlgebraGap(stop.stateId, "Resolve the active native endpoint view.");
      const key = `${stop.stateId}:${objectId}:${motion !== undefined}`;
      if (!invalidate && key === renderedKey) { if (motion) painters.forEach(paint => paint(motion)); return; }
      clear();
      overlay.innerHTML = `<svg class="anchored-leaders" aria-hidden="true"></svg>${stop.notes.map(note => renderKpFocusDeckAnnotation({ entityId: note.id, role: "support", text: note.text, detail: note.detail })).join("")}`;
      overlay.hidden = false; overlay.style.visibility = "hidden";
      overlay.dataset['objectComment'] = String(motion !== undefined);
      const viewport = stage.getBoundingClientRect(), svg = overlay.querySelector("svg")!;
      try {
        // Labels are positioned in stage-local CSS pixels. A presentation
        // scale (including perspective depth) must not be applied twice.
        const width = stage.offsetWidth, height = stage.offsetHeight;
        const scaleX = viewport.width / width, scaleY = viewport.height / height;
        if (!(scaleX > 0 && scaleY > 0) || !Number.isFinite(scaleX + scaleY))
          throw new AnchoredAlgebraGap(stop.stateId, 'Require measurable annotation-plane geometry.');
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
          const left = (Math.min(...bounds.map(b => b.left)) - viewport.left) / scaleX, right = (Math.max(...bounds.map(b => b.right)) - viewport.left) / scaleX;
          const top = (Math.min(...bounds.map(b => b.top)) - viewport.top) / scaleY, bottom = (Math.max(...bounds.map(b => b.bottom)) - viewport.top) / scaleY;
          const label = overlay.querySelector<HTMLElement>(`[data-kp-focus-deck-annotation="${CSS.escape(note.id)}"]`)!;
          // This adapter owns border-box labels. Read their intrinsic CSS
          // dimensions: inverse-projecting a rounded screen rect can falsely
          // enlarge an exactly fitting label (notably Firefox at higher depth).
          const style = getComputedStyle(label);
          const size = { width: parseFloat(style.width), height: parseFloat(style.height) }, center = (left + right) / 2;
          if (!(size.width > 0 && size.height > 0) || !Number.isFinite(size.width + size.height))
            throw new AnchoredAlgebraGap(note.id, 'Require measurable annotation text.');
          const x = Math.max(16, Math.min(width - size.width - 16, center - size.width / 2));
          const gap = motion ? 16 : 32;
          const y = note.side === "above" ? top - gap - size.height : bottom + 32;
          // Client-rect projection/inversion can put an exact-fit width a few
          // millionths of a pixel over its bound. Keep sub-layout-unit slack,
          // not a fit exemption for genuinely overflowing commentary.
          const rounding = 1 / 1024;
          if (y < 8 - rounding || y + size.height > height - 8 + rounding || size.width > width - 32 + rounding)
            throw new AnchoredAlgebraGap(note.id, 'Reserve enough screen space for the full commentary without shrinking or clipping it.');
          label.style.left = `${x}px`; label.style.top = `${y}px`;
          label.dataset["anchorSelectors"] = ids.join(" ");
          const edge = note.side === "above" ? top - 8 : bottom + 8, tip = note.side === "above" ? edge + 4 : edge - 4;
          const labelEdge = note.side === "above" ? y + size.height + 5 : y - 5;
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", `M ${left} ${tip} V ${edge} H ${right} V ${tip} M ${center} ${edge} L ${x + size.width / 2} ${labelEdge}`);
          svg.append(path);
          if (motion) {
            if (note.side !== 'above') throw new AnchoredAlgebraGap(note.id, 'This candidate supports upward comments only.');
            const paint = prepareObjectCommentPaint({ overlay, svg, label, bracket: path,
              left, right, edge, tip, x, y, width: size.width, height: size.height });
            painters.push(paint); paint(motion);
          }
        }
        overlay.style.visibility = ""; stage.dataset["anchoredState"] = stop.stateId; renderedKey = key;
      } catch (error) { clear(); throw error; }
    },
    dispose() { clear(); overlay.remove(); }
  };
}
