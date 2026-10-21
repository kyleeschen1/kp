/** Owns temporary DOM only. The revision session owns supersession, the mount
 * owns partial-resource cleanup on rejection, and the caller owns publication. */
export async function preparePreview<Surface extends { dispose(): void }>(
  display: HTMLElement,
  input: { readonly className: string; readonly html: string;
    readonly mount: (staging: HTMLDivElement) => Promise<Surface> }
) {
  const staging = display.ownerDocument.createElement("div");
  staging.className = input.className;
  staging.inert = true;
  staging.setAttribute("aria-hidden", "true");
  staging.style.width = `${display.getBoundingClientRect().width}px`;
  staging.innerHTML = input.html;
  display.after(staging);
  try {
    const surface = await input.mount(staging);
    let disposed = false;
    return Object.freeze({ staging, surface, dispose() {
      if (disposed) return;
      disposed = true;
      // Failed teardown must not strand an inert preview in the document.
      try { surface.dispose(); } finally { staging.remove(); }
    } });
  } catch (error) { staging.remove(); throw error; }
}
