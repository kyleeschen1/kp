import type {
  KpCanonicalNativeKatexSceneSession
} from "../../src/rendering/native-katex-scene-compositor.ts";

declare const uncheckedSession: Omit<
  KpCanonicalNativeKatexSceneSession,
  "executableMotion"
>;

// @ts-expect-error A session without measured dynamic-motion evidence is not runnable.
const runnable: KpCanonicalNativeKatexSceneSession = uncheckedSession;

void runnable;
