import { assertMomentumEnergy, sampleMomentumEnergy, type CheckedMomentumEnergy } from "../../../domains/physics/momentum-energy.ts";
import { KpGraph2DRuntimeSessionLifecycle, type KpGraph2DRuntimeSession } from "../../rendering/graph-2d-runtime-session.ts";
import { describeMomentumEnergyFrame, describeMomentumEnergyPower, displayNumber, projectMomentumEnergyFigure, type MomentumEnergyFrame } from "./momentum-energy-figure.ts";
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
  const caption = get("[data-physics-description]"), momentumLabel = get('[data-kp-focus-deck-annotation="physics.momentum"]');
  const energyLabel = get('[data-kp-focus-deck-annotation="physics.energy"]');
  const rightAngle = get('[data-right-angle]');
  const powerCalculation = get('[data-kp-focus-deck-annotation="physics.power-value"]');
  const powerExplanation = get('[data-kp-focus-deck-annotation="physics.power-explanation"]');
  const lifecycle = new KpGraph2DRuntimeSessionLifecycle<HTMLElement, CheckedMomentumEnergy, MomentumEnergyFrame, null, Session>(({ content, frame }) => {
    let status: Session["status"] = "mounted";
    const paint = (next: MomentumEnergyFrame) => {
      if (status === "disposed") return;
      const p = projectMomentumEnergyFigure(next), n = displayNumber;
      particle.setAttribute("cx", String(p.x)); particle.setAttribute("cy", String(p.y));
      momentum.setAttribute("d", p.momentum); force.setAttribute("d", p.force); energy.setAttribute("width", String(p.energyWidth));
      rightAngle.setAttribute("d", p.rightAngle);
      const power = describeMomentumEnergyPower(next);
      powerCalculation.textContent = power.calculation;
      powerExplanation.textContent = power.explanation;
      momentumLabel.textContent = `Momentum (${n(next.momentum.x)}, ${n(next.momentum.y)}) kg m/s`;
      energyLabel.textContent = `Kinetic energy ${n(next.kineticEnergy)} J`;
      caption.textContent = describeMomentumEnergyFrame(next);
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
