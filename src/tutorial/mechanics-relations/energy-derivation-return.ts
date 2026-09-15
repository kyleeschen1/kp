/** A same-document bookmark, not a reasoning authority or a second playhead.
 * Reject the entire frame before changing the reader; an edited publication
 * requires a new bookmark rather than guessing at old positions. */
export interface EnergyReturnFrame {
  readonly revision: string;
  readonly transition: string;
  readonly progress: number;
  readonly disclosures: readonly boolean[];
  readonly focus: string;
  readonly anchorRow: number;
  readonly anchorOffset: number;
}
export interface EnergyReturnBoundary {
  readonly revision: string;
  readonly transitions: readonly string[];
  readonly disclosureCount: number;
  readonly focusIds: readonly string[];
}
export function validateEnergyReturn(value: unknown, boundary: EnergyReturnBoundary): EnergyReturnFrame {
  if (!value || typeof value !== "object") throw new Error("Invalid derivation return frame");
  const fields = Object.getOwnPropertyDescriptors(value);
  const names = ["revision", "transition", "progress", "disclosures", "focus", "anchorRow", "anchorOffset"];
  if (Reflect.ownKeys(value).length !== names.length || names.some(key => !fields[key] || fields[key]!.get || fields[key]!.set))
    throw new Error("Invalid derivation return fields");
  const v = Object.fromEntries(names.map(key => [key, fields[key]!.value])) as Record<keyof EnergyReturnFrame, unknown>;
  if (!boundary.revision || v.revision !== boundary.revision || typeof v.transition !== "string" || !boundary.transitions.includes(v.transition)
    || typeof v.progress !== "number" || !Number.isFinite(v.progress) || v.progress < 0 || v.progress > 1
    || !Array.isArray(v.disclosures) || v.disclosures.length !== boundary.disclosureCount
    || Array.from(v.disclosures).some(item => typeof item !== "boolean")
    || typeof v.focus !== "string" || !boundary.focusIds.includes(v.focus) || typeof v.anchorRow !== "number" || !Number.isInteger(v.anchorRow)
    || v.anchorRow !== boundary.transitions.indexOf(v.transition) || typeof v.anchorOffset !== "number" || !Number.isFinite(v.anchorOffset))
    throw new Error("Stale or invalid derivation return frame");
  return Object.freeze({ revision: v.revision, transition: v.transition, progress: v.progress,
    disclosures: Object.freeze([...v.disclosures]), focus: v.focus,
    anchorRow: v.anchorRow, anchorOffset: v.anchorOffset });
}

export interface EnergyReturnPort {
  pause(): void;
  capturePosition(): Promise<{ transition: string; progress: number }>;
  restorePosition(transition: string, progress: number): Promise<void>;
  remeasure(): void;
  inspectUse(resultId: string): Promise<void>;
}

/** Local adapter. Native links still work without enhancement. Keeping
 * the bookmark in this mounted document avoids a global navigation store and
 * makes its same-revision, same-document limit explicit. */
export function bindEnergyDerivationReturn(root: HTMLElement, port: EnergyReturnPort, signal: AbortSignal) {
  const doc = root.ownerDocument;
  const candidate = new URL(location.href).searchParams.get("derivation-recall") === "use";
  const template = root.querySelector<HTMLTemplateElement>(candidate ? "[data-derivation-use-template]" : "[data-derivation-recall-template]");
  // A scalar argument need not invent a physics provenance link. If the source
  // declares one, however, missing targets remain an explicit repair.
  if (!template) return;
  const original = doc.getElementById(template.dataset["provenanceTarget"] ?? "");
  if (!original) throw new Error("Missing declared provenance binding");
  const passage = root.querySelector<HTMLElement>('[data-derivation-interleave="0"] .energy-derivation-interleave-text')!;
  passage.append(template.content.cloneNode(true));
  const recall = passage.querySelector<HTMLDetailsElement>("[data-derivation-recall]")!;
  const link = recall.querySelector<HTMLAnchorElement>("a")!;
  const back = doc.createElement("button");
  back.type = "button"; back.textContent = "Return to your derivation"; back.hidden = true;
  back.dataset["derivationReturn"] = ""; original.append(back);
  const notice = doc.createElement("p"); notice.setAttribute("role", "status"); notice.hidden = true; original.append(notice);
  const disclosures = [...root.querySelectorAll<HTMLDetailsElement>("details")];
  const focusElements = [...root.querySelectorAll<HTMLElement>("button, summary, a")];
  const focusIds = focusElements.map((_, index) => `focus.${index}`);
  const transitions = [...root.querySelectorAll<HTMLElement>("[data-derivation-template]")].map(el => el.dataset["transitionId"]!);
  const boundary: EnergyReturnBoundary = { revision: root.dataset["derivationRevision"]!, transitions,
    disclosureCount: disclosures.length, focusIds };
  const rows = [...root.querySelectorAll<HTMLElement>("[data-derivation-row]")];
  let frame: EnergyReturnFrame | undefined, busy = false;
  const opts = { signal };
  const use = recall.querySelector<HTMLButtonElement>("[data-derivation-use-result]");
  use?.addEventListener("click", async () => {
    if (busy) return;
    busy = true; use.disabled = true;
    const feedback = recall.querySelector<HTMLElement>("[data-derivation-use-status]")!;
    feedback.hidden = true;
    try { await port.inspectUse(use.dataset["derivationUseResult"]!); }
    catch (error) {
      feedback.hidden = false;
      feedback.textContent = "This result cannot be linked to the current step. Your held inspection is unchanged.";
      console.error("Derivation reference repair", error);
    } finally { busy = false; use.disabled = false; }
  }, opts);
  const fail = (error: unknown) => {
    notice.hidden = false; notice.textContent = "This return needs repair; your written derivation is unchanged.";
    console.error("Derivation return repair", error);
  };
  link.addEventListener("click", async event => {
    // Preserve normal modified-link behavior; this bookmark owns only a local visit.
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (busy) return;
    busy = true;
    try {
      const focused = focusElements.indexOf(doc.activeElement as HTMLElement);
      port.pause();
      const position = await port.capturePosition();
      if (signal.aborted) return;
      const anchorRow = transitions.indexOf(position.transition);
      frame = validateEnergyReturn({ revision: boundary.revision, ...position,
        disclosures: disclosures.map(el => el.open), focus: focusIds[focused < 0 ? focusElements.indexOf(link) : focused]!,
        anchorRow, anchorOffset: rows[anchorRow]!.getBoundingClientRect().top }, boundary);
      back.hidden = false; notice.hidden = true;
      original.scrollIntoView({ block: "start", behavior: "instant" });
      back.focus({ preventScroll: true });
    } catch (error) { fail(error); }
    finally { busy = false; }
  }, opts);
  back.addEventListener("click", async () => {
    if (!frame || busy) return;
    busy = true;
    try {
      const saved = validateEnergyReturn(frame, { ...boundary, revision: root.dataset["derivationRevision"]! });
      port.pause();
      disclosures.forEach((el, index) => { el.open = saved.disclosures[index]!; });
      await port.restorePosition(saved.transition, saved.progress);
      if (signal.aborted) return;
      port.remeasure();
      // Restore a semantic row's viewport offset, not a stale document pixel.
      // Reflow above the proof can change scrollY without changing reading place.
      window.scrollBy({ top: rows[saved.anchorRow]!.getBoundingClientRect().top - saved.anchorOffset, behavior: "instant" });
      focusElements[focusIds.indexOf(saved.focus)]!.focus({ preventScroll: true });
      back.hidden = true; frame = undefined;
    } catch (error) { fail(error); }
    finally { busy = false; }
  }, opts);
  signal.addEventListener("abort", () => { recall.remove(); back.remove(); notice.remove(); }, { once: true });
}
