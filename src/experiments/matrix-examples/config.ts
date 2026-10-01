/** Presentation preferences shared by these preview hosts, never math state. */
export interface MatrixExampleConfig {
  readonly layout: "stacked" | "side";
  readonly spacing: "compact" | "roomy";
  readonly motion: "animate" | "steps";
  readonly theme: "dark" | "light";
}
const changed = "kp-matrix-example-config";

export function readMatrixConfig(doc: Document): MatrixExampleConfig {
  const { matrixLayout = "stacked", matrixSpacing = "compact", matrixMotion = "animate", matrixTheme = 'dark' } = doc.documentElement.dataset;
  if ((matrixLayout !== "stacked" && matrixLayout !== "side") ||
      (matrixSpacing !== "compact" && matrixSpacing !== "roomy") ||
      (matrixMotion !== "animate" && matrixMotion !== "steps") ||
      (matrixTheme !== 'dark' && matrixTheme !== 'light')) throw new Error("Unsupported matrix presentation configuration.");
  return Object.freeze({ layout: matrixLayout, spacing: matrixSpacing, motion: matrixMotion, theme: matrixTheme });
}

export function applyMatrixConfig(doc: Document, config: MatrixExampleConfig) {
  const data = doc.documentElement.dataset;
  data["matrixLayout"] = config.layout; data["matrixSpacing"] = config.spacing; data["matrixMotion"] = config.motion;
  data['matrixTheme'] = config.theme;
  // Dispatch in the receiving document; no cross-origin message or global store.
  const event = doc.createEvent("Event"); event.initEvent(changed, false, false); doc.dispatchEvent(event);
}

export function observeMatrixConfig(doc: Document, update: (config: MatrixExampleConfig) => void) {
  const listener = () => update(readMatrixConfig(doc));
  doc.addEventListener(changed, listener);
  return () => doc.removeEventListener(changed, listener);
}
