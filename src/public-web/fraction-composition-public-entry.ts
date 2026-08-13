import { mountKpFractionCompositionArticleEnhancement } from
  "../tutorial/algebra-fraction-composition/fraction-composition-progressive-entry.ts";

type KpFractionCompositionPublicDevelopment = typeof import(
  "./fraction-composition-public-development.ts"
);
const loadDevelopment:
  | (() => Promise<KpFractionCompositionPublicDevelopment>)
  | undefined = import.meta.env.DEV
    ? () => import("./fraction-composition-public-development.ts")
    : undefined;

let dispose = (): void => undefined;

if (loadDevelopment === undefined) {
  dispose = mountKpFractionCompositionArticleEnhancement(
    window,
    undefined,
    { attentionStageRequested: true }
  );
} else {
  void loadDevelopment().then((development) => {
    dispose = development.mountKpFractionCompositionPublicDevelopment(window);
  });
}

window.addEventListener("pagehide", () => dispose(), { once: true });
