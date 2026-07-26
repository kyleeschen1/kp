const root = required<HTMLElement>("[data-kp-canonical-host-parity]");
const oracle = required<HTMLIFrameElement>("[data-kp-canonical-host-oracle]");
const reference = required<HTMLIFrameElement>(
  "[data-kp-canonical-host-reference]"
);
const reader = required<HTMLIFrameElement>("[data-kp-canonical-host-reader]");
const progress = required<HTMLInputElement>(
  "[data-kp-canonical-host-progress]"
);
const status = required<HTMLOutputElement>("[data-kp-canonical-host-status]");

root.hidden = false;

const oracleUrl = new URL("/", location.origin);
oracleUrl.searchParams.set(
  "animation",
  "editor-animation.sample.animation.radical-rewrite.square-root-as-power"
);
const referenceUrl = new URL(
  "/glyph-reconciliation-experiment.html",
  location.origin
);
referenceUrl.searchParams.set("radicalInventory", "1");
referenceUrl.searchParams.set("reviewGallery", "radical");
referenceUrl.searchParams.set("progress", "0");
const readerUrl = new URL("/reader/radical-succession/", location.origin);
readerUrl.searchParams.set("kpMotion", "full");
readerUrl.searchParams.set("kpProgress", "0");

const loaded = Promise.all([
  loadFrame(oracle, oracleUrl, '[data-action="seek-editor-animation"]'),
  loadFrame(reference, referenceUrl, "[data-radical-progress]"),
  loadFrame(reader, readerUrl, "[data-kp-reader-attention-scrubber]")
]);
await loaded;
await Promise.all([
  waitForFrameAttribute(
    oracle,
    "[data-kp-editor-equation-stage]",
    "data-kp-editor-radical-morph-ready",
    "true"
  ),
  waitForFrameAttribute(
    reference,
    "[data-radical-stage]",
    "data-kp-native-katex-structural-succession-status",
    "ready"
  ),
  waitForFrameAttribute(
    reader,
    '[data-kp-reader-transition-active="true"] [data-kp-reader-fit-surface]',
    "data-kp-native-katex-structural-succession-status",
    "ready"
  )
]);
oracle.contentDocument?.querySelector<HTMLElement>(
  "[data-kp-editor-equation-stage]"
)?.scrollIntoView({ block: "center" });
reference.contentDocument?.querySelector<HTMLElement>("[data-radical-stage]")
  ?.scrollIntoView({ block: "center" });
reader.contentDocument?.querySelector<HTMLElement>(
  "[data-kp-reader-equation-stage]"
)?.scrollIntoView({ block: "center" });

const apply = () => {
  const value = Number(progress.value);
  setFrameProgress(
    oracle,
    '[data-action="seek-editor-animation"]',
    value / 1_000
  );
  setFrameProgress(reference, "[data-radical-progress]", value);
  setFrameProgress(reader, "[data-kp-reader-attention-scrubber]", value);
  status.value = `${Math.round(value / 10)}%`;
  document.documentElement.dataset["kpCanonicalHostParityProgress"] =
    String(value);
};
progress.addEventListener("input", apply);
apply();
document.documentElement.dataset["kpCanonicalHostParity"] = "radical";
document.documentElement.dataset["kpCanonicalHostParityReady"] = "true";

async function loadFrame(
  frame: HTMLIFrameElement,
  url: URL,
  readySelector: string
): Promise<void> {
  const ready = new Promise<void>((resolve) => {
    frame.addEventListener("load", () => resolve(), { once: true });
  });
  frame.src = url.href;
  await ready;
  await waitForFrameElement(frame, readySelector);
}

async function waitForFrameElement(
  frame: HTMLIFrameElement,
  selector: string
): Promise<void> {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    if (frame.contentDocument?.querySelector(selector) !== null) return;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  throw new Error(`Canonical parity frame did not hydrate ${selector}.`);
}

async function waitForFrameAttribute(
  frame: HTMLIFrameElement,
  selector: string,
  attribute: string,
  value: string
): Promise<void> {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    if (
      frame.contentDocument?.querySelector(selector)?.getAttribute(attribute) ===
        value
    ) {
      return;
    }
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  throw new Error(
    `Canonical parity frame did not settle ${selector}[${attribute}=${value}].`
  );
}

function setFrameProgress(
  frame: HTMLIFrameElement,
  selector: string,
  value: number
): void {
  const input = frame.contentDocument?.querySelector<HTMLInputElement>(selector);
  if (input === null || input === undefined) {
    throw new Error(`Canonical parity frame is missing ${selector}.`);
  }
  input.value = String(value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Expected ${selector}.`);
  return element;
}
