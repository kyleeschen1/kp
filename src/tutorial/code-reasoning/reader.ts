const root = document.querySelector<HTMLElement>("[data-code-reasoning]");
if (root) {
  const inspection = root.querySelector<HTMLDetailsElement>("[data-code-inspection]")!;
  let session: ReturnType<typeof import("./inspection-session.ts").mountCodeReasoningInspection> | undefined;
  let loading: Promise<void> | undefined;
  let disposed = false;
  const reading = () => {
    delete root.dataset["codeView"];
    root.querySelector<HTMLElement>("[data-code-source-label]")!.hidden = true;
  };
  const inspecting = () => {
    root.dataset["codeView"] = "inspection";
    root.querySelector<HTMLElement>("[data-code-source-label]")!.hidden = false;
    root.querySelector<HTMLElement>("[data-code-source-label]")!.textContent = "Inspection · original available below";
    const original = root.querySelector<HTMLButtonElement>("[data-code-original]")!;
    original.textContent = "Show original";
    original.setAttribute("aria-pressed", "false");
  };
  const open = () => {
    if (!inspection.open) { session?.pause(); reading(); return; }
    if (session) inspecting();
    loading ??= import("./inspection-session.ts").then(module => {
      if (disposed) return;
      session = module.mountCodeReasoningInspection(root);
      if (!inspection.open) session.pause(); else inspecting();
    }).catch(error => {
      if (disposed) return;
      const message = root.querySelector<HTMLElement>("[data-code-error]")!;
      message.textContent = `Inspection unavailable: ${error instanceof Error ? error.message : String(error)} The written explanation is unchanged.`;
      message.hidden = false;
      root.querySelector<HTMLElement>(".code-controls")!.hidden = true;
      root.querySelector<HTMLElement>("[data-code-stage-host]")!.replaceChildren();
      root.dataset["codeReady"] = "repair";
      reading();
    });
  };
  inspection.hidden = false;
  inspection.addEventListener("toggle", open);
  if (new URL(location.href).searchParams.get("reading") === "focus") inspection.open = true;
  window.addEventListener("pagehide", event => {
    session?.pause();
    if (event.persisted) return;
    disposed = true;
    inspection.removeEventListener("toggle", open);
    session?.dispose();
  });
}
