import "../authored-focus-card.css";
import "./style.css";
import { createFlaggedTicketSource } from "../../../domains/probability/binary-joint-model.ts";
import { bindBayesEvidence } from "./evidence.ts";
import { compileBayesNotation } from "./notation.ts";
import { mountBayesNativeSurface } from "./native-surface.ts";

const output = document.querySelector<HTMLOutputElement>("[data-bayes-native-status]")!;
try {
  const notation = compileBayesNotation(bindBayesEvidence(createFlaggedTicketSource()).trace);
  const session = await mountBayesNativeSurface(document.querySelector<HTMLElement>("[data-bayes-native-host]")!,
    document.querySelector<HTMLTemplateElement>("template[data-kp-reader-exemplar-template]")!, notation);
  Object.assign(window, { bayesNativeProbe: { seek: session.seek } });
  output.value = "ready";
  import.meta.hot?.dispose(() => session.dispose());
} catch (error) { output.value = error instanceof Error ? error.message : String(error); output.dataset["error"] = "true"; }
