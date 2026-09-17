import { checkScalarCancellation } from "../../../domains/algebra/scalar-cancellation.ts";
import { enhanceEnergyDerivation } from "./momentum-energy-derivation-reader.ts";

for (const article of document.querySelectorAll<HTMLElement>('[data-kp-article]')) {
  const root = article.querySelector<HTMLElement>("[data-energy-derivation]");
  if (!root) continue;
  try {
    const source = article.querySelector<HTMLScriptElement>("[data-scalar-derivation-source]");
    const checked = checkScalarCancellation(JSON.parse(source?.textContent ?? "null"));
    if (checked.status !== "checked") throw new Error(`${checked.code} at ${checked.path}`);
    // The browser reissues authority from source; it never trusts a transported
    // proof or imports the build-time governed compiler.
    const plan = import("../../semantic/momentum-energy-derivation-plan.ts").then(module => ({
      coarse: module.createScalarCancellationPlan(checked.model), unfold: module.unfoldDerivationInspection
    }));
    enhanceEnergyDerivation(root, { async loadPlan(detail) {
      const { coarse, unfold } = await plan;
      return detail === "coarse" ? coarse : unfold(coarse, coarse.moves[0]!.id);
    } });
  } catch (error) {
    root.dataset["repair"] = "true";
    const status = root.querySelector<HTMLElement>("[data-derivation-status]")!;
    status.hidden = false; status.textContent = "This inspection needs repair. The written reasoning remains available.";
    console.error("Scalar derivation source repair", error);
  }
}
