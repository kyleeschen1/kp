import type { KpLispLambdaApplicationRuntimeFrame } from "../animation/lisp-lambda-application-runtime-frame.ts";
import type { KpLispBotanicalPresentationPlan } from "../animation/lisp-botanical-presentation-plan.ts";
import { renderKpLispLambdaApplicationHtml } from "./lisp-lambda-application-html.ts";

export interface KpLispBotanicalStageRenderInput {
  readonly frame: KpLispLambdaApplicationRuntimeFrame;
  readonly plan: KpLispBotanicalPresentationPlan;
  readonly reducedMotion?: boolean | undefined;
  readonly salience?: {
    readonly targetNodeIds: readonly string[];
    readonly contextNodeIds: readonly string[];
    readonly targetMaterialIds: readonly string[];
    readonly attenuation: number;
  } | undefined;
}

export function renderKpLispBotanicalStageHtml(
  input: KpLispBotanicalStageRenderInput
): string {
  const { frame, plan } = input;
  const mode = input.reducedMotion === true ? "reduced" : "animated";
  const bind = input.reducedMotion === true ? endpoint(frame.bindingProgress) : frame.bindingProgress;
  const substitute = input.reducedMotion === true ? endpoint(frame.substitutionProgress) : frame.substitutionProgress;
  const evaluate = input.reducedMotion === true ? endpoint(frame.evaluationProgress) : frame.evaluationProgress;

  return `
    <div class="kp-lisp-botanical" data-kp-lisp-botanical-stage data-kp-lisp-botanical-plan="${plan.id}" data-kp-lisp-botanical-mode="${mode}" data-kp-lisp-botanical-stage-name="${frame.stage}" style="--kp-lisp-bind:${fixed(bind)};--kp-lisp-substitute:${fixed(substitute)};--kp-lisp-evaluate:${fixed(evaluate)};--kp-lisp-attenuation:${fixed(input.salience?.attenuation ?? 1)}">
      <svg class="kp-lisp-botanical__plant" viewBox="0 0 720 360" role="presentation" aria-hidden="true" focusable="false">
        <path class="kp-lisp-botanical__enclosure" data-kp-lisp-botanical-node="botanical.application" ${salienceAttribute(input, "botanical.application", "node")} d="M100 68 C58 92 58 268 100 292 M620 68 C662 92 662 268 620 292" />
        <path class="kp-lisp-botanical__branch" data-kp-lisp-botanical-node="botanical.lambda" ${salienceAttribute(input, "botanical.lambda", "node")} d="M360 278 C360 236 350 202 332 172 C314 142 286 120 248 104" />
        <path class="kp-lisp-botanical__branch kp-lisp-botanical__branch--body" data-kp-lisp-botanical-node="botanical.reconstructed" ${salienceAttribute(input, "botanical.reconstructed", "node")} d="M360 278 C360 224 386 174 432 132 M386 190 C426 184 466 166 494 134" />
        <path class="kp-lisp-botanical__root" data-kp-lisp-botanical-node="botanical.environment" ${salienceAttribute(input, "botanical.environment", "node")} d="M360 278 C332 302 302 316 266 322 M360 278 C386 304 420 318 456 324" />
        ${plantNode(input, "botanical.argument", "leaf", 250, 116, bind)}
        ${plantNode(input, "botanical.binder", "bud", 314, 154, bind)}
        ${plantNode(input, "botanical.reference", "bud", 430, 132, substitute)}
        ${plantNode(input, "botanical.result", "fruit", 500, 122, evaluate)}
        ${motionPath(input, "botanical.path.bind", "material.argument", "M250 116 C270 140 294 150 314 154", bind)}
        ${motionPath(input, "botanical.path.reconstruct", "material.plus material.argument material.literal material.lambda-shell", "M314 154 C354 140 390 132 430 132", substitute)}
        ${motionPath(input, "botanical.path.evaluate", "material.result", "M430 132 C452 116 476 112 500 122", evaluate)}
      </svg>
      ${renderKpLispLambdaApplicationHtml(frame)}
    </div>
  `;
}

export const kpLispBotanicalStageCss = `
.kp-lisp-botanical { position: relative; display: grid; min-height: 30rem; place-items: start center; color: #173f35; }
.kp-lisp-botanical__plant { width: min(100%, 45rem); overflow: visible; }
.kp-lisp-botanical__enclosure, .kp-lisp-botanical__branch, .kp-lisp-botanical__root, .kp-lisp-botanical__motion { fill: none; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.kp-lisp-botanical__enclosure { stroke: #8b6b46; stroke-width: 3; opacity: calc(1 - (.62 * var(--kp-lisp-substitute))); }
.kp-lisp-botanical__branch { stroke: #557a57; stroke-width: 5; opacity: calc(1 - (.7 * var(--kp-lisp-evaluate))); }
.kp-lisp-botanical__branch--body { opacity: var(--kp-lisp-substitute); }
.kp-lisp-botanical__root { stroke: #8b6b46; stroke-width: 3; opacity: calc(var(--kp-lisp-bind) * (1 - var(--kp-lisp-substitute))); }
.kp-lisp-botanical__leaf { fill: #7ba66d; transform-box: fill-box; transform-origin: center; }
.kp-lisp-botanical__bud { fill: #d5a64a; }
.kp-lisp-botanical__fruit { fill: #c76252; }
.kp-lisp-botanical__motion { stroke: #d5a64a; stroke-width: 2; stroke-dasharray: 5 7; }
.kp-lisp-botanical [data-kp-lisp-salience="target"] { filter: opacity(1); }
.kp-lisp-botanical [data-kp-lisp-salience="context"] { filter: opacity(.82); }
.kp-lisp-botanical [data-kp-lisp-salience="attenuated"] { filter: opacity(var(--kp-lisp-attenuation)); }
.kp-lisp-botanical [data-kp-lisp-salience="target"] { stroke-width: 5.75; }
.kp-lisp-botanical__leaf[data-kp-lisp-salience="target"], .kp-lisp-botanical__bud[data-kp-lisp-salience="target"], .kp-lisp-botanical__fruit[data-kp-lisp-salience="target"] { stroke: #f4f0e6; stroke-width: 2; }
.kp-lisp-stage { position: absolute; inset: auto 0 0; display: grid; min-height: 7rem; place-items: center; }
.kp-lisp-stage__expression, .kp-lisp-stage__environment { position: absolute; margin: 0; opacity: var(--kp-lisp-expression-opacity, var(--kp-lisp-environment-opacity, 0)); }
.kp-lisp-stage__expression code, .kp-lisp-stage__environment code { font: 600 clamp(1.05rem, 2.7vw, 1.7rem)/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; }
.kp-lisp-stage__expression--application { transform: translateY(-1.35rem); }
.kp-lisp-stage__environment { transform: translateY(1.65rem); }
.kp-lisp-stage__environment > div { display: flex; align-items: baseline; gap: .55rem; }
.kp-lisp-stage__environment dt::after { content: " ↦"; color: #8b6b46; }
.kp-lisp-stage__environment dd { margin: 0; }
.kp-lisp-stage__accessible { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
@media (prefers-reduced-motion: reduce) { .kp-lisp-botanical * { transition: none !important; } }
`;

function plantNode(
  input: KpLispBotanicalStageRenderInput,
  id: string,
  role: "leaf" | "bud" | "fruit",
  cx: number,
  cy: number,
  progress: number
): string {
  if (role === "leaf") {
    return `<ellipse class="kp-lisp-botanical__leaf" data-kp-lisp-botanical-node="${id}" ${salienceAttribute(input, id, "node")} cx="${cx}" cy="${cy}" rx="18" ry="10" opacity="${fixed(1 - 0.45 * progress)}" />`;
  }
  return `<circle class="kp-lisp-botanical__${role}" data-kp-lisp-botanical-node="${id}" ${salienceAttribute(input, id, "node")} cx="${cx}" cy="${cy}" r="${role === "fruit" ? 14 : 8}" opacity="${fixed(role === "fruit" ? progress : Math.max(0.28, progress))}" />`;
}

function motionPath(
  input: KpLispBotanicalStageRenderInput,
  id: string,
  materialIds: string,
  d: string,
  progress: number
): string {
  return `<path class="kp-lisp-botanical__motion" data-kp-lisp-botanical-path="${id}" data-kp-lisp-material="${materialIds}" ${salienceAttribute(input, materialIds, "material")} d="${d}" pathLength="1" stroke-dashoffset="${fixed(1 - progress)}" opacity="${fixed(progress * (1 - progress) * 4)}" />`;
}

function salienceAttribute(
  input: KpLispBotanicalStageRenderInput,
  ids: string,
  kind: "node" | "material"
): string {
  if (input.salience === undefined) return "";
  const values = ids.split(" ");
  const target = kind === "node"
    ? values.some((id) => input.salience?.targetNodeIds.includes(id))
    : values.some((id) => input.salience?.targetMaterialIds.includes(id));
  const context = kind === "node" && values.some((id) =>
    input.salience?.contextNodeIds.includes(id)
  );
  return `data-kp-lisp-salience="${target ? "target" : context ? "context" : "attenuated"}"`;
}

function endpoint(progress: number): number {
  return progress >= 1 ? 1 : 0;
}

function fixed(value: number): string {
  return Math.min(1, Math.max(0, value)).toFixed(4);
}
