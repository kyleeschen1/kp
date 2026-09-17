/** Project one measured interval into the shared statement/move vocabulary.
 * Callers own semantic position; this function owns no clock or algebra. */
export function projectEquationRail(input: {
  readonly root: HTMLElement; readonly rail: HTMLElement;
  readonly centers: readonly number[]; readonly stops: readonly HTMLElement[];
  readonly passages: readonly HTMLElement[]; readonly move: number; readonly progress: number;
}) {
  const { root, rail, centers, stops, passages, move, progress } = input;
  if (!Number.isInteger(move) || move < 0 || move + 1 >= centers.length ||
      !Number.isFinite(progress) || progress < 0 || progress > 1 || stops.length !== centers.length)
    throw new RangeError("Rail projection requires one valid measured interval and its statement stops.");
  const between = progress > 0 && progress < 1;
  const dock = progress === 0 ? move : move + 1;
  root.dataset["railPosition"] = between ? "between" : "docked";
  rail.style.setProperty("--rail-move-top", `${centers[move]! - centers[0]!}px`);
  rail.style.setProperty("--rail-move-height", `${centers[move + 1]! - centers[move]!}px`);
  stops.forEach((stop, i) => {
    stop.dataset["railStop"] = between && (i === move || i === move + 1) ? "boundary" : !between && i === dock ? "current" : "rest";
  });
  passages.forEach((passage, i) => { passage.dataset["railActive"] = String(between && i === move); });
}
