import {
  createKpAnimationVisualFrame,
  type KpAnimationVisualBinding,
  type KpAnimationVisualFrame,
  type KpAnimationVisualFrameDiagnostic,
  type KpAnimationVisualRendererKind
} from "../animation/visual-frame-adapter.ts";
import type {
  KpAnimationRuntimeFrame,
  KpAnimationRuntimeSelectorFrame
} from "../animation/runtime-sampler.ts";
import {
  normalizeKatexTokenText
} from "./katex-token-snapshot.ts";
import type {
  KatexMotionToken
} from "./katex-transition-types.ts";

export interface CreateKatexRuntimeVisualFrameInput {
  readonly id?: string | undefined;
  readonly runtimeFrame: KpAnimationRuntimeFrame;
  readonly tokens: readonly KatexMotionToken[];
  readonly renderTargetRef?: string | undefined;
  readonly renderer?: KpAnimationVisualRendererKind | undefined;
}

interface KatexSelectorTokenMatch {
  readonly tokenIds: readonly string[];
  readonly startIndex: number;
  readonly endIndex: number;
}

export function createKatexRuntimeVisualFrame(
  input: CreateKatexRuntimeVisualFrameInput
): KpAnimationVisualFrame {
  const bindingResult = createKatexRuntimeVisualBindings(input);
  const visualFrame = createKpAnimationVisualFrame({
    id: input.id,
    runtimeFrame: input.runtimeFrame,
    bindings: bindingResult.bindings
  });

  return {
    ...visualFrame,
    diagnostics: [
      ...bindingResult.diagnostics,
      ...visualFrame.diagnostics
    ]
  };
}

export function createKatexRuntimeVisualBindings(
  input: CreateKatexRuntimeVisualFrameInput
): {
  readonly bindings: readonly KpAnimationVisualBinding[];
  readonly diagnostics: readonly KpAnimationVisualFrameDiagnostic[];
} {
  const renderer = input.renderer ?? "dom";
  const diagnostics: KpAnimationVisualFrameDiagnostic[] = [];
  const renderTargetBindings = input.runtimeFrame.activeRenderTargets
    .filter((target) => target.kind === "equation")
    .map((target): KpAnimationVisualBinding => ({
      id: `katex-render-target.${target.id}`,
      kind: "render-target",
      targetId: target.id,
      renderer,
      ref: input.renderTargetRef ?? target.id
    }));
  const selectorBindings = input.runtimeFrame.selectorFrames.flatMap(
    (selector) => {
      const match = selectTokensForRuntimeSelector({
        selector,
        tokens: input.tokens,
        diagnostics
      });

      return match === undefined
        ? []
        : match.tokenIds.map((tokenId) => {
            const token = tokenById(input.tokens, tokenId);

            return {
              id: `katex-selector.${selector.id}.${tokenId}`,
              kind: "selector" as const,
              targetId: selector.id,
              renderer,
              ref: tokenId,
              ...(token === undefined
                ? {}
                : {
                    geometry: {
                      x: token.localRect.left,
                      y: token.localRect.top,
                      width: token.localRect.width,
                      height: token.localRect.height
                    }
                  })
            };
          });
    }
  );

  return {
    bindings: [...renderTargetBindings, ...selectorBindings],
    diagnostics
  };
}

function selectTokensForRuntimeSelector(input: {
  readonly selector: KpAnimationRuntimeSelectorFrame;
  readonly tokens: readonly KatexMotionToken[];
  readonly diagnostics: KpAnimationVisualFrameDiagnostic[];
}): KatexSelectorTokenMatch | undefined {
  const pieces = selectorLabelPieces(input.selector.label);

  if (pieces.length === 0) {
    return undefined;
  }

  const matches = contextualMatches(
    input.selector.id,
    contiguousTokenMatches(input.tokens, pieces),
    input.tokens
  );

  if (matches.length === 1) {
    return matches[0];
  }

  input.diagnostics.push({
    severity: "warning",
    code:
      matches.length === 0
        ? "katex-runtime.selector-token-missing"
        : "katex-runtime.selector-token-ambiguous",
    path: `selectorFrames[${input.selector.id}]`,
    message:
      matches.length === 0
        ? `Runtime selector ${input.selector.id} label ${input.selector.label ?? ""} did not match any KaTeX token sequence.`
        : `Runtime selector ${input.selector.id} label ${input.selector.label ?? ""} matched ${matches.length} KaTeX token sequence(s).`
  });

  return undefined;
}

function contiguousTokenMatches(
  tokens: readonly KatexMotionToken[],
  pieces: readonly string[]
): readonly KatexSelectorTokenMatch[] {
  const matches: KatexSelectorTokenMatch[] = [];

  for (let index = 0; index <= tokens.length - pieces.length; index += 1) {
    const tokenSlice = tokens.slice(index, index + pieces.length);
    const tokenTexts = tokenSlice.map((token) =>
      normalizeKatexTokenText(token.text)
    );

    if (tokenTexts.every((text, offset) => text === pieces[offset])) {
      matches.push({
        tokenIds: tokenSlice.map((token) => token.id),
        startIndex: index,
        endIndex: index + pieces.length - 1
      });
    }
  }

  return matches;
}

function contextualMatches(
  selectorId: string,
  matches: readonly KatexSelectorTokenMatch[],
  tokens: readonly KatexMotionToken[]
): readonly KatexSelectorTokenMatch[] {
  const equalsIndex = tokens.findIndex((token) => token.text === "=");

  if (equalsIndex === -1) {
    return matches;
  }

  if (selectorId.includes(".lhs.")) {
    return matches.filter((match) => match.endIndex < equalsIndex);
  }

  if (selectorId.includes(".rhs.")) {
    return matches.filter((match) => match.startIndex > equalsIndex);
  }

  return matches;
}

function selectorLabelPieces(label: string | undefined): readonly string[] {
  const normalized = normalizeKatexTokenText(label ?? "");

  if (normalized.length === 0) {
    return [];
  }

  return normalized.match(/[A-Za-z]+|\d+|[+\-=*/^()]|./g) ?? [];
}

function tokenById(
  tokens: readonly KatexMotionToken[],
  tokenId: string
): KatexMotionToken | undefined {
  return tokens.find((token) => token.id === tokenId);
}
