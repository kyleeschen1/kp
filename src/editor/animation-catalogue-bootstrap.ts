export type KpAnimationCatalogueBootstrapState =
  | Readonly<{
      readonly status: "loading";
      readonly animationId: string;
      readonly title: string;
    }>
  | Readonly<{
      readonly status: "selected";
      readonly animationId: string;
      readonly title: string;
      readonly packId: string;
    }>
  | Readonly<{
      readonly status: "not-found";
      readonly animationId: string;
    }>
  | Readonly<{
      readonly status: "error";
      readonly animationId: string;
      readonly message: string;
    }>;

export function renderKpAnimationCatalogueBootstrap(
  state: KpAnimationCatalogueBootstrapState
): string {
  const animationId = escapeHtml(state.animationId);
  const packAttribute = state.status === "selected"
    ? ` data-kp-animation-catalogue-pack-id="${escapeHtml(state.packId)}"`
    : "";
  return `<main class="kp-animation-catalogue-bootstrap" data-kp-animation-catalogue data-kp-animation-catalogue-state="${state.status}" data-kp-animation-catalogue-selection="${animationId}"${packAttribute} aria-label="Animation catalogue" aria-busy="${state.status === "loading"}">
    ${renderStatus(state)}
  </main>`;
}

function renderStatus(state: KpAnimationCatalogueBootstrapState): string {
  switch (state.status) {
    case "loading":
      return `<p role="status">Preparing ${escapeHtml(state.title)}…</p>`;
    case "selected":
      return `<p role="status"><strong>${escapeHtml(state.title)}</strong> is selected.</p>`;
    case "not-found":
      return `<p role="alert">Artifact <code>${escapeHtml(state.animationId)}</code> was not found.</p>`;
    case "error":
      return `<p role="alert">${escapeHtml(state.message)}</p>`;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
