import type {
  KpResolvedEquationTypographyV2,
  KpTexMathStyleV2
} from "../domain-ir/equation-typography-policy-v2.ts";
import { renderLatexToHtml } from "./katex-adapter.ts";

export const kpNativeKatexEndpointRendererRevisionV2 =
  "kp.native-katex-endpoint-renderer.v2.1" as const;

declare const kpNativeKatexTypographyCacheIdentityV2Brand: unique symbol;

export interface KpNativeKatexTypographyCacheIdentityV2 {
  readonly [kpNativeKatexTypographyCacheIdentityV2Brand]:
    "KpNativeKatexTypographyCacheIdentityV2";
  readonly key: string;
}

export interface KpNativeKatexEndpointParametersV2 {
  readonly kind: "native-katex-endpoint-parameters-v2";
  readonly transitionId: string;
  readonly typographyPolicyId: string;
  readonly flow: KpResolvedEquationTypographyV2["policy"]["flow"]["kind"];
  readonly mathStyle: KpTexMathStyleV2;
  readonly scaleProfile:
    KpResolvedEquationTypographyV2["policy"]["scale"]["profile"];
  readonly relativeEm: number;
  readonly displayMode: boolean;
  readonly semanticLargeOperators:
    KpResolvedEquationTypographyV2["semanticLargeOperators"];
  readonly typographyCacheIdentity:
    KpNativeKatexTypographyCacheIdentityV2;
}

export interface KpNativeKatexRenderedEndpointV2 {
  readonly kind: "native-katex-rendered-endpoint-v2";
  readonly latex: string;
  readonly renderedLatex: string;
  readonly html: string;
  readonly parameters: KpNativeKatexEndpointParametersV2;
  readonly cacheKey: string;
  readonly hydrationKey: string;
  readonly hostAttributes: Readonly<Record<string, string>>;
}

export function compileKpNativeKatexEndpointParametersV2(input: {
  readonly typography: KpResolvedEquationTypographyV2;
}): KpNativeKatexEndpointParametersV2 {
  const { typography } = input;
  const policy = typography.policy;
  const displayMode = policy.flow.kind !== "inline-with-prose";
  const typographyCacheIdentity =
    createKpNativeKatexTypographyCacheIdentityV2({ typography });
  return Object.freeze({
    kind: "native-katex-endpoint-parameters-v2",
    transitionId: typography.transitionId,
    typographyPolicyId: policy.id,
    flow: policy.flow.kind,
    mathStyle: policy.mathStyle.kind,
    scaleProfile: policy.scale.profile,
    relativeEm: policy.scale.relativeEm,
    displayMode,
    semanticLargeOperators: typography.semanticLargeOperators,
    typographyCacheIdentity
  });
}

export function createKpNativeKatexTypographyCacheIdentityV2(input: {
  readonly typography: KpResolvedEquationTypographyV2;
}): KpNativeKatexTypographyCacheIdentityV2 {
  const { typography } = input;
  const policy = typography.policy;
  const key = JSON.stringify([
    kpNativeKatexEndpointRendererRevisionV2,
    typography.transitionId,
    policy.id,
    policy.flow.kind,
    policy.mathStyle.kind,
    policy.scale.profile,
    policy.scale.relativeEm,
    typography.semanticLargeOperators.map((operator) => [
      operator.entityId,
      operator.kind,
      operator.limitPlacement
    ])
  ]);
  return Object.freeze({ key }) as KpNativeKatexTypographyCacheIdentityV2;
}

export function renderKpNativeKatexEndpointV2(input: {
  readonly latex: string;
  readonly parameters: KpNativeKatexEndpointParametersV2;
}): KpNativeKatexRenderedEndpointV2 {
  if (input.latex.trim() === "") {
    throw new Error("Native KaTeX endpoint v2 requires non-empty LaTeX.");
  }
  const renderedLatex = applyMathStyle(input.latex, input.parameters.mathStyle);
  const cacheKey = JSON.stringify([
    kpNativeKatexEndpointRendererRevisionV2,
    input.latex,
    input.parameters.typographyCacheIdentity.key
  ]);
  const hostAttributes = Object.freeze({
    "data-kp-native-katex-endpoint": "v2",
    "data-kp-equation-flow": input.parameters.flow,
    "data-kp-equation-math-style": input.parameters.mathStyle,
    "data-kp-equation-scale-profile": input.parameters.scaleProfile,
    "data-kp-equation-typography-cache-key":
      input.parameters.typographyCacheIdentity.key,
    "style": `--kp-equation-relative-em:${input.parameters.relativeEm}`
  });
  return Object.freeze({
    kind: "native-katex-rendered-endpoint-v2",
    latex: input.latex,
    renderedLatex,
    html: renderLatexToHtml(renderedLatex, {
      displayMode: input.parameters.displayMode
    }),
    parameters: input.parameters,
    cacheKey,
    // SSR and hydration compare the exact render input rather than DOM shape.
    hydrationKey: cacheKey,
    hostAttributes
  });
}

export function assertKpNativeKatexEndpointHydrationV2(input: {
  readonly server: KpNativeKatexRenderedEndpointV2;
  readonly client: KpNativeKatexRenderedEndpointV2;
}): KpNativeKatexRenderedEndpointV2 {
  if (input.server.hydrationKey !== input.client.hydrationKey) {
    throw new Error(
      "Native KaTeX endpoint hydration rejected incompatible typography or LaTeX."
    );
  }
  return input.client;
}

function applyMathStyle(latex: string, mathStyle: KpTexMathStyleV2): string {
  const command = {
    text: "\\textstyle",
    display: "\\displaystyle",
    script: "\\scriptstyle",
    scriptscript: "\\scriptscriptstyle"
  } satisfies Record<KpTexMathStyleV2, string>;
  return `{${command[mathStyle]} ${latex}}`;
}
