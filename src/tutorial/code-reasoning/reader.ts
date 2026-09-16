const root = document.querySelector<HTMLElement>("[data-code-reasoning]");
if (root) {
  const inspection = root.querySelector<HTMLDetailsElement>("[data-code-inspection]")!;
  let session: ReturnType<typeof import("./inspection-session.ts").mountCodeReasoningInspection> | undefined;
  let loading: Promise<void> | undefined;
  let disposed = false;
  const open = () => {
    if (!inspection.open) { session?.pause(); return; }
    loading ??= import("./inspection-session.ts").then(module => {
      if (disposed) return;
      session = module.mountCodeReasoningInspection(root);
      if (!inspection.open) session.pause();
    }).catch(error => {
      if (disposed) return;
      const message = root.querySelector<HTMLElement>("[data-code-error]")!;
      message.textContent = `Inspection unavailable: ${error instanceof Error ? error.message : String(error)} The written explanation is unchanged.`;
      message.hidden = false;
      root.querySelector<HTMLElement>(".code-controls")!.hidden = true;
      root.querySelector<HTMLElement>("[data-code-stage-host]")!.replaceChildren();
      root.dataset["codeReady"] = "repair";
    });
  };
  inspection.hidden = false;
  inspection.addEventListener("toggle", open);
  window.addEventListener("pagehide", event => {
    session?.pause();
    if (event.persisted) return;
    disposed = true;
    inspection.removeEventListener("toggle", open);
    session?.dispose();
  });
}
