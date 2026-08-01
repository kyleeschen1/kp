import type {
  KpAnimationCatalogueEntry,
  KpAnimationCatalogueProjection
} from "./animation-catalogue-projection.ts";
import {
  readKpAnimationCatalogueRoute
} from "./animation-catalogue-route.ts";
import {
  resolveKpAnimationCatalogueSelection
} from "./animation-catalogue-selection.ts";

export interface KpAnimationCatalogueLinkEventState {
  readonly defaultPrevented: boolean;
  readonly button: number;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
}

export type KpAnimationCatalogueNativeNavigationReason =
  | "prevented"
  | "non-primary"
  | "modified"
  | "target"
  | "download"
  | "different-origin"
  | "different-path"
  | "other-view"
  | "unknown-artifact";

export type KpAnimationCatalogueLinkNavigationDecision =
  | Readonly<{
      readonly action: "native";
      readonly reason: KpAnimationCatalogueNativeNavigationReason;
    }>
  | Readonly<{
      readonly action: "stay";
      readonly animationId: string;
    }>
  | Readonly<{
      readonly action: "select";
      readonly entry: KpAnimationCatalogueEntry;
      readonly playhead?: number | undefined;
      readonly href: string;
      readonly history: "push";
    }>;

export type KpAnimationCatalogueHistoryNavigationDecision =
  | Readonly<{ readonly action: "leave-catalogue" }>
  | Readonly<{
      readonly action: "not-found";
      readonly requestedArtifactId: string;
    }>
  | Readonly<{
      readonly action: "select";
      readonly entry: KpAnimationCatalogueEntry;
      readonly playhead?: number | undefined;
      readonly history: "none";
    }>;

export function decideKpAnimationCatalogueLinkNavigation(input: {
  readonly projection: KpAnimationCatalogueProjection;
  readonly currentAnimationId: string;
  readonly currentHref: string;
  readonly href: string;
  readonly event: KpAnimationCatalogueLinkEventState;
  readonly target?: string | undefined;
  readonly download?: boolean | undefined;
}): KpAnimationCatalogueLinkNavigationDecision {
  const browserOwned = browserOwnedReason(input);
  if (browserOwned !== undefined) return native(browserOwned);

  const current = new URL(input.currentHref);
  const destination = new URL(input.href, current);
  if (destination.origin !== current.origin) {
    return native("different-origin");
  }
  if (destination.pathname !== current.pathname) {
    return native("different-path");
  }
  const route = readKpAnimationCatalogueRoute(destination.search);
  if (!route.active) return native("other-view");
  const selection = resolveKpAnimationCatalogueSelection({
    projection: input.projection,
    artifactId: route.artifactId
  });
  if (selection.status === "not-found") {
    return native("unknown-artifact");
  }
  if (selection.entry.animationId === input.currentAnimationId) {
    return Object.freeze({
      action: "stay" as const,
      animationId: selection.entry.animationId
    });
  }
  return Object.freeze({
    action: "select" as const,
    entry: selection.entry,
    ...(route.playhead === undefined ? {} : { playhead: route.playhead }),
    href: `${destination.pathname}${destination.search}${destination.hash}`,
    history: "push" as const
  });
}

export function resolveKpAnimationCatalogueHistoryNavigation(input: {
  readonly projection: KpAnimationCatalogueProjection;
  readonly href: string;
}): KpAnimationCatalogueHistoryNavigationDecision {
  const destination = new URL(input.href);
  const route = readKpAnimationCatalogueRoute(destination.search);
  if (!route.active) {
    return Object.freeze({ action: "leave-catalogue" as const });
  }
  const selection = resolveKpAnimationCatalogueSelection({
    projection: input.projection,
    artifactId: route.artifactId
  });
  if (selection.status === "not-found") {
    return Object.freeze({
      action: "not-found" as const,
      requestedArtifactId: selection.requestedArtifactId
    });
  }
  return Object.freeze({
    action: "select" as const,
    entry: selection.entry,
    ...(route.playhead === undefined ? {} : { playhead: route.playhead }),
    history: "none" as const
  });
}

function browserOwnedReason(input: {
  readonly event: KpAnimationCatalogueLinkEventState;
  readonly target?: string | undefined;
  readonly download?: boolean | undefined;
}): KpAnimationCatalogueNativeNavigationReason | undefined {
  if (input.event.defaultPrevented) return "prevented";
  if (input.event.button !== 0) return "non-primary";
  if (
    input.event.altKey || input.event.ctrlKey || input.event.metaKey ||
    input.event.shiftKey
  ) return "modified";
  if (input.target !== undefined && input.target !== "" &&
    input.target !== "_self") return "target";
  if (input.download === true) return "download";
  return undefined;
}

function native(
  reason: KpAnimationCatalogueNativeNavigationReason
): KpAnimationCatalogueLinkNavigationDecision {
  return Object.freeze({ action: "native" as const, reason });
}
