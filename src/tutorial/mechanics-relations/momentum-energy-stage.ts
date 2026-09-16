import { assertMomentumEnergy, sampleMomentumEnergy, type CheckedMomentumEnergy } from "../../../domains/physics/momentum-energy.ts";
import { KpGraph2DRuntimeSessionLifecycle, type KpGraph2DRuntimeSession } from "../../rendering/graph-2d-runtime-session.ts";
import { describeMomentumEnergyPower, projectMomentumEnergyFigure, type MomentumEnergyFrame } from "./momentum-energy-figure.ts";
import { bindPhysicsReadouts } from "./physics-readout.ts";
import { momentumEnergyTimeAtProgress } from "./momentum-energy-runtime-source.ts";

type Session = KpGraph2DRuntimeSession<CheckedMomentumEnergy, MomentumEnergyFrame, null>;

export function mountMomentumEnergyStage(root: HTMLElement, model: CheckedMomentumEnergy) {
  assertMomentumEnergy(model);
  const get = (selector: string): Element => {
    const element = root.querySelector(selector);
    if (!element) throw new Error(`Missing physics stage element: ${selector}`);
    return element;
  };
  const particle = get("[data-particle]"), momentum = get("[data-momentum]"), force = get("[data-force]"), energy = get("[data-energy]");
  const rightAngle = get('[data-right-angle]');
  const updateReadouts = bindPhysicsReadouts(root);
  const explanations = root.querySelectorAll<HTMLElement>('[data-physics-explanation]');
  const lifecycle = new KpGraph2DRuntimeSessionLifecycle<HTMLElement, CheckedMomentumEnergy, MomentumEnergyFrame, null, Session>(({ content, frame }) => {
    let status: Session["status"] = "mounted";
    const paint = (next: MomentumEnergyFrame) => {
      if (status === "disposed") return;
      const p = projectMomentumEnergyFigure(next);
      updateReadouts(next);
      particle.setAttribute("cx", String(p.x)); particle.setAttribute("cy", String(p.y));
      momentum.setAttribute("d", p.momentum); force.setAttribute("d", p.force); energy.setAttribute("width", String(p.energyWidth));
      rightAngle.setAttribute("d", p.rightAngle);
      const power = describeMomentumEnergyPower(next);
      explanations.forEach(element => {
        const inactive = element.dataset["physicsExplanation"] !== power.explanationId;
        element.inert = inactive;
        if (inactive) element.setAttribute("aria-hidden", "true");
        else element.removeAttribute("aria-hidden");
      });
      root.dataset["physicalTime"] = String(next.time.seconds);
      root.dataset["energy"] = String(next.kineticEnergy);
      root.dataset["power"] = String(next.power);
    };
    paint(frame);
    return { content, get status() { return status; }, apply: ({ frame: next }) => paint(next), dispose() { status = "disposed"; } };
  });
  let disposed = false;
  const project = (progress: number) => {
    if (!disposed) lifecycle.apply({ owner: root, content: model, frame: sampleMomentumEnergy(model, momentumEnergyTimeAtProgress(model, progress)), viewport: null });
  };
  project(0);
  return { project, dispose() { disposed = true; lifecycle.dispose(root); } };
}
