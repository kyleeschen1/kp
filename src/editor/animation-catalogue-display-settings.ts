import {
  kpGestaltStyleKey,
  kpOrganicSubtleStyleRef,
  kpRestrainedEditorialStyleRef
} from "../animation/gestalt-base-styles.ts";
import type {
  KpAnimationDevelopmentDisplaySettings,
  KpAnimationDevelopmentStyle
} from "./animation-development-url-state.ts";
import {
  applyKpEditorAnimationPresentationTuning
} from "./animation-player-controller.ts";

const playerStyleByUrlStyle: Readonly<
  Record<KpAnimationDevelopmentStyle, string>
> = Object.freeze({
  "organic-subtle": kpGestaltStyleKey(kpOrganicSubtleStyleRef),
  "restrained-editorial": kpGestaltStyleKey(kpRestrainedEditorialStyleRef)
});

export function projectKpAnimationCatalogueDisplaySettings(input: {
  readonly shell: HTMLElement;
  readonly display: KpAnimationDevelopmentDisplaySettings;
}): void {
  const player = input.shell.querySelector<HTMLElement>(
    "[data-kp-editor-animation-player]"
  );
  if (player === null) return;
  const styleValue = playerStyleByUrlStyle[input.display.style];
  syncSelects(input.shell, "gestalt-style", styleValue);
  syncSelects(input.shell, "focus-experiment", input.display.focus);
  applyKpEditorAnimationPresentationTuning(
    player,
    "gestalt-style",
    styleValue
  );
  applyKpEditorAnimationPresentationTuning(
    player,
    "focus-experiment",
    input.display.focus
  );
}

export function updateKpAnimationCatalogueDisplaySettings(input: {
  readonly current: KpAnimationDevelopmentDisplaySettings;
  readonly select: HTMLSelectElement;
}): KpAnimationDevelopmentDisplaySettings | undefined {
  const kind = input.select.dataset["kpAnimationCatalogueTuning"];
  if (kind === "gestalt-style") {
    const style = Object.entries(playerStyleByUrlStyle).find(
      ([_urlStyle, playerStyle]) => playerStyle === input.select.value
    )?.[0] as KpAnimationDevelopmentStyle | undefined;
    return style === undefined
      ? undefined
      : Object.freeze({ ...input.current, style });
  }
  if (kind === "focus-experiment" && (
    input.select.value === "flat" ||
    input.select.value === "elevated" ||
    input.select.value === "no-depth"
  )) {
    return Object.freeze({
      ...input.current,
      focus: input.select.value
    });
  }
  return undefined;
}

function syncSelects(
  shell: HTMLElement,
  kind: "gestalt-style" | "focus-experiment",
  value: string
): void {
  const selectors = kind === "gestalt-style"
    ? [
        '[data-kp-animation-catalogue-tuning="gestalt-style"]',
        "[data-kp-editor-animation-gestalt-style-control]"
      ]
    : [
        '[data-kp-animation-catalogue-tuning="focus-experiment"]',
        "[data-kp-editor-animation-focus-experiment-control]"
      ];
  shell.querySelectorAll<HTMLSelectElement>(selectors.join(", "))
    .forEach((select) => {
      select.value = value;
    });
}
