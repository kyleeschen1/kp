export type KpTutorialTocDestinationKind =
  | "section"
  | "block"
  | "checkpoint";

export interface KpTutorialTocItem {
  readonly kind: KpTutorialTocDestinationKind;
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly children: readonly KpTutorialTocItem[];
}

export interface KpTutorialTocModel {
  readonly label: string;
  readonly items: readonly KpTutorialTocItem[];
}

export function renderKpTutorialToc(model: KpTutorialTocModel): string {
  return `<kp-tutorial-toc data-kp-tutorial-toc data-kp-tutorial-toc-enhancement="pending">
    <nav class="kp-tutorial-toc" aria-label="${escapeHtml(model.label)}">
      <p class="kp-tutorial-toc__label">${escapeHtml(model.label)}</p>
      ${renderItems(model.items, 0)}
    </nav>
  </kp-tutorial-toc>`;
}

function renderItems(items: readonly KpTutorialTocItem[], depth: number): string {
  if (items.length === 0) return "";
  return `<ol class="kp-tutorial-toc__list kp-tutorial-toc__list--depth-${depth}">
    ${items.map((item) => `<li data-kp-tutorial-toc-item="${item.kind}" data-kp-tutorial-toc-item-id="${escapeHtml(item.id)}">
      <a href="${escapeHtml(item.href)}" data-kp-tutorial-toc-link data-kp-tutorial-destination-kind="${item.kind}" data-kp-tutorial-destination-id="${escapeHtml(item.id)}">${escapeHtml(item.label)}</a>
      ${renderItems(item.children, depth + 1)}
    </li>`).join("")}
  </ol>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
