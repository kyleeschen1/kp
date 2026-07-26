import {
  projectKpGovernedCanonicalConstructionCohort
} from "../authoring/governed-canonical-construction-projections.ts";

type ReviewArtifact = "fraction-split" | "fraction-merge" | "cohort";
type ReviewViewport = "wide" | "phone";
type ReviewMotion = "full" | "reduced";

const root = required<HTMLElement>(
  document,
  "[data-kp-canonical-animation-review]"
);
const frame = required<HTMLIFrameElement>(root, "[data-review-frame]");
const viewportShell = required<HTMLElement>(
  root,
  "[data-review-viewport-shell]"
);
const progress = required<HTMLInputElement>(root, "[data-review-progress]");
const play = required<HTMLButtonElement>(root, "[data-review-play]");
const rewind = required<HTMLButtonElement>(root, "[data-review-rewind]");
const status = required<HTMLOutputElement>(root, "[data-review-status]");
const owner = required<HTMLElement>(root, "[data-review-owner]");
const diagnostics = required<HTMLElement>(root, "[data-review-diagnostics]");
const projectionList = required<HTMLOListElement>(
  root,
  "[data-review-projections]"
);
let artifact: ReviewArtifact = "fraction-split";
let viewport: ReviewViewport = "wide";
let motion: ReviewMotion = "full";
let monitorFrame: number | undefined;
let loadRevision = 0;

renderProjectionParity();
root.querySelectorAll<HTMLButtonElement>("[data-review-artifact]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      const value = button.dataset["reviewArtifact"];
      if (
        value === "fraction-split" ||
        value === "fraction-merge" ||
        value === "cohort"
      ) {
        artifact = value;
        setPressed("[data-review-artifact]", value, "reviewArtifact");
        loadArtifact();
      }
    });
  });
root.querySelectorAll<HTMLButtonElement>("[data-review-viewport]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      const value = button.dataset["reviewViewport"];
      if (value === "wide" || value === "phone") {
        viewport = value;
        viewportShell.dataset["reviewViewportShell"] = viewport;
        setPressed("[data-review-viewport]", value, "reviewViewport");
        refreshDiagnostics();
      }
    });
  });
root.querySelectorAll<HTMLButtonElement>("[data-review-motion]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      const value = button.dataset["reviewMotion"];
      if (value === "full" || value === "reduced") {
        motion = value;
        setPressed("[data-review-motion]", value, "reviewMotion");
        status.value = motion === "reduced"
          ? "Reduced review settles directly at native checkpoints."
          : "Full review delegates playback to the embedded canonical surface.";
      }
    });
  });
progress.addEventListener("input", () => {
  seekEmbedded(Number(progress.value));
});
play.addEventListener("click", () => {
  if (motion === "reduced") {
    seekEmbedded(1_000);
    return;
  }
  clickEmbeddedPlay(false);
});
rewind.addEventListener("click", () => {
  if (motion === "reduced") {
    seekEmbedded(0);
    return;
  }
  clickEmbeddedPlay(true);
});
loadArtifact();

function loadArtifact(): void {
  loadRevision += 1;
  const revision = loadRevision;
  const requestedArtifact = artifact;
  stopMonitor();
  progress.value = "0";
  status.value = "Loading live artifact…";
  owner.textContent = "Waiting for artifact";
  frame.title = artifact === "cohort"
    ? "Governed canonical animation cohort"
    : artifact === "fraction-split"
      ? "Canonical fraction split animation"
      : "Canonical fraction merge animation";
  const url = new URL("/glyph-reconciliation-experiment.html", location.href);
  if (artifact === "cohort") {
    url.searchParams.set("governedCompound", "1");
    url.searchParams.set("compoundProgress", "0");
    url.searchParams.set("reviewGallery", "cohort");
    url.hash = "glyph-compound-trace";
  } else {
    url.searchParams.set(
      "fractionDirection",
      artifact === "fraction-split" ? "split" : "merge"
    );
    url.searchParams.set("progress", "0");
    url.searchParams.set("reviewGallery", "fraction");
    url.hash = "glyph-fraction-exemplar";
  }
  frame.src = url.toString();
  void initializeEmbeddedFrame(revision, requestedArtifact);
}

async function initializeEmbeddedFrame(
  revision: number,
  requestedArtifact: ReviewArtifact
): Promise<void> {
  const readySelector = requestedArtifact === "cohort"
    ? '[data-compound-trace][data-governed-compound-ready="true"]'
    : '[data-kp-glyph-review][data-kp-ready="true"]';
  const sectionSelector = requestedArtifact === "cohort"
    ? "[data-compound-trace]"
    : "[data-fraction-card]";
  const sliderSelector = requestedArtifact === "cohort"
    ? "[data-compound-progress]"
    : "[data-fraction-card] [data-fraction-progress]";
  let document: Document | undefined;
  for (let attempt = 0; attempt < 600; attempt += 1) {
    if (revision !== loadRevision) return;
    const candidate = frame.contentDocument;
    if (
      candidate !== null &&
      candidate.querySelector(readySelector) !== null &&
      candidate.querySelector(sectionSelector) !== null &&
      candidate.querySelector(sliderSelector) !== null
    ) {
      document = candidate;
      break;
    }
    await nextFrame();
  }
  if (revision !== loadRevision) return;
  if (document === undefined) {
    throw new Error(`Embedded review did not expose ${readySelector}.`);
  }
  const slider = required<HTMLInputElement>(document, sliderSelector);
  slider.value = "0";
  slider.dispatchEvent(new Event("input", { bubbles: true }));
  progress.value = "0";
  root.dataset["reviewReady"] = "true";
  root.dataset["reviewArtifact"] = requestedArtifact;
  status.value = "Live canonical artifact ready for direct review.";
  refreshDiagnostics();
}

function seekEmbedded(value: number): void {
  const bounded = Math.max(0, Math.min(1_000, value));
  const slider = embeddedSlider();
  slider.value = String(Math.round(bounded));
  slider.dispatchEvent(new Event("input", { bubbles: true }));
  progress.value = slider.value;
  refreshDiagnostics();
}

function clickEmbeddedPlay(forceRewind: boolean): void {
  const slider = embeddedSlider();
  if (forceRewind && Number(slider.value) < 1_000) {
    seekEmbedded(1_000);
  } else if (!forceRewind && Number(slider.value) >= 1_000) {
    seekEmbedded(0);
  }
  const button = artifact === "cohort"
    ? required<HTMLButtonElement>(childDocument(), "[data-trace-play]")
    : required<HTMLButtonElement>(
        childDocument(),
        "[data-fraction-card] [data-play]"
      );
  button.click();
  monitorEmbeddedProgress();
}

function monitorEmbeddedProgress(): void {
  stopMonitor();
  const tick = (): void => {
    const slider = embeddedSlider();
    progress.value = slider.value;
    refreshDiagnostics();
    if (slider.disabled || (
      Number(slider.value) > 0 && Number(slider.value) < 1_000
    )) {
      monitorFrame = requestAnimationFrame(tick);
    } else {
      monitorFrame = undefined;
    }
  };
  monitorFrame = requestAnimationFrame(tick);
}

function stopMonitor(): void {
  if (monitorFrame !== undefined) cancelAnimationFrame(monitorFrame);
  monitorFrame = undefined;
}

function refreshDiagnostics(): void {
  const document = childDocument();
  const embedded = artifact === "cohort"
    ? document.querySelector<HTMLElement>("[data-compound-trace]")
    : document.querySelector<HTMLElement>("[data-kp-glyph-review]");
  if (embedded === null) return;
  const visualOwner = artifact === "cohort"
    ? embedded.dataset["governedCompoundVisualOwner"]
    : embedded.dataset["kpFractionVisualOwner"];
  const operation = artifact === "cohort"
    ? embedded.dataset["governedCompoundOperationId"]
    : embedded.dataset["kpFractionDirection"];
  const overflow =
    document.documentElement.scrollWidth -
    document.documentElement.clientWidth;
  owner.textContent = visualOwner ?? "Native endpoint";
  diagnostics.textContent =
    `${artifact.replaceAll("-", " ")} · ${operation ?? "checkpoint"} · ` +
    `${viewport} · ${motion} · overflow ${Math.max(0, overflow)} px`;
  root.dataset["reviewOwner"] = visualOwner ?? "native";
  root.dataset["reviewOverflow"] = String(Math.max(0, overflow));
  root.dataset["reviewProgress"] = embeddedSlider().value;
}

function renderProjectionParity(): void {
  const bundle = projectKpGovernedCanonicalConstructionCohort();
  for (const target of bundle.targets) {
    const item = document.createElement("li");
    item.dataset["reviewProjection"] = target.kind;
    item.dataset["reviewProjectionArtifacts"] =
      target.artifactIds.join(",");
    item.dataset["reviewProjectionCheckpoints"] =
      target.checkpointIds.join(",");
    const name = document.createElement("strong");
    name.textContent = target.kind;
    const detail = document.createElement("span");
    detail.textContent =
      `${target.artifactIds.length} artifacts · ` +
      `${target.checkpointIds.length} checkpoints · ${target.delivery}`;
    item.append(name, detail);
    projectionList.append(item);
  }
  root.dataset["reviewProjectionSchema"] = bundle.schemaVersion;
}

function embeddedSlider(): HTMLInputElement {
  return artifact === "cohort"
    ? required<HTMLInputElement>(childDocument(), "[data-compound-progress]")
    : required<HTMLInputElement>(
        childDocument(),
        "[data-fraction-card] [data-fraction-progress]"
      );
}

function childDocument(): Document {
  const document = frame.contentDocument;
  if (document === null) throw new Error("Review iframe is not available.");
  return document;
}

function setPressed(
  selector: string,
  value: string,
  datasetKey: "reviewArtifact" | "reviewViewport" | "reviewMotion"
): void {
  root.querySelectorAll<HTMLButtonElement>(selector).forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset[datasetKey] === value)
    );
  });
}

function required<T extends Element>(
  parent: ParentNode,
  selector: string
): T {
  const element = parent.querySelector<T>(selector);
  if (element === null) throw new Error(`Missing review control ${selector}.`);
  return element;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
