import { kpCommonDenominatorPressureAnimationId } from "../animation/common-denominator-pressure-exemplar.ts";
import { mountCanonicalCommonDenominatorPressure } from "../rendering/common-denominator-pressure-session.ts";
import { KP_EDITOR_ANIMATION_DISPOSE_EVENT } from "./animation-player-controller.ts";
import type { KpEditorAnimationSurfaceAdapter } from "./animation-surface-adapter-registry.ts";

const sessions = new WeakMap<HTMLElement, ReturnType<typeof mountCanonicalCommonDenominatorPressure>>();
export const kpEditorCommonDenominatorPressureSurfaceAdapter = Object.freeze({
  id: "editor-animation-surface.fraction-equivalence.common-denominator-pressure",
  slotKind: "equation" as const, priority: 134,
  supports(state) { return state.animationId === kpCommonDenominatorPressureAnimationId; },
  render({ player, slot, state }) {
    let session = sessions.get(player);
    if (!session) {
      session = mountCanonicalCommonDenominatorPressure(player, slot);
      sessions.set(player, session);
      const mounted = session;
      void mounted.ready.catch(error => console.error("Common denominator preparation failed", error));
      player.addEventListener(KP_EDITOR_ANIMATION_DISPOSE_EVENT, () => { mounted.dispose(); sessions.delete(player); }, { once: true });
    }
    session.sample(state);
  }
} satisfies KpEditorAnimationSurfaceAdapter);
