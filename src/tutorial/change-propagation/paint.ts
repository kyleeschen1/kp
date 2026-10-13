import { formatChangeNumber, type ChangeModel, type ChangeSample } from "./model.ts";

const readouts = ["x", "h", "u", "y", "deltaU", "deltaY", "du", "dy", "firstScale", "secondScale", "derivative", "error", "errorPerH"] as const;
/** Bind native numeric leaves once. Neither math markup nor stage owners are
 * rebuilt while scrubbing, changing parameters, reversing or resizing. */
export function bindChangePaint(root: HTMLElement, model: ChangeModel) {
  const leaves = readouts.map(key => ({ key, nodes: root.querySelectorAll<HTMLOutputElement>(`[data-change-value="${key}"]`) }));
  const meters = Array.from(root.querySelectorAll<SVGSVGElement>("[data-change-meter]"));
  const ranges = Array.from(root.querySelectorAll<HTMLElement>(".change-axis-labels"));
  return (sample: ChangeSample) => {
    for (const { key, nodes } of leaves) for (const node of nodes) node.textContent = formatChangeNumber(sample[key]);
    const scales = model.scales(sample.x), exact = [sample.h, sample.deltaU, sample.deltaY], predicted = [sample.h, sample.du, sample.dy];
    meters.forEach((meter, i) => {
      const a = 120 + 95 * exact[i]! / scales[i]!, b = 120 + 95 * predicted[i]! / scales[i]!;
      meter.querySelector(".change-actual")!.setAttribute("cx", String(a));
      meter.querySelector(".change-prediction")!.setAttribute("cx", String(b));
      meter.querySelector(".change-actual-line")!.setAttribute("x2", String(a));
      meter.querySelector(".change-prediction-line")!.setAttribute("x2", String(b));
      meter.setAttribute("aria-label", `${["Input", "Intermediate", "Output"][i]} change: actual ${formatChangeNumber(exact[i]!)}, linear prediction ${formatChangeNumber(predicted[i]!)}`);
      ranges[i]!.firstElementChild!.textContent = `−${scales[i]!.toFixed(2)}`;
      ranges[i]!.lastElementChild!.textContent = `+${scales[i]!.toFixed(2)}`;
    });
  };
}
