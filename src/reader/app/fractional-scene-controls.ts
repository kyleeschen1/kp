/** Local review controls, not part of the lesson's mathematical/authoring API. */
export function mountFractionalSceneControls(input: {
  readonly stage: HTMLElement;
  readonly onGeometryChange: () => void;
}): { dispose(): void } {
  const document = input.stage.ownerDocument;
  const body = document.body;
  const panel = document.createElement("details");
  panel.className = "kp-fractional-scene-controls";
  panel.dataset["kpSceneControls"] = "true";
  panel.open = true;
  panel.innerHTML = `<summary>Scene controls</summary>
    <p>Math thinning adjusts the ink; it keeps the KaTeX font.</p>`;
  const controls = [
    { id: "thinning", label: "Math thinning", property: "--kp-scene-math-trim", min: 0, max: 0.5, step: 0.02, initial: 0.12, unit: "px", geometry: false },
    { id: "math-size", label: "Math size", property: "--kp-equation-type-size", min: 14, max: 32, step: 0.1, initial: 19.2, unit: "px", geometry: true },
    { id: "prose-size", label: "Prose size", property: "--kp-scene-prose-size", min: 14, max: 24, step: 0.5, initial: 17, unit: "px", geometry: true }
  ] as const;
  const abort = new AbortController();
  const resetters: (() => void)[] = [];
  for (const control of controls) {
    const label = document.createElement("label");
    const name = document.createElement("span");
    name.textContent = control.label;
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = String(control.min);
    slider.max = String(control.max);
    slider.step = String(control.step);
    slider.dataset["kpSceneControl"] = control.id;
    const output = document.createElement("output");
    const apply = (value: number) => {
      const bounded = Math.min(control.max, Math.max(control.min, value));
      slider.value = String(bounded);
      body.style.setProperty(control.property, `${bounded}${control.unit}`);
      output.value = `${bounded}${control.unit}`;
    };
    slider.addEventListener("input", () => {
      if (!Number.isFinite(slider.valueAsNumber)) return;
      apply(slider.valueAsNumber);
      if (control.geometry) input.onGeometryChange();
    }, { signal: abort.signal });
    resetters.push(() => apply(control.initial));
    label.append(name, slider, output);
    panel.append(label);
    apply(control.initial);
  }
  const reset = document.createElement("button");
  reset.type = "button";
  reset.textContent = "Reset";
  reset.addEventListener("click", () => {
    resetters.forEach((restore) => restore());
    input.onGeometryChange();
  }, { signal: abort.signal });
  panel.append(reset);
  input.stage.append(panel);
  return {
    dispose() {
      abort.abort();
      panel.remove();
      for (const control of controls) body.style.removeProperty(control.property);
    }
  };
}
