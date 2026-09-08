import { readKpFocusDeckScrubberKeyTarget } from "./focus-deck-scaffold.ts";

/** One focused card owns semantic navigation. Keyboard input cannot take the
 * range's fractional sampling path or move native prose independently. */
export function bindKpFocusDeckKeyboard(input: {
  readonly card: HTMLElement;
  readonly slider: HTMLInputElement;
  readonly enabled: () => boolean;
  readonly position: () => number;
  readonly checkpointCount: () => number;
  readonly navigate: (checkpoint: number) => void;
}): () => void {
  const { card, slider } = input;
  const addedTabStop = !card.hasAttribute("tabindex");
  if (addedTabStop) card.tabIndex = 0;
  const keydown = (event: KeyboardEvent) => {
    if (!input.enabled() || event.shiftKey || !(event.target instanceof Element)) return;
    const target = event.target;
    if (target.closest("[data-kp-focus-deck]") !== card) return;
    if (target !== slider && target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="combobox"],[role="listbox"],[role="spinbutton"]')) return;
    // Up/Down remain native passage/page scrolling except on the range itself.
    if (target !== slider && (event.key === "ArrowUp" || event.key === "ArrowDown")) return;
    const checkpoint = readKpFocusDeckScrubberKeyTarget(event, input.position(), input.checkpointCount());
    if (checkpoint === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    input.navigate(checkpoint);
  };
  card.addEventListener("keydown", keydown);
  return () => {
    card.removeEventListener("keydown", keydown);
    if (addedTabStop) card.removeAttribute("tabindex");
  };
}
