import type { KpLispLambdaApplicationRuntimeFrame } from "../animation/lisp-lambda-application-runtime-frame.ts";

export function renderKpLispLambdaApplicationHtml(
  frame: KpLispLambdaApplicationRuntimeFrame
): string {
  return `
    <section class="kp-lisp-stage" data-kp-lisp-stage="${frame.stage}" data-kp-lisp-progress="${frame.progress}" data-kp-lisp-checkpoint="${frame.checkpointId}" aria-label="${escapeHtml(frame.accessibleDescription)}">
      <div class="kp-lisp-stage__native" data-kp-lisp-native-layer>
        ${expression("application", frame.expressions.application, frame.expressions.applicationOpacity, frame.stage === "read" || frame.stage === "bind")}
        ${environment(frame)}
        ${expression("reconstructed", frame.expressions.reconstructed, frame.expressions.reconstructedOpacity, frame.stage === "substitute")}
        ${expression("result", frame.expressions.result, frame.expressions.resultOpacity, frame.stage === "evaluate" || frame.stage === "settle")}
      </div>
      <div class="kp-lisp-stage__motion" data-kp-lisp-motion-layer aria-hidden="true"></div>
      <p class="kp-lisp-stage__accessible" data-kp-lisp-accessible-state role="status" aria-live="polite" aria-atomic="true">${escapeHtml(frame.accessibleDescription)}</p>
    </section>
  `;
}

function expression(
  role: "application" | "reconstructed" | "result",
  source: string,
  opacity: number,
  current: boolean
): string {
  return `<pre class="kp-lisp-stage__expression kp-lisp-stage__expression--${role}" data-kp-lisp-expression="${role}" data-kp-lisp-current="${current}" aria-hidden="${!current}" style="--kp-lisp-expression-opacity:${opacity.toFixed(4)}"><code data-kp-lisp-native-code="${role}">${escapeHtml(source)}</code></pre>`;
}

function environment(frame: KpLispLambdaApplicationRuntimeFrame): string {
  return `<dl class="kp-lisp-stage__environment" data-kp-lisp-environment aria-hidden="${frame.stage !== "bind"}" style="--kp-lisp-environment-opacity:${frame.expressions.environmentOpacity.toFixed(4)}">
    <div><dt><code>x</code></dt><dd><code>4</code></dd></div>
  </dl>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
