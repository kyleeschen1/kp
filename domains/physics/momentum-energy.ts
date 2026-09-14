/** Bounded analytical Newtonian particle fixtures, not a general simulator.
 * All displayed quantities derive from the same time and physical assumptions. */
export interface MomentumEnergySource {
  readonly schemaVersion: "kp.physics.momentum-energy.v1";
  readonly episode: "straight" | "turning";
  readonly massKg: number;
}
export interface MomentumEnergyGap {
  readonly status: "repair";
  readonly code: "physics.momentum-energy.source";
  readonly path: string;
  readonly expected: string;
}
const modelBrand = Symbol("checked-momentum-energy");
const issued = new WeakSet<object>();
export interface CheckedMomentumEnergy {
  readonly [modelBrand]: true;
  readonly source: MomentumEnergySource;
  readonly durationSeconds: number;
}
const timeBrand = Symbol("physical-seconds");
export interface PhysicalTime {
  readonly [timeBrand]: true;
  readonly kind: "physical-time";
  readonly seconds: number;
}
export function physicalTime(seconds: number): PhysicalTime {
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError("Physical time must be finite and nonnegative.");
  return Object.freeze({ [timeBrand]: true as const, kind: "physical-time", seconds });
}
export const momentumEnergyExamples: readonly MomentumEnergySource[] = Object.freeze([
  Object.freeze({ schemaVersion: "kp.physics.momentum-energy.v1", episode: "straight", massKg: 1 }),
  Object.freeze({ schemaVersion: "kp.physics.momentum-energy.v1", episode: "turning", massKg: 1 })
]);

export function checkMomentumEnergy(value: unknown):
  | { readonly status: "checked"; readonly model: CheckedMomentumEnergy }
  | MomentumEnergyGap {
  const gap = (path: string, expected: string): MomentumEnergyGap => ({ status: "repair", code: "physics.momentum-energy.source", path, expected });
  if (typeof value !== "object" || value === null || Object.getPrototypeOf(value) !== Object.prototype)
    return gap("$", "Use a plain v1 analytical fixture source.");
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(value);
  if (keys.length !== 3 || keys.some(key => typeof key !== "string" || !["schemaVersion", "episode", "massKg"].includes(key) ||
    !descriptors[key]?.enumerable || !("value" in descriptors[key]!)))
    return gap("$", "Supply only schemaVersion, episode and massKg; no derived claims, getters, geometry or timing policy.");
  const schema = descriptors["schemaVersion"]?.value, episode = descriptors["episode"]?.value, massKg: unknown = descriptors["massKg"]?.value;
  if (schema !== "kp.physics.momentum-energy.v1" || (episode !== "straight" && episode !== "turning"))
    return gap("$.episode", "Supported episodes are straight (2 N, initial rest, 2 s) and turning (unit-radius, unit-angular-speed quarter circle), in SI units and a fixed inertial frame.");
  if (typeof massKg !== "number" || !Number.isFinite(massKg) || massKg < 1 || massKg > 4)
    return gap("$.massKg", "Use a constant particle mass from 1 to 4 kg.");
  const source: MomentumEnergySource = Object.freeze({ schemaVersion: schema, episode, massKg });
  const model: CheckedMomentumEnergy = Object.freeze({ [modelBrand]: true as const, source, durationSeconds: episode === "straight" ? 2 : Math.PI / 2 });
  issued.add(model);
  return Object.freeze({ status: "checked", model });
}
export function assertMomentumEnergy(model: CheckedMomentumEnergy): void {
  if (!issued.has(model)) throw new TypeError("Use the physics-owned checker; immutable data alone is not checked physics.");
}
export interface PhysicsVector { readonly x: number; readonly y: number }
const vector = (x: number, y: number): PhysicsVector => Object.freeze({ x: x === 0 ? 0 : x, y: y === 0 ? 0 : y });
export function sampleMomentumEnergy(model: CheckedMomentumEnergy, time: PhysicalTime) {
  assertMomentumEnergy(model);
  if (!time || time.kind !== "physical-time" || !Number.isFinite(time.seconds) || time.seconds < 0 || time.seconds > model.durationSeconds)
    throw new RangeError("Sample physical seconds within this episode; normalized presentation progress is not time.");
  const t = time.seconds, m = model.source.massKg;
  const turning = model.source.episode === "turning";
  // Canonical endpoints remain exact; interior trig values are numerical samples.
  const c = t === Math.PI / 2 ? 0 : Math.cos(t), s = t === 0 ? 0 : t === Math.PI / 2 ? 1 : Math.sin(t);
  const position = turning ? vector(c, s) : vector(t * t / m, 0);
  const velocity = turning ? vector(-s, c) : vector(2 * t / m, 0);
  const force = turning ? vector(-m * c, -m * s) : vector(2, 0);
  const momentum = vector(m * velocity.x, m * velocity.y);
  const initialMomentum = turning ? vector(0, m) : vector(0, 0);
  const momentumChange = vector(momentum.x - initialMomentum.x, momentum.y - initialMomentum.y);
  // These constants follow analytically from the fixture, not a tolerance badge
  // inferred from rendered geometry or an accumulated numerical integration.
  const speed = turning ? 1 : 2 * t / m;
  const initialEnergy = turning ? m / 2 : 0;
  const kineticEnergy = turning ? m / 2 : 2 * t * t / m;
  const work = turning ? 0 : 2 * position.x;
  const power = turning ? 0 : 2 * velocity.x;
  return Object.freeze({ episode: model.source.episode, time, massKg: m, position, velocity, force, momentum,
    initialMomentum, momentumChange, speed, initialEnergy, kineticEnergy,
    energyChange: kineticEnergy - initialEnergy, work, power });
}
export type MomentumEnergyFrame = ReturnType<typeof sampleMomentumEnergy>;
