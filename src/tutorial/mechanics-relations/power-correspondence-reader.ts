import { createKpReaderSemanticFocusService } from "../../reader/runtime/semantic-focus.ts";
import { isPowerTerm, powerTerms, projectPowerCorrespondence, type PowerTerm } from "./power-correspondence.ts";

export function enhancePowerCorrespondence(root: HTMLDetailsElement) {
  const focus = createKpReaderSemanticFocusService(powerTerms.map(term => term.id));
  const abort = new AbortController(), options = { signal: abort.signal };
  const buttons = root.querySelectorAll<HTMLButtonElement>('[data-power-term]');
  const modes = root.querySelector<HTMLElement>('[data-power-modes]')!;
  const instruction = root.querySelector<HTMLElement>('[data-power-instruction]')!;
  const close = root.querySelector<HTMLButtonElement>('[data-power-close]')!;
  let inspecting = false;
  const paint = () => {
    const selected = focus.getSnapshot().objectRefs[0];
    const term = inspecting && selected && isPowerTerm(selected) ? selected : null;
    root.dataset["powerView"] = inspecting ? "inspect" : "static";
    instruction.hidden = !inspecting;
    projectPowerCorrespondence(term).forEach(state => {
      root.querySelectorAll(`[data-power-entity="${state.id}"]`).forEach(element => {
        element.setAttribute("data-power-salience", state.salience);
      });
    });
    buttons.forEach(button => {
      button.disabled = !inspecting;
      button.setAttribute("aria-pressed", String(button.dataset["powerTerm"] === term));
    });
    root.querySelectorAll<HTMLElement>('[data-power-reason]').forEach(reason => {
      const inactive = term !== null && reason.dataset["powerReason"] !== term;
      reason.inert = inactive;
      if (inactive) reason.setAttribute("aria-hidden", "true"); else reason.removeAttribute("aria-hidden");
    });
    modes.querySelectorAll('[data-power-mode]').forEach(button => button.setAttribute("aria-pressed", String(button.getAttribute("data-power-mode") === (inspecting ? "inspect" : "static"))));
  };
  const select = (term: PowerTerm, source: "pointer" | "keyboard" | "url") => {
    inspecting = true;
    // Explicit navigation supersedes the previous input source; stale keyboard
    // priority must not mask a later click or restored URL selection.
    focus.clear("keyboard"); focus.clear("pointer"); focus.clear("url");
    focus.set(source, [term]); paint();
  };
  focus.subscribe(paint);
  buttons.forEach(button => button.addEventListener("click", event => {
    const id = button.dataset["powerTerm"];
    if (!id || !isPowerTerm(id)) throw new Error("Unknown power correspondence term");
    select(id, event.detail === 0 ? "keyboard" : "pointer");
  }, options));
  modes.querySelectorAll<HTMLButtonElement>('[data-power-mode]').forEach(button => button.addEventListener("click", () => {
    if (button.dataset["powerMode"] === "inspect") select("speed", "keyboard");
    else { inspecting = false; paint(); }
  }, options));
  const restore = () => {
    const hash = location.hash.slice(1);
    if (hash === "power-correspondence") {
      root.open = true; inspecting = false; paint();
    } else if (hash.startsWith("power-correspondence-")) {
      const term = hash.slice("power-correspondence-".length);
      if (isPowerTerm(term)) { root.open = true; select(term, "url"); }
    }
  };
  // The source link is next to the original identity. Keep its exact reading
  // position for return, rather than navigating to the section's distant top.
  let returnPoint: { link: HTMLAnchorElement; top: number } | undefined;
  document.querySelectorAll<HTMLAnchorElement>('a[href="#power-correspondence"]').forEach(link => link.addEventListener("click", event => {
    event.preventDefault();
    returnPoint = { link, top: link.getBoundingClientRect().top };
    root.open = true; inspecting = false; paint();
    root.querySelector('summary')!.focus({ preventScroll: true }); root.scrollIntoView({ block: "start" });
  }, options));
  close.addEventListener("click", () => {
    root.open = false;
    if (returnPoint) {
      returnPoint.link.focus({ preventScroll: true });
      window.scrollBy(0, returnPoint.link.getBoundingClientRect().top - returnPoint.top);
    } else root.querySelector('summary')!.focus({ preventScroll: true });
  }, options);
  window.addEventListener("hashchange", restore, options);
  let printState: { open: boolean; inspecting: boolean } | undefined;
  window.addEventListener("beforeprint", () => {
    printState = { open: root.open, inspecting };
    root.open = true; inspecting = false; paint();
  }, options);
  window.addEventListener("afterprint", () => {
    if (!printState) return;
    root.open = printState.open; inspecting = printState.inspecting; paint(); printState = undefined;
  }, options);
  window.addEventListener("pagehide", event => {
    if (event.persisted) return;
    abort.abort(); focus.dispose();
  }, options);
  modes.hidden = false; close.hidden = false; paint(); restore();
}
