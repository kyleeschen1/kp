import {
  createKpAnimationLibraryDisplayCatalog,
  type KpAnimationLibraryDisplayEntry,
  type KpAnimationLibraryDisplayRepresentation
} from "../editor/animation-library-display-catalog.ts";
import {
  isKpAnimationHostStatusMessage,
  type KpAnimationHostStatusMessage
} from "../rendering/animation-host-status.ts";

// Keep the development branch at module scope so production erases the
// feedback client while local review always mounts one persistent shell.
const loadAnimationLibraryReview =
  import.meta.env.DEV
    ? () => import("../dev-review/animation-library-review-bootstrap.ts")
    : undefined;

const defaultAnimationId =
  "animation.generated.radical.square-root-as-power";
const catalog = createKpAnimationLibraryDisplayCatalog();
const root = required<HTMLElement>(
  document,
  "[data-kp-animation-library]"
);
const count = required<HTMLElement>(
  root,
  "[data-animation-library-count]"
);
const search = required<HTMLInputElement>(
  root,
  "[data-animation-library-search]"
);
const resultStatus = required<HTMLElement>(
  root,
  "[data-animation-library-results]"
);
const list = required<HTMLOListElement>(
  root,
  "[data-animation-library-list]"
);
const title = required<HTMLElement>(
  root,
  "[data-animation-library-title]"
);
const summary = required<HTMLElement>(
  root,
  "[data-animation-library-summary]"
);
const state = required<HTMLElement>(
  root,
  "[data-animation-library-state]"
);
const representations = required<HTMLElement>(
  root,
  "[data-animation-library-representations]"
);
const openOriginal = required<HTMLAnchorElement>(
  root,
  "[data-animation-library-open]"
);
const viewport = required<HTMLElement>(
  root,
  "[data-animation-library-viewport-shell]"
);
const frame = required<HTMLIFrameElement>(
  root,
  "[data-animation-library-frame]"
);
const empty = required<HTMLElement>(
  root,
  "[data-animation-library-empty]"
);
const errorPanel = required<HTMLElement>(
  root,
  "[data-animation-library-error]"
);
const errorMessage = required<HTMLElement>(
  root,
  "[data-animation-library-error-message]"
);
const retry = required<HTMLButtonElement>(
  root,
  "[data-animation-library-retry]"
);
const status = required<HTMLOutputElement>(
  root,
  "[data-animation-library-status]"
);

let query = readParameter("q") ?? "";
let selectedAnimationId =
  readParameter("animation") ?? defaultAnimationId;
let selectedRepresentationId =
  readParameter("representation");
let selectedViewport: "wide" | "phone" =
  readParameter("viewport") === "phone"
  ? "phone"
  : "wide";
let mountedEntry: KpAnimationLibraryDisplayEntry | undefined;
let mountedRepresentation:
  | KpAnimationLibraryDisplayRepresentation
  | undefined;
let expectedFrameHref: string | undefined;
let acceptingHostStatus = false;
let hostReadinessTimeout:
  | ReturnType<typeof window.setTimeout>
  | undefined;

count.textContent = `${catalog.length} animations`;
search.value = query;
setViewport(selectedViewport, false);
renderCatalog();
renderSelection(false);

search.addEventListener("input", () => {
  query = search.value.trim();
  renderCatalog();
  writeRoute(false);
});
root
  .querySelectorAll<HTMLButtonElement>(
    "[data-animation-library-viewport]"
  )
  .forEach((button) => {
    button.addEventListener("click", () => {
      const value = button.dataset["animationLibraryViewport"];
      if (value === "wide" || value === "phone") {
        setViewport(value, true);
      }
    });
  });
frame.addEventListener("load", inspectLoadedHost);
window.addEventListener("message", (event) => {
  if (
    !acceptingHostStatus ||
    event.source !== frame.contentWindow ||
    event.origin !== location.origin ||
    !isKpAnimationHostStatusMessage(event.data)
  ) return;
  applyHostStatus(event.data);
});
retry.addEventListener("click", () => {
  if (mountedEntry === undefined || mountedRepresentation === undefined) {
    return;
  }
  mountRepresentation(mountedEntry, mountedRepresentation);
});
window.addEventListener("popstate", () => {
  query = readParameter("q") ?? "";
  selectedAnimationId =
    readParameter("animation") ?? defaultAnimationId;
  selectedRepresentationId = readParameter("representation");
  selectedViewport = readParameter("viewport") === "phone"
    ? "phone"
    : "wide";
  search.value = query;
  setViewport(selectedViewport, false);
  renderCatalog();
  renderSelection(false);
});

root.dataset["catalogReady"] = "true";
void loadAnimationLibraryReview?.().then(
  ({ mountKpAnimationLibraryDevReview }) => {
    mountKpAnimationLibraryDevReview(window);
  }
);

function renderCatalog(): void {
  const normalized = query.toLocaleLowerCase();
  const visible = catalog.filter((entry) =>
    normalized === "" ||
    [
      entry.title,
      entry.animationId,
      entry.summary,
      ...entry.tags,
      ...entry.representations.flatMap((representation) => [
        representation.label,
        representation.kind
      ])
    ].some((value) => value.toLocaleLowerCase().includes(normalized))
  );
  list.replaceChildren(
    ...visible.map((entry) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      const heading = document.createElement("strong");
      const metadata = document.createElement("span");
      button.type = "button";
      button.dataset["animationId"] = entry.animationId;
      button.dataset["featured"] = String(entry.featured);
      button.dataset["canonicalFormat"] = entry.canonicalFormat;
      button.dataset["availability"] = entry.availability;
      button.setAttribute(
        "aria-pressed",
        String(entry.animationId === selectedAnimationId)
      );
      heading.textContent = entry.title;
      metadata.textContent =
        `${canonicalFormatLabel(entry.canonicalFormat)} · ` +
        `${entry.availability} · ` +
        `${entry.representations.length} ` +
        `${entry.representations.length === 1 ? "host" : "hosts"}`;
      button.append(heading, metadata);
      button.addEventListener("click", () => {
        selectedAnimationId = entry.animationId;
        selectedRepresentationId = entry.primaryRepresentationId;
        renderCatalog();
        renderSelection(true);
      });
      item.append(button);
      return item;
    })
  );
  resultStatus.textContent =
    `${visible.length} of ${catalog.length} animations`;
}

function renderSelection(updateRoute: boolean): void {
  const entry =
    catalog.find(
      (candidate) => candidate.animationId === selectedAnimationId
    ) ??
    catalog.find(
      (candidate) => candidate.animationId === defaultAnimationId
    ) ??
    catalog[0];
  if (entry === undefined) {
    throw new Error("Animation Library catalog must not be empty.");
  }
  selectedAnimationId = entry.animationId;
  const representation =
    entry.representations.find(
      (candidate) => candidate.id === selectedRepresentationId
    ) ??
    entry.representations.find(
      (candidate) => candidate.id === entry.primaryRepresentationId
    ) ??
    entry.representations[0];
  selectedRepresentationId = representation?.id;

  root.dataset["animationId"] = entry.animationId;
  root.dataset["representationId"] =
    representation?.id ?? "unpublished";
  root.dataset["canonicalFormat"] = entry.canonicalFormat;
  root.dataset["previewReady"] = "false";
  title.textContent = entry.title;
  summary.textContent = entry.summary;
  state.textContent =
    `${canonicalFormatLabel(entry.canonicalFormat)} · ` +
    `${entry.availability} · ` +
    `${entry.featured ? "featured exemplar" : "catalog"}`;
  renderRepresentations(entry, representation);
  mountRepresentation(entry, representation);
  if (updateRoute) writeRoute(true);
}

function canonicalFormatLabel(
  format: KpAnimationLibraryDisplayEntry["canonicalFormat"]
): string {
  switch (format) {
    case "ported": return "ported";
    case "partial": return "partial port";
    case "legacy": return "legacy";
  }
}

function renderRepresentations(
  entry: KpAnimationLibraryDisplayEntry,
  selected: KpAnimationLibraryDisplayRepresentation | undefined
): void {
  representations.replaceChildren(
    ...entry.representations.map((representation) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset["representationId"] = representation.id;
      button.dataset["role"] = representation.role;
      button.setAttribute(
        "aria-pressed",
        String(representation.id === selected?.id)
      );
      button.textContent =
        `${representation.label} · ${representation.kind}`;
      button.addEventListener("click", () => {
        selectedRepresentationId = representation.id;
        renderSelection(true);
      });
      return button;
    })
  );
  if (entry.representations.length === 0) {
    const message = document.createElement("span");
    message.textContent = "No live representation published.";
    representations.append(message);
  }
}

function mountRepresentation(
  entry: KpAnimationLibraryDisplayEntry,
  representation: KpAnimationLibraryDisplayRepresentation | undefined
): void {
  mountedEntry = entry;
  mountedRepresentation = representation;
  clearHostReadinessTimeout();
  acceptingHostStatus = false;
  root.dataset["previewReady"] = "false";
  errorPanel.hidden = true;
  errorMessage.textContent = "";
  if (representation === undefined) {
    frame.hidden = true;
    empty.hidden = false;
    frame.src = "about:blank";
    expectedFrameHref = undefined;
    openOriginal.hidden = true;
    status.value = "Planned identity; no live host.";
    return;
  }
  frame.hidden = false;
  empty.hidden = true;
  openOriginal.hidden = false;
  openOriginal.href = representation.href;
  frame.title = `${entry.title} · ${representation.label}`;
  status.value = `Loading ${representation.label}…`;
  expectedFrameHref = new URL(representation.href, location.href).href;
  // Reload even when two catalog representations share a URL. Reusing a
  // prior document would let a stale ready state certify the new selection.
  if (frame.getAttribute("src") === "about:blank") {
    frame.src = representation.href;
  } else {
    frame.src = "about:blank";
    window.queueMicrotask(() => {
      if (mountedRepresentation === representation) {
        frame.src = representation.href;
      }
    });
  }
  hostReadinessTimeout = window.setTimeout(() => {
    failHost(
      "The host loaded no certified animation frame within 12 seconds."
    );
  }, 12_000);
}

function inspectLoadedHost(): void {
  if (
    expectedFrameHref === undefined ||
    frame.contentWindow?.location.href !== expectedFrameHref
  ) return;
  acceptingHostStatus = true;
  const body = frame.contentDocument?.body;
  const hostStatus = body?.dataset["kpAnimationHostStatus"];
  if (hostStatus === "ready") {
    readyHost();
  } else if (hostStatus === "failed") {
    failHost(
      body?.dataset["kpAnimationHostError"] ??
      "The animation host reported a render failure."
    );
  }
}

function applyHostStatus(message: KpAnimationHostStatusMessage): void {
  switch (message.status) {
    case "loading":
      status.value = `Rendering ${mountedRepresentation?.label ?? "host"}…`;
      return;
    case "ready":
      readyHost();
      return;
    case "failed":
      failHost(message.message ?? "The animation host failed to render.");
  }
}

function readyHost(): void {
  clearHostReadinessTimeout();
  frame.hidden = false;
  errorPanel.hidden = true;
  status.value = "Selected host ready.";
  root.dataset["previewReady"] = "true";
}

function failHost(message: string): void {
  clearHostReadinessTimeout();
  frame.hidden = true;
  errorPanel.hidden = false;
  errorMessage.textContent = message;
  status.value = "Selected host failed.";
  root.dataset["previewReady"] = "false";
}

function clearHostReadinessTimeout(): void {
  if (hostReadinessTimeout !== undefined) {
    window.clearTimeout(hostReadinessTimeout);
    hostReadinessTimeout = undefined;
  }
}

function setViewport(
  value: "wide" | "phone",
  updateRoute: boolean
): void {
  selectedViewport = value;
  viewport.dataset["animationLibraryViewportShell"] = value;
  root
    .querySelectorAll<HTMLButtonElement>(
      "[data-animation-library-viewport]"
    )
    .forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset["animationLibraryViewport"] === value)
      );
    });
  if (updateRoute) writeRoute(true);
}

function writeRoute(push: boolean): void {
  const url = new URL(location.href);
  setParameter(url, "q", query);
  setParameter(url, "animation", selectedAnimationId);
  setParameter(url, "representation", selectedRepresentationId);
  setParameter(
    url,
    "viewport",
    selectedViewport === "wide" ? undefined : selectedViewport
  );
  const method = push ? "pushState" : "replaceState";
  history[method](null, "", url);
}

function readParameter(name: string): string | undefined {
  const value = new URL(location.href).searchParams.get(name)?.trim();
  return value === undefined || value === "" ? undefined : value;
}

function setParameter(
  url: URL,
  name: string,
  value: string | undefined
): void {
  if (value === undefined || value === "") url.searchParams.delete(name);
  else url.searchParams.set(name, value);
}

function required<T extends Element>(
  rootNode: ParentNode,
  selector: string
): T {
  const element = rootNode.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`Animation Library requires ${selector}.`);
  }
  return element;
}
