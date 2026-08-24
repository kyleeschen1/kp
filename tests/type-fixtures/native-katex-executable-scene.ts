import type {
  KpCanonicalNativeKatexCarrierSceneSession,
  KpCanonicalNativeKatexSceneSession
} from "../../src/rendering/native-katex-scene-compositor.ts";

declare const uncheckedSession: Omit<
  KpCanonicalNativeKatexSceneSession,
  "executableMotion"
>;

// @ts-expect-error A session without measured dynamic-motion evidence is not runnable.
const runnable: KpCanonicalNativeKatexSceneSession = uncheckedSession;

void runnable;

declare const carrier: KpCanonicalNativeKatexCarrierSceneSession;

// @ts-expect-error A measured carrier cannot masquerade as executable motion.
const executableFromCarrier: KpCanonicalNativeKatexSceneSession = carrier;

void executableFromCarrier;
