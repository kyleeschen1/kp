import { sampleMomentumEnergy, momentumEnergyPowerRelation, type CheckedMomentumEnergy, type PhysicalTime } from "../../../domains/physics/momentum-energy.ts";

export type MomentumEnergyFrame = ReturnType<typeof sampleMomentumEnergy>;
export const displayNumber = (value: number): string => {
  if (!Number.isFinite(value)) throw new RangeError("Display numbers must be finite");
  const text = value.toFixed(2);
  return Number(text) === 0 ? "0.00" : text;
};

/** Representation coordinates are derived from physics, never fed back into it.
 * Momentum and force have different units and deliberately separate scales. */
export function projectMomentumEnergyFigure(frame: MomentumEnergyFrame) {
  const turning = frame.episode === "turning";
  const x = turning ? 230 + 100 * frame.position.x : 35 + 60 * frame.position.x;
  const y = turning ? 175 - 100 * frame.position.y : 150;
  const relation = momentumEnergyPowerRelation(frame);
  let rightAngle = "";
  if (relation.kind === "moving" && relation.alignment === "perpendicular") {
    const forceLength = Math.hypot(frame.force.x, frame.force.y);
    const ux = 10 * relation.direction.x, uy = -10 * relation.direction.y;
    const fx = 10 * frame.force.x / forceLength, fy = -10 * frame.force.y / forceLength;
    rightAngle = `M${x + ux} ${y + uy}L${x + ux + fx} ${y + uy + fy}L${x + fx} ${y + fy}`;
  }
  const arrow = (dx: number, dy: number) => {
    const length = Math.hypot(dx, dy);
    if (length < 1e-8) return `M${x} ${y}`;
    const ex = x + dx, ey = y + dy, ux = dx / length, uy = dy / length;
    return `M${x} ${y}L${ex} ${ey}M${ex - 7 * ux + 4 * uy} ${ey - 7 * uy - 4 * ux}L${ex} ${ey}L${ex - 7 * ux - 4 * uy} ${ey - 7 * uy + 4 * ux}`;
  };
  return Object.freeze({ x, y, rightAngle,
    trajectory: turning ? "M330 175A100 100 0 0 0 230 75" : "M35 150H275",
    momentum: arrow(25 * frame.momentum.x, -25 * frame.momentum.y),
    force: arrow(35 * frame.force.x, -35 * frame.force.y),
    energyWidth: frame.kineticEnergy / 8 * 300
  });
}

export function renderMomentumEnergySvg(model: CheckedMomentumEnergy, time: PhysicalTime, options: { readonly showEnergy?: boolean } = {}): string {
  const frame = sampleMomentumEnergy(model, time), p = projectMomentumEnergyFigure(frame);
  // Fixed bounds contain the complete fixture trajectory and arrow extents.
  // Crop unused vertical space once; never auto-fit to the current sample.
  // For a turn, the highest momentum tip is 175 - hypot(100, 25m).
  // Include the arrowhead and every supported mass, even when it is not 1 kg.
  const turnTop = Math.floor((175 - Math.hypot(100, 25 * model.source.massKg) - 10) / 10) * 10;
  const bottom = options.showEnergy === false ? 190 : 240;
  const viewBox = frame.episode === "straight" ? `0 130 420 ${bottom - 130}` : `0 ${turnTop} 420 ${bottom - turnTop}`;
  // Explicit data-attribute values keep this identical markup valid as XML
  // standalone SVG as well as the browser's more permissive inline HTML.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${options.showEnergy === false ? "Particle trajectory, momentum along velocity, and net force" : "Particle trajectory, momentum arrow, force arrow, and kinetic energy bar"}">
    <path data-trajectory="" d="${p.trajectory}" fill="none" stroke="#a3a3a3" stroke-width="2" stroke-dasharray="3 5"/>
    <path data-force="" d="${p.force}" fill="none" stroke="#a55b24" stroke-width="3"/>
    <path data-momentum="" d="${p.momentum}" fill="none" stroke="#236b8e" stroke-width="3"/>
    <path data-right-angle="" d="${p.rightAngle}" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <circle data-particle="" cx="${p.x}" cy="${p.y}" r="5" fill="currentColor"/>
    ${options.showEnergy === false ? "" : `<path d="M35 228H335" stroke="#a3a3a3" stroke-width="2"/>
    <rect data-energy="" x="35" y="218" width="${p.energyWidth}" height="10" fill="#236b8e"/>`}
  </svg>`;
}

export function describeMomentumEnergyFrame(frame: MomentumEnergyFrame): string {
  const n = displayNumber;
  return `Time ${n(frame.time.seconds)} s; momentum (${n(frame.momentum.x)}, ${n(frame.momentum.y)}) kg m/s; speed ${n(frame.speed)} m/s; kinetic energy ${n(frame.kineticEnergy)} J; net work since the start ${n(frame.work)} J; instantaneous power ${n(frame.power)} W.`;
}

/** Shared by initial HTML and live paint so enhancement cannot change the
 * explanation's numerical meaning. Units are screen-space text, not SVG ink. */
export function describeMomentumEnergyPower(frame: MomentumEnergyFrame) {
  const relation = momentumEnergyPowerRelation(frame), n = displayNumber;
  return Object.freeze({
    calculation: relation.kind === "at-rest"
      ? `Velocity is zero → power is ${n(relation.power)} W`
      : `${n(frame.speed)} m/s × ${n(relation.forceAlongMotion)} N = ${n(relation.power)} W`,
    explanation: powerExplanations[relation.kind === "at-rest" ? "rest" : relation.alignment],
    explanationId: relation.kind === "at-rest" ? "rest" : relation.alignment
  });
}

export const powerExplanations = Object.freeze({
  rest: "At this instant there is no direction of motion (—). Force is nonzero and starts changing momentum; the energy rate is zero only at this instant.",
  perpendicular: "The right angle persists: force has no component along velocity. Momentum turns, but kinetic energy stays constant.",
  parallel: "Force points along velocity. As speed grows, the same force transfers more energy each second."
});
