import { sampleKpNativeKatexContributorFusionPaint, type KpContributorFusionPaintInput } from "../../rendering/native-katex-contributor-fusion-sampling.ts";

/** Local DOM projection of the canonical optical sampler. This does not issue
 * an evaluation certificate or claim canonical compositor certification. */
export function prepareFusion(stage: HTMLElement, operands: readonly HTMLElement[], operators: readonly HTMLElement[], result: HTMLElement) {
  const bounds = stage.getBoundingClientRect();
  const describe = (node: HTMLElement, role: string): KpContributorFusionPaintInput => {
    const rect = node.getBoundingClientRect();
    return { rect: { left: rect.left - bounds.left, top: rect.top - bounds.top, width: rect.width, height: rect.height },
      pivot: { x: rect.left - bounds.left + rect.width / 2, y: rect.top - bounds.top + rect.height / 2 }, role };
  };
  const nodes = [...operands, ...operators];
  const source = [...operands.map(node => describe(node, "successor-source:material-input")),
    ...operators.map(node => describe(node, "successor-source:catalyst"))];
  const target = [describe(result, "successor-target:result-material")];
  return (progress: number) => {
    if (progress === 0 || progress === 1) {
      for (const node of nodes) { node.style.transform = ""; node.style.opacity = progress === 0 ? "1" : "0"; }
      result.style.transform = ""; result.style.clipPath = ""; result.style.opacity = progress === 1 ? "1" : "0";
      return;
    }
    const frame = sampleKpNativeKatexContributorFusionPaint({ source, target, progress });
    nodes.forEach((node, i) => {
      const pose = frame.source[i]!;
      node.style.transform = pose.transform; node.style.opacity = pose.present ? "1" : "0";
    });
    const pose = frame.target[0]!;
    result.style.transform = pose.transform; result.style.opacity = pose.present ? "1" : "0";
    result.style.clipPath = `inset(${pose.clipInset}% ${pose.clipInset}%)`;
  };
}
