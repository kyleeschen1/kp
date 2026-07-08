export type EquationMotionChoreographyKind = "transfer-3" | "melt-right-side";

export type EquationMotionChoreographyRenderer =
  | "custom-transfer"
  | "custom-melt";

export interface EquationMotionChoreographyOptions {
  durationMs?: number | undefined;
  beforeCleanup?: (() => void | Promise<void>) | undefined;
}

export interface EquationMotionChoreographyResult {
  readonly renderer: EquationMotionChoreographyRenderer;
}

interface ChoreographyToken {
  readonly element: HTMLElement;
  readonly text: string;
  readonly rect: DOMRect;
}

const DEFAULT_DURATION_MS = 620;
const HANDOFF_FADE_MS = 240;

export async function runEquationMotionChoreography(
  sourceEl: HTMLElement,
  targetEl: HTMLElement,
  kind: EquationMotionChoreographyKind,
  options: EquationMotionChoreographyOptions = {}
): Promise<EquationMotionChoreographyResult> {
  const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;

  return kind === "transfer-3"
    ? runTransferThreeChoreography(sourceEl, targetEl, {
        durationMs,
        beforeCleanup: options.beforeCleanup
      })
    : runMeltRightSideChoreography(sourceEl, targetEl, {
        durationMs,
        beforeCleanup: options.beforeCleanup
      });
}

interface ResolvedChoreographyOptions {
  readonly durationMs: number;
  readonly beforeCleanup?: (() => void | Promise<void>) | undefined;
}

async function runTransferThreeChoreography(
  sourceEl: HTMLElement,
  targetEl: HTMLElement,
  options: ResolvedChoreographyOptions
): Promise<EquationMotionChoreographyResult> {
  const { durationMs } = options;
  const anchorShiftDelayMs = durationMs * 0.32;
  const sourceTokens = snapshotLeafTokens(sourceEl);
  const targetTokens = snapshotLeafTokens(targetEl);
  const sourceX = findToken(sourceTokens, "x");
  const sourcePlus = findToken(sourceTokens, "+");
  const sourceThree = findToken(sourceTokens, "3");
  const sourceEquals = findToken(sourceTokens, "=");
  const sourceSeven = findToken(sourceTokens, "7");
  const targetX = findToken(targetTokens, "x");
  const targetThree = findToken(targetTokens, "3");
  const targetEquals = findToken(targetTokens, "=");
  const targetSeven = findToken(targetTokens, "7");
  const targetMinus = findToken(targetTokens, "-", "last");

  if (
    sourceX === undefined ||
    sourcePlus === undefined ||
    sourceThree === undefined ||
    sourceEquals === undefined ||
    sourceSeven === undefined ||
    targetX === undefined ||
    targetThree === undefined ||
    targetEquals === undefined ||
    targetSeven === undefined ||
    targetMinus === undefined
  ) {
    throw new Error("Could not locate the algebra-transfer KaTeX tokens.");
  }

  const overlay = createChoreographyOverlay(
    "transfer-3",
    sourceEl,
    targetEl
  );
  const persistingX = createTokenGhost(
    sourceX,
    overlay.rect,
    "persisting-x"
  );
  const persistingEquals = createTokenGhost(
    sourceEquals,
    overlay.rect,
    "persisting-equals"
  );
  const persistingSeven = createTokenGhost(
    sourceSeven,
    overlay.rect,
    "persisting-seven"
  );
  const movingThree = createTokenGhost(
    sourceThree,
    overlay.rect,
    "moving-3"
  );
  const vanishingPlus = createTokenGhost(
    sourcePlus,
    overlay.rect,
    "vanishing-plus"
  );
  const appearingMinus = createTokenGhost(
    targetMinus,
    overlay.rect,
    "appearing-minus"
  );
  const motionGroup = createChoreographyGroup("transfer-motion");
  const hiddenTokens = [
    sourceX.element,
    sourcePlus.element,
    sourceThree.element,
    sourceEquals.element,
    sourceSeven.element
  ];

  motionGroup.append(
    persistingX,
    vanishingPlus,
    movingThree,
    persistingEquals,
    persistingSeven,
    appearingMinus
  );
  overlay.element.append(motionGroup);
  document.body.append(overlay.element);
  hideTokens(hiddenTokens);

  try {
    await Promise.all([
      runPersistentTokenAnimation(
        persistingX,
        sourceX,
        targetX,
        durationMs
      ),
      runPersistentTokenAnimation(
        persistingEquals,
        sourceEquals,
        targetEquals,
        durationMs,
        { delayMs: anchorShiftDelayMs }
      ),
      runPersistentTokenAnimation(
        persistingSeven,
        sourceSeven,
        targetSeven,
        durationMs,
        { delayMs: anchorShiftDelayMs }
      ),
      runTransferTokenAnimation(
        movingThree,
        sourceThree,
        targetThree,
        durationMs
      ),
      runElementAnimation(
        vanishingPlus,
        [
          { opacity: 1, transform: "scale(1)" },
          { opacity: 0, transform: "scale(0.72)" }
        ],
        {
          duration: Math.max(120, durationMs * 0.32),
          easing: "ease-out",
          fill: "forwards"
        }
      ),
      runElementAnimation(
        appearingMinus,
        [
          { opacity: 0, transform: "scale(0.72)" },
          { opacity: 1, transform: "scale(1)" }
        ],
        {
          delay: durationMs * 0.48,
          duration: Math.max(140, durationMs * 0.32),
          easing: "ease-out",
          fill: "forwards"
        }
      )
    ]);
    // Keep the completed motion ghosts alive through handoff. Swapping to a
    // second settled clone layer makes unchanged glyphs flicker.
    await runBeforeCleanup(options.beforeCleanup);
    await fadeOverlayBeforeRemoval(overlay.element);
  } finally {
    showTokens(hiddenTokens);
    overlay.element.remove();
  }

  return { renderer: "custom-transfer" };
}

function createChoreographyGroup(role: string): HTMLDivElement {
  const group = document.createElement("div");

  group.className = "equation-motion-choreography__group";
  group.dataset["kpEquationMotionRole"] = role;

  return group;
}

function runPersistentTokenAnimation(
  ghost: HTMLElement,
  sourceToken: ChoreographyToken,
  targetToken: ChoreographyToken,
  durationMs: number,
  options: { readonly delayMs?: number | undefined } = {}
): Promise<void> {
  const delayMs = options.delayMs ?? 0;
  const activeDurationMs = Math.max(0, durationMs - delayMs);
  const dx = targetToken.rect.left - sourceToken.rect.left;
  const dy = targetToken.rect.top - sourceToken.rect.top;

  return runElementAnimation(
    ghost,
    [
      { opacity: 1, transform: "translate3d(0, 0, 0)" },
      {
        opacity: 1,
        transform: `translate3d(${dx}px, ${dy}px, 0)`
      }
    ],
    {
      delay: delayMs,
      duration: activeDurationMs,
      easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      fill: "forwards"
    }
  );
}

function runTransferTokenAnimation(
  ghost: HTMLElement,
  sourceToken: ChoreographyToken,
  targetToken: ChoreographyToken,
  durationMs: number
): Promise<void> {
  const dx = targetToken.rect.left - sourceToken.rect.left;
  const dy = targetToken.rect.top - sourceToken.rect.top;
  const lift = Math.min(-14, dy - 14);

  return runElementAnimation(
    ghost,
    [
      { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
      {
        offset: 0.22,
        opacity: 1,
        transform: `translate3d(0, ${lift}px, 0) scale(1.04)`
      },
      {
        offset: 0.72,
        opacity: 1,
        transform: `translate3d(${dx}px, ${dy + lift}px, 0) scale(1.06)`
      },
      {
        opacity: 1,
        transform: `translate3d(${dx}px, ${dy}px, 0) scale(1)`
      }
    ],
    {
      duration: durationMs,
      easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      fill: "forwards"
    }
  );
}

async function runMeltRightSideChoreography(
  sourceEl: HTMLElement,
  targetEl: HTMLElement,
  options: ResolvedChoreographyOptions
): Promise<EquationMotionChoreographyResult> {
  const { durationMs } = options;
  const anchorShiftDelayMs = durationMs * 0.36;
  const sourceTokens = snapshotLeafTokens(sourceEl);
  const targetTokens = snapshotLeafTokens(targetEl);
  const sourceX = findToken(sourceTokens, "x");
  const sourceEquals = findToken(sourceTokens, "=");
  const targetX = findToken(targetTokens, "x");
  const targetEquals = findToken(targetTokens, "=");
  const rightSideTokens = tokensAfterEquals(sourceTokens);
  const resultToken = findToken(targetTokens, "4");

  if (
    sourceX === undefined ||
    sourceEquals === undefined ||
    targetX === undefined ||
    targetEquals === undefined ||
    rightSideTokens.length === 0 ||
    resultToken === undefined
  ) {
    throw new Error("Could not locate the right-side simplification tokens.");
  }

  const overlay = createChoreographyOverlay(
    "melt-right-side",
    sourceEl,
    targetEl
  );
  const motionGroup = createChoreographyGroup("melt-motion");
  const meltingGroup = document.createElement("div");
  const persistingX = createTokenGhost(sourceX, overlay.rect, "persisting-x");
  const persistingEquals = createTokenGhost(
    sourceEquals,
    overlay.rect,
    "persisting-equals"
  );
  const resultGhost = createTokenGhost(
    resultToken,
    overlay.rect,
    "appearing-result"
  );
  const hiddenTokens = sourceTokens.map((token) => token.element);

  meltingGroup.className = "equation-motion-choreography__group";
  meltingGroup.dataset["kpEquationMotionRole"] = "melting-right-side";

  rightSideTokens.forEach((token) => {
    meltingGroup.append(createTokenGhost(token, overlay.rect, "melting-token"));
  });

  motionGroup.append(persistingX, persistingEquals, meltingGroup, resultGhost);
  overlay.element.append(motionGroup);
  document.body.append(overlay.element);
  hideTokens(hiddenTokens);

  try {
    await Promise.all([
      runPersistentTokenAnimation(
        persistingX,
        sourceX,
        targetX,
        durationMs,
        { delayMs: anchorShiftDelayMs }
      ),
      runPersistentTokenAnimation(
        persistingEquals,
        sourceEquals,
        targetEquals,
        durationMs,
        { delayMs: anchorShiftDelayMs }
      ),
      runElementAnimation(
        meltingGroup,
        [
          { opacity: 1, filter: "blur(0)", transform: "translateY(0) scale(1)" },
          {
            opacity: 0,
            filter: "blur(5px)",
            transform: "translateY(7px) scale(0.86)"
          }
        ],
        {
          duration: durationMs * 0.72,
          easing: "cubic-bezier(0.3, 0, 0.7, 1)",
          fill: "forwards"
        }
      ),
      runElementAnimation(
        resultGhost,
        [
          {
            opacity: 0,
            filter: "blur(5px)",
            transform: "scale(0.82)"
          },
          {
            opacity: 1,
            filter: "blur(0)",
            transform: "scale(1)"
          }
        ],
        {
          delay: durationMs * 0.34,
          duration: durationMs * 0.58,
          easing: "ease-out",
          fill: "forwards"
        }
      )
    ]);
    // Keep the completed motion ghosts alive through handoff. Swapping to a
    // second settled clone layer makes unchanged glyphs flicker.
    await runBeforeCleanup(options.beforeCleanup);
    await fadeOverlayBeforeRemoval(overlay.element);
  } finally {
    showTokens(hiddenTokens);
    overlay.element.remove();
  }

  return { renderer: "custom-melt" };
}

async function runBeforeCleanup(
  beforeCleanup: (() => void | Promise<void>) | undefined
): Promise<void> {
  if (beforeCleanup === undefined) {
    return;
  }

  await beforeCleanup();
  await nextAnimationFrame();
}

function nextAnimationFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function fadeOverlayBeforeRemoval(overlay: HTMLElement): Promise<void> {
  overlay.dataset["kpEquationMotionOverlayState"] = "handoff-fade";
  overlay.style.setProperty(
    "--equation-motion-handoff-duration",
    `${HANDOFF_FADE_MS}ms`
  );

  return new Promise((resolve) => {
    setTimeout(resolve, HANDOFF_FADE_MS);
  });
}

function snapshotLeafTokens(root: HTMLElement): readonly ChoreographyToken[] {
  return Array.from(root.querySelectorAll<HTMLElement>(".katex-html span"))
    .filter((element) => {
      const text = normalizeTokenText(element.textContent ?? "");

      return (
        text.length > 0 &&
        !Array.from(element.children).some(
          (child) => normalizeTokenText(child.textContent ?? "").length > 0
        )
      );
    })
    .map((element) => ({
      element,
      text: normalizeTokenText(element.textContent ?? ""),
      rect: element.getBoundingClientRect()
    }))
    .filter((token) => token.rect.width > 0 && token.rect.height > 0);
}

function findToken(
  tokens: readonly ChoreographyToken[],
  text: string,
  occurrence: "first" | "last" = "first"
): ChoreographyToken | undefined {
  const normalizedText = normalizeTokenText(text);
  const matches = tokens.filter((token) => token.text === normalizedText);

  return occurrence === "last" ? matches.at(-1) : matches[0];
}

function tokensAfterEquals(
  tokens: readonly ChoreographyToken[]
): readonly ChoreographyToken[] {
  const equalsIndex = tokens.findIndex((token) => token.text === "=");

  return equalsIndex === -1 ? [] : tokens.slice(equalsIndex + 1);
}

function createChoreographyOverlay(
  kind: EquationMotionChoreographyKind,
  sourceEl: HTMLElement,
  targetEl: HTMLElement
): { element: HTMLDivElement; rect: DOMRect } {
  const rect = unionRects(
    sourceEl.getBoundingClientRect(),
    targetEl.getBoundingClientRect()
  );
  const element = document.createElement("div");
  const measuredFrom = targetEl.dataset["kpEquationMotionMeasure"];

  element.className = "equation-motion-choreography";
  element.dataset["kpEquationMotionChoreography"] = kind;
  if (measuredFrom !== undefined) {
    element.dataset["kpEquationMotionMeasuredFrom"] = measuredFrom;
  }
  element.style.left = `${rect.left + window.scrollX}px`;
  element.style.top = `${rect.top + window.scrollY}px`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;

  return { element, rect };
}

function createTokenGhost(
  token: ChoreographyToken,
  overlayRect: DOMRect,
  role: string
): HTMLSpanElement {
  const style = window.getComputedStyle(token.element);
  const clone = token.element.cloneNode(true);
  const ghost = document.createElement("span");

  ghost.className = "equation-motion-choreography__ghost";
  ghost.dataset["kpEquationMotionRole"] = role;
  if (clone instanceof HTMLElement) {
    ghost.append(clone);
  } else {
    ghost.textContent = token.text;
  }
  ghost.style.left = `${token.rect.left - overlayRect.left}px`;
  ghost.style.top = `${token.rect.top - overlayRect.top}px`;
  ghost.style.width = `${token.rect.width}px`;
  ghost.style.height = `${token.rect.height}px`;
  ghost.style.font = style.font;
  ghost.style.color = style.color;
  ghost.style.lineHeight = style.lineHeight;
  ghost.style.letterSpacing = style.letterSpacing;
  ghost.style.opacity = role === "appearing-minus" || role === "appearing-result"
    ? "0"
    : "1";

  return ghost;
}

function hideTokens(tokens: readonly HTMLElement[]): void {
  tokens.forEach((token) => {
    token.classList.add("equation-motion__token-hidden");
  });
}

function showTokens(tokens: readonly HTMLElement[]): void {
  tokens.forEach((token) => {
    token.classList.remove("equation-motion__token-hidden");
  });
}

function runElementAnimation(
  element: Element,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions
): Promise<void> {
  const animation = element.animate(keyframes, options);

  return animation.finished.then(
    () => undefined,
    () => undefined
  );
}

function unionRects(first: DOMRect, second: DOMRect): DOMRect {
  const left = Math.min(first.left, second.left);
  const top = Math.min(first.top, second.top);
  const right = Math.max(first.right, second.right);
  const bottom = Math.max(first.bottom, second.bottom);

  return new DOMRect(left, top, right - left, bottom - top);
}

function normalizeTokenText(text: string): string {
  return text.replace(/\s+/g, " ").replace("\u2212", "-").trim();
}
