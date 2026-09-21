import { createKpReaderSemanticFocusService } from "../../reader/runtime/semantic-focus.ts";
import generated from "../../semantic/centroid-extraction.generated.json" with { type: "json" };

export function mountCentroidRelation(root: HTMLElement) {
  if (root.dataset["centroidSourcePin"] !== generated.sourcePin) throw new Error("Centroid relationship needs repair: source revision mismatch");
  const get = <T extends HTMLElement>(selector: string) => {
    const node = root.querySelector<T>(selector);
    if (!node) throw new Error(`Centroid relationship needs repair: ${selector}`);
    return node;
  };
  const call = get<HTMLButtonElement>("[data-centroid-relation-call]");
  const helper = get<HTMLElement>("[data-centroid-relation-helper]");
  const before = get<HTMLButtonElement>("[data-centroid-relation-before]");
  const clear = get<HTMLButtonElement>("[data-centroid-relation-clear]");
  const sources = [get<HTMLElement>('[data-relation-source="after"]'), get<HTMLElement>('[data-relation-source="before"]')];
  const callRole = generated.causalContract.contributors.find(role => role.sourceContributorRoleId === "role.centroid.x.calculation")?.targetCallRoleId;
  const helperRole = generated.causalContract.introducedHelper.declarationRoleId;
  if (!callRole || call.dataset["relationRole"] !== callRole || helper.dataset["relationRole"] !== helperRole) throw new Error("Centroid relationship needs repair: unknown call/helper binding");
  const focus = createKpReaderSemanticFocusService([callRole, helperRole]);
  const abort = new AbortController(), options = { signal: abort.signal };
  let original = false;
  const render = () => {
    const selected = focus.getSnapshot().objectRefs.length > 0;
    root.dataset["relationSelected"] = String(selected);
    root.dataset["relationBefore"] = String(original);
    call.setAttribute("aria-pressed", String(selected)); clear.disabled = !selected;
    before.setAttribute("aria-pressed", String(original));
    before.textContent = original ? "Return to helper" : "Show before extraction";
    sources.forEach((source, index) => { const current = original === (index === 1); source.inert = !current; source.setAttribute("aria-hidden", String(!current)); });
    const noteRole = original ? "before" : selected ? "selected" : "idle";
    root.querySelectorAll<HTMLElement>("[data-relation-note]").forEach(note => note.setAttribute("aria-hidden", String(note.dataset["relationNote"] !== noteRole)));
  };
  const clearFocus = () => { focus.clear("keyboard"); focus.clear("pointer"); };
  call.addEventListener("click", event => {
    const selected = focus.getSnapshot().objectRefs.length > 0; clearFocus();
    if (!selected) focus.set(event.detail === 0 ? "keyboard" : "pointer", [callRole, helperRole]);
  }, options);
  clear.addEventListener("click", () => { clearFocus(); (original ? before : call).focus({ preventScroll: true }); }, options);
  root.addEventListener("keydown", event => { if (event.key === "Escape") clearFocus(); }, options);
  before.addEventListener("click", () => {
    original = !original; render();
    get<HTMLElement>("[data-centroid-relation-status]").textContent = original ? "Before extraction. Your relationship selection is retained." : "Returned to the helper. Your relationship selection is retained.";
  }, options);
  const off = focus.subscribe(render);
  render(); call.disabled = false;
  return () => { abort.abort(); off(); focus.dispose(); };
}
