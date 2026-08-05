export interface KpTutorialSemanticTransitProxyRegistration {
  readonly transitId: string;
  readonly source: HTMLElement;
}

export interface KpTutorialSemanticTransitProxyPaint {
  readonly progress: number;
  readonly x: number;
  readonly y: number;
  readonly visible: boolean;
}

export type KpTutorialSemanticTransitProxyState =
  | "animated"
  | "geometry-pending"
  | "phone-static"
  | "reduced-motion-static";

/** Fixed visual copies preserve both endpoint nodes, selection, and layout. */
export class KpTutorialSemanticTransitProxyLayer {
  readonly host: HTMLElement;
  private readonly proxies = new Map<string, HTMLElement>();

  constructor(root: HTMLElement) {
    const host = root.ownerDocument.createElement("kp-semantic-transit-layer");
    host.className = "kp-tutorial-semantic-transit-layer";
    host.dataset["kpTutorialSemanticTransitLayer"] = "viewport";
    host.setAttribute("aria-hidden", "true");
    host.setAttribute("inert", "");
    root.append(host);
    this.host = host;
  }

  mountProxy(
    registration: KpTutorialSemanticTransitProxyRegistration
  ): HTMLElement {
    const transitId = slug(registration.transitId);
    const extant = this.proxies.get(transitId);
    if (extant !== undefined) return extant;
    const proxy = this.host.ownerDocument.createElement("span");
    proxy.className = "kp-tutorial-semantic-transit-layer__proxy";
    proxy.dataset["kpTutorialSemanticTransitProxy"] = transitId;
    const visual = registration.source.cloneNode(true) as HTMLElement;
    stripSemanticIdentity(visual);
    visual.dataset["kpTutorialSemanticTransitVisual"] = transitId;
    proxy.append(visual);
    this.host.append(proxy);
    this.proxies.set(transitId, proxy);
    return proxy;
  }

  proxy(transitId: string): HTMLElement | undefined {
    return this.proxies.get(transitId);
  }

  paintProxy(
    transitId: string,
    paint: KpTutorialSemanticTransitProxyPaint
  ): void {
    const proxy = this.proxies.get(transitId);
    if (proxy === undefined) {
      throw new Error(`Unknown semantic transit proxy: ${transitId}`);
    }
    proxy.dataset["kpTutorialSemanticTransitProgress"] =
      paint.progress.toFixed(4);
    proxy.dataset["kpTutorialSemanticTransitX"] = paint.x.toFixed(4);
    proxy.dataset["kpTutorialSemanticTransitY"] = paint.y.toFixed(4);
    proxy.dataset["kpTutorialSemanticTransitState"] = "animated";
    proxy.style.transform = `translate3d(${paint.x}px, ${paint.y}px, 0)`;
    proxy.style.visibility = paint.visible ? "visible" : "hidden";
    proxy.style.opacity = paint.visible ? "1" : "0";
  }

  hideProxy(
    transitId: string,
    state: Exclude<KpTutorialSemanticTransitProxyState, "animated">,
    progress?: number
  ): void {
    const proxy = this.proxies.get(transitId);
    if (proxy === undefined) {
      throw new Error(`Unknown semantic transit proxy: ${transitId}`);
    }
    proxy.dataset["kpTutorialSemanticTransitState"] = state;
    if (progress !== undefined) {
      proxy.dataset["kpTutorialSemanticTransitProgress"] =
        Math.max(0, Math.min(1, progress)).toFixed(4);
    }
    proxy.style.visibility = "hidden";
    proxy.style.opacity = "0";
  }

  dispose(): void {
    this.proxies.clear();
    this.host.remove();
  }
}

function stripSemanticIdentity(root: HTMLElement): void {
  for (const element of [root, ...root.querySelectorAll<HTMLElement>("*")]) {
    element.removeAttribute("id");
    element.removeAttribute("data-kp-tutorial-text-reference");
    element.removeAttribute("data-kp-tutorial-stage-object");
  }
}

function slug(value: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error("Semantic transit proxy id must be a lowercase slug.");
  }
  return value;
}
