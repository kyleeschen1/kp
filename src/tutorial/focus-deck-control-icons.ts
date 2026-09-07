export type KpFocusDeckControlIconId =
  | "next"
  | "pause"
  | "play"
  | "previous"
  | "replay";

const paths: Readonly<Record<KpFocusDeckControlIconId, string>> = {
  previous:
    '<path d="M19 12H5m6-6-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter"/>',
  next:
    '<path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter"/>',
  play: '<path d="M8 5.5 18.5 12 8 18.5Z" fill="currentColor"/>',
  pause:
    '<path d="M7.25 5.5h3.5v13h-3.5zM14.25 5.5h3.5v13h-3.5z" fill="currentColor"/>',
  replay:
    '<path d="M19 8V4m0 0h-4m4 0-3.1 3.1A7 7 0 1 0 19 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter"/>'
};

export function renderKpFocusDeckControlIcon(
  iconId: KpFocusDeckControlIconId
): string {
  return `<svg class="kp-focus-deck-control__icon" data-kp-focus-deck-control-icon="${iconId}" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">${paths[iconId]}</svg>`;
}

export function projectKpFocusDeckControl(input: {
  readonly button: HTMLButtonElement;
  readonly iconId: KpFocusDeckControlIconId;
  readonly accessibleLabel: string;
  /**
   * A retained generic player compares textContent before synchronizing its
   * own face. Keeping its status word visually hidden lets this projection own
   * the icon without rebuilding the button on every sampled frame.
   */
  readonly compatibilityText?: string | undefined;
}): void {
  const { button, iconId, accessibleLabel } = input;
  const compatibilityText = input.compatibilityText ?? "";
  const currentIcon = button.querySelector<SVGElement>(
    "[data-kp-focus-deck-control-icon]"
  )?.dataset["kpFocusDeckControlIcon"];
  if (currentIcon !== iconId || button.textContent !== compatibilityText) {
    const template = button.ownerDocument.createElement("template");
    template.innerHTML = renderKpFocusDeckControlIcon(iconId);
    const icon = template.content.firstElementChild;
    if (!(icon instanceof SVGElement)) {
      throw new Error(`Could not create Focus Deck ${iconId} icon.`);
    }
    const children: Node[] = [icon];
    if (compatibilityText !== "") {
      const label = button.ownerDocument.createElement("span");
      label.className = "kp-focus-deck-control__compatibility-label";
      label.textContent = compatibilityText;
      children.push(label);
    }
    button.replaceChildren(...children);
  }
  if (button.getAttribute("aria-label") !== accessibleLabel) {
    button.setAttribute("aria-label", accessibleLabel);
  }
  if (button.title !== accessibleLabel) button.title = accessibleLabel;
}
