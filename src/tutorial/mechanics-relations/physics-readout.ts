import { momentumEnergyPowerRelation, type MomentumEnergyFrame } from "../../../domains/physics/momentum-energy.ts";

/** Local presentation contract. The supported range reserves sign and digit
 * growth before playback; exceeding it requires a presentation repair. */
export function defineNumericReadout(spec: {
  readonly decimals: number; readonly min: number; readonly max: number;
  readonly unit: string; readonly unavailable?: boolean;
}) {
  const { decimals, min, max, unit, unavailable = false } = spec;
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 6 ||
      !Number.isFinite(min) || !Number.isFinite(max) || min > max ||
      Math.max(Math.abs(min), Math.abs(max)) >= 1e21) throw new RangeError("Invalid numeric readout range or precision");
  const fixed = (value: number) => {
    const text = value.toFixed(decimals);
    return Number(text) === 0 ? (0).toFixed(decimals) : text;
  };
  // ch is a digit's width. Reserve one digit-width for punctuation/sign too.
  const columns = Math.max(fixed(min).length, fixed(max).length, unavailable ? 2 : 0);
  return Object.freeze({ decimals, min, max, unit, columns, format(value: number | null): string {
    if (value === null && unavailable) return "—";
    if (value === null || !Number.isFinite(value) || value < min || value > max)
      throw new RangeError("Numeric readout value outside its declared range");
    return fixed(value);
  } });
}

const reading = (unit: string, min: number, max: number, unavailable = false) =>
  defineNumericReadout({ decimals: 2, unit, min, max, unavailable });

// Bounds cover every checked fixture mass (1–4 kg), not just today's Article.
export const physicsReadouts = Object.freeze({
  time: reading("s", 0, 2), momentumX: reading("kg m/s", -4, 4),
  momentumY: reading("kg m/s", 0, 4), kineticEnergy: reading("J", 0, 8),
  speed: reading("m/s", 0, 4), forceAlongMotion: reading("N", 0, 2, true),
  power: reading("W", 0, 8), work: reading("J", 0, 8)
});
export type PhysicsReadoutId = keyof typeof physicsReadouts;

export function physicsReadoutValues(frame: MomentumEnergyFrame): Readonly<Record<PhysicsReadoutId, number | null>> {
  const relation = momentumEnergyPowerRelation(frame);
  return { time: frame.time.seconds, momentumX: frame.momentum.x, momentumY: frame.momentum.y,
    kineticEnergy: frame.kineticEnergy, speed: frame.speed, power: frame.power, work: frame.work,
    forceAlongMotion: relation.kind === "at-rest" ? null : relation.forceAlongMotion };
}

export function renderPhysicsReadout(id: PhysicsReadoutId, value: number | null, withUnit = true): string {
  const spec = physicsReadouts[id];
  return `<span class="physics-readout"><span data-physics-number="${id}" style="--physics-number-columns:${spec.columns}">${spec.format(value)}</span>${withUnit ? ` <span class="physics-readout-unit">${spec.unit}</span>` : ""}</span>`;
}

export function bindPhysicsReadouts(root: HTMLElement) {
  const known = (id: string): id is PhysicsReadoutId => Object.hasOwn(physicsReadouts, id);
  const bindings = Array.from(root.querySelectorAll('[data-physics-number]'), element => {
    const id = element.getAttribute("data-physics-number");
    if (id === null || !known(id)) throw new TypeError("Unknown physics readout identity");
    return { id, spec: physicsReadouts[id], element };
  });
  return (frame: MomentumEnergyFrame) => {
    const values = physicsReadoutValues(frame);
    // Validate every value before mutating the DOM so bad input cannot leave a
    // partially updated reading. Node identities and surrounding text persist.
    const texts = bindings.map(({ id, spec }) => spec.format(values[id]));
    bindings.forEach(({ element }, index) => { element.textContent = texts[index]!; });
  };
}
