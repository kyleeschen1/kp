import {
  kpEigenvectorBeatIds,
  parseKpEigenvectorBeatHash,
  type KpEigenvectorBeatId
} from "./eigenvector-endpoints.ts";
import { kpEigenvectorSemanticRegistry } from "./eigenvector-semantics.ts";

export interface KpEigenvectorLocation {
  readonly beatId: KpEigenvectorBeatId;
  readonly focusObjectId?: string;
}

export function decodeKpEigenvectorLocation(
  href: string
): KpEigenvectorLocation {
  const url = new URL(href, "https://kinetic.press");
  const beatId = parseKpEigenvectorBeatHash(url.hash) ??
    kpEigenvectorBeatIds[0];
  const requestedFocus = url.searchParams.get("focus") ?? undefined;
  const focusObjectId = kpEigenvectorSemanticRegistry.some(
    ({ id }) => id === requestedFocus
  ) ? requestedFocus : undefined;
  return {
    beatId,
    ...(focusObjectId === undefined ? {} : { focusObjectId })
  };
}

export function encodeKpEigenvectorLocation(
  href: string,
  location: KpEigenvectorLocation
): string {
  const url = new URL(href, "https://kinetic.press");
  url.hash = location.beatId;
  if (location.focusObjectId === undefined) {
    url.searchParams.delete("focus");
  } else {
    url.searchParams.set("focus", location.focusObjectId);
  }
  return url.href;
}

/** Direct semantic entry is painted by identity, never by glyph or geometry. */
export function paintKpEigenvectorDirectFocus(
  root: HTMLElement,
  focusObjectId: string | undefined
): void {
  if (focusObjectId === undefined) delete root.dataset["kpFocusObject"];
  else root.dataset["kpFocusObject"] = focusObjectId;
  for (const element of root.querySelectorAll<HTMLElement | SVGElement>(
    "[data-kp-semantic-object]"
  )) {
    const focused = focusObjectId !== undefined &&
      element.getAttribute("data-kp-semantic-object") === focusObjectId;
    if (focused) element.setAttribute("data-kp-direct-focus", "true");
    else element.removeAttribute("data-kp-direct-focus");
  }
}
